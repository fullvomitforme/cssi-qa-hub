import { z } from "zod"

import type { PlanStatus } from "@/types/qa"

export const planFormSchema = z
  .object({
    planId: z.string().uuid().optional(),
    name: z.string().trim().min(1, "Plan name is required.").max(200),
    applicationId: z.string().uuid("Select an application."),
    releaseId: z.string().uuid("Select a release."),
    environmentId: z.string().uuid("Select an environment."),
    ownerId: z.string().uuid("Select an owner."),
    description: z.string().trim().max(4_000).default(""),
    startDate: z.string().trim(),
    targetCompletion: z.string().trim(),
    status: z.enum([
      "DRAFT",
      "READY",
      "ACTIVE",
      "COMPLETED",
      "ARCHIVED",
    ] satisfies [PlanStatus, ...PlanStatus[]]),
    scenarioIds: z
      .array(z.string().uuid("Invalid scenario selection."))
      .min(1, "Select at least one scenario."),
    assignmentProfileIds: z
      .array(z.string().uuid("Invalid assignee selection."))
      .min(1, "Assign at least one QA member."),
  })
  .superRefine((value, context) => {
    if (
      value.startDate &&
      value.targetCompletion &&
      value.targetCompletion < value.startDate
    ) {
      context.addIssue({
        code: "custom",
        message: "Target completion must be on or after the start date.",
        path: ["targetCompletion"],
      })
    }
  })

export type PlanFormData = z.infer<typeof planFormSchema>

export function normalizePlanFormPayload(payload: {
  planId?: unknown
  name?: unknown
  applicationId?: unknown
  releaseId?: unknown
  environmentId?: unknown
  ownerId?: unknown
  description?: unknown
  startDate?: unknown
  targetCompletion?: unknown
  status?: unknown
  scenarioIds?: unknown
  assignmentProfileIds?: unknown
}) {
  return planFormSchema.safeParse({
    planId: typeof payload.planId === "string" ? payload.planId : undefined,
    name: payload.name,
    applicationId: payload.applicationId,
    releaseId: payload.releaseId,
    environmentId: payload.environmentId,
    ownerId: payload.ownerId,
    description: payload.description,
    startDate: payload.startDate,
    targetCompletion: payload.targetCompletion,
    status: payload.status,
    scenarioIds: Array.isArray(payload.scenarioIds) ? payload.scenarioIds : [],
    assignmentProfileIds: Array.isArray(payload.assignmentProfileIds)
      ? payload.assignmentProfileIds
      : [],
  })
}
