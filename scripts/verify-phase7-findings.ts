import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) throw new Error("Supabase environment is not configured")

const supabase = createClient(url, key)
const credentials = {
  tester: ["phase2.tester@localhost.com", "QaHubPhase2!Tester"],
  lead: ["phase2.lead@localhost.com", "QaHubPhase2!Lead"],
} as const

async function signIn(role: keyof typeof credentials) {
  const [email, password] = credentials[role]
  const client = createClient(url!, key!)
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return client
}

const tester = await signIn("tester")
const lead = await signIn("lead")
const { data: leadUser } = await lead.auth.getUser()
if (!leadUser.user) throw new Error("Lead sign-in did not establish a user")
const { data: executions, error: executionError } = await tester
  .from("test_executions")
  .select(
    "id,test_run_id,source_scenario_id,scenario_title,test_run:test_runs!test_executions_test_run_id_fkey(application_id)"
  )
  .eq("test_run_id", "086dae28-ea44-4af2-b380-9c12a4617551")
if (executionError) throw executionError
const execution = executions?.[0]
if (!execution) throw new Error("No retained verification execution found")
const executionRun = Array.isArray(execution.test_run)
  ? execution.test_run[0]
  : execution.test_run

const { data: failures, error: failuresError } = await tester
  .from("failures")
  .select(
    "id,execution_id,execution:test_executions!failures_execution_id_fkey(scenario_title)"
  )
  .order("created_at", { ascending: false })
if (failuresError) throw failuresError
const { data: feedback, error: feedbackError } = await tester
  .from("feedback")
  .select(
    "id,execution_id,scenario_id,application:applications!feedback_application_id_fkey(name),scenario:test_scenarios!feedback_scenario_id_fkey(title)"
  )
  .order("created_at", { ascending: false })
if (feedbackError) throw feedbackError

const title = `Phase 7 verification feedback ${new Date().toISOString()}`
const { data: insertedFeedback, error: insertError } = await lead
  .from("feedback")
  .insert({
    application_id: (executionRun as { application_id: string }).application_id,
    execution_id: execution.id,
    scenario_id: execution.source_scenario_id,
    feedback_type: "UX",
    title,
    description: "Hosted findings integration verification.",
    severity: "LOW",
    created_by: leadUser.user.id,
  })
  .select("id")
  .single()
if (insertError) throw insertError

const { data: testerUser } = await tester.auth.getUser()
if (!testerUser.user) throw new Error("Tester sign-in did not establish a user")
const { data: insertedFailure, error: failureInsertError } = await tester
  .from("failures")
  .insert({
    application_id: (executionRun as { application_id: string }).application_id,
    execution_id: execution.id,
    severity: "LOW",
    title: `Phase 7 verification failure ${new Date().toISOString()}`,
    description: "Hosted findings integration verification.",
    retest_status: "AWAITING_FIX",
    created_by: testerUser.user.id,
  })
  .select("id")
  .single()
if (failureInsertError) throw failureInsertError

const { data: restrictedInsert, error: restrictedError } = await tester
  .from("feedback")
  .insert({
    application_id: (executionRun as { application_id: string }).application_id,
    execution_id: "81429dc9-a4f5-42b2-b3a6-33804415a2cb",
    scenario_id: execution.source_scenario_id,
    feedback_type: "QUESTION",
    title: "Phase 7 restricted mutation",
    description: "Should be denied by execution access policy.",
    created_by: (await tester.auth.getUser()).data.user?.id,
  })
  .select("id")
  .maybeSingle()

console.log(
  JSON.stringify(
    {
      executionId: execution.id,
      failureRead: failuresError ? "ERROR" : "ALLOWED",
      feedbackRead: feedbackError ? "ERROR" : "ALLOWED",
      feedbackCreate: insertedFeedback?.id ? "ALLOWED" : "DENIED",
      testerRestrictedFeedbackCreate: restrictedInsert?.id
        ? "ALLOWED_UNEXPECTED"
        : restrictedError?.code === "42501" || restrictedError?.code === "23514"
          ? "DENIED"
          : "DENIED_OR_NO_ROW",
      failureCount: failures?.length ?? 0,
      feedbackCountBeforeCreate: feedback?.length ?? 0,
      verificationFeedbackId: insertedFeedback?.id ?? null,
      verificationFailureId: insertedFailure?.id ?? null,
    },
    null,
    2
  )
)

await tester.auth.signOut()
await lead.auth.signOut()
