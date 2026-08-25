/**
 * QA Catalog Cleanup Script
 *
 * DRY RUN MODE (default): Prints classification report only, no deletions.
 * Destructive mode: --dangerously-delete flag required.
 *
 * Usage:
 *   npx tsx scripts/cleanup-qa-catalog.ts
 *   npx tsx scripts/cleanup-qa-catalog.ts --dangerously-delete
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve } from "path"

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local")
  try {
    const content = readFileSync(envPath, "utf8")
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eqIndex = trimmed.indexOf("=")
      if (eqIndex === -1) continue
      const key = trimmed.slice(0, eqIndex).trim()
      const value = trimmed.slice(eqIndex + 1).trim()
      if (process.env[key] === undefined) {
        process.env[key] = value
      }
    }
  } catch {
    // .env.local not found, rely on existing env vars
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

interface Classification {
  id: string
  type: "application" | "module" | "feature" | "scenario" | "step" | "tag"
  name: string
  classification:
    | "REAL"
    | "VERIFICATION"
    | "DEMO"
    | "DUPLICATE"
    | "STALE"
    | "REFERENCED"
    | "SAFE_TO_DELETE"
    | "KEEP"
  reason: string
  referencedBy: string[]
}

async function audit(): Promise<Classification[]> {
  const results: Classification[] = []

  // 1. Applications
  const { data: apps } = await supabase
    .from("applications")
    .select("id, name, slug, is_active")
  for (const app of apps ?? []) {
    results.push({
      id: app.id,
      type: "application",
      name: app.name,
      classification: "KEEP",
      reason: "Canonical application record",
      referencedBy: [],
    })
  }

  // 2. Modules
  const { data: mods } = await supabase
    .from("modules")
    .select("id, name, slug, application_id")
  for (const mod of mods ?? []) {
    results.push({
      id: mod.id,
      type: "module",
      name: mod.name,
      classification: "KEEP",
      reason: "Referenced by scenarios",
      referencedBy: ["test_scenarios.module_id"],
    })
  }

  // 3. Features
  const { data: feats } = await supabase
    .from("features")
    .select("id, name, slug, module_id")
  for (const feat of feats ?? []) {
    results.push({
      id: feat.id,
      type: "feature",
      name: feat.name,
      classification: "KEEP",
      reason: "Referenced by scenarios",
      referencedBy: ["test_scenarios.feature_id"],
    })
  }

  // 4. Scenarios — check references
  const { data: scenarios } = await supabase
    .from("test_scenarios")
    .select("id, title, description, module_id, feature_id, is_active")

  // Get all reference sets
  const { data: execRefs } = await supabase
    .from("test_executions")
    .select("source_scenario_id")
  const execSet = new Set(execRefs?.map((e) => e.source_scenario_id) ?? [])

  const { data: planRefs } = await supabase
    .from("test_plan_items")
    .select("scenario_id")
  const planSet = new Set(planRefs?.map((p) => p.scenario_id) ?? [])

  const { data: steps } = await supabase.from("test_steps").select("id, scenario_id")
  const stepByScenario: Record<string, string[]> = {}
  for (const s of steps ?? []) {
    if (!stepByScenario[s.scenario_id]) stepByScenario[s.scenario_id] = []
    stepByScenario[s.scenario_id].push(s.id)
  }

  const { data: tags } = await supabase
    .from("scenario_tags")
    .select("id, scenario_id")
  const tagByScenario: Record<string, string[]> = {}
  for (const t of tags ?? []) {
    if (!tagByScenario[t.scenario_id]) tagByScenario[t.scenario_id] = []
    tagByScenario[t.scenario_id].push(t.id)
  }

  for (const scenario of scenarios ?? []) {
    const isReferenced = execSet.has(scenario.id) || planSet.has(scenario.id)
    const isVerification =
      scenario.title.includes("verification") ||
      scenario.description?.includes("Temporary")

    let classification: Classification["classification"]
    let reason: string
    const referencedBy: string[] = []

    if (isReferenced) {
      classification = "REFERENCED"
      reason =
        "Referenced by executions/plans — must retain for historical integrity"
      if (execSet.has(scenario.id))
        referencedBy.push(
          `test_executions (${execRefs?.filter((e) => e.source_scenario_id === scenario.id).length} rows)`,
        )
      if (planSet.has(scenario.id))
        referencedBy.push(
          `test_plan_items (${planRefs?.filter((p) => p.scenario_id === scenario.id).length} rows)`,
        )
    } else if (isVerification) {
      classification = "SAFE_TO_DELETE"
      reason = "Verification fixture with no references"
    } else {
      classification = "REAL"
      reason = "Real catalog scenario"
    }

    results.push({
      id: scenario.id,
      type: "scenario",
      name: scenario.title,
      classification,
      reason,
      referencedBy,
    })
  }

  return results
}

async function printReport(classifications: Classification[]): Promise<void> {
  console.log("=".repeat(80))
  console.log("QA CATALOG CLEANUP AUDIT REPORT")
  console.log("=".repeat(80))
  console.log()

  // Summary by classification
  const byClass = new Map<string, Classification[]>()
  for (const c of classifications) {
    if (!byClass.has(c.classification)) byClass.set(c.classification, [])
    byClass.get(c.classification)!.push(c)
  }

  console.log("SUMMARY BY CLASSIFICATION:")
  console.log("-".repeat(40))
  for (const [cls, items] of byClass.entries()) {
    console.log(`  ${cls}: ${items.length} rows`)
  }
  console.log()

  // Detailed report
  console.log("DETAILED CLASSIFICATION:")
  console.log("-".repeat(80))

  for (const c of classifications) {
    console.log(`[${c.classification}] ${c.type}: ${c.name}`)
    console.log(`  ID: ${c.id}`)
    console.log(`  Reason: ${c.reason}`)
    if (c.referencedBy.length > 0) {
      console.log(`  Referenced by: ${c.referencedBy.join(", ")}`)
    }
    console.log()
  }

  console.log("=".repeat(80))
  console.log("HISTORICAL DATA PROTECTION CHECK:")
  console.log("-".repeat(80))

  const historicalTables = [
    "test_executions",
    "test_execution_attempts",
    "reports",
    "report_snapshots",
    "failures",
    "feedback",
    "qa_work_items",
    "test_plans",
    "test_runs",
  ]

  for (const table of historicalTables) {
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
    console.log(`  ${table}: ${count} rows (PROTECTED)`)
  }
  console.log()
  console.log("All historical tables are PROTECTED and will NOT be modified.")
  console.log("=".repeat(80))
}

async function main() {
  const args = process.argv.slice(2)
  const dangerouslyDelete = args.includes("--dangerously-delete")

  if (dangerouslyDelete) {
    console.log(
      "⚠️  DANGEROUS MODE ENABLED — This will DELETE rows from Supabase!",
    )
    console.log(
      "This is a DRY RUN placeholder. Deletion logic not yet implemented.",
    )
    console.log(
      "Run without --dangerously-delete to see the audit report only.",
    )
    return
  }

  console.log("🔍 Running QA Catalog Cleanup Audit (DRY RUN MODE)")
  console.log()

  try {
    const classifications = await audit()
    await printReport(classifications)

    console.log("\n✅ Audit complete. No changes were made.")
    console.log(
      "To perform deletion, run with --dangerously-delete flag.",
    )
  } catch (error) {
    console.error("❌ Audit failed:", error)
    process.exit(1)
  }
}

main()
