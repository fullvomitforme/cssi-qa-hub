import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type PlanDetailRow = {
  id: string
  name: string
  status: string
  test_plan_items: Array<{ position: number; scenario_id: string }>
  test_plan_assignments: Array<{ profile_id: string }>
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
  const [
    applicationResult,
    environmentResult,
    releaseResult,
    scenariosResult,
    leadResult,
    testerResult,
  ] = await Promise.all([
    client.from("applications").select("id").eq("slug", "portal").single(),
    client.from("environments").select("id").eq("slug", "uat").single(),
    client
      .from("releases")
      .select("id")
      .eq("version", "v1.10.0")
      .eq("build", "phase3-verification")
      .single(),
    client
      .from("test_scenarios")
      .select("id,title")
      .eq("application_id", "21000000-0000-4000-8000-000000000001")
      .eq("is_active", true)
      .order("title", { ascending: true })
      .limit(2),
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
    ["application", applicationResult],
    ["environment", environmentResult],
    ["release", releaseResult],
    ["scenarios", scenariosResult],
    ["lead", leadResult],
    ["tester", testerResult],
  ] as const) {
    if (result.error) {
      throw new Error(`Unable to load ${label}: ${result.error.message}`)
    }
  }

  const application = applicationResult.data
  const environment = environmentResult.data
  const release = releaseResult.data
  const lead = leadResult.data
  const tester = testerResult.data
  const scenarios = scenariosResult.data ?? []

  if (!application || !environment || !release || !lead || !tester) {
    throw new Error("Required Phase 3 plan references are missing")
  }

  if (scenarios.length < 2) {
    throw new Error("At least two persisted Portal scenarios are required")
  }

  return {
    applicationId: application.id,
    environmentId: environment.id,
    releaseId: release.id,
    leadProfileId: lead.id,
    testerProfileId: tester.id,
    scenarios,
  }
}

async function main() {
  const client = await signInLead()

  try {
    const references = await loadReferences(client)

    const { data: createdPlanId, error: createError } = await client.rpc(
      "create_test_plan",
      {
        target_name: "Phase 3 Verification Plan",
        target_application_id: references.applicationId,
        target_release_id: references.releaseId,
        target_environment_id: references.environmentId,
        target_owner_id: references.leadProfileId,
        target_description:
          "Hosted verification plan for Phase 3 Supabase integration.",
        target_start_date: "2026-08-25",
        target_target_completion: "2026-08-29",
        target_status: "DRAFT",
        target_scenario_ids: references.scenarios.map(({ id }) => id),
        target_assignment_profile_ids: [references.testerProfileId],
      }
    )

    if (createError || !createdPlanId) {
      throw new Error(
        `Plan creation failed: ${createError?.message ?? "No plan id returned"}`
      )
    }

    const listResult = await client
      .from("test_plans")
      .select("id,name,status,test_plan_items(id)")
      .ilike("name", "Phase 3 Verification Plan%")
      .order("created_at", { ascending: false })

    if (listResult.error) {
      throw new Error(
        `Plan list verification failed: ${listResult.error.message}`
      )
    }

    const createdPlan = (listResult.data ?? []).find(
      (plan) => plan.id === createdPlanId
    )
    if (!createdPlan) {
      throw new Error("Created plan was not returned by the real plan list")
    }

    const detailBeforeUpdate = await client
      .from("test_plans")
      .select(
        "id,name,status,test_plan_items(position,scenario_id),test_plan_assignments(profile_id)"
      )
      .eq("id", createdPlanId)
      .single<PlanDetailRow>()

    if (detailBeforeUpdate.error) {
      throw new Error(
        `Plan detail verification failed: ${detailBeforeUpdate.error.message}`
      )
    }

    const reversedScenarioIds = [...references.scenarios]
      .reverse()
      .map(({ id }) => id)

    const { error: updateError } = await client.rpc("update_test_plan", {
      target_plan_id: createdPlanId,
      target_name: "Phase 3 Verification Plan Updated",
      target_application_id: references.applicationId,
      target_release_id: references.releaseId,
      target_environment_id: references.environmentId,
      target_owner_id: references.leadProfileId,
      target_description: "Updated hosted verification plan for Phase 3.",
      target_start_date: "2026-08-25",
      target_target_completion: "2026-09-02",
      target_status: "READY",
      target_scenario_ids: reversedScenarioIds,
      target_assignment_profile_ids: [
        references.leadProfileId,
        references.testerProfileId,
      ],
    })

    if (updateError) {
      throw new Error(`Plan update failed: ${updateError.message}`)
    }

    const detailAfterUpdate = await client
      .from("test_plans")
      .select(
        "id,name,status,test_plan_items(position,scenario_id),test_plan_assignments(profile_id)"
      )
      .eq("id", createdPlanId)
      .single<PlanDetailRow>()

    if (detailAfterUpdate.error) {
      throw new Error(
        `Updated plan verification failed: ${detailAfterUpdate.error.message}`
      )
    }

    const updatedScenarioIds = detailAfterUpdate.data.test_plan_items
      .sort((left, right) => left.position - right.position)
      .map(({ scenario_id }) => scenario_id)
    const updatedAssignmentIds = detailAfterUpdate.data.test_plan_assignments
      .map(({ profile_id }) => profile_id)
      .sort()

    if (updatedScenarioIds.join(",") !== reversedScenarioIds.join(",")) {
      throw new Error(
        "Updated plan scenarios did not persist in the expected order"
      )
    }

    if (
      updatedAssignmentIds.join(",") !==
      [references.leadProfileId, references.testerProfileId].sort().join(",")
    ) {
      throw new Error("Updated plan assignments did not persist")
    }

    console.log(
      JSON.stringify(
        {
          planId: createdPlanId,
          listCount: listResult.data?.length ?? 0,
          initialStatus: detailBeforeUpdate.data.status,
          initialScenarioCount: detailBeforeUpdate.data.test_plan_items.length,
          initialAssignmentCount:
            detailBeforeUpdate.data.test_plan_assignments.length,
          updatedName: detailAfterUpdate.data.name,
          updatedStatus: detailAfterUpdate.data.status,
          updatedScenarioIds,
          updatedAssignmentIds,
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
