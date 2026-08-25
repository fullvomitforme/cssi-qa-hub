import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type RunDetailRow = {
  id: string
  name: string
  status: string
  build: string
  test_run_assignments: Array<{ profile_id: string }>
  test_executions: Array<{
    id: string
    source_scenario_id: string
    scenario_title: string
    scenario_steps: Array<unknown>
  }>
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

async function safeSignOut(client: SupabaseClient) {
  await client.auth.signOut({ scope: "global" })
}

async function loadReferences(client: SupabaseClient) {
  const [planResult, releaseResult, leadResult, testerResult] =
    await Promise.all([
      client
        .from("test_plans")
        .select(
          "id,application_id,environment_id,release_id,test_plan_items(id)"
        )
        .eq("name", "Phase 3 Verification Plan Updated")
        .single(),
      client
        .from("releases")
        .select("id,application_id,environment_id")
        .eq("version", "v1.10.0")
        .eq("build", "phase3-verification")
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
    ["plan", planResult],
    ["release", releaseResult],
    ["lead", leadResult],
    ["tester", testerResult],
  ] as const) {
    if (result.error) {
      throw new Error(`Unable to load ${label}: ${result.error.message}`)
    }
  }

  const plan = planResult.data
  const release = releaseResult.data
  const lead = leadResult.data
  const tester = testerResult.data

  if (!plan || !release || !lead || !tester) {
    throw new Error("Required Phase 4 references are missing")
  }

  return {
    applicationId: plan.application_id,
    environmentId: release.environment_id,
    releaseId: release.id,
    planId: plan.id,
    planScenarioCount: plan.test_plan_items.length,
    leadProfileId: lead.id,
    testerProfileId: tester.id,
  }
}

async function main() {
  const client = await signInLead()

  try {
    const references = await loadReferences(client)

    const { data: createdRunId, error: createError } = await client.rpc(
      "create_test_run",
      {
        target_name: "Phase 4 Verification Run",
        target_test_plan_id: references.planId,
        target_application_id: references.applicationId,
        target_release_id: references.releaseId,
        target_environment_id: references.environmentId,
        target_build: "phase4-build-001",
        target_status: "IN_PROGRESS",
        target_assignment_profile_ids: [
          references.leadProfileId,
          references.testerProfileId,
        ],
      }
    )

    if (createError || !createdRunId) {
      throw new Error(
        `Run creation failed: ${createError?.message ?? "No run id returned"}`
      )
    }

    const listResult = await client
      .from("test_runs")
      .select("id,name,status")
      .eq("id", createdRunId)
      .single()

    if (listResult.error) {
      throw new Error(
        `Run list verification failed: ${listResult.error.message}`
      )
    }

    const detailBeforeUpdate = await client
      .from("test_runs")
      .select(
        "id,name,status,build,test_run_assignments(profile_id),test_executions(id,source_scenario_id,scenario_title,scenario_steps)"
      )
      .eq("id", createdRunId)
      .single<RunDetailRow>()

    if (detailBeforeUpdate.error) {
      throw new Error(
        `Run detail verification failed: ${detailBeforeUpdate.error.message}`
      )
    }

    if (
      detailBeforeUpdate.data.test_executions.length !==
      references.planScenarioCount
    ) {
      throw new Error(
        "Execution snapshot count does not match the selected plan"
      )
    }

    if (
      !detailBeforeUpdate.data.test_executions.every(
        (execution) =>
          execution.scenario_title.length > 0 &&
          execution.source_scenario_id.length > 0 &&
          Array.isArray(execution.scenario_steps)
      )
    ) {
      throw new Error("Execution snapshot payload is incomplete")
    }

    const { error: updateError } = await client.rpc("update_test_run", {
      target_run_id: createdRunId,
      target_name: "Phase 4 Verification Run Updated",
      target_release_id: references.releaseId,
      target_environment_id: references.environmentId,
      target_build: "phase4-build-002",
      target_status: "BLOCKED",
      target_assignment_profile_ids: [references.testerProfileId],
    })

    if (updateError) {
      throw new Error(`Run update failed: ${updateError.message}`)
    }

    const detailAfterUpdate = await client
      .from("test_runs")
      .select(
        "id,name,status,build,test_run_assignments(profile_id),test_executions(id,source_scenario_id,scenario_title,scenario_steps)"
      )
      .eq("id", createdRunId)
      .single<RunDetailRow>()

    if (detailAfterUpdate.error) {
      throw new Error(
        `Updated run verification failed: ${detailAfterUpdate.error.message}`
      )
    }

    console.log(
      JSON.stringify(
        {
          runId: createdRunId,
          listStatus: listResult.data.status,
          initialExecutionCount: detailBeforeUpdate.data.test_executions.length,
          initialAssignmentCount:
            detailBeforeUpdate.data.test_run_assignments.length,
          updatedName: detailAfterUpdate.data.name,
          updatedStatus: detailAfterUpdate.data.status,
          updatedBuild: detailAfterUpdate.data.build,
          updatedAssignmentCount:
            detailAfterUpdate.data.test_run_assignments.length,
        },
        null,
        2
      )
    )
  } finally {
    await safeSignOut(client)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
