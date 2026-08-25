import "server-only"

import { z } from "zod"

import { shouldUseDemoData } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import type { Priority } from "@/types/qa"
import type { BoardItem, BoardStatus } from "@/lib/data/product-seed"

const boardStatusSchema = z.enum([
  "BACKLOG",
  "READY_TO_TEST",
  "IN_TESTING",
  "BLOCKED",
  "FAILED_NEED_FIX",
  "RETEST",
  "PASSED",
  "DONE",
])

export class BoardMutationError extends Error {
  constructor(
    message: string,
    readonly code:
      "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "UNKNOWN" = "UNKNOWN"
  ) {
    super(message)
  }
}

export async function listBoardItems(): Promise<BoardItem[]> {
  if (shouldUseDemoData()) return []
  const supabase = await createClient()

  // Fetch board items with their test_run_id
  const { data: items, error: itemsError } = await supabase
    .from("qa_work_items")
    .select(
      "id,title,priority,status,due_at,applications(name),features(name),releases(version),environments(name),qa_work_item_assignments(profile_id,assigned_by,profiles!qa_work_item_assignments_profile_id_fkey(full_name)),test_run_id"
    )
    .order("created_at", { ascending: false })
  if (itemsError)
    throw new Error(`Unable to load QA work items: ${itemsError.message}`)

  // Collect test_run_ids from board items
  const runIds = ((items ?? []) as Array<{ test_run_id: string | null }>)
    .map((row) => row.test_run_id)
    .filter((id): id is string => id !== null)

  // Fetch execution counts grouped by test_run_id
  let countsByRun = new Map<
    string,
    {
      total: number
      passed: number
      failed: number
      blocked: number
      notTested: number
    }
  >()
  if (runIds.length > 0) {
    const { data: execCounts, error: execError } = await supabase
      .from("test_executions")
      .select("test_run_id, status")
      .in("test_run_id", runIds)
    if (execError)
      throw new Error(`Unable to load execution counts: ${execError.message}`)

    countsByRun = (
      (execCounts ?? []) as Array<{ test_run_id: string; status: string }>
    ).reduce((acc, item) => {
      const runId = String(item.test_run_id)
      const existing = acc.get(runId) ?? {
        total: 0,
        passed: 0,
        failed: 0,
        blocked: 0,
        notTested: 0,
      }
      existing.total += 1
      if (item.status === "PASS") existing.passed += 1
      else if (item.status === "FAIL") existing.failed += 1
      else if (item.status === "BLOCKED") existing.blocked += 1
      else if (item.status === "NOT_TESTED") existing.notTested += 1
      acc.set(runId, existing)
      return acc
    }, new Map<string, { total: number; passed: number; failed: number; blocked: number; notTested: number }>())
  }

  return ((items ?? []) as unknown as Array<Record<string, unknown>>).map(
    (row) => {
      const app = row.applications as { name: string } | null
      const feature = row.features as { name: string } | null
      const release = row.releases as { version: string } | null
      const environment = row.environments as { name: string } | null
      const assignments = (row.qa_work_item_assignments ?? []) as Array<{
        profiles: { full_name: string } | null
      }>
      const runId = String(row.test_run_id ?? "")
      const counts = runId
        ? (countsByRun.get(runId) ?? {
            total: 0,
            passed: 0,
            failed: 0,
            blocked: 0,
            notTested: 0,
          })
        : { total: 0, passed: 0, failed: 0, blocked: 0, notTested: 0 }
      return {
        id: String(row.id),
        title: String(row.title),
        application: app?.name ?? "Unknown application",
        feature: feature?.name ?? "—",
        release: release?.version ?? "—",
        environment: environment?.name ?? "—",
        priority: row.priority as Priority,
        assignee: assignments[0]?.profiles?.full_name ?? "Unassigned",
        due: row.due_at
          ? new Date(String(row.due_at)).toLocaleDateString("en-GB", {
              month: "short",
              day: "numeric",
            })
          : "—",
        scenarios: counts.total,
        passed: counts.passed,
        failed: counts.failed,
        blocked: counts.blocked,
        untested: counts.notTested,
        status: row.status as BoardStatus,
      }
    }
  )
}

