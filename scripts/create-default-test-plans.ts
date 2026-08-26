#!/usr/bin/env npx tsx
/**
 * Idempotent Canonical QA Test Plan Creator
 *
 * Creates 12 baseline QA plans (6 smoke + 6 regression) from the
 * imported 330-scenario catalog.
 *
 * Usage:
 *   npx tsx scripts/create-default-test-plans.ts --dry-run --all
 *   npx tsx scripts/create-default-test-plans.ts --dry-run --app portal
 *   npx tsx scripts/create-default-test-plans.ts --apply --portal
 *   npx tsx scripts/create-default-test-plans.ts --apply --all
 *
 * Default: DRY RUN (no DB writes).
 *
 * Prerequisites:
 *   - 330 scenarios imported (scenario_code column populated)
 *   - 6 applications exist
 *   - Operational profile exists (tazkiyadigitalarchive@gmail.com)
 *
 * Creates if missing:
 *   - 1 shared "Baseline" environment
 *   - 6 releases (one per application, linked to Baseline)
 */

import { config } from "dotenv"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import * as path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

config({ path: path.resolve(__dirname, "..", ".env.local") })

// ─── Types ──────────────────────────────────────────────────────────────────

interface PlanSpec {
  appSlug: string
  appName: string
  appId: string
  planName: string
  description: string
  scenarioCodes: string[]
}

interface CreationResult {
  app: string
  planName: string
  planId: string | null
  scenariosFound: number
  scenariosInserted: number
  alreadyExisted: boolean
  errors: string[]
}

// ─── Constants ──────────────────────────────────────────────────────────────

const APPS: Record<string, { id: string; name: string }> = {
  portal: { id: "21000000-0000-4000-8000-000000000001", name: "Portal" },
  crm: { id: "21000000-0000-4000-8000-000000000002", name: "CRM" },
  flowra: { id: "21000000-0000-4000-8000-000000000003", name: "Flowra" },
  "daily-operation": {
    id: "21000000-0000-4000-8000-000000000004",
    name: "Daily Operation",
  },
  itqm: { id: "21000000-0000-4000-8000-000000000005", name: "ITQM" },
  intranet: { id: "21000000-0000-4000-8000-000000000006", name: "Intranet" },
}

const OPERATIONAL_EMAIL = "tazkiyadigitalarchive@gmail.com"

// ─── Smoke Plan Definitions ─────────────────────────────────────────────────

