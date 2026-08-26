/**
 * QA Workspace Reset Script — Controlled Maintenance Tool
 *
 * This script performs a complete workspace reset for the QA Hub.
 * It removes all dummy/verification data while preserving:
 * - Database schema, migrations, RLS policies
 * - Functions/triggers (except immutable trigger bypass)
 * - Storage bucket configuration
 * - Canonical application IDs
 * - Operational QA Lead account
 *
 * Usage:
 *   npx tsx scripts/reset-qa-workspace.ts                    # Dry run (default)
 *   npx tsx scripts/reset-qa-workspace.ts --dangerously-run  # Execute
 *   npx tsx scripts/reset-qa-workspace.ts --yes              # Skip confirmation
 *
 * Requirements:
 * - SUPABASE_SECRET_KEY with service role privileges
 * - Private.maintenance_reset() function must exist
 */

import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
)

// ─── Configuration ───────────────────────────────────────────────────────────

const OPERATIONAL_ACCOUNT_EMAIL = "tazkiyadigitalarchive@gmail.com"
const OPERATIONAL_ROLE = "QA_LEAD" as const

const DRY_RUN_TABLES = [
  "applications",
  "modules",
  "features",
  "test_scenarios",
  "test_steps",
  "scenario_tags",
  "environments",
  "releases",
  "test_plans",
  "test_plan_items",
  "test_plan_assignments",
  "test_runs",
  "test_run_assignments",
  "test_executions",
  "test_execution_steps",
  "test_execution_attempts",
  "qa_work_items",
  "qa_work_item_assignments",
  "qa_work_item_history",
  "failures",
  "feedback",
  "comments",
  "attachments",
  "reports",
  "report_snapshots",
  "report_approvals",
  "audit_events",
  "report_number_counters",
  "profiles",
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface CountSnapshot {
  [table: string]: number
}

interface CleanupReport {
  metadata: {
    supabaseUrl: string
    projectId: string
    timestamp: string
    mode: "DRY_RUN" | "EXECUTE"
  }
  before: CountSnapshot
  after: CountSnapshot
  auth: {
    before: { total: number; operational: number; temporary: string[] }
    after: { total: number; operational: number; temporary: string[] }
    suspended: string[]
    deleted: string[]
  }
  storage: {
    buckets: Array<{
      id: string
      name: string
      objects: number
    }>
  }
  verification: {
    schemaIntact: boolean
    applicationsKept: boolean
    noOrphanRows: boolean
    immutableTablesEmpty: boolean
    operationalAccountVerified: boolean
    allChecksPassed: boolean
  }
  errors: string[]
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function logSection(title: string): void {
  console.log("\n" + "=".repeat(80))
  console.log(title.toUpperCase())
  console.log("=".repeat(80))
}

function logSuccess(message: string): void {
  console.log(`  ✅ ${message}`)
}

function logWarning(message: string): void {
  console.log(`  ⚠️  ${message}`)
}

function logError(message: string): void {
  console.log(`  ❌ ${message}`)
}

function logInfo(message: string): void {
  console.log(`  ℹ️  ${message}`)
}

async function getTableCounts(): Promise<CountSnapshot> {
  const counts: CountSnapshot = {}

  for (const table of DRY_RUN_TABLES) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
      if (error) {
        counts[table] = -1 // Error marker
      } else {
        counts[table] = count ?? 0
      }
    } catch (_e: unknown) {
      counts[table] = -2 // Not found or other error
    }
  }

  return counts
}

async function getAuthUserState(): Promise<{
  total: number
  operational: number
  temporary: string[]
}> {
  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) {
    throw new Error(`Failed to list auth users: ${error.message}`)
  }

  const users = data?.users ?? []
  const operationalId = users.find(
    (u) => u.email === OPERATIONAL_ACCOUNT_EMAIL
  )?.id

  return {
    total: users.length,
    operational: operationalId ? 1 : 0,
    temporary: users
      .filter((u) => !u.email?.includes("@"))
      .map((u) => u.email!),
  }
}

async function _getSuspendedUsers(): Promise<string[]> {
  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) return []

  return (data?.users ?? [])
    .filter((u) => !!u.banned_until)
    .map((u) => u.email!)
}

