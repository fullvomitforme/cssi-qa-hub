import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type Role = "ADMIN" | "QA_LEAD" | "QA_TESTER"
type CapabilityResult = "ALLOWED" | "DENIED"

type VerificationResult = {
  readScenarios: CapabilityResult
  readSteps: CapabilityResult
  readTags: CapabilityResult
  createScenario: CapabilityResult
  updateScenario: CapabilityResult
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

const hierarchy = {
  applicationId: "21000000-0000-4000-8000-000000000001",
  moduleId: "23000000-0000-4000-8000-000000000001",
  featureId: "24000000-0000-4000-8000-000000000001",
  scenarioId: "25000000-0000-4000-8000-000000000001",
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
  const credentials = credentialMap[role]
  const { error } = await client.auth.signInWithPassword(credentials)

  if (error) {
    throw new Error(`${role} sign-in failed: ${error.message}`)
  }

  return client
}

async function safeSignOut(client: SupabaseClient) {
  await client.auth.signOut({ scope: "global" })
}

async function canRead(
  client: SupabaseClient,
  table: "test_scenarios" | "test_steps" | "scenario_tags"
) {
  const column = table === "scenario_tags" ? "scenario_id" : "id"
  const { error } = await client.from(table).select(column).limit(1)
  return error ? "DENIED" : "ALLOWED"
}

async function canCreateScenario(
  client: SupabaseClient,
  role: Role
): Promise<{ result: CapabilityResult; scenarioId: string | null }> {
  const titleSuffix = `${role.toLowerCase()}-${Date.now()}`
  const { data, error } = await client.rpc("create_test_scenario", {
    target_application_id: hierarchy.applicationId,
    target_module_id: hierarchy.moduleId,
    target_feature_id: hierarchy.featureId,
    target_title: `Phase 2 verify ${titleSuffix}`,
    target_description: "Temporary scenario for hosted RLS verification.",
    target_preconditions: "Verification user is signed in.",
    target_test_type: "HAPPY_PATH",
    target_priority: "P2",
    target_expected_result: "Scenario is created.",
    target_steps: [
      {
        instruction: "Open the target page.",
        expected_result: "Page is visible.",
      },
    ],
    target_tags: ["phase2-verify"],
  })

  if (error) {
    return { result: "DENIED", scenarioId: null }
  }

  return { result: "ALLOWED", scenarioId: data as string }
}

async function canUpdateScenario(
  client: SupabaseClient,
  scenarioId: string
): Promise<CapabilityResult> {
  const { error } = await client.rpc("update_test_scenario", {
    target_scenario_id: scenarioId,
    target_application_id: hierarchy.applicationId,
    target_module_id: hierarchy.moduleId,
    target_feature_id: hierarchy.featureId,
    target_title: "Phase 2 verification scenario updated",
    target_description: "Temporary update for hosted RLS verification.",
    target_preconditions: "Verification user is signed in.",
    target_test_type: "REGRESSION",
    target_priority: "P2",
    target_expected_result: "Scenario is updated.",
    target_steps: [
      {
        instruction: "Open the target page.",
        expected_result: "Page is visible.",
      },
      {
        instruction: "Submit the scenario update.",
        expected_result: "Saved changes are returned.",
      },
    ],
    target_tags: ["phase2-verify", "updated"],
  })

  return error ? "DENIED" : "ALLOWED"
}

async function cleanupScenario(
  client: SupabaseClient,
  scenarioId: string | null
) {
  if (!scenarioId) return

  await client.from("test_scenarios").delete().eq("id", scenarioId)
}

async function runFor(role: Role) {
  const client = await signIn(role)

  try {
    const created = await canCreateScenario(client, role)
    const updateTarget = created.scenarioId ?? hierarchy.scenarioId
    const updateScenario = await canUpdateScenario(client, updateTarget)

    await cleanupScenario(client, created.scenarioId)

    return {
      readScenarios: await canRead(client, "test_scenarios"),
      readSteps: await canRead(client, "test_steps"),
      readTags: await canRead(client, "scenario_tags"),
      createScenario: created.result,
      updateScenario,
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
