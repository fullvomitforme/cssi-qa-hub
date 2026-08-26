#!/usr/bin/env npx tsx
/**
 * Idempotent QA Catalog Importer
 *
 * Parses reviewed markdown catalogs from docs/qa-scenarios/ and imports
 * modules, features, scenarios, steps, and tags into Supabase.
 *
 * Usage:
 *   npx tsx scripts/import-qa-catalog.ts --dry-run --all
 *   npx tsx scripts/import-qa-catalog.ts --dry-run --app portal
 *   npx tsx scripts/import-qa-catalog.ts --apply --portal
 *   npx tsx scripts/import-qa-catalog.ts --apply --all
 *
 * Default: DRY RUN (no DB writes).
 */

import { config } from "dotenv"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

config({ path: path.resolve(__dirname, "..", ".env.local") })

// ─── Types ──────────────────────────────────────────────────────────────────

interface ParsedStep {
  position: number
  instruction: string
  expected_result: string | null
}

interface ParsedScenario {
  scenario_code: string
  title: string
  description: string
  preconditions: string
  steps: ParsedStep[]
  expected_result: string
  priority: string
  category: string
  tags: string[]
}

interface ParsedFeature {
  name: string
  scenarios: ParsedScenario[]
}

interface ParsedModule {
  name: string
  features: ParsedFeature[]
}

interface ImportResult {
  app: string
  modules_created: number
  modules_existing: number
  features_created: number
  features_existing: number
  scenarios_created: number
  scenarios_updated: number
  scenarios_existing: number
  steps_created: number
  steps_updated: number
  tags_created: number
  tags_existing: number
  errors: string[]
}

// ─── Constants ──────────────────────────────────────────────────────────────

const APPS: Record<string, { id: string; file: string }> = {
  portal: { id: "21000000-0000-4000-8000-000000000001", file: "portal.md" },
  crm: { id: "21000000-0000-4000-8000-000000000002", file: "crm.md" },
  flowra: { id: "21000000-0000-4000-8000-000000000003", file: "flowra.md" },
  "daily-operation": {
    id: "21000000-0000-4000-8000-000000000004",
    file: "daily-operation.md",
  },
  itqm: { id: "21000000-0000-4000-8000-000000000005", file: "itqm.md" },
  intranet: { id: "21000000-0000-4000-8000-000000000006", file: "intranet.md" },
}

const VALID_TEST_TYPES = [
  "HAPPY_PATH",
  "VALIDATION",
  "NEGATIVE",
  "PERMISSION",
  "EDGE_CASE",
  "INTEGRATION",
  "REGRESSION",
  "RESPONSIVE",
  "ACCESSIBILITY",
  "PERFORMANCE",
]

const VALID_PRIORITIES = ["P0", "P1", "P2", "P3"]

const CATEGORY_MAP: Record<string, string> = {
  "happy path": "HAPPY_PATH",
  validation: "VALIDATION",
  negative: "NEGATIVE",
  permission: "PERMISSION",
  "edge case": "EDGE_CASE",
  integration: "INTEGRATION",
  regression: "REGRESSION",
  responsive: "RESPONSIVE",
  accessibility: "ACCESSIBILITY",
  performance: "PERFORMANCE",
}

const PRIORITY_MAP: Record<string, string> = {
  critical: "P0",
  high: "P1",
  medium: "P2",
  low: "P3",
}

const SCENARIO_CODE_PREFIX: Record<string, string> = {
  portal: "QA-PORTAL",
  crm: "QA-CRM",
  flowra: "QA-FLOWRA",
  "daily-operation": "QA-DAILY",
  itqm: "QA-ITQM",
  intranet: "QA-INTRANET",
}