async function auditStorage(): Promise<
  Array<{ id: string; name: string; objects: number }>
> {
  const { data: buckets, error } = await supabase.storage.listBuckets()

  if (error) {
    throw new Error(`Failed to list storage buckets: ${error.message}`)
  }

  const results: Array<{ id: string; name: string; objects: number }> = []

  for (const bucket of buckets ?? []) {
    const { data: objects } = await supabase.storage
      .from(bucket.id)
      .list("", { limit: 1000 })
    results.push({
      id: bucket.id,
      name: bucket.name || bucket.id,
      objects: objects?.length ?? 0,
    })
  }

  return results
}

// ─── Reset Functions ─────────────────────────────────────────────────────────

async function executeMaintenanceReset(): Promise<void> {
  // Call the maintenance reset function
  const { error } = await supabase.rpc("maintenance_reset")

  if (error) {
    throw new Error(`Maintenance reset failed: ${error.message}`)
  }

  logSuccess("Maintenance reset completed via private.maintenance_reset()")
}

async function suspendTemporaryUsers(): Promise<string[]> {
  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) {
    throw new Error(`Failed to list auth users: ${error.message}`)
  }

  const users = data?.users ?? []
  const suspended: string[] = []

  for (const user of users) {
    // Skip operational account
    if (user.email === OPERATIONAL_ACCOUNT_EMAIL) continue

    // Suspend the user
    const { error: suspendError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        ban_duration: "24h",
      }
    )

    if (suspendError) {
      logWarning(`Failed to suspend ${user.email}: ${suspendError.message}`)
    } else {
      logSuccess(`Suspended: ${user.email}`)
      suspended.push(user.email!)
    }
  }

  return suspended
}

async function deleteStorageObjects(
  buckets: Array<{ id: string; name: string }>
): Promise<void> {
  for (const bucket of buckets) {
    const { data: objects, error } = await supabase.storage
      .from(bucket.id)
      .list("", { limit: 1000 })

    if (error) {
      logWarning(`Failed to list objects in ${bucket.name}: ${error.message}`)
      continue
    }

    if (!objects || objects.length === 0) {
      logInfo(`${bucket.name}: No objects to delete`)
      continue
    }

    const paths = objects.map((obj) => obj.name)

    const { error: deleteError } = await supabase.storage
      .from(bucket.id)
      .remove(paths)

    if (deleteError) {
      logWarning(
        `Failed to delete objects from ${bucket.name}: ${deleteError.message}`
      )
    } else {
      logSuccess(`${bucket.name}: Deleted ${paths.length} object(s)`)
    }
  }
}

// ─── Verification Functions ─────────────────────────────────────────────────

async function verifySchemaIntact(): Promise<boolean> {
  // Verify that all expected tables still exist
  const expectedTables = [
    "applications",
    "modules",
    "features",
    "test_scenarios",
    "test_steps",
    "scenario_tags",
    "environments",
    "releases",
    "test_plans",
    "test_plan_items",
    "test_plan_assignments",
    "test_runs",
    "test_run_assignments",
    "test_executions",
    "test_execution_steps",
    "test_execution_attempts",
    "qa_work_items",
    "qa_work_item_assignments",
    "qa_work_item_history",
    "failures",
    "feedback",
    "comments",
    "attachments",
    "reports",
    "report_snapshots",
    "report_approvals",
    "audit_events",
    "report_number_counters",
    "profiles",
  ]

  let intact = true

  for (const table of expectedTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
      if (error) {
        logError(`Table ${table} no longer exists or is inaccessible`)
        intact = false
      }
    } catch (e: unknown) {
      logError(
        `Error checking table ${table}: ${e instanceof Error ? e.message : String(e)}`
      )
      intact = false
    }
  }

  if (intact) {
    logSuccess("All expected tables present")
  }

  return intact
}

async function verifyApplicationsKept(): Promise<boolean> {
  const { data, error } = await supabase.from("applications").select("name")

  if (error) {
    logError(`Failed to check applications: ${error.message}`)
    return false
  }

  const expectedApps = [
    "Portal",
    "CRM",
    "Flowra",
    "Daily Operation",
    "ITQM",
    "Intranet",
  ]
  const actualApps = (data ?? []).map((a) => a.name).sort()
  const expectedSorted = [...expectedApps].sort()

  const match = JSON.stringify(actualApps) === JSON.stringify(expectedSorted)

  if (match) {
    logSuccess(`All ${expectedApps.length} canonical applications preserved`)
  } else {
    logError(
      `Applications mismatch: expected ${expectedSorted}, got ${actualApps}`
    )
  }

  return match
}

