import { z } from "zod"

import type { RunStatus } from "@/types/qa"

export const runFormSchema = z.object({
  runId: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Run name is required.").max(200),
  applicationId: z.string().uuid("Select an application."),
  testPlanId: z.string().uuid("Select a test plan."),
  releaseId: z.string().uuid("Select a release."),
  environmentId: z.string().uuid("Select an environment."),
  build: z.string().trim().min(1, "Build is required.").max(120),
  status: z.enum([
    "NOT_STARTED",
    "IN_PROGRESS",
    "BLOCKED",
    "COMPLETED",
    "CANCELLED",
  ] satisfies [RunStatus, ...RunStatus[]]),
  assignmentProfileIds: z
    .array(z.string().uuid("Invalid assignee selection."))
    .min(1, "Assign at least one QA member."),
})

export type RunFormData = z.infer<typeof runFormSchema>

export function normalizeRunFormPayload(payload: {
  runId?: unknown
  name?: unknown
  applicationId?: unknown
  testPlanId?: unknown
  releaseId?: unknown
  environmentId?: unknown
  build?: unknown
  status?: unknown
  assignmentProfileIds?: unknown
}) {
  return runFormSchema.safeParse({
    runId: typeof payload.runId === "string" ? payload.runId : undefined,
    name: payload.name,
    applicationId: payload.applicationId,
    testPlanId: payload.testPlanId,
    releaseId: payload.releaseId,
    environmentId: payload.environmentId,
    build: payload.build,
    status: payload.status,
    assignmentProfileIds: Array.isArray(payload.assignmentProfileIds)
      ? payload.assignmentProfileIds
      : [],
  })
}
