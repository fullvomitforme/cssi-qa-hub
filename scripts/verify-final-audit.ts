import { createClient } from "@supabase/supabase-js"

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)
const { error: authError } = await client.auth.signInWithPassword({
  email: "phase2.lead@localhost.com",
  password: "QaHubPhase2!Lead",
})
if (authError) throw authError
async function rows(table: string, columns = "*") {
  const result = await client.from(table).select(columns)
  if (result.error) throw result.error
  return (result.data ?? []) as unknown as Array<Record<string, unknown>>
}
const [
  plans,
  planItems,
  planAssignments,
  runs,
  runAssignments,
  executions,
  steps,
  attachments,
  reports,
  snapshots,
  histories,
] = await Promise.all([
  rows("test_plans"),
  rows("test_plan_items"),
  rows("test_plan_assignments"),
  rows("test_runs"),
  rows("test_run_assignments"),
  rows("test_executions"),
  rows("test_execution_steps"),
  rows("attachments"),
  rows("reports", "id,report_number"),
  rows("report_snapshots", "id,report_id"),
  rows("qa_work_item_history", "id,work_item_id"),
])
const ids = (items: Array<Record<string, unknown>>, key: string) =>
  new Set(items.map((item) => String(item[key])))
const planIds = ids(plans, "id"),
  runIds = ids(runs, "id"),
  executionIds = ids(executions, "id")
console.log(
  JSON.stringify(
    {
      counts: {
        plans: plans.length,
        planItems: planItems.length,
        planAssignments: planAssignments.length,
        runs: runs.length,
        runAssignments: runAssignments.length,
        executions: executions.length,
        steps: steps.length,
        attachments: attachments.length,
        reports: reports.length,
        snapshots: snapshots.length,
        boardHistory: histories.length,
      },
      orphanPlanItems: planItems.filter(
        (item) => !planIds.has(String(item.test_plan_id))
      ).length,
      orphanRunAssignments: runAssignments.filter(
        (item) => !runIds.has(String(item.test_run_id))
      ).length,
      orphanExecutionSteps: steps.filter(
        (item) => !executionIds.has(String(item.execution_id))
      ).length,
      orphanAttachments: attachments.filter(
        (item) => !executionIds.has(String(item.execution_id))
      ).length,
      duplicateReportNumbers:
        reports.length -
        new Set(reports.map((item) => item.report_number)).size,
      snapshotsWithoutReports: snapshots.filter(
        (item) =>
          !new Set(reports.map((report) => String(report.id))).has(
            String(item.report_id)
          )
      ).length,
    },
    null,
    2
  )
)
await client.auth.signOut()