async function verifyOperationalAccount(): Promise<boolean> {
  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) {
    logError(`Failed to check auth users: ${error.message}`)
    return false
  }

  const user = data?.users?.find((u) => u.email === OPERATIONAL_ACCOUNT_EMAIL)

  if (!user) {
    logError(`Operational account not found: ${OPERATIONAL_ACCOUNT_EMAIL}`)
    return false
  }

  if (user.banned_until) {
    logError(`Operational account is banned: ${OPERATIONAL_ACCOUNT_EMAIL}`)
    return false
  }

  // Check profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("email", OPERATIONAL_ACCOUNT_EMAIL)
    .single()

  if (profileError) {
    logError(`Failed to check profile: ${profileError.message}`)
    return false
  }

  if (profile?.role !== OPERATIONAL_ROLE) {
    logError(
      `Operational account role is ${profile?.role}, expected ${OPERATIONAL_ROLE}`
    )
    return false
  }

  if (profile?.status !== "ACTIVE") {
    logError(
      `Operational account status is ${profile?.status}, expected ACTIVE`
    )
    return false
  }

  logSuccess(
    `Operational account verified: ${OPERATIONAL_ACCOUNT_EMAIL} (${OPERATIONAL_ROLE}, ACTIVE)`
  )
  return true
}

async function verifyNoOrphanRows(): Promise<boolean> {
  const checks = [
    { table: "modules", expected: 0 },
    { table: "features", expected: 0 },
    { table: "test_scenarios", expected: 0 },
    { table: "test_steps", expected: 0 },
    { table: "scenario_tags", expected: 0 },
    { table: "test_plans", expected: 0 },
    { table: "test_plan_items", expected: 0 },
    { table: "test_plan_assignments", expected: 0 },
    { table: "test_runs", expected: 0 },
    { table: "test_run_assignments", expected: 0 },
    { table: "test_executions", expected: 0 },
    { table: "test_execution_steps", expected: 0 },
    { table: "qa_work_items", expected: 0 },
    { table: "qa_work_item_assignments", expected: 0 },
    { table: "failures", expected: 0 },
    { table: "feedback", expected: 0 },
    { table: "comments", expected: 0 },
    { table: "attachments", expected: 0 },
    { table: "reports", expected: 0 },
    { table: "report_approvals", expected: 0 },
    { table: "audit_events", expected: 0 },
    { table: "report_number_counters", expected: 0 },
  ]

  let allEmpty = true

  for (const check of checks) {
    const { count, error } = await supabase
      .from(check.table)
      .select("*", { count: "exact", head: true })

    if (error) {
      logError(`Failed to count ${check.table}: ${error.message}`)
      allEmpty = false
      continue
    }

    if (count !== check.expected) {
      logError(`${check.table}: ${count} rows (expected ${check.expected})`)
      allEmpty = false
    }
  }

  // Check immutable tables (should also be empty after maintenance reset)
  const immutableTables = [
    "test_execution_attempts",
    "qa_work_item_history",
    "report_snapshots",
  ]

  for (const table of immutableTables) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })

    if (error) {
      logError(`Failed to count ${table}: ${error.message}`)
      allEmpty = false
      continue
    }

    if (count !== 0) {
      logError(
        `${table}: ${count} rows (expected 0) - IMMUTABLE TRIGGER MAY HAVE BLOCKED DELETION`
      )
      allEmpty = false
    }
  }

  if (allEmpty) {
    logSuccess("All non-preserved tables are empty")
  }

  return allEmpty
}

async function verifyImmutableTablesEmpty(): Promise<boolean> {
  const tables = [
    "test_execution_attempts",
    "qa_work_item_history",
    "report_snapshots",
  ]
  let allEmpty = true

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })

    if (error) {
      logError(`Failed to count ${table}: ${error.message}`)
      allEmpty = false
      continue
    }

    if (count !== 0) {
      logError(`${table}: ${count} rows (expected 0)`)
      allEmpty = false
    }
  }

  if (allEmpty) {
    logSuccess("All immutable tables are empty (trigger bypass successful)")
  }

  return allEmpty
}