const SMOKE_PLANS: PlanSpec[] = [
  {
    appSlug: "portal",
    appName: "Portal",
    appId: APPS.portal.id,
    planName: "Portal Smoke",
    description:
      "Core smoke test suite for validating Portal's critical user journeys: authentication, session management, user/role CRUD, SSO integration, and access control.",
    scenarioCodes: [
      "QA-PORTAL-AUTH-001",
      "QA-PORTAL-AUTH-005",
      "QA-PORTAL-AUTH-010",
      "QA-PORTAL-AUTH-003",
      "QA-PORTAL-USER-001",
      "QA-PORTAL-ROLE-001",
      "QA-PORTAL-APP-002",
      "QA-PORTAL-ACCOUNT-002",
      "QA-PORTAL-APP-001",
    ],
  },
  {
    appSlug: "crm",
    appName: "CRM",
    appId: APPS.crm.id,
    planName: "CRM Smoke",
    description:
      "Core smoke test suite for validating CRM's access control, account/contact/lead CRUD, global search, and admin module access.",
    scenarioCodes: [
      "QA-CRM-PERM-001",
      "QA-CRM-ACCT-001",
      "QA-CRM-ACCT-004",
      "QA-CRM-ACCT-005",
      "QA-CRM-CONTACT-001",
      "QA-CRM-LEAD-001",
      "QA-CRM-SEARCH-001",
      "QA-CRM-PERM-005",
    ],
  },
  {
    appSlug: "flowra",
    appName: "Flowra",
    appId: APPS.flowra.id,
    planName: "Flowra Smoke",
    description:
      "Core smoke test suite for validating Flowra's Opening Account workflow: multi-step form completion, validation, draft/autosave, submission, and permission enforcement.",
    scenarioCodes: [
      "QA-FLOWRA-VAL-001",
      "QA-FLOWRA-VAL-003",
      "QA-FLOWRA-SUB-001",
      "QA-FLOWRA-PROD-001",
      "QA-FLOWRA-INST-001",
      "QA-FLOWRA-PERS-001",
      "QA-FLOWRA-DRAFT-001",
      "QA-FLOWRA-DRAFT-002",
      "QA-FLOWRA-OA-001",
      "QA-FLOWRA-PERM-001",
    ],
  },
  {
    appSlug: "daily-operation",
    appName: "Daily Operation",
    appId: APPS["daily-operation"].id,
    planName: "Daily Operation Smoke",
    description:
      "Core smoke test suite for validating Daily Operation's today workspace, checklist completion, submission, approval/rejection workflow, and permission isolation.",
    scenarioCodes: [
      "QA-DAILY-TODAY-001",
      "QA-DAILY-TODAY-003",
      "QA-DAILY-TODAY-006",
      "QA-DAILY-APPROVAL-001",
      "QA-DAILY-APPROVAL-002",
      "QA-DAILY-APPROVAL-003",
      "QA-DAILY-PERM-001",
      "QA-DAILY-PERM-002",
    ],
  },
  {
    appSlug: "itqm",
    appName: "ITQM",
    appId: APPS.itqm.id,
    planName: "ITQM Smoke",
    description:
      "Core smoke test suite for validating ITQM's development request lifecycle: creation, resubmission, division approval, IT acceptance, PIC assignment, completion, and access control.",
    scenarioCodes: [
      "QA-ITQM-DEVREQ-001",
      "QA-ITQM-DEVREQ-005",
      "QA-ITQM-DEVREQ-006",
      "QA-ITQM-APPROVE-001",
      "QA-ITQM-APPROVE-002",
      "QA-ITQM-ACCEPT-001",
      "QA-ITQM-ACCEPT-002",
      "QA-ITQM-DONE-001",
      "QA-ITQM-DONE-002",
      "QA-ITQM-PERM-001",
    ],
  },
  {
    appSlug: "intranet",
    appName: "Intranet",
    appId: APPS.intranet.id,
    planName: "Intranet Smoke",
    description:
      "Core smoke test suite for validating Intranet's system announcements, regulations with role-based visibility, intranet announcements, and access control.",
    scenarioCodes: [
      "QA-INTRANET-SYSANN-001",
      "QA-INTRANET-SYSANN-006",
      "QA-INTRANET-REG-001",
      "QA-INTRANET-REG-005",
      "QA-INTRANET-REG-004",
      "QA-INTRANET-INTRANETANN-001",
      "QA-INTRANET-PERM-001",
      "QA-INTRANET-ACCOUNT-002",
    ],
  },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getOperationalProfile(
  supabase: SupabaseClient
): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", OPERATIONAL_EMAIL)
    .eq("status", "ACTIVE")
    .single()

  if (error || !data) {
    throw new Error(`Operational profile not found: ${OPERATIONAL_EMAIL}`)
  }
  return data.id
}

async function getOrCreateEnvironment(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const slug = "baseline"
  const { data: existing } = await supabase
    .from("environments")
    .select("id")
    .eq("slug", slug)
    .single()

  if (existing) return existing.id

  const id = crypto.randomUUID()
  const { error } = await supabase.from("environments").insert({
    id,
    name: "Baseline",
    slug,
    description:
      "Shared baseline environment for canonical QA test plans (not release-specific)",
    is_active: true,
    created_by: userId,
    updated_by: userId,
  })

  if (error) throw new Error(`Failed to create environment: ${error.message}`)
  return id
}

async function getOrCreateRelease(
  supabase: SupabaseClient,
  applicationId: string,
  environmentId: string,
  userId: string
): Promise<string> {
  const version = "baseline"
  const build = "catalog-v1"

  const { data: existing } = await supabase
    .from("releases")
    .select("id")
    .eq("application_id", applicationId)
    .eq("environment_id", environmentId)
    .eq("version", version)
    .eq("build", build)
    .single()

  if (existing) return existing.id

  const id = crypto.randomUUID()
  const { error } = await supabase.from("releases").insert({
    id,
    application_id: applicationId,
    environment_id: environmentId,
    version,
    build,
    status: "PLANNED",
    created_by: userId,
    updated_by: userId,
  })

  if (error) throw new Error(`Failed to create release: ${error.message}`)
  return id
}

