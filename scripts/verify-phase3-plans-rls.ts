import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type Role = "ADMIN" | "QA_LEAD" | "QA_TESTER"
type CapabilityResult = "ALLOWED" | "DENIED"

type VerificationResult = {
  readPlans: CapabilityResult
  readPlanItems: CapabilityResult
  readAssignments: CapabilityResult
  createPlan: CapabilityResult
  updatePlan: CapabilityResult
  manageScenarios: CapabilityResult
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
  const [releaseResult, scenariosResult, leadResult, testerResult, planResult] =
    await Promise.all([
      client
        .from("releases")
        .select("id,application_id,environment_id")
        .eq("version", "v1.10.0")
        .eq("build", "phase3-verification")
        .single(),
      client
        .from("test_scenarios")
        .select("id")
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
      client
        .from("test_plans")
        .select("id")
        .eq("name", "Phase 3 Verification Plan Updated")
        .single(),
    ])

  for (const [label, result] of [
    ["release", releaseResult],
    ["scenarios", scenariosResult],
    ["lead", leadResult],
    ["tester", testerResult],
    ["plan", planResult],
  ] as const) {
    if (result.error) {
      throw new Error(`Unable to load ${label}: ${result.error.message}`)
    }
  }

  const release = releaseResult.data
  const scenarios = scenariosResult.data ?? []
  const lead = leadResult.data
  const tester = testerResult.data
  const baselinePlan = planResult.data

  if (!release || !lead || !tester || !baselinePlan) {
    throw new Error("Required Phase 3 RLS references are missing")
  }

  if (scenarios.length < 2) {
    throw new Error(
      "At least two Portal scenarios are required for RLS verification"
    )
  }

  return {
    applicationId: release.application_id,
    environmentId: release.environment_id,
    releaseId: release.id,
    baselinePlanId: baselinePlan.id,
    leadProfileId: lead.id,
    testerProfileId: tester.id,
    scenarioIds: scenarios.map(({ id }) => id),
  }
}

async function canRead(
  client: SupabaseClient,
  table: "test_plans" | "test_plan_items" | "test_plan_assignments"
) {
  const column = table === "test_plans" ? "id" : "test_plan_id"
  const { error } = await client.from(table).select(column).limit(1)
  return error ? "DENIED" : "ALLOWED"
}

async function createPlanForRole(
  client: SupabaseClient,
  role: Role,
  references: Awaited<ReturnType<typeof loadReferences>>
): Promise<{ planId: string | null; result: CapabilityResult }> {
  const name = `Phase 3 RLS ${role} ${Date.now()}`
  const { data, error } = await client.rpc("create_test_plan", {
    target_name: name,
    target_application_id: references.applicationId,
    target_release_id: references.releaseId,
    target_environment_id: references.environmentId,
    target_owner_id: references.leadProfileId,
    target_description: "Temporary plan for RLS verification.",
    target_start_date: "2026-08-25",
    target_target_completion: "2026-08-29",
    target_status: "DRAFT",
    target_scenario_ids: [references.scenarioIds[0]],
    target_assignment_profile_ids: [references.testerProfileId],
  })

  return {
    planId: (data as string | null) ?? null,
    result: error ? "DENIED" : "ALLOWED",
  }
}

async function updatePlan(
  client: SupabaseClient,
  references: Awaited<ReturnType<typeof loadReferences>>,
  targetPlanId: string,
  overrides?: {
    assignmentProfileIds?: string[]
    name?: string
    scenarioIds?: string[]
    status?: "DRAFT" | "READY"
  }
): Promise<CapabilityResult> {
  const { error } = await client.rpc("update_test_plan", {
    target_plan_id: targetPlanId,
    target_name: overrides?.name ?? "Phase 3 RLS Updated",
    target_application_id: references.applicationId,
    target_release_id: references.releaseId,
    target_environment_id: references.environmentId,
    target_owner_id: references.leadProfileId,
    target_description: "Temporary update for RLS verification.",
    target_start_date: "2026-08-25",
    target_target_completion: "2026-08-30",
    target_status: overrides?.status ?? "READY",
    target_scenario_ids: overrides?.scenarioIds ?? [references.scenarioIds[0]],
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
    const created = await createPlanForRole(client, role, references)
    const updateTarget = created.planId ?? references.baselinePlanId

    const updateResult = await updatePlan(client, references, updateTarget, {
      name: `Phase 3 RLS Update ${role}`,
    })
    const scenarioMutation = await updatePlan(
      client,
      references,
      updateTarget,
      {
        scenarioIds: [...references.scenarioIds].reverse(),
        name: `Phase 3 RLS Scenario ${role}`,
      }
    )
    const assignmentMutation = await updatePlan(
      client,
      references,
      updateTarget,
      {
        assignmentProfileIds: [
          references.leadProfileId,
          references.testerProfileId,
        ],
        name: `Phase 3 RLS Assignment ${role}`,
      }
    )

    return {
      readPlans: await canRead(client, "test_plans"),
      readPlanItems: await canRead(client, "test_plan_items"),
      readAssignments: await canRead(client, "test_plan_assignments"),
      createPlan: created.result,
      updatePlan: updateResult,
      manageScenarios: scenarioMutation,
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
