import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient } from "@supabase/supabase-js"

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

async function main() {
  const { url, key } = readEnvFile()
  const client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { error: loginError } = await client.auth.signInWithPassword({
    email: "phase2.admin@localhost.com",
    password: "QaHubPhase2!Admin",
  })

  if (loginError) {
    throw new Error(`Admin sign-in failed: ${loginError.message}`)
  }

  const listResult = await client
    .from("test_scenarios")
    .select(
      "id,title,applications!inner(slug),modules!inner(slug),features!inner(slug),scenario_tags(tag),test_steps(id)",
      { count: "exact" }
    )
    .eq("is_active", true)
    .eq("applications.slug", "portal")
    .textSearch("search_vector", "login")
    .order("updated_at", { ascending: false })
    .range(0, 1)

  if (listResult.error) {
    throw new Error(`Scenario list query failed: ${listResult.error.message}`)
  }

  const detailId = (listResult.data ?? [])[0]?.id
  if (!detailId) {
    throw new Error("Scenario list query returned no matching rows")
  }

  const detailResult = await client
    .from("test_scenarios")
    .select(
      "id,title,expected_result,applications!inner(slug),modules!inner(slug),features!inner(slug),scenario_tags(tag),test_steps(id,position,instruction,expected_result)"
    )
    .eq("id", detailId)
    .single()

  if (detailResult.error) {
    throw new Error(
      `Scenario detail query failed: ${detailResult.error.message}`
    )
  }

  console.log(
    JSON.stringify(
      {
        listCount: listResult.count,
        firstScenarioId: detailId,
        stepCount: detailResult.data.test_steps.length,
        tagCount: detailResult.data.scenario_tags.length,
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
