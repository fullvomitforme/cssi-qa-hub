import "server-only"

import { createHash } from "node:crypto"
import { z } from "zod"

import {
  getReportDetail as getDemoReportDetail,
  reports as demoReports,
  type MockReportDetail,
} from "@/lib/data/product-seed"
import { shouldUseDemoData } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { buildReportPdf } from "@/services/report-pdf"

export class ReportMutationError extends Error {
  constructor(
    message: string,
    readonly code:
      "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "UNKNOWN" = "UNKNOWN"
  ) {
    super(message)
  }
}

export type ReportListItem = {
  id: string
  number: string
  application: string
  release: string
  environment: string
  result: "PASS" | "CONDITIONAL_PASS" | "FAIL"
  generatedBy: string
  generatedAt: string
  status: "DRAFT" | "FINALIZED"
}

export type ReportRunOption = { id: string; name: string; application: string }
export type ReportApprovalKind = "PREPARED_BY" | "REVIEWED_BY" | "APPROVED_BY"

export type ReportApprovalRecord = {
  kind: ReportApprovalKind
  approvedBy: string
  approverRole: "ADMIN" | "QA_LEAD" | "QA_TESTER"
  approvedAt: string
  remarks: string | null
}

export async function listReportRunOptions(): Promise<ReportRunOption[]> {
  if (shouldUseDemoData()) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("test_runs")
    .select("id,name,applications(name)")
    .order("created_at", { ascending: false })
  if (error) throw new Error(`Unable to load report runs: ${error.message}`)
  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map(
    (item) => ({
      id: String(item.id),
      name: String(item.name),
      application: String(
        (item.applications as { name: string } | null)?.name ?? "Unknown"
      ),
    })
  )
}

function demoList(): ReportListItem[] {
  return demoReports.map((report) => ({
    ...report,
    status: "FINALIZED" as const,
  }))
}

export async function listReports(): Promise<ReportListItem[]> {
  if (shouldUseDemoData()) return demoList()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("reports")
    .select(
      "id,report_number,status,result,created_at,applications(name),test_runs(build,environments(name),releases(version)),created_by_profile:profiles!reports_created_by_fkey(full_name)"
    )
    .order("created_at", { ascending: false })
  if (error) throw new Error(`Unable to load reports: ${error.message}`)
  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map(
    (row) => {
      const app = row.applications as { name: string } | null
      const run = row.test_runs as {
        build: string
        environments: { name: string } | null
        releases: { version: string } | null
      } | null
      const author = row.created_by_profile as { full_name: string } | null
      return {
        id: String(row.id),
        number: String(row.report_number ?? "Draft report"),
        application: app?.name ?? "Unknown application",
        release: run?.releases?.version ?? "—",
        environment: run?.environments?.name ?? "—",
        result: (row.result ?? "PASS") as ReportListItem["result"],
        generatedBy: author?.full_name ?? "Unknown",
        generatedAt: String(row.created_at),
        status: row.status as ReportListItem["status"],
      }
    }
  )
}

