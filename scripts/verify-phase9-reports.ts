import { createHash } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const runId = "086dae28-ea44-4af2-b380-9c12a4617551"

async function login(email: string, password: string) {
  const client = createClient(url, key)
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return client
}

const lead = await login("phase2.lead@localhost.com", "QaHubPhase2!Lead")
const tester = await login("phase2.tester@localhost.com", "QaHubPhase2!Tester")
const { data: run, error: runError } = await lead
  .from("test_runs")
  .select("id,application_id")
  .eq("id", runId)
  .single()
if (runError || !run) throw runError ?? new Error("Verification run not found")

const leadNumber = await lead.rpc("next_report_number", {
  target_application_id: run.application_id,
  target_year: 2026,
})
const testerNumber = await tester.rpc("next_report_number", {
  target_application_id: run.application_id,
  target_year: 2026,
})
if (leadNumber.error || !leadNumber.data)
  throw leadNumber.error ?? new Error("Lead report number allocation failed")
const { data: leadUser } = await lead.auth.getUser()
if (!leadUser.user) throw new Error("Lead user unavailable")
const { data: report, error: reportError } = await lead
  .from("reports")
  .insert({
    test_run_id: runId,
    application_id: run.application_id,
    report_number: leadNumber.data,
    status: "FINALIZED",
    result: "CONDITIONAL_PASS",
    conclusion: "Phase 9 hosted report verification.",
    created_by: leadUser.user.id,
    finalized_by: leadUser.user.id,
    finalized_at: new Date().toISOString(),
  })
  .select("id,report_number")
  .single()
if (reportError || !report)
  throw reportError ?? new Error("Report insert failed")
const snapshot = {
  reportNumber: report.report_number,
  purpose: "Phase 9 verification",
  runId,
}
const hash = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex")
const { error: snapshotError } = await lead.from("report_snapshots").insert({
  report_id: report.id,
  test_run_id: runId,
  report_number: report.report_number,
  snapshot_json: snapshot,
  generated_by: leadUser.user.id,
  pdf_storage_path: `pending/${report.report_number}.pdf`,
  pdf_sha256: hash,
})
if (snapshotError) throw snapshotError
const { error: mutateError } = await tester
  .from("report_snapshots")
  .update({ snapshot_json: { tampered: true } })
  .eq("report_id", report.id)
console.log(
  JSON.stringify(
    {
      leadAllocate: "ALLOWED",
      testerAllocate: testerNumber.data ? "ALLOWED_UNEXPECTED" : "DENIED",
      snapshotCreate: "ALLOWED",
      snapshotMutation:
        mutateError?.code === "42501" || mutateError?.code === "55000"
          ? "DENIED"
          : "DENIED_OR_NO_ROW",
      reportId: report.id,
      reportNumber: report.report_number,
    },
    null,
    2
  )
)
await lead.auth.signOut()
await tester.auth.signOut()