export async function moveBoardItem(id: string, status: BoardStatus) {
  const parsed = z
    .object({ id: z.uuid(), status: boardStatusSchema })
    .safeParse({ id, status })
  if (!parsed.success)
    throw new BoardMutationError("The board move is invalid.", "VALIDATION")
  const supabase = await createClient()
  const { data: profile } = await supabase.auth.getUser()
  if (!profile.user)
    throw new BoardMutationError("You must be signed in.", "FORBIDDEN")
  const { data: current, error: readError } = await supabase
    .from("qa_work_items")
    .select("id,status")
    .eq("id", id)
    .single()
  if (readError || !current)
    throw new BoardMutationError("The work item no longer exists.", "NOT_FOUND")
  if (current.status === status) return
  const { error: updateError } = await supabase
    .from("qa_work_items")
    .update({ status })
    .eq("id", id)
  if (updateError)
    throw new BoardMutationError(
      "You do not have permission to move this work item.",
      updateError.code === "42501" ? "FORBIDDEN" : "UNKNOWN"
    )
  const { error: historyError } = await supabase
    .from("qa_work_item_history")
    .insert({
      work_item_id: id,
      from_status: current.status,
      to_status: status,
      changed_by: profile.user.id,
      previous_value: { status: current.status },
      new_value: { status },
    })
  if (historyError)
    throw new BoardMutationError(
      `Work item moved, but history could not be recorded: ${historyError.message}`
    )
}

export async function createBoardItem(input: {
  title: string
  feature: string
  application: string
  priority: Priority
  assignee: string
  due: string
  scenarios: number
}) {
  const parsed = z
    .object({
      title: z.string().trim().min(1).max(200),
      feature: z.string().trim().min(1).max(200),
      application: z.string().trim().min(1),
      priority: z.enum(["P0", "P1", "P2", "P3"]),
      assignee: z.string().trim().min(1),
      due: z.string().trim().min(1),
      scenarios: z.number().int().positive(),
    })
    .safeParse(input)
  if (!parsed.success)
    throw new BoardMutationError("Work item details are invalid.", "VALIDATION")
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user)
    throw new BoardMutationError("You must be signed in.", "FORBIDDEN")
  const [
    { data: app },
    { data: release },
    { data: environment },
    { data: assignee },
  ] = await Promise.all([
    supabase
      .from("applications")
      .select("id")
      .eq("name", parsed.data.application)
      .single(),
    supabase
      .from("releases")
      .select("id")
      .eq("status", "TESTING")
      .order("release_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("environments").select("id").eq("name", "UAT").maybeSingle(),
    supabase
      .from("profiles")
      .select("id")
      .eq("full_name", parsed.data.assignee)
      .eq("status", "ACTIVE")
      .maybeSingle(),
  ])
  if (!app || !release || !environment)
    throw new BoardMutationError(
      "A matching application, testing release, and UAT environment are required.",
      "VALIDATION"
    )
  const dueDate = new Date(`${parsed.data.due} ${new Date().getFullYear()}`)
  const { data: item, error } = await supabase
    .from("qa_work_items")
    .insert({
      application_id: app.id,
      release_id: release.id,
      environment_id: environment.id,
      title: parsed.data.title,
      priority: parsed.data.priority,
      due_at: Number.isNaN(dueDate.getTime()) ? null : dueDate.toISOString(),
      created_by: user.user.id,
      updated_by: user.user.id,
    })
    .select("id")
    .single()
  if (error || !item)
    throw new BoardMutationError(
      "Unable to create the work item.",
      error?.code === "42501" ? "FORBIDDEN" : "UNKNOWN"
    )
  if (assignee) {
    const { error: assignmentError } = await supabase
      .from("qa_work_item_assignments")
      .insert({
        work_item_id: item.id,
        profile_id: assignee.id,
        assigned_by: user.user.id,
      })
    if (assignmentError)
      throw new BoardMutationError(
        "Work item created, but assignment could not be saved."
      )
  }
}