async function buildSnapshot(
  runId: string,
  report: {
    number: string
    application: string
    result: ReportListItem["result"]
    conclusion: string
    generatedAt: string
    generatedBy: string
  }
): Promise<MockReportDetail> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("test_runs")
    .select(
      "id,build,started_at,completed_at,applications(name),environments(name),releases(version),test_run_assignments(profiles(full_name)),test_executions(scenario_title,scenario_description,scenario_expected_result,status,actual_result,failure_reason,severity,bug_reference,source_scenario:test_scenarios(modules(name)))"
    )
    .eq("id", runId)
    .single()
  if (error || !data)
    throw new ReportMutationError(
      "The selected test run no longer exists.",
      "NOT_FOUND"
    )
  const executions = (data.test_executions ?? []) as Array<
    Record<string, unknown>
  >
  const counts = executions.reduce<{
    total: number
    executed: number
    passed: number
    failed: number
    blocked: number
    notTested: number
  }>(
    (acc, item) => {
      const status = String(item.status)
      acc.total += 1
      if (status !== "NOT_TESTED") acc.executed += 1
      if (status === "PASS") acc.passed += 1
      if (status === "FAIL") acc.failed += 1
      if (status === "BLOCKED") acc.blocked += 1
      if (status === "NOT_TESTED") acc.notTested += 1
      return acc
    },
    { total: 0, executed: 0, passed: 0, failed: 0, blocked: 0, notTested: 0 }
  )
  const firstFailure =
    executions.find((item) => item.status === "FAIL") ?? executions[0]
  const firstModule = firstFailure?.source_scenario as unknown as {
    modules: { name: string } | null
  } | null
  const app = data.applications as unknown as { name: string } | null
  const env = data.environments as unknown as { name: string } | null
  const release = data.releases as unknown as { version: string } | null
  const assignments = (data.test_run_assignments ?? []) as unknown as Array<{
    profiles: { full_name: string } | null
  }>
  const detail = {
    id: report.number,
    number: report.number,
    application: app?.name ?? report.application,
    release: release?.version ?? "—",
    environment: env?.name ?? "—",
    result: report.result,
    generatedBy: report.generatedBy,
    generatedAt: report.generatedAt,
    build: String(data.build ?? "—"),
    period: `${data.started_at ?? "—"} → ${data.completed_at ?? "—"}`,
    members:
      assignments
        .map((item) => item.profiles?.full_name)
        .filter(Boolean)
        .join(", ") || "—",
    branch: "—",
    summary: counts,
    modules: [
      {
        module: firstModule?.modules?.name ?? "Uncategorized",
        scenarios: executions.map((item) => [
          String(item.scenario_title),
          (String(item.status) === "NOT_TESTED"
            ? "NOT TESTED"
            : String(item.status)) as
            "PASS" | "FAIL" | "BLOCKED" | "NOT TESTED",
        ]),
      },
    ],
    primaryFailure: {
      scenario: String(firstFailure?.scenario_title ?? "No failures"),
      feature: "—",
      bugReference: String(firstFailure?.bug_reference ?? "—"),
      severity: (firstFailure?.severity ?? "LOW") as
        "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      expected: String(firstFailure?.scenario_expected_result ?? "—"),
      actual: String(firstFailure?.actual_result ?? "—"),
      reason: String(firstFailure?.failure_reason ?? "—"),
      tester: "—",
    },
    findings: [0, 0, counts.failed, 0] as [number, number, number, number],
    unresolved: counts.failed,
    conclusion: report.conclusion,
    preparedBy: report.generatedBy,
    reviewedBy: "Pending review",
    approvedBy: "Pending approval",
  } as unknown as MockReportDetail
  return detail
}

export async function getReportDetailReal(
  id: string
): Promise<MockReportDetail | null> {
  if (shouldUseDemoData()) return getDemoReportDetail(id) ?? null
  const supabase = await createClient()
  const { data: report, error } = await supabase
    .from("reports")
    .select(
      "id,report_number,result,conclusion,created_at,application_id,test_run_id,applications(name),created_by_profile:profiles!reports_created_by_fkey(full_name),report_snapshots(snapshot_json)"
    )
    .eq("id", id)
    .maybeSingle()
  if (error || !report) return null
  const snapshot = (
    report.report_snapshots as Array<{ snapshot_json: MockReportDetail }> | null
  )?.[0]?.snapshot_json
  if (snapshot) return snapshot
  const app = report.applications as unknown as { name: string } | null
  const author = report.created_by_profile as unknown as {
    full_name: string
  } | null
  return buildSnapshot(String(report.test_run_id), {
    number: String(report.report_number ?? "Draft"),
    application: app?.name ?? "Unknown",
    result: (report.result ?? "PASS") as ReportListItem["result"],
    conclusion: String(report.conclusion ?? "Draft report"),
    generatedAt: String(report.created_at),
    generatedBy: author?.full_name ?? "Unknown",
  })
}

