import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type ExecutionRow = {
  id: string
  status: string
  actual_result: string | null
  failure_reason: string | null
  severity: string | null
  bug_reference: string | null
  test_execution_steps: Array<{
    id: string
    status: string | null
  }>
  test_execution_attempts: Array<{
    id: string
    attempt_number: number
    status: string
    build: string
  }>
}

type PlanReferenceRow = {
  id: string
  application_id: string
  environment_id: string
}

type ReleaseReferenceRow = {
  id: string
  environment_id: string
}

function readEnvFile() {
  const raw = readFileSync(resolve(".env.local"), "utf8")
  const entries = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=")
      return [line.slice(0, separator), line.slice(separator + 1)] as const
    })

  const env = Object.fromEntries(entries)
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC Supabase env values in .env.local")
  }

  return { url, key }
}

function createBrowserlessClient() {
  const { url, key } = readEnvFile()

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function sleep(milliseconds: number) {
  await new Promise((resolvePromise) =>
    setTimeout(resolvePromise, milliseconds)
  )
}

type MaybeErrorResult = {
  error?: {
    message?: string
  } | null
}

async function withJwtRetry<T>(
  operation: () => PromiseLike<T> | T,
  attempts = 5
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const result = await Promise.resolve(operation())

      if (
        typeof result === "object" &&
        result !== null &&
        "error" in result &&
        (result as MaybeErrorResult).error?.message?.includes(
          "JWT issued at future"
        )
      ) {
        lastError = new Error(
          (result as MaybeErrorResult).error?.message ?? "JWT issued at future"
        )

        if (attempt === attempts - 1) {
          throw lastError
        }

        await sleep(1500)
        continue
      }

      return result
    } catch (error) {
      lastError = error
      if (
        !(error instanceof Error) ||
        !error.message.includes("JWT issued at future") ||
        attempt === attempts - 1
      ) {
        throw error
      }

      await sleep(1500)
    }
  }

  throw lastError
}

async function signInLead() {
  const client = createBrowserlessClient()
  const { error } = await client.auth.signInWithPassword({
    email: "phase2.lead@localhost.com",
    password: "QaHubPhase2!Lead",
  })

  if (error) {
    throw new Error(`QA_LEAD sign-in failed: ${error.message}`)
  }

  return client
}

async function signInTester() {
  const client = createBrowserlessClient()
  const { error } = await client.auth.signInWithPassword({
    email: "phase2.tester@localhost.com",
    password: "QaHubPhase2!Tester",
  })

  if (error) {
    throw new Error(`QA_TESTER sign-in failed: ${error.message}`)
  }

  return client
}

async function safeSignOut(client: SupabaseClient) {
  await client.auth.signOut({ scope: "global" })
}

async function loadReferences(client: SupabaseClient) {
  const [planResult, releaseResult, testerResult] = await Promise.all(
    [
      () =>
        client
          .from("test_plans")
          .select("id,application_id,environment_id")
          .eq("name", "Phase 3 Verification Plan Updated")
          .single<PlanReferenceRow>(),
      () =>
        client
          .from("releases")
          .select("id,environment_id")
          .eq("version", "v1.10.0")
          .eq("build", "phase3-verification")
          .single<ReleaseReferenceRow>(),
      () =>
        client
          .from("profiles")
          .select("id")
          .eq("email", "phase2.tester@localhost.com")
          .single(),
    ].map((operation) => withJwtRetry(operation))
  )

  for (const [label, result] of [
    ["plan", planResult],
    ["release", releaseResult],
    ["tester", testerResult],
  ] as const) {
    if (result.error) {
      throw new Error(`Unable to load ${label}: ${result.error.message}`)
    }
  }

  const plan = planResult.data as PlanReferenceRow | null
  const release = releaseResult.data as ReleaseReferenceRow | null
  const tester = testerResult.data

  if (!plan || !release || !tester) {
    throw new Error("Required Phase 5 references are missing")
  }

  return {
    planId: plan.id,
    applicationId: plan.application_id,
    environmentId: release.environment_id,
    releaseId: release.id,
    testerProfileId: tester.id,
  }
}

async function loadExecutionRows(
  client: SupabaseClient,
  runId: string
): Promise<ExecutionRow[]> {
  const { data, error } = await withJwtRetry(() =>
    client
      .from("test_executions")
      .select(
        "id,status,actual_result,failure_reason,severity,bug_reference,test_execution_steps(id,status),test_execution_attempts(id,attempt_number,status,build)"
      )
      .eq("test_run_id", runId)
      .order("scenario_title", { ascending: true })
  )

  if (error) {
    throw new Error(`Unable to load execution rows: ${error.message}`)
  }

  return (data ?? []) as ExecutionRow[]
}

