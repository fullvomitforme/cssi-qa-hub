"use server"

import { revalidatePath } from "next/cache"

import { shouldUseDemoData } from "@/lib/env"
import { getCurrentProfile } from "@/services/auth"
import {
  approveReport,
  createAndFinalizeReport,
  ReportMutationError,
} from "@/services/reports"
import type { ReportListItem } from "@/services/reports"

export async function createReportAction(input: {
  runId: string
  result: ReportListItem["result"]
  conclusion: string
}) {
  if (shouldUseDemoData())
    return {
      status: "error" as const,
      message: "Demo mode uses local report state.",
    }
  const profile = await getCurrentProfile()
  if (!profile || profile.role === "QA_TESTER")
    return {
      status: "error" as const,
      message: "You do not have permission to generate reports.",
    }
  try {
    const reportId = await createAndFinalizeReport(input)
    revalidatePath("/reports")
    revalidatePath(`/reports/${reportId}`)
    return {
      status: "success" as const,
      reportId,
      message: "Report finalized.",
    }
  } catch (error) {
    if (error instanceof ReportMutationError)
      return { status: "error" as const, message: error.message }
    console.error("createReportAction failed", error)
    return {
      status: "error" as const,
      message: "Unable to generate the report right now.",
    }
  }
}

export async function approveReportAction(
  reportId: string,
  kind: "PREPARED_BY" | "REVIEWED_BY" | "APPROVED_BY"
) {
  if (shouldUseDemoData())
    return {
      status: "error" as const,
      message: "Demo mode uses local report state.",
    }
  if (!(await getCurrentProfile()))
    return {
      status: "error" as const,
      message: "You must be signed in to approve reports.",
    }
  try {
    await approveReport({ reportId, kind })
    revalidatePath("/reports")
    revalidatePath(`/reports/${reportId}`)
    return { status: "success" as const }
  } catch (error) {
    if (error instanceof ReportMutationError)
      return { status: "error" as const, message: error.message }
    console.error("approveReportAction failed", error)
    return {
      status: "error" as const,
      message: "Unable to record the report approval right now.",
    }
  }
}
