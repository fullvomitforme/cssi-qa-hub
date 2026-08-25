import "server-only"

import { z } from "zod"

import { shouldUseDemoData } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import type { ExecutionStatus, Severity } from "@/types/qa"

const feedbackTypeSchema = z.enum([
  "BUG",
  "UX",
  "COPY",
  "IMPROVEMENT",
  "QUESTION",
])
const severitySchema = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"])

export class FindingsMutationError extends Error {
  constructor(
    message: string,
    readonly code:
      "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "UNKNOWN" = "UNKNOWN"
  ) {
    super(message)
  }
}

export interface FailureListItem {
  id: string
  executionId: string
  runId: string | null
  attemptId: string | null
  scenario: string
  application: string
  severity: Severity
  status: string
  title: string
  description: string
  bugReference: string
  retestStatus: string
  foundBy: string
  foundAt: string
}

export interface FeedbackListItem {
  id: string
  executionId: string
  scenarioId: string
  type: "BUG" | "UX" | "COPY" | "IMPROVEMENT" | "QUESTION"
  title: string
  description: string
  application: string
  scenario: string
  severity: Severity | null
  status: string
  author: string
  createdAt: string
}

type FailureRow = {
  id: string
  execution_id: string
  attempt_id: string | null
  application_id: string
  execution: { scenario_title: string; test_run_id: string } | null
  application: { name: string } | null
  severity: Severity
  status: string
  title: string
  description: string
  bug_reference: string | null
  retest_status: string | null
  created_by_profile: { full_name: string } | null
  created_at: string
}

type FeedbackRow = {
  id: string
  execution_id: string
  scenario_id: string
  feedback_type: FeedbackListItem["type"]
  title: string
  description: string
  application: { name: string } | null
  scenario: { title: string } | null
  severity: Severity | null
  status: string
  created_by_profile: { full_name: string } | null
  created_at: string
}

export async function listFailures(): Promise<FailureListItem[]> {
  if (shouldUseDemoData()) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("failures")
    .select(
      "id,execution_id,attempt_id,application_id,severity,status,title,description,bug_reference,retest_status,created_at,execution:test_executions!failures_execution_id_fkey(scenario_title,test_run_id),application:applications!failures_application_id_fkey(name),created_by_profile:profiles!failures_created_by_fkey(full_name)"
    )
    .order("created_at", { ascending: false })
  if (error) throw new Error(`Unable to load findings: ${error.message}`)
  return ((data ?? []) as unknown as FailureRow[]).map((row) => ({
    id: row.id,
    executionId: row.execution_id,
    runId: row.execution?.test_run_id ?? null,
    attemptId: row.attempt_id,
    scenario: row.execution?.scenario_title ?? "Unknown scenario",
    application: row.application?.name ?? "Unknown application",
    severity: row.severity,
    status: row.status,
    title: row.title,
    description: row.description,
    bugReference: row.bug_reference ?? "—",
    retestStatus: row.retest_status ?? "AWAITING_FIX",
    foundBy: row.created_by_profile?.full_name ?? "Unknown",
    foundAt: row.created_at,
  }))
}

export async function listFeedback(): Promise<FeedbackListItem[]> {
  if (shouldUseDemoData()) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("feedback")
    .select(
      "id,execution_id,scenario_id,feedback_type,title,description,severity,status,created_at,application:applications!feedback_application_id_fkey(name),scenario:test_scenarios!feedback_scenario_id_fkey(title),created_by_profile:profiles!feedback_created_by_fkey(full_name)"
    )
    .order("created_at", { ascending: false })
  if (error) throw new Error(`Unable to load feedback: ${error.message}`)
  return ((data ?? []) as unknown as FeedbackRow[]).map((row) => ({
    id: row.id,
    executionId: row.execution_id,
    scenarioId: row.scenario_id,
    type: row.feedback_type,
    title: row.title,
    description: row.description,
    application: row.application?.name ?? "Unknown application",
    scenario: row.scenario?.title ?? "Unknown scenario",
    severity: row.severity,
    status: row.status,
    author: row.created_by_profile?.full_name ?? "Unknown",
    createdAt: row.created_at,
  }))
}