export async function getReportApprovalState(
  reportId: string
): Promise<ReportApprovalRecord[]> {
  if (shouldUseDemoData()) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("report_approvals")
    .select(
      "approval_kind,approver_role,approved_at,remarks,approved_by_profile:profiles!report_approvals_approved_by_fkey(full_name)"
    )
    .eq("report_id", reportId)
    .order("approved_at", { ascending: true })

  if (error) {
    throw new Error(`Unable to load report approvals: ${error.message}`)
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    kind: row.approval_kind as ReportApprovalKind,
    approvedBy: String(
      (row.approved_by_profile as { full_name: string } | null)?.full_name ??
        "Unknown"
    ),
    approverRole: row.approver_role as ReportApprovalRecord["approverRole"],
    approvedAt: String(row.approved_at),
    remarks: typeof row.remarks === "string" ? row.remarks : null,
  }))
}

export async function getReportPdfUrl(id: string): Promise<string | null> {
  if (shouldUseDemoData()) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from("report_snapshots")
    .select("pdf_storage_path")
    .eq("report_id", id)
    .maybeSingle()
  if (!data?.pdf_storage_path) return null
  const { data: signed } = await supabase.storage
    .from("qa-reports")
    .createSignedUrl(data.pdf_storage_path, 3600)
  return signed?.signedUrl ?? null
}

export async function createAndFinalizeReport(input: {
  runId: string
  result: ReportListItem["result"]
  conclusion: string
}) {
  const parsed = z
    .object({
      runId: z.uuid(),
      result: z.enum(["PASS", "CONDITIONAL_PASS", "FAIL"]),
      conclusion: z.string().trim().min(1).max(4000),
    })
    .safeParse(input)
  if (!parsed.success)
    throw new ReportMutationError("Report details are invalid.", "VALIDATION")
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user)
    throw new ReportMutationError("You must be signed in.", "FORBIDDEN")
  const { data: profile } = await supabase
    .from("profiles")
    .select("role,full_name")
    .eq("id", user.user.id)
    .single()
  if (!profile)
    throw new ReportMutationError(
      "Your QA profile is unavailable.",
      "FORBIDDEN"
    )
  const { data: run, error: runError } = await supabase
    .from("test_runs")
    .select("id,application_id,applications(name)")
    .eq("id", parsed.data.runId)
    .single()
  if (runError || !run)
    throw new ReportMutationError(
      "The selected run no longer exists.",
      "NOT_FOUND"
    )
  const year = new Date().getUTCFullYear()
  const { data: number, error: numberError } = await supabase.rpc(
    "next_report_number",
    { target_application_id: run.application_id, target_year: year }
  )
  if (numberError || !number)
    throw new ReportMutationError(
      numberError?.code === "42501"
        ? "You do not have permission to generate reports."
        : "Unable to allocate a report number.",
      numberError?.code === "42501" ? "FORBIDDEN" : "UNKNOWN"
    )
  const app = run.applications as unknown as { name: string } | null
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .insert({
      test_run_id: parsed.data.runId,
      application_id: run.application_id,
      report_number: number,
      status: "FINALIZED",
      result: parsed.data.result,
      conclusion: parsed.data.conclusion,
      created_by: user.user.id,
      finalized_by: user.user.id,
      finalized_at: new Date().toISOString(),
    })
    .select("id,report_number,created_at")
    .single()
  if (reportError || !report)
    throw new ReportMutationError(
      "Unable to create the report.",
      reportError?.code === "42501" ? "FORBIDDEN" : "UNKNOWN"
    )
  const snapshot = await buildSnapshot(parsed.data.runId, {
    number: number,
    application: app?.name ?? "Unknown",
    result: parsed.data.result,
    conclusion: parsed.data.conclusion,
    generatedAt: report.created_at,
    generatedBy: profile.full_name,
  })
  const pdfBytes = buildReportPdf(snapshot)
  const pdfPath = `reports/${report.id}/${number}.pdf`
  const { error: pdfError } = await supabase.storage
    .from("qa-reports")
    .upload(pdfPath, pdfBytes, {
      contentType: "application/pdf",
      upsert: false,
    })
  if (pdfError)
    throw new ReportMutationError(
      `Report created, but its PDF could not be stored: ${pdfError.message}`
    )
  const hash = createHash("sha256").update(pdfBytes).digest("hex")
  const { error: snapshotError } = await supabase
    .from("report_snapshots")
    .insert({
      report_id: report.id,
      test_run_id: parsed.data.runId,
      report_number: number,
      snapshot_json: snapshot,
      generated_by: user.user.id,
      pdf_storage_path: pdfPath,
      pdf_sha256: hash,
    })
  if (snapshotError)
    throw new ReportMutationError(
      `Report created, but immutable snapshot failed: ${snapshotError.message}`
    )
  const { error: approvalError } = await supabase
    .from("report_approvals")
    .insert({
      report_id: report.id,
      approval_kind: "PREPARED_BY",
      approved_by: user.user.id,
      approver_role: profile.role,
    })
  if (approvalError)
    throw new ReportMutationError(
      `Report created, but the prepared approval could not be recorded: ${approvalError.message}`
    )
  return report.id
}

