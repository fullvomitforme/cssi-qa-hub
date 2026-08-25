import "server-only"

import {
  buildDemoExecutionWorkspaceRun,
  mapRunExecutionWorkspaceRow,
  type RunExecutionWorkspaceRow,
} from "@/lib/execution-adapters"
import { shouldUseDemoData } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import type { ExecutionSaveInput, ExecutionWorkspaceRun } from "@/types/qa"

export class ExecutionMutationError extends Error {
  constructor(
    message: string,
    readonly code:
      "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "UNKNOWN" = "UNKNOWN"
  ) {
    super(message)
  }
}

export async function getRunExecutionWorkspace(
  runId: string
): Promise<ExecutionWorkspaceRun | null> {
  if (shouldUseDemoData()) {
    return buildDemoExecutionWorkspaceRun(runId)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("test_runs")
    .select(
      "id,name,status,build,started_at,completed_at,applications!inner(name,slug),environments!inner(name),releases!inner(version),test_run_assignments(profiles!inner(full_name,role)),test_executions(id,source_scenario_id,scenario_title,scenario_description,scenario_preconditions,scenario_expected_result,scenario_priority,scenario_type,status,actual_result,failure_reason,severity,bug_reference,tested_at,tested_profile:profiles!test_executions_tested_by_fkey(full_name),source_scenario:test_scenarios!test_executions_source_scenario_id_fkey(modules!inner(name)),test_execution_steps(id,source_step_id,position,instruction,expected_result,status,actual_result),test_execution_attempts(id,attempt_number,status,build,actual_result,failure_reason,severity,bug_reference,executed_at))"
    )
    .eq("id", runId)
    .single()

  if (error?.code === "PGRST116") {
    return null
  }

  if (error) {
    throw new Error(`Unable to load execution workspace: ${error.message}`)
  }

  return mapRunExecutionWorkspaceRow(
    data as unknown as RunExecutionWorkspaceRow
  )
}

export async function saveExecutionRecord(
  input: ExecutionSaveInput
): Promise<ExecutionWorkspaceRun> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("record_test_execution", {
    target_execution_id: input.executionId,
    target_status: input.status,
    target_actual_result: input.actualResult.trim() || null,
    target_failure_reason: input.failureReason.trim() || null,
    target_severity: input.severity,
    target_bug_reference: input.bugReference.trim() || null,
    target_steps: input.steps.map((step) => ({
      id: step.id,
      status: step.status,
      actual_result: step.actualResult.trim() || null,
    })),
  })

  if (error) {
    if (error.code === "P0001") {
      throw new ExecutionMutationError(error.message, "VALIDATION")
    }

    if (error.code === "42501") {
      throw new ExecutionMutationError(
        "You do not have permission to update this execution.",
        "FORBIDDEN"
      )
    }

    if (error.code === "PGRST116") {
      throw new ExecutionMutationError(
        "The selected execution no longer exists.",
        "NOT_FOUND"
      )
    }

    throw new ExecutionMutationError(
      `Unable to save execution: ${error.message}`,
      "UNKNOWN"
    )
  }

  const updated = await getRunExecutionWorkspace(input.runId)
  if (!updated) {
    throw new ExecutionMutationError(
      "The execution run no longer exists.",
      "NOT_FOUND"
    )
  }

  return updated
}