// ─── Parser ─────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function parseMarkdownCatalog(
  filePath: string,
  _appSlug: string
): ParsedModule[] {
  const content = fs.readFileSync(filePath, "utf-8")
  const lines = content.split("\n")
  const modules: ParsedModule[] = []
  let currentModule: ParsedModule | null = null
  let currentFeature: ParsedFeature | null = null
  let currentScenario: ParsedScenario | null = null
  let inSection: string | null = null
  let sectionLines: string[] = []
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const scenarioCodePrefix = SCENARIO_CODE_PREFIX[_appSlug] || "QA-UNKNOWN"

  function flushSection() {
    if (!currentScenario) return
    const text = sectionLines.join("\n").trim()
    switch (inSection) {
      case "description":
        currentScenario.description = text
        break
      case "preconditions":
        currentScenario.preconditions = text
        break
      case "steps": {
        const steps: ParsedStep[] = []
        for (const line of sectionLines) {
          const stepMatch = line.match(/^\s*\d+\.\s+(.+)/)
          if (stepMatch) {
            steps.push({
              position: steps.length + 1,
              instruction: stepMatch[1].trim(),
              expected_result: null,
            })
          }
        }
        currentScenario.steps = steps
        break
      }
      case "expected_result":
        currentScenario.expected_result = text
        break
    }
    sectionLines = []
    inSection = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // ## Module heading (h2)
    const h2Match = line.match(/^## (.+)/)
    if (h2Match) {
      const name = h2Match[1].trim()
      // Skip meta sections
      if (
        [
          "Scope",
          "Coverage Quality Check",
          "Coverage Gaps",
          "Implementation Reference",
          "Implementation Status",
        ].includes(name)
      ) {
        currentModule = null
        currentFeature = null
        currentScenario = null
        continue
      }
      flushSection()
      currentScenario = null
      currentFeature = null
      currentModule = { name, features: [] }
      modules.push(currentModule)
      continue
    }

    // ### Feature heading (h3) — only inside a module
    const h3Match = line.match(/^### (.+)/)
    if (h3Match && currentModule) {
      flushSection()
      currentScenario = null
      currentFeature = { name: h3Match[1].trim(), scenarios: [] }
      currentModule.features.push(currentFeature)
      continue
    }

    // #### Scenario heading (h4)
    const h4Match = line.match(/^#### (QA-\S+)\s+[—–-]\s+(.+)/)
    if (h4Match) {
      flushSection()
      const code = h4Match[1].trim()
      const title = h4Match[2].trim()

      currentScenario = {
        scenario_code: code,
        title,
        description: "",
        preconditions: "",
        steps: [],
        expected_result: "",
        priority: "P2",
        category: "HAPPY_PATH",
        tags: [],
      }

      if (currentFeature) {
        currentFeature.scenarios.push(currentScenario)
      } else {
        // Scenario without a feature — create implicit feature "General"
        if (currentModule) {
          currentFeature = { name: "General", scenarios: [currentScenario] }
          currentModule.features.push(currentFeature)
        }
      }
      continue
    }

    // Section headers inside a scenario
    if (currentScenario) {
      if (line.match(/^\*\*Purpose\*\*/)) {
        flushSection()
        inSection = "description"
        continue
      }
      if (line.match(/^\*\*Preconditions\*\*/)) {
        flushSection()
        inSection = "preconditions"
        continue
      }
      if (line.match(/^\*\*Steps\*\*/)) {
        flushSection()
        inSection = "steps"
        continue
      }
      if (line.match(/^\*\*Expected Result\*\*/)) {
        flushSection()
        inSection = "expected_result"
        continue
      }
      if (line.match(/^\*\*Priority\*\*/)) {
        flushSection()
        // Next non-empty line is the priority
        const nextLine = lines[i + 1]?.trim().toLowerCase()
        if (nextLine && PRIORITY_MAP[nextLine]) {
          currentScenario.priority = PRIORITY_MAP[nextLine]
          i++ // skip the priority value line
        }
        continue
      }
      if (line.match(/^\*\*Category\*\*/)) {
        flushSection()
        const nextLine = lines[i + 1]?.trim().toLowerCase()
        if (nextLine && CATEGORY_MAP[nextLine]) {
          // Deduplicate — only take first Category
          if (
            currentScenario.category === "HAPPY_PATH" ||
            !currentScenario.category
          ) {
            currentScenario.category = CATEGORY_MAP[nextLine]
          }
          i++
        }
        continue
      }

      // Accumulate section content
      if (inSection) {
        sectionLines.push(line)
      }
    }
  }

  flushSection()
  return modules
}

// ─── Validator ──────────────────────────────────────────────────────────────

interface ValidationError {
  scenario_code: string
  field: string
  message: string
}

function validateCatalog(
  modules: ParsedModule[],
  _appSlug: string
): ValidationError[] {
  const errors: ValidationError[] = []
  const codes = new Set<string>()

  for (const mod of modules) {
    if (!mod.name) {
      errors.push({
        scenario_code: "N/A",
        field: "module",
        message: "Module name is empty",
      })
    }

    for (const feat of mod.features) {
      if (!feat.name) {
        errors.push({
          scenario_code: "N/A",
          field: "feature",
          message: `Feature in module "${mod.name}" is empty`,
        })
      }

      for (const sc of feat.scenarios) {
        if (codes.has(sc.scenario_code)) {
          errors.push({
            scenario_code: sc.scenario_code,
            field: "scenario_code",
            message: "Duplicate scenario code",
          })
        }
        codes.add(sc.scenario_code)

        if (!sc.title)
          errors.push({
            scenario_code: sc.scenario_code,
            field: "title",
            message: "Missing title",
          })
        if (!sc.description)
          errors.push({
            scenario_code: sc.scenario_code,
            field: "description",
            message: "Missing description/purpose",
          })
        if (!sc.preconditions)
          errors.push({
            scenario_code: sc.scenario_code,
            field: "preconditions",
            message: "Missing preconditions",
          })
        if (sc.steps.length === 0)
          errors.push({
            scenario_code: sc.scenario_code,
            field: "steps",
            message: "No steps defined",
          })
        if (!sc.expected_result)
          errors.push({
            scenario_code: sc.scenario_code,
            field: "expected_result",
            message: "Missing expected result",
          })

        if (!VALID_PRIORITIES.includes(sc.priority)) {
          errors.push({
            scenario_code: sc.scenario_code,
            field: "priority",
            message: `Invalid priority: "${sc.priority}"`,
          })
        }
        if (!VALID_TEST_TYPES.includes(sc.category)) {
          errors.push({
            scenario_code: sc.scenario_code,
            field: "category",
            message: `Invalid category: "${sc.category}"`,
          })
        }
      }
    }
  }

  return errors
}

// ─── Importer ───────────────────────────────────────────────────────────────

async function getOrCreateModule(
  supabase: SupabaseClient,
  applicationId: string,
  moduleName: string,
  userId: string
): Promise<{ id: string; created: boolean }> {
  const slug = slugify(moduleName)

  const { data: existing } = await supabase
    .from("modules")
    .select("id")
    .eq("application_id", applicationId)
    .eq("slug", slug)
    .single()

  if (existing) return { id: existing.id, created: false }

  const id = crypto.randomUUID()
  const { error } = await supabase.from("modules").insert({
    id,
    application_id: applicationId,
    name: moduleName,
    slug,
    created_by: userId,
    updated_by: userId,
  })

  if (error)
    throw new Error(`Failed to create module "${moduleName}": ${error.message}`)
  return { id, created: true }
}

async function getOrCreateFeature(
  supabase: SupabaseClient,
  moduleId: string,
  featureName: string,
  userId: string
): Promise<{ id: string; created: boolean }> {
  const slug = slugify(featureName)

  const { data: existing } = await supabase
    .from("features")
    .select("id")
    .eq("module_id", moduleId)
    .eq("slug", slug)
    .single()

  if (existing) return { id: existing.id, created: false }

  const id = crypto.randomUUID()
  const { error } = await supabase.from("features").insert({
    id,
    module_id: moduleId,
    name: featureName,
    slug,
    created_by: userId,
    updated_by: userId,
  })

  if (error)
    throw new Error(
      `Failed to create feature "${featureName}": ${error.message}`
    )
  return { id, created: true }
}

async function upsertScenario(
  supabase: SupabaseClient,
  applicationId: string,
  moduleId: string,
  featureId: string,
  scenario: ParsedScenario,
  userId: string
): Promise<{ created: boolean; updated: boolean }> {
  // Check if scenario_code already exists
  const { data: existing } = await supabase
    .from("test_scenarios")
    .select("id")
    .eq("scenario_code", scenario.scenario_code)
    .single()

  const now = new Date().toISOString()

  if (existing) {
    // Update if source data differs
    const { data: current } = await supabase
      .from("test_scenarios")
      .select(
        "title, description, preconditions, expected_result, priority, test_type"
      )
      .eq("id", existing.id)
      .single()

    const needsUpdate =
      current?.title !== scenario.title ||
      current?.description !== scenario.description ||
      current?.preconditions !== scenario.preconditions ||
      current?.expected_result !== scenario.expected_result ||
      current?.priority !== scenario.priority ||
      current?.test_type !== scenario.category

    if (needsUpdate) {
      const { error } = await supabase
        .from("test_scenarios")
        .update({
          title: scenario.title,
          description: scenario.description,
          preconditions: scenario.preconditions,
          expected_result: scenario.expected_result,
          priority: scenario.priority,
          test_type: scenario.category,
          updated_by: userId,
          updated_at: now,
        })
        .eq("id", existing.id)

      if (error)
        throw new Error(
          `Failed to update scenario ${scenario.scenario_code}: ${error.message}`
        )

      // Replace steps
      await supabase.from("test_steps").delete().eq("scenario_id", existing.id)
      await importSteps(supabase, existing.id, scenario.steps, userId)

      // Replace tags
      await supabase
        .from("scenario_tags")
        .delete()
        .eq("scenario_id", existing.id)
      await importTags(supabase, existing.id, scenario.tags, userId)

      return { created: false, updated: true }
    }

    return { created: false, updated: false }
  }

  // Insert new scenario
  const scenarioId = crypto.randomUUID()
  const { error } = await supabase.from("test_scenarios").insert({
    id: scenarioId,
    application_id: applicationId,
    module_id: moduleId,
    feature_id: featureId,
    scenario_code: scenario.scenario_code,
    title: scenario.title,
    description: scenario.description,
    preconditions: scenario.preconditions,
    test_type: scenario.category,
    priority: scenario.priority,
    expected_result: scenario.expected_result,
    is_active: true,
    created_by: userId,
    updated_by: userId,
  })

  if (error)
    throw new Error(
      `Failed to insert scenario ${scenario.scenario_code}: ${error.message}`
    )

  await importSteps(supabase, scenarioId, scenario.steps, userId)
  await importTags(supabase, scenarioId, scenario.tags, userId)

  return { created: true, updated: false }
}

async function importSteps(
  supabase: SupabaseClient,
  scenarioId: string,
  steps: ParsedStep[],
  userId: string
) {
  for (const step of steps) {
    const { error } = await supabase.from("test_steps").insert({
      id: crypto.randomUUID(),
      scenario_id: scenarioId,
      position: step.position,
      instruction: step.instruction,
      expected_result: step.expected_result,
      created_by: userId,
    })
    if (error)
      throw new Error(
        `Failed to insert step ${step.position} for ${scenarioId}: ${error.message}`
      )
  }
}

async function importTags(
  supabase: SupabaseClient,
  scenarioId: string,
  tags: string[],
  userId: string
) {
  for (const rawTag of tags) {
    const tag = rawTag.toLowerCase().trim()
    if (!tag || tag.length > 40) continue
    const { error } = await supabase.from("scenario_tags").insert({
      scenario_id: scenarioId,
      tag,
      created_by: userId,
    })
    if (error && error.code !== "23505") {
      // skip duplicate
      throw new Error(
        `Failed to insert tag "${tag}" for ${scenarioId}: ${error.message}`
      )
    }
  }
}

async function importApp(
  supabase: SupabaseClient,
  appSlug: string,
  apply: boolean
): Promise<ImportResult> {
  const appInfo = APPS[appSlug]
  if (!appInfo) throw new Error(`Unknown app: ${appSlug}`)

  const filePath = path.resolve(
    __dirname,
    "..",
    "docs",
    "qa-scenarios",
    appInfo.file
  )
  if (!fs.existsSync(filePath))
    throw new Error(`Catalog file not found: ${filePath}`)

  const modules = parseMarkdownCatalog(filePath, appSlug)
  const validationErrors = validateCatalog(modules, appSlug)

  const result: ImportResult = {
    app: appSlug,
    modules_created: 0,
    modules_existing: 0,
    features_created: 0,
    features_existing: 0,
    scenarios_created: 0,
    scenarios_updated: 0,
    scenarios_existing: 0,
    steps_created: 0,
    steps_updated: 0,
    tags_created: 0,
    tags_existing: 0,
    errors: [],
  }

  // Count totals
  let totalScenarios = 0
  let totalSteps = 0
  for (const mod of modules) {
    for (const feat of mod.features) {
      totalScenarios += feat.scenarios.length
      for (const sc of feat.scenarios) {
        totalSteps += sc.steps.length
      }
    }
  }

  console.log(`\n${"=".repeat(60)}`)
  console.log(`  ${appSlug.toUpperCase()} CATALOG`)
  console.log(`${"=".repeat(60)}`)
  console.log(`  Modules:    ${modules.length}`)
  console.log(`  Scenarios:  ${totalScenarios}`)
  console.log(`  Steps:      ${totalSteps}`)

  if (validationErrors.length > 0) {
    console.log(`\n  ❌ VALIDATION ERRORS (${validationErrors.length}):`)
    for (const err of validationErrors) {
      console.log(`    [${err.scenario_code}] ${err.field}: ${err.message}`)
    }
    result.errors = validationErrors.map(
      (e) => `[${e.scenario_code}] ${e.field}: ${e.message}`
    )
    return result
  }

  console.log(`  ✅ Validation passed`)

  if (!apply) {
    console.log(`\n  DRY RUN — no changes written`)
    return result
  }

  // Get the operational user ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", "tazkiyadigitalarchive@gmail.com")
    .single()

  if (!profile) throw new Error("Operational profile not found")
  const userId = profile.id

  for (const mod of modules) {
    const modResult = await getOrCreateModule(
      supabase,
      appInfo.id,
      mod.name,
      userId
    )
    if (modResult.created) result.modules_created++
    else result.modules_existing++

    for (const feat of mod.features) {
      const featResult = await getOrCreateFeature(
        supabase,
        modResult.id,
        feat.name,
        userId
      )
      if (featResult.created) result.features_created++
      else result.features_existing++

      for (const scenario of feat.scenarios) {
        try {
          const scResult = await upsertScenario(
            supabase,
            appInfo.id,
            modResult.id,
            featResult.id,
            scenario,
            userId
          )
          if (scResult.created) result.scenarios_created++
          else if (scResult.updated) result.scenarios_updated++
          else result.scenarios_existing++
        } catch (err: unknown) {
          result.errors.push(
            `${scenario.scenario_code}: ${err instanceof Error ? err.message : String(err)}`
          )
        }
      }
    }
  }

  // Count actual steps and tags in DB
  const { count: stepCount } = await supabase
    .from("test_steps")
    .select("*", { count: "exact", head: true })
  const { count: tagCount } = await supabase
    .from("scenario_tags")
    .select("*", { count: "exact", head: true })
  result.steps_created = stepCount ?? 0
  result.tags_created = tagCount ?? 0

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
      "Usage: npx tsx scripts/import-qa-catalog.ts [--dry-run|--apply] [--all|--portal|--crm|--flowra|--daily-operation|--itqm|--intranet]"
    )
    console.log("Default: --dry-run")
    process.exit(1)
  }

  const targets = importAll ? Object.keys(APPS) : appSlugs

  console.log(`\n🔧 QA Catalog Importer`)
  console.log(`   Mode: ${isDryRun ? "DRY RUN" : "APPLY"}`)
  console.log(`   Targets: ${targets.join(", ")}`)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  )

  const allResults: ImportResult[] = []

  for (const slug of targets) {
    try {
      const result = await importApp(supabase, slug, isApply)
      allResults.push(result)

      if (result.errors.length > 0) {
        console.log(
          `\n  ⚠️  ${slug} had ${result.errors.length} error(s) — stopping`
        )
        break
      }
    } catch (err: unknown) {
      console.error(
        `\n  ❌ FATAL: ${slug} — ${err instanceof Error ? err.message : String(err)}`
      )
      process.exit(1)
    }
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`)
  console.log(`  IMPORT SUMMARY`)
  console.log(`${"=".repeat(60)}`)

  for (const r of allResults) {
    console.log(`\n  ${r.app.toUpperCase()}:`)
    console.log(
      `    Modules:    +${r.modules_created} new, ${r.modules_existing} existing`
    )
    console.log(
      `    Features:   +${r.features_created} new, ${r.features_existing} existing`
    )
    console.log(
      `    Scenarios:  +${r.scenarios_created} new, ${r.scenarios_updated} updated, ${r.scenarios_existing} unchanged`
    )
    if (r.errors.length > 0) {
      console.log(`    Errors:     ${r.errors.length}`)
      for (const e of r.errors) console.log(`      - ${e}`)
    }
  }

  console.log(`\n  TOTALS (all apps combined):`)
  console.log(
    `    Scenarios: ${allResults.reduce((s, r) => s + r.scenarios_created + r.scenarios_updated + r.scenarios_existing, 0)}`
  )
  console.log(
    `    Steps:     ${allResults[allResults.length - 1]?.steps_created ?? 0}`
  )
  console.log(
    `    Tags:      ${allResults[allResults.length - 1]?.tags_created ?? 0}`
  )
  console.log(
    `    Errors:    ${allResults.reduce((s, r) => s + r.errors.length, 0)}`
  )

  console.log(`\n  Mode: ${isDryRun ? "DRY RUN (no changes)" : "APPLIED"}`)
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