async function main() {
  const leadClient = await signInLead()

  try {
    const references = await loadReferences(leadClient)

    const { data: createdRunId, error: createError } = await withJwtRetry(() =>
      leadClient.rpc("create_test_run", {
        target_name: "Phase 5 Verification Run",
        target_test_plan_id: references.planId,
        target_application_id: references.applicationId,
        target_release_id: references.releaseId,
        target_environment_id: references.environmentId,
        target_build: "phase5-build-001",
        target_status: "NOT_STARTED",
        target_assignment_profile_ids: [references.testerProfileId],
      })
    )

    if (createError || !createdRunId) {
      throw new Error(
        `Run creation failed: ${createError?.message ?? "No run id returned"}`
      )
    }

    const initialExecutions = await loadExecutionRows(leadClient, createdRunId)
    const firstExecution = initialExecutions[0]
    const secondExecution = initialExecutions[1]

    if (!firstExecution || !secondExecution) {
      throw new Error("Expected at least two execution rows for verification")
    }

    const testerClient = await signInTester()
    try {
      const { error: failError } = await withJwtRetry(() =>
        testerClient.rpc("record_test_execution", {
          target_execution_id: firstExecution.id,
          target_status: "FAIL",
          target_actual_result: "Dashboard did not load after sign in.",
          target_failure_reason: "The login redirect looped indefinitely.",
          target_severity: "HIGH",
          target_bug_reference: "PORTAL-201",
          target_steps: firstExecution.test_execution_steps.map(
            (step, index) => ({
              id: step.id,
              status: index === 0 ? "PASS" : null,
              actual_result: null,
            })
          ),
        })
      )

      if (failError) {
        throw new Error(
          `Initial fail attempt was rejected: ${failError.message}`
        )
      }

      const failedExecution = (
        await loadExecutionRows(testerClient, createdRunId)
      ).find((execution) => execution.id === firstExecution.id)

      if (!failedExecution) {
        throw new Error("Failed execution row could not be reloaded")
      }

      if (
        failedExecution.status !== "FAIL" ||
        failedExecution.test_execution_attempts.length !== 1
      ) {
        throw new Error("First fail attempt was not persisted correctly")
      }

      const { error: passError } = await withJwtRetry(() =>
        testerClient.rpc("record_test_execution", {
          target_execution_id: firstExecution.id,
          target_status: "PASS",
          target_actual_result: "Dashboard loaded on retest.",
          target_failure_reason: null,
          target_severity: null,
          target_bug_reference: null,
          target_steps: failedExecution.test_execution_steps.map((step) => ({
            id: step.id,
            status: "PASS",
            actual_result: null,
          })),
        })
      )

      if (passError) {
        throw new Error(
          `Retest pass attempt was rejected: ${passError.message}`
        )
      }

      const { error: blockedError } = await withJwtRetry(() =>
        testerClient.rpc("record_test_execution", {
          target_execution_id: secondExecution.id,
          target_status: "BLOCKED",
          target_actual_result: "The dependency service remained unavailable.",
          target_failure_reason: null,
          target_severity: null,
          target_bug_reference: null,
          target_steps: secondExecution.test_execution_steps.map((step) => ({
            id: step.id,
            status: null,
            actual_result: null,
          })),
        })
      )

      if (blockedError) {
        throw new Error(
          `Blocked execution save was rejected: ${blockedError.message}`
        )
      }
    } finally {
      await safeSignOut(testerClient)
    }

    const persistedExecutions = await loadExecutionRows(
      leadClient,
      createdRunId
    )
    const refreshedFirstExecution = persistedExecutions.find(
      (execution) => execution.id === firstExecution.id
    )
    const refreshedSecondExecution = persistedExecutions.find(
      (execution) => execution.id === secondExecution.id
    )

    if (!refreshedFirstExecution || !refreshedSecondExecution) {
      throw new Error("Persisted execution rows could not be reloaded")
    }

    if (
      refreshedFirstExecution.status !== "PASS" ||
      refreshedFirstExecution.test_execution_attempts.length !== 2
    ) {
      throw new Error("Retest history was not preserved correctly")
    }

    if (
      !refreshedFirstExecution.test_execution_attempts.some(
        (attempt) => attempt.status === "FAIL"
      ) ||
      !refreshedFirstExecution.test_execution_attempts.some(
        (attempt) => attempt.status === "PASS"
      )
    ) {
      throw new Error(
        "Expected both FAIL and PASS attempts on the first execution"
      )
    }

    if (refreshedSecondExecution.status !== "BLOCKED") {
      throw new Error("Blocked execution status was not persisted correctly")
    }

    const summary = persistedExecutions.reduce(
      (result, execution) => {
        result[execution.status] = (result[execution.status] ?? 0) + 1
        return result
      },
      {} as Record<string, number>
    )

    console.log(
      JSON.stringify(
        {
          runId: createdRunId,
          executionCount: persistedExecutions.length,
          firstExecutionAttemptCount:
            refreshedFirstExecution.test_execution_attempts.length,
          firstExecutionCurrentStatus: refreshedFirstExecution.status,
          secondExecutionCurrentStatus: refreshedSecondExecution.status,
          summary,
        },
        null,
        2
      )
    )
  } finally {
    await safeSignOut(leadClient)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
