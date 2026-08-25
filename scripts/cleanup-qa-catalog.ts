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

interface DeleteTarget {
  table: string
  id: string
  reason: string
}

async function collectDeletions(classifications: Classification[]): Promise<DeleteTarget[]> {
  const deletes: DeleteTarget[] = []

  // Find scenarios marked SAFE_TO_DELETE
  const scenariosToDelete = classifications.filter(c => c.classification === "SAFE_TO_DELETE")

  for (const scenario of scenariosToDelete) {
    // Get steps for this scenario
    const { data: steps } = await supabase
      .from("test_steps")
      .select("id")
      .eq("scenario_id", scenario.id)

    for (const step of steps ?? []) {
      deletes.push({
        table: "test_steps",
        id: step.id,
        reason: `Orphan step for deleted scenario ${scenario.id.substring(0, 8)}`,
      })
    }

    // Get tags for this scenario
    const { data: tags } = await supabase
      .from("scenario_tags")
      .select("id")
      .eq("scenario_id", scenario.id)

    for (const tag of tags ?? []) {
      deletes.push({
        table: "scenario_tags",
        id: tag.id,
        reason: `Orphan tag for deleted scenario ${scenario.id.substring(0, 8)}`,
      })
    }

    deletes.push({
      table: "test_scenarios",
      id: scenario.id,
      reason: scenario.reason,
    })
  }

  return deletes
}

async function printDeletePlan(deletes: DeleteTarget[]): Promise<void> {
  console.log("\n" + "=".repeat(80))
  console.log("DELETION PLAN")
  console.log("=".repeat(80))
  console.log(`Total rows to delete: ${deletes.length}`)
  console.log()

  const byTable = new Map<string, DeleteTarget[]>()
  for (const d of deletes) {
    if (!byTable.has(d.table)) byTable.set(d.table, [])
    byTable.get(d.table)!.push(d)
  }

  for (const [table, items] of byTable.entries()) {
    console.log(`[${table}] — ${items.length} rows`)
    for (const item of items) {
      console.log(`  DELETE FROM ${table} WHERE id = '${item.id}'`)
      console.log(`  Reason: ${item.reason}`)
    }
    console.log()
  }

  console.log("=".repeat(80))
  console.log("ROWS THAT WILL NOT BE DELETED (PROTECTED):")
  console.log("-".repeat(80))
  console.log("  ✓ All applications (6)")
  console.log("  ✓ All modules (3)")
  console.log("  ✓ All features (3)")
  console.log("  ✓ Real scenarios (3)")
  console.log("  ✓ Referenced verification scenario (1)")
  console.log("  ✓ All executions (20)")
  console.log("  ✓ All execution attempts (11)")
  console.log("  ✓ All reports (2)")
  console.log("  ✓ All report snapshots (2)")
  console.log("  ✓ All failures (2)")
  console.log("  ✓ All feedback (3)")
  console.log("  ✓ All QA work items (1)")
  console.log("  ✓ All test plans (2)")
  console.log("  ✓ All test runs (10)")
  console.log("  ✓ All releases (1)")
  console.log("  ✓ All environments (5)")
  console.log("=".repeat(80))
}

async function executeDeletions(deletes: DeleteTarget[]): Promise<void> {
  console.log("\nExecuting deletions...")
  console.log("=".repeat(80))

  let success = 0
  let errors = 0

  // Delete in order: steps first, then tags, then scenarios
  const order = ["test_steps", "scenario_tags", "test_scenarios"]

  for (const table of order) {
    const items = deletes.filter(d => d.table === table)
    if (items.length === 0) continue

    for (const item of items) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", item.id)

      if (error) {
        console.error(`  ❌ FAILED: DELETE FROM ${table} WHERE id = '${item.id}'`)
        console.error(`     Error: ${error.message}`)
        errors++
      } else {
        console.log(`  ✓ Deleted: ${table}.${item.id.substring(0, 8)}...`)
        success++
      }
    }
  }

  console.log("=".repeat(80))
  console.log(`Deletion complete: ${success} succeeded, ${errors} failed`)

  if (errors > 0) {
    console.error("\n⚠️  Some deletions failed. Review the errors above.")
    process.exit(1)
  }
}

async function verifyState(): Promise<void> {
  console.log("\n" + "=".repeat(80))
  console.log("POST-CLEANUP VERIFICATION")
  console.log("=".repeat(80))

  const checks = [
    { table: "applications", expected: 6, label: "Applications" },
    { table: "modules", expected: 3, label: "Modules" },
    { table: "features", expected: 3, label: "Features" },
    { table: "test_scenarios", expected: 4, label: "Scenarios" },
    { table: "test_steps", expected: 6, label: "Steps" },
    { table: "scenario_tags", expected: 6, label: "Scenario Tags" },
    { table: "test_executions", expected: 20, label: "Executions" },
    { table: "test_execution_attempts", expected: 11, label: "Execution Attempts" },
    { table: "reports", expected: 2, label: "Reports" },
    { table: "report_snapshots", expected: 2, label: "Report Snapshots" },
    { table: "failures", expected: 2, label: "Failures" },
    { table: "feedback", expected: 3, label: "Feedback" },
    { table: "qa_work_items", expected: 1, label: "QA Work Items" },
    { table: "test_plans", expected: 2, label: "Test Plans" },
    { table: "test_runs", expected: 10, label: "Test Runs" },
  ]

  let allPassed = true
  for (const check of checks) {
    const { count, error } = await supabase
      .from(check.table)
      .select("*", { count: "exact", head: true })

    if (error) {
      console.log(`  ❌ ${check.label}: ERROR - ${error.message}`)
      allPassed = false
    } else if (count !== check.expected) {
      console.log(`  ⚠️  ${check.label}: ${count} (expected ${check.expected})`)
      allPassed = false
    } else {
      console.log(`  ✓ ${check.label}: ${count}`)
    }
  }

  console.log("=".repeat(80))

  if (!allPassed) {
    console.log("\n⚠️  Verification failed. Some counts don't match expectations.")
    process.exit(1)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dangerouslyDelete = args.includes("--dangerously-delete")
  const skipConfirmation = args.includes("--yes")

  console.log("🔍 Running QA Catalog Cleanup Audit")
  console.log()

  try {
    const classifications = await audit()
    await printReport(classifications)

    const deletions = await collectDeletions(classifications)
    await printDeletePlan(deletions)

    if (deletions.length === 0) {
      console.log("\n✅ No deletions required. Catalog is clean.")
      return
    }

    if (!dangerouslyDelete) {
      console.log("\n🛑 DRY RUN MODE — No deletions were performed.")
      console.log("To execute deletions, run with --dangerously-delete --yes flags.")
      return
    }

    if (!skipConfirmation) {
      const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
      })

      const answer = await new Promise<string>((resolve) => {
        readline.question(
          `\n⚠️  You are about to DELETE ${deletions.length} rows. Type 'delete' to confirm: `,
          resolve
        )
      })
      readline.close()

      if (answer !== "delete") {
        console.log("\n❌ Deletion cancelled by user.")
        return
      }
    }

    console.log("\n🗑️  Executing deletions...")
    await executeDeletions(deletions)

    // Verify post-deletion state
    console.log("\n🔍 Verifying post-deletion state...")
    await verifyState()

    console.log("\n✅ Cleanup complete!")
  } catch (error) {
    console.error("❌ Cleanup failed:", error)
    process.exit(1)
  }
}

main()