export async function recordFailureForExecution(input: {
  executionId: string
  status: ExecutionStatus
  actualResult: string
  failureReason: string
  severity: Severity | null
  bugReference: string
}) {
  if (input.status !== "FAIL" && input.status !== "PASS") return
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user)
    throw new FindingsMutationError(
      "You must be signed in to record findings.",
      "FORBIDDEN"
    )
  const { data: execution, error: executionError } = await supabase
    .from("test_executions")
    .select(
      "id,scenario_title,test_run:test_runs!test_executions_test_run_id_fkey(application_id),test_execution_attempts(id,attempt_number,status)"
    )
    .eq("id", input.executionId)
    .single()
  if (executionError || !execution) {
    throw new FindingsMutationError(
      "The selected execution no longer exists.",
      "NOT_FOUND"
    )
  }

  const attempts = (execution.test_execution_attempts ?? []) as Array<{
    id: string
    attempt_number: number
    status: string
  }>
  const latestAttempt = [...attempts].sort(
    (a, b) => b.attempt_number - a.attempt_number
  )[0]
  const { data: existing, error: existingError } = await supabase
    .from("failures")
    .select("id,attempt_id")
    .eq("execution_id", input.executionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (existingError)
    throw new FindingsMutationError("Unable to load the execution finding.")

  if (input.status === "PASS" && existing) {
    const { error } = await supabase
      .from("failures")
      .update({ retest_status: "PASSED", status: "FIXED" })
      .eq("id", existing.id)
    if (error)
      throw new FindingsMutationError(
        `Unable to close the finding: ${error.message}`
      )
    return
  }

  const parsed = z
    .object({
      failureReason: z.string().trim().min(1),
      severity: severitySchema,
      bugReference: z.string().trim().max(500),
    })
    .safeParse({
      failureReason: input.failureReason,
      severity: input.severity,
      bugReference: input.bugReference,
    })
  if (!parsed.success)
    throw new FindingsMutationError(
      "Failure reason and severity are required.",
      "VALIDATION"
    )

  if (existing?.attempt_id === (latestAttempt?.id ?? null)) {
    const { error } = await supabase
      .from("failures")
      .update({
        severity: parsed.data.severity,
        description: parsed.data.failureReason,
        bug_reference: parsed.data.bugReference || null,
        retest_status: "FAILED_AGAIN",
      })
      .eq("id", existing.id)
    if (error)
      throw new FindingsMutationError(
        `Unable to update the finding: ${error.message}`
      )
    return
  }

  const testRun = Array.isArray(execution.test_run)
    ? execution.test_run[0]
    : execution.test_run
  const { error } = await supabase.from("failures").insert({
    application_id: (testRun as { application_id: string }).application_id,
    execution_id: input.executionId,
    attempt_id: latestAttempt?.id ?? null,
    severity: parsed.data.severity,
    title: execution.scenario_title,
    description: parsed.data.failureReason,
    bug_reference: parsed.data.bugReference || null,
    retest_status: existing ? "FAILED_AGAIN" : "AWAITING_FIX",
    created_by: authData.user.id,
  })
  if (error)
    throw new FindingsMutationError(
      `Unable to record the finding: ${error.message}`
    )
}

export async function createFeedbackRecord(input: {
  executionId: string
  scenarioId: string
  type: FeedbackListItem["type"]
  title: string
  description: string
  severity: Severity | null
}) {
  const parsed = z
    .object({
      executionId: z.uuid(),
      scenarioId: z.uuid(),
      type: feedbackTypeSchema,
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().min(1).max(4000),
      severity: severitySchema.nullable(),
    })
    .safeParse(input)
  if (!parsed.success)
    throw new FindingsMutationError(
      "Feedback details are invalid.",
      "VALIDATION"
    )
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user)
    throw new FindingsMutationError(
      "You must be signed in to submit feedback.",
      "FORBIDDEN"
    )
  const { data: execution, error: executionError } = await supabase
    .from("test_executions")
    .select(
      "id,test_run:test_runs!test_executions_test_run_id_fkey(application_id)"
    )
    .eq("id", parsed.data.executionId)
    .single()
  if (executionError || !execution)
    throw new FindingsMutationError(
      "The selected execution no longer exists.",
      "NOT_FOUND"
    )
  const testRun = Array.isArray(execution.test_run)
    ? execution.test_run[0]
    : execution.test_run
  const { error } = await supabase.from("feedback").insert({
    application_id: (testRun as { application_id: string }).application_id,
    execution_id: parsed.data.executionId,
    scenario_id: parsed.data.scenarioId,
    feedback_type: parsed.data.type,
    title: parsed.data.title,
    description: parsed.data.description,
    severity: parsed.data.severity,
    created_by: authData.user.id,
  })
  if (error)
    throw new FindingsMutationError(`Unable to save feedback: ${error.message}`)
}

export async function createCommentRecord(input: {
  subjectType: "EXECUTION" | "FAILURE" | "FEEDBACK" | "WORK_ITEM" | "REPORT"
  subjectId: string
  body: string
}) {
  const parsed = z
    .object({
      subjectType: z.enum([
        "EXECUTION",
        "FAILURE",
        "FEEDBACK",
        "WORK_ITEM",
        "REPORT",
      ]),
      subjectId: z.uuid(),
      body: z.string().trim().min(1).max(4000),
    })
    .safeParse(input)
  if (!parsed.success)
    throw new FindingsMutationError(
      "Comment details are invalid.",
      "VALIDATION"
    )
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user)
    throw new FindingsMutationError(
      "You must be signed in to comment.",
      "FORBIDDEN"
    )
  const { error } = await supabase.from("comments").insert({
    subject_type: parsed.data.subjectType,
    subject_id: parsed.data.subjectId,
    body: parsed.data.body,
    created_by: authData.user.id,
  })
  if (error)
    throw new FindingsMutationError(`Unable to save comment: ${error.message}`)
}
