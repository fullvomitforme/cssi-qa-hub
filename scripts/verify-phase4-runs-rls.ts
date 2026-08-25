import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type Role = "ADMIN" | "QA_LEAD" | "QA_TESTER"
type CapabilityResult = "ALLOWED" | "DENIED"

type VerificationResult = {
  readRuns: CapabilityResult
  readRunAssignments: CapabilityResult
  createRun: CapabilityResult
  updateRun: CapabilityResult
  manageAssignments: CapabilityResult
}

const credentialMap: Record<Role, { email: string; password: string }> = {
  ADMIN: {
    email: "phase2.admin@localhost.com",
    password: "QaHubPhase2!Admin",
  },
  QA_LEAD: {
    email: "phase2.lead@localhost.com",
    password: "QaHubPhase2!Lead",
  },
  QA_TESTER: {
    email: "phase2.tester@localhost.com",
    password: "QaHubPhase2!Tester",
  },
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

async function signIn(role: Role) {
  const client = createBrowserlessClient()
  const { error } = await client.auth.signInWithPassword(credentialMap[role])

  if (error) {
    throw new Error(`${role} sign-in failed: ${error.message}`)
  }

  return client
}

async function safeSignOut(client: SupabaseClient) {
  await client.auth.signOut({ scope: "global" })
}

async function loadReferences(client: SupabaseClient) {
  const [runResult, releaseResult, planResult, leadResult, testerResult] =
    await Promise.all([
      client
        .from("test_runs")
        .select("id")
        .eq("name", "Phase 4 Verification Run Updated")
        .single(),
      client
        .from("releases")
        .select("id,application_id,environment_id")
        .eq("version", "v1.10.0")
        .eq("build", "phase3-verification")
        .single(),
      client
        .from("test_plans")
        .select("id")
        .eq("name", "Phase 3 Verification Plan Updated")
        .single(),
      client
        .from("profiles")
        .select("id")
        .eq("email", "phase2.lead@localhost.com")
        .single(),
      client
        .from("profiles")
        .select("id")
        .eq("email", "phase2.tester@localhost.com")
        .single(),
    ])

  for (const [label, result] of [
    ["run", runResult],
    ["release", releaseResult],
    ["plan", planResult],
    ["lead", leadResult],
    ["tester", testerResult],
  ] as const) {
    if (result.error) {
      throw new Error(`Unable to load ${label}: ${result.error.message}`)
    }
  }

  const run = runResult.data
  const release = releaseResult.data
  const plan = planResult.data
  const lead = leadResult.data
  const tester = testerResult.data

  if (!run || !release || !plan || !lead || !tester) {
    throw new Error("Required Phase 4 RLS references are missing")
  }

  return {
    baselineRunId: run.id,
    applicationId: release.application_id,
    environmentId: release.environment_id,
    releaseId: release.id,
    planId: plan.id,
    leadProfileId: lead.id,
    testerProfileId: tester.id,
  }
}

async function canRead(
  client: SupabaseClient,
  table: "test_runs" | "test_run_assignments"
) {
  const column = table === "test_runs" ? "id" : "test_run_id"
  const { error } = await client.from(table).select(column).limit(1)
  return error ? "DENIED" : "ALLOWED"
}

async function createRunForRole(
  client: SupabaseClient,
  role: Role,
  references: Awaited<ReturnType<typeof loadReferences>>
): Promise<{ runId: string | null; result: CapabilityResult }> {
  const { data, error } = await client.rpc("create_test_run", {
    target_name: `Phase 4 RLS ${role} ${Date.now()}`,
    target_test_plan_id: references.planId,
    target_application_id: references.applicationId,
    target_release_id: references.releaseId,
    target_environment_id: references.environmentId,
    target_build: `phase4-rls-${role.toLowerCase()}`,
    target_status: "NOT_STARTED",
    target_assignment_profile_ids: [references.testerProfileId],
  })

  return {
    runId: (data as string | null) ?? null,
    result: error ? "DENIED" : "ALLOWED",
  }
}

async function updateRun(
  client: SupabaseClient,
  references: Awaited<ReturnType<typeof loadReferences>>,
  targetRunId: string,
  overrides?: {
    assignmentProfileIds?: string[]
    build?: string
    status?: string
  }
): Promise<CapabilityResult> {
  const { error } = await client.rpc("update_test_run", {
    target_run_id: targetRunId,
    target_name: "Phase 4 RLS Updated",
    target_release_id: references.releaseId,
    target_environment_id: references.environmentId,
    target_build: overrides?.build ?? "phase4-rls-update",
    target_status: overrides?.status ?? "IN_PROGRESS",
    target_assignment_profile_ids: overrides?.assignmentProfileIds ?? [
      references.testerProfileId,
    ],
  })

  return error ? "DENIED" : "ALLOWED"
}

async function runFor(role: Role) {
  const client = await signIn(role)

  try {
    const references = await loadReferences(client)
    const created = await createRunForRole(client, role, references)
    const updateTarget = created.runId ?? references.baselineRunId

    const updateResult = await updateRun(client, references, updateTarget, {
      build: `phase4-rls-update-${role.toLowerCase()}`,
      status: "BLOCKED",
    })
    const assignmentMutation = await updateRun(
      client,
      references,
      updateTarget,
      {
        assignmentProfileIds: [
          references.leadProfileId,
          references.testerProfileId,
        ],
        build: `phase4-rls-assignment-${role.toLowerCase()}`,
        status: "IN_PROGRESS",
      }
    )

    return {
      readRuns: await canRead(client, "test_runs"),
      readRunAssignments: await canRead(client, "test_run_assignments"),
      createRun: created.result,
      updateRun: updateResult,
      manageAssignments: assignmentMutation,
    } satisfies VerificationResult
  } finally {
    await safeSignOut(client)
  }
}

async function main() {
  const roles: Role[] = ["ADMIN", "QA_LEAD", "QA_TESTER"]
  const matrix = {} as Record<Role, VerificationResult>

  for (const role of roles) {
    matrix[role] = await runFor(role)
  }

  console.log(JSON.stringify(matrix, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
