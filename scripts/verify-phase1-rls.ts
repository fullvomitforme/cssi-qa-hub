import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type ActiveRole = "ADMIN" | "QA_LEAD" | "QA_TESTER"
type AccessStateRole = ActiveRole | "MISSING_PROFILE" | "INACTIVE_PROFILE"
type CapabilityResult = "ALLOWED" | "DENIED"
type VerificationResult = {
  readApplications: CapabilityResult
  readEnvironments: CapabilityResult
  readReleases: CapabilityResult
  insertApplication: CapabilityResult
  insertEnvironment: CapabilityResult
  insertRelease: CapabilityResult
}

type Matrix = Record<AccessStateRole, VerificationResult>

const credentialMap: Record<
  AccessStateRole,
  { email: string; password: string }
> = {
  ADMIN: {
    email: "phase1.admin@localhost.com",
    password: "QaHubPhase1!Admin",
  },
  QA_LEAD: {
    email: "phase1.lead@localhost.com",
    password: "QaHubPhase1!Lead",
  },
  QA_TESTER: {
    email: "phase1.tester@localhost.com",
    password: "QaHubPhase1!Tester",
  },
  MISSING_PROFILE: {
    email: "phase1.missing@localhost.com",
    password: "QaHubPhase1!Missing",
  },
  INACTIVE_PROFILE: {
    email: "phase1.inactive@localhost.com",
    password: "QaHubPhase1!Inactive",
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

async function signIn(role: AccessStateRole) {
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
  table: "applications" | "environments" | "releases"
): Promise<CapabilityResult> {
  const { data, error } = await client.from(table).select("id").limit(1)
  if (error) return "DENIED"
  return data.length > 0 ? "ALLOWED" : "DENIED"
}

async function canInsertApplication(
  client: SupabaseClient
): Promise<CapabilityResult> {
  const slug = `phase1-verify-app-${Date.now()}`
  const { error } = await client
    .from("applications")
    .insert({
      name: `Phase 1 Verify App ${Date.now()}`,
      slug,
      description: "Temporary RLS verification row",
    })
    .select("id")
    .single()

  return error ? "DENIED" : "ALLOWED"
}

async function canInsertEnvironment(
  client: SupabaseClient
): Promise<CapabilityResult> {
  const slug = `phase1-verify-env-${Date.now()}`
  const { error } = await client
    .from("environments")
    .insert({
      name: `Phase 1 Verify Env ${Date.now()}`,
      slug,
      description: "Temporary RLS verification environment",
      availability: "AVAILABLE",
    })
    .select("id")
    .single()

  return error ? "DENIED" : "ALLOWED"
}

async function canInsertRelease(
  client: SupabaseClient
): Promise<CapabilityResult> {
  const { error } = await client
    .from("releases")
    .insert({
      application_id: "21000000-0000-4000-8000-000000000001",
      environment_id: "22000000-0000-4000-8000-000000000003",
      version: `phase1-${Date.now()}`,
      build: `phase1-${Date.now()}`,
      branch: "phase1/verify",
      commit_sha: "1111111111111111111111111111111111111111",
      status: "PLANNED",
    })
    .select("id")
    .single()

  return error ? "DENIED" : "ALLOWED"
}

async function runFor(role: AccessStateRole) {
  const client = await signIn(role)

  try {
    return {
      readApplications: await canRead(client, "applications"),
      readEnvironments: await canRead(client, "environments"),
      readReleases: await canRead(client, "releases"),
      insertApplication: await canInsertApplication(client),
      insertEnvironment: await canInsertEnvironment(client),
      insertRelease: await canInsertRelease(client),
    }
  } finally {
    await safeSignOut(client)
  }
}

async function main() {
  const roles: AccessStateRole[] = [
    "ADMIN",
    "QA_LEAD",
    "QA_TESTER",
    "MISSING_PROFILE",
    "INACTIVE_PROFILE",
  ]

  const matrix = {} as Matrix

  for (const role of roles) {
    matrix[role] = await runFor(role)
  }

  console.log(JSON.stringify(matrix, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