export async function approveReport(input: {
  reportId: string
  kind: Exclude<ReportApprovalKind, "PREPARED_BY"> | "PREPARED_BY"
  remarks?: string
}) {
  if (shouldUseDemoData()) {
    throw new ReportMutationError("Demo mode uses local report state.")
  }

  const parsed = z
    .object({
      reportId: z.uuid(),
      kind: z.enum(["PREPARED_BY", "REVIEWED_BY", "APPROVED_BY"]),
      remarks: z.string().trim().max(1000).optional(),
    })
    .safeParse(input)

  if (!parsed.success) {
    throw new ReportMutationError(
      "Report approval details are invalid.",
      "VALIDATION"
    )
  }

  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) {
    throw new ReportMutationError("You must be signed in.", "FORBIDDEN")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.user.id)
    .single()
  if (!profile) {
    throw new ReportMutationError(
      "Your QA profile is unavailable.",
      "FORBIDDEN"
    )
  }

  if (parsed.data.kind === "APPROVED_BY" && profile.role !== "ADMIN") {
    throw new ReportMutationError(
      "Only administrators can approve finalized reports.",
      "FORBIDDEN"
    )
  }
  if (
    parsed.data.kind !== "APPROVED_BY" &&
    !["ADMIN", "QA_LEAD"].includes(profile.role)
  ) {
    throw new ReportMutationError(
      "You do not have permission to approve reports.",
      "FORBIDDEN"
    )
  }

  const approvals = await getReportApprovalState(parsed.data.reportId)
  const hasPrepared = approvals.some((item) => item.kind === "PREPARED_BY")
  const hasReviewed = approvals.some((item) => item.kind === "REVIEWED_BY")

  if (parsed.data.kind === "REVIEWED_BY" && !hasPrepared) {
    throw new ReportMutationError(
      "The report must be prepared before it can be reviewed.",
      "VALIDATION"
    )
  }
  if (parsed.data.kind === "APPROVED_BY" && !hasReviewed) {
    throw new ReportMutationError(
      "The report must be reviewed before it can be approved.",
      "VALIDATION"
    )
  }

  const { error } = await supabase.from("report_approvals").insert({
    report_id: parsed.data.reportId,
    approval_kind: parsed.data.kind,
    approved_by: user.user.id,
    approver_role: profile.role,
    remarks: parsed.data.remarks?.trim() || null,
  })
  if (error) {
    throw new ReportMutationError(
      error.code === "42501"
        ? "You do not have permission to approve this report."
        : error.code === "23505"
          ? "That approval step has already been recorded."
          : "Unable to save the report approval.",
      error.code === "42501" ? "FORBIDDEN" : "UNKNOWN"
    )
  }
}
