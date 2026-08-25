"use server"

import { revalidatePath } from "next/cache"

import { shouldUseDemoData } from "@/lib/env"
import { getCurrentProfile } from "@/services/auth"
import {
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