async function resolveScenarioIds(
  supabase: SupabaseClient,
  applicationId: string,
  codes: string[]
): Promise<{ found: string[]; missing: string[] }> {
  const { data: scenarios } = await supabase
    .from("test_scenarios")
    .select("id, scenario_code")
    .eq("application_id", applicationId)
    .in("scenario_code", codes)

  const found = scenarios?.map((s) => s.id) ?? []
  const foundCodes = new Set(scenarios?.map((s) => s.scenario_code))
  const missing = codes.filter((c) => !foundCodes.has(c))

  return { found, missing }
}

async function getAllScenarioIdsForApp(
  supabase: SupabaseClient,
  applicationId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("test_scenarios")
    .select("id")
    .eq("application_id", applicationId)
    .order("scenario_code", { ascending: true })

  return data?.map((s) => s.id) ?? []
}

// ─── Plan Creation ──────────────────────────────────────────────────────────

async function createPlan(
  supabase: SupabaseClient,
  spec: PlanSpec,
  environmentId: string,
  releaseId: string,
  userId: string,
  apply: boolean
): Promise<CreationResult> {
  const result: CreationResult = {
    app: spec.appSlug,
    planName: spec.planName,
    planId: null,
    scenariosFound: 0,
    scenariosInserted: 0,
    alreadyExisted: false,
    errors: [],
  }

  // Check if plan already exists
  const { data: existingPlan } = await supabase
    .from("test_plans")
    .select("id")
    .eq("application_id", spec.appId)
    .eq("name", spec.planName)
    .single()

  if (existingPlan) {
    result.alreadyExisted = true
    result.planId = existingPlan.id

    const { count } = await supabase
      .from("test_plan_items")
      .select("*", { count: "exact", head: true })
      .eq("test_plan_id", existingPlan.id)

    result.scenariosInserted = count ?? 0
    return result
  }

  // Resolve scenario IDs
  const scenarioIds = spec.scenarioCodes
  const { found, missing } = await resolveScenarioIds(
    supabase,
    spec.appId,
    scenarioIds
  )

  result.scenariosFound = found.length
  if (missing.length > 0) {
    result.errors.push(`Missing scenarios: ${missing.join(", ")}`)
  }

  if (!apply) return result

  // Create plan
  const planId = crypto.randomUUID()
  const { error: planError } = await supabase.from("test_plans").insert({
    id: planId,
    application_id: spec.appId,
    release_id: releaseId,
    environment_id: environmentId,
    name: spec.planName,
    description: spec.description,
    owner_id: userId,
    status: "READY",
    created_by: userId,
    updated_by: userId,
  })

  if (planError) {
    result.errors.push(`Failed to create plan: ${planError.message}`)
    return result
  }

  result.planId = planId

  // Insert plan items
  let position = 0
  for (const scenarioId of found) {
    position++
    const { error } = await supabase.from("test_plan_items").insert({
      id: crypto.randomUUID(),
      test_plan_id: planId,
      scenario_id: scenarioId,
      position,
      created_by: userId,
    })

    if (error) {
      result.errors.push(
        `Failed to insert item at position ${position}: ${error.message}`
      )
    } else {
      result.scenariosInserted++
    }
  }

  return result
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const isApply = args.includes("--apply")
  const isDryRun = args.includes("--dry-run") || !isApply
  const importAll = args.includes("--all")

  const appSlugs = Object.keys(APPS).filter((slug) =>
    args.includes(`--${slug}`)
  )

  if (!importAll && appSlugs.length === 0) {
    console.log(
      "Usage: npx tsx scripts/create-default-test-plans.ts [--dry-run|--apply] [--all|--portal|--crm|--flowra|--daily-operation|--itqm|--intranet]"
    )
    console.log("Default: --dry-run")
    process.exit(1)
  }

  const targets = importAll ? Object.keys(APPS) : appSlugs

  console.log(`\n🔧 Canonical QA Test Plan Creator`)
  console.log(`   Mode: ${isDryRun ? "DRY RUN" : "APPLY"}`)
  console.log(`   Targets: ${targets.join(", ")}`)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  )

  // Setup shared infrastructure
  const userId = await getOperationalProfile(supabase)
  const environmentId = isApply
    ? await getOrCreateEnvironment(supabase, userId)
    : "dry-run-env"
  const envLabel = isApply ? environmentId : "(created on apply)"

  console.log(`   Environment: Baseline ${envLabel}`)
  console.log(`   Owner: ${OPERATIONAL_EMAIL} (${userId})`)

  const allResults: CreationResult[] = []

  for (const slug of targets) {
    const appInfo = APPS[slug]
    if (!appInfo) {
      console.error(`Unknown app: ${slug}`)
      continue
    }

    const releaseId = isApply
      ? await getOrCreateRelease(supabase, appInfo.id, environmentId, userId)
      : "dry-run-release"
    const relLabel = isApply ? releaseId : "(created on apply)"
    console.log(`\n   ${appInfo.name} release: ${relLabel}`)

    // Create smoke plan
    const smokeSpec = SMOKE_PLANS.find((p) => p.appSlug === slug)
    if (smokeSpec) {
      const smokeResult = await createPlan(
        supabase,
        smokeSpec,
        environmentId,
        releaseId,
        userId,
        isApply
      )
      allResults.push(smokeResult)
    }

    // Create regression plan (all scenarios for this app)
    const regressionIds = await getAllScenarioIdsForApp(supabase, appInfo.id)
    const regressionSpec: PlanSpec = {
      appSlug: slug,
      appName: appInfo.name,
      appId: appInfo.id,
      planName: `${appInfo.name} Regression`,
      description: `Full regression test suite covering all ${regressionIds.length} scenarios in the ${appInfo.name} QA catalog.`,
      scenarioCodes: [], // Not used for regression — we use direct IDs
    }

    // Check if regression plan exists
    const { data: existingRegression } = await supabase
      .from("test_plans")
      .select("id")
      .eq("application_id", appInfo.id)
      .eq("name", regressionSpec.planName)
      .single()

    if (existingRegression) {
      const { count } = await supabase
        .from("test_plan_items")
        .select("*", { count: "exact", head: true })
        .eq("test_plan_id", existingRegression.id)

      allResults.push({
        app: slug,
        planName: regressionSpec.planName,
        planId: existingRegression.id,
        scenariosFound: regressionIds.length,
        scenariosInserted: count ?? 0,
        alreadyExisted: true,
        errors: [],
      })
    } else if (isApply) {
      const planId = crypto.randomUUID()
      const { error: planError } = await supabase.from("test_plans").insert({
        id: planId,
        application_id: appInfo.id,
        release_id: releaseId,
        environment_id: environmentId,
        name: regressionSpec.planName,
        description: regressionSpec.description,
        owner_id: userId,
        status: "READY",
        created_by: userId,
        updated_by: userId,
      })

      if (planError) {
        allResults.push({
          app: slug,
          planName: regressionSpec.planName,
          planId: null,
          scenariosFound: regressionIds.length,
          scenariosInserted: 0,
          alreadyExisted: false,
          errors: [`Failed to create plan: ${planError.message}`],
        })
      } else {
        let inserted = 0
        for (let i = 0; i < regressionIds.length; i++) {
          const { error } = await supabase.from("test_plan_items").insert({
            id: crypto.randomUUID(),
            test_plan_id: planId,
            scenario_id: regressionIds[i],
            position: i + 1,
            created_by: userId,
          })
          if (!error) inserted++
        }

        allResults.push({
          app: slug,
          planName: regressionSpec.planName,
          planId,
          scenariosFound: regressionIds.length,
          scenariosInserted: inserted,
          alreadyExisted: false,
          errors: [],
        })
      }
    } else {
      allResults.push({
        app: slug,
        planName: regressionSpec.planName,
        planId: null,
        scenariosFound: regressionIds.length,
        scenariosInserted: 0,
        alreadyExisted: false,
        errors: [],
      })
    }
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`)
  console.log(`  CREATION SUMMARY`)
  console.log(`${"=".repeat(60)}`)

  let totalPlans = 0
  let totalItems = 0
  let totalErrors = 0

  for (const r of allResults) {
    const status = r.alreadyExisted
      ? "(existing)"
      : r.planId
        ? "(created)"
        : isDryRun
          ? "(dry-run)"
          : "(FAILED)"
    const itemCount = isDryRun ? r.scenariosFound : r.scenariosInserted
    console.log(
      `  ${r.app.padEnd(18)} ${r.planName.padEnd(30)} ${String(itemCount).padStart(3)} items ${status}`
    )
    totalPlans++
    totalItems += r.scenariosInserted
    totalErrors += r.errors.length
    for (const e of r.errors) console.log(`    ⚠️  ${e}`)
  }

  console.log(`\n  Plans: ${totalPlans}`)
  console.log(`  Items: ${totalItems}`)
  console.log(`  Errors: ${totalErrors}`)
  console.log(`  Mode: ${isDryRun ? "DRY RUN (no changes)" : "APPLIED"}`)
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
