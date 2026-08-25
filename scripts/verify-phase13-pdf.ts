import { createHash } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const runId = "39d6485c-2b93-4db8-9bd6-29181c9e1e5b"
async function login(email: string, password: string) {
  const client = createClient(url, key)
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return client
}
const lead = await login("phase2.lead@localhost.com", "QaHubPhase2!Lead")
const tester = await login("phase2.tester@localhost.com", "QaHubPhase2!Tester")
const run = (
  await lead.from("test_runs").select("application_id").eq("id", runId).single()
).data
const leadUser = (await lead.auth.getUser()).data.user
if (!run || !leadUser) throw new Error("Verification references unavailable")
const number = (
  await lead.rpc("next_report_number", {
    target_application_id: run.application_id,
    target_year: 2026,
  })
).data as string
const report = (
  await lead
    .from("reports")
    .insert({
      test_run_id: runId,
      application_id: run.application_id,
      report_number: number,
      status: "FINALIZED",
      result: "PASS",
      conclusion: "Phase 13 PDF verification.",
      created_by: leadUser.id,
      finalized_by: leadUser.id,
      finalized_at: new Date().toISOString(),
    })
    .select("id")
    .single()
).data
if (!report) throw new Error("Report fixture creation failed")
const pdf = new TextEncoder().encode("%PDF-1.4 phase13 verification")
const path = `reports/${report.id}/${number}.pdf`
const upload = await lead.storage
  .from("qa-reports")
  .upload(path, pdf, { contentType: "application/pdf" })
if (upload.error) throw upload.error
const snapshot = { number, source: "immutable snapshot verification" }
const hash = createHash("sha256").update(pdf).digest("hex")
const snapshotInsert = await lead.from("report_snapshots").insert({
  report_id: report.id,
  test_run_id: runId,
  report_number: number,
  snapshot_json: snapshot,
  generated_by: leadUser.id,
  pdf_storage_path: path,
  pdf_sha256: hash,
})
if (snapshotInsert.error) throw snapshotInsert.error
const signed = await tester.storage
  .from("qa-reports")
  .createSignedUrl(path, 600)
const testerUpload = await tester.storage
  .from("qa-reports")
  .upload(`reports/${report.id}/tester.pdf`, pdf, {
    contentType: "application/pdf",
  })
console.log(
  JSON.stringify(
    {
      upload: "ALLOWED",
      signedRead: signed.data?.signedUrl ? "ALLOWED" : "DENIED",
      testerUpload: testerUpload.error ? "DENIED" : "ALLOWED_UNEXPECTED",
      reportId: report.id,
      reportNumber: number,
    },
    null,
    2
  )
)
await lead.auth.signOut()
await tester.auth.signOut()