// ─── Main Execution ─────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const dangerouslyRun = args.includes("--dangerously-run")
  const skipConfirmation = args.includes("--yes")

  const report: CleanupReport = {
    metadata: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      projectId: process.env
        .NEXT_PUBLIC_SUPABASE_URL!.replace(/^https:\/\//, "")
        .split(".")[0],
      timestamp: new Date().toISOString(),
      mode: dangerouslyRun ? "EXECUTE" : "DRY_RUN",
    },
    before: {},
    after: {},
    auth: {
      before: { total: 0, operational: 0, temporary: [] },
      after: { total: 0, operational: 0, temporary: [] },
      suspended: [],
      deleted: [],
    },
    storage: { buckets: [] },
    verification: {
      schemaIntact: false,
      applicationsKept: false,
      noOrphanRows: false,
      immutableTablesEmpty: false,
      operationalAccountVerified: false,
      allChecksPassed: false,
    },
    errors: [],
  }

  console.log("🔧 QA Workspace Reset Script")
  console.log("=".repeat(80))
  console.log(`Target: ${report.metadata.projectId}`)
  console.log(`Mode: ${report.metadata.mode}`)

  if (!dangerouslyRun) {
    console.log("\n⚠️  DRY RUN MODE — No changes will be made.")
    console.log("To execute, add --dangerously-run flag.\n")
  }

  try {
    // ── Phase 1: Pre-flight Checks ──
    logSection("Phase 1: Pre-flight Checks")

    // Verify project
    logInfo(`Project ID: ${report.metadata.projectId}`)

    // Verify operational account exists
    const { data: authData, error: authError } =
      await supabase.auth.admin.listUsers()
    if (authError) {
      throw new Error(`Failed to authenticate: ${authError.message}`)
    }

    const operationalUser = authData?.users?.find(
      (u) => u.email === OPERATIONAL_ACCOUNT_EMAIL
    )
    if (!operationalUser) {
      throw new Error(
        `Operational account not found: ${OPERATIONAL_ACCOUNT_EMAIL}`
      )
    }
    logSuccess(`Operational account found: ${OPERATIONAL_ACCOUNT_EMAIL}`)

    // ── Phase 2: Audit Current State ──
    logSection("Phase 2: Audit Current State")

    report.before = await getTableCounts()
    report.auth.before = await getAuthUserState()
    report.storage.buckets = await auditStorage()

    console.log("\n📊 TABLE COUNTS:")
    console.log("  TABLE".padEnd(35) + "COUNT".padStart(10))
    console.log("  " + "-".repeat(45))
    for (const [table, count] of Object.entries(report.before)) {
      if (count >= 0) {
        console.log(`  ${table.padEnd(35)}${count.toString().padStart(10)}`)
      }
    }

    console.log("\n📊 AUTH STATE:")
    console.log(`  Total users: ${report.auth.before.total}`)
    console.log(`  Operational: ${report.auth.before.operational}`)
    console.log(`  Temporary: ${report.auth.before.temporary.length}`)

    console.log("\n📊 STORAGE:")
    for (const bucket of report.storage.buckets) {
      console.log(`  ${bucket.name}: ${bucket.objects} objects`)
    }

    // ── Phase 3: Execute Reset ──
    if (!dangerouslyRun) {
      console.log("\n🛑 DRY RUN MODE — Skipping execution.")
      return
    }

    if (!skipConfirmation) {
      const readline = await import("readline").then((m) =>
        m.createInterface({
          input: process.stdin,
          output: process.stdout,
        })
      )

      const answer = await new Promise<string>((resolve) => {
        readline.question(
          "\n⚠️  You are about to RESET THE ENTIRE WORKSPACE.\n" +
            "   All dummy data will be permanently deleted.\n" +
            '   Type "reset" to confirm: ',
          resolve
        )
      })
      readline.close()

      if (answer !== "reset") {
        console.log("\n❌ Reset cancelled by user.")
        return
      }
    }

    // ── Phase 4: Execute Maintenance Reset ──
    logSection("Phase 4: Execute Maintenance Reset")

    await executeMaintenanceReset()

    // ── Phase 5: Auth Cleanup ──
    logSection("Phase 5: Auth Cleanup")

    report.auth.suspended = await suspendTemporaryUsers()
    logSuccess(`Suspended ${report.auth.suspended.length} temporary user(s)`)

    // ── Phase 6: Storage Cleanup ──
    logSection("Phase 6: Storage Cleanup")

    const bucketsToDelete = report.storage.buckets.filter((b) => b.objects > 0)
    if (bucketsToDelete.length > 0) {
      await deleteStorageObjects(bucketsToDelete)
    } else {
      logInfo("No storage objects to delete")
    }

    // ── Phase 7: Post-Reset Audit ──
    logSection("Phase 7: Post-Reset Audit")

    report.after = await getTableCounts()
    report.auth.after = await getAuthUserState()

    console.log("\n📊 TABLE COUNTS (AFTER):")
    console.log(
      "  TABLE".padEnd(35) + "BEFORE".padStart(8) + "AFTER".padStart(8)
    )
    console.log("  " + "-".repeat(51))
    for (const [table] of Object.entries(report.before)) {
      const before = report.before[table]
      const after = report.after[table] ?? 0
      const change = before >= 0 && after >= 0 ? after - before : 0
      const changeStr =
        change !== 0 ? ` (${change > 0 ? "+" : ""}${change})` : ""
      console.log(
        `  ${table.padEnd(35)}${before.toString().padStart(8)}${after.toString().padStart(8)}${changeStr}`
      )
    }

    // ── Phase 8: Verification ──
    logSection("Phase 8: Verification")

    report.verification.schemaIntact = await verifySchemaIntact()
    report.verification.applicationsKept = await verifyApplicationsKept()
    report.verification.noOrphanRows = await verifyNoOrphanRows()
    report.verification.immutableTablesEmpty =
      await verifyImmutableTablesEmpty()
    report.verification.operationalAccountVerified =
      await verifyOperationalAccount()

    report.verification.allChecksPassed =
      report.verification.schemaIntact &&
      report.verification.applicationsKept &&
      report.verification.noOrphanRows &&
      report.verification.immutableTablesEmpty &&
      report.verification.operationalAccountVerified

    // ── Final Summary ──
    logSection("Final Summary")

    console.log("\n📊 PRE-FLIGHT:")
    console.log(`  Project: ${report.metadata.projectId}`)
    console.log(`  Operational account: ${OPERATIONAL_ACCOUNT_EMAIL}`)
    console.log(`  Mode: ${report.metadata.mode}`)

    console.log("\n📊 RESET RESULTS:")
    console.log(`  Tables affected: ${Object.keys(report.before).length}`)
    console.log(`  Auth users before: ${report.auth.before.total}`)
    console.log(`  Auth users after: ${report.auth.after.total}`)
    console.log(`  Temporary users suspended: ${report.auth.suspended.length}`)
    console.log(`  Storage buckets cleaned: ${bucketsToDelete.length}`)

    console.log("\n✅ VERIFICATION:")
    console.log(
      `  Schema intact: ${report.verification.schemaIntact ? "PASS" : "FAIL"}`
    )
    console.log(
      `  Applications preserved: ${report.verification.applicationsKept ? "PASS" : "FAIL"}`
    )
    console.log(
      `  No orphan rows: ${report.verification.noOrphanRows ? "PASS" : "FAIL"}`
    )
    console.log(
      `  Immutable tables empty: ${report.verification.immutableTablesEmpty ? "PASS" : "FAIL"}`
    )
    console.log(
      `  Operational account verified: ${report.verification.operationalAccountVerified ? "PASS" : "FAIL"}`
    )

    console.log("\n" + "=".repeat(80))
    if (report.verification.allChecksPassed) {
      console.log("✅ WORKSPACE RESET COMPLETE — READY FOR IMPORT")
    } else {
      console.log("❌ RESET FAILED — Some verification checks did not pass")
      process.exit(1)
    }
    console.log("=".repeat(80))
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("\n❌ Reset failed:", msg)
    report.errors.push(msg)
    process.exit(1)
  }
}

main().catch(console.error)
