import { z } from "zod"

import type { Priority, TestType } from "@/types/qa"

export const scenarioStepSchema = z.object({
  id: z.string().uuid().optional(),
  instruction: z.string().trim().min(1, "Step instruction is required."),
  expectedResult: z.string().trim().max(2_000).default(""),
})

export const scenarioFormSchema = z.object({
  scenarioId: z.string().uuid().optional(),
  applicationId: z.string().uuid("Select an application."),
  moduleId: z.string().uuid("Select a module."),
  featureId: z.string().uuid("Select a feature."),
  title: z.string().trim().min(1, "Scenario title is required.").max(200),
  description: z.string().trim().min(1, "Description is required.").max(4_000),
  preconditions: z.string().trim().max(4_000).default(""),
  type: z.enum([
    "HAPPY_PATH",
    "VALIDATION",
    "NEGATIVE",
    "PERMISSION",
    "EDGE_CASE",
    "INTEGRATION",
    "REGRESSION",
    "RESPONSIVE",
    "ACCESSIBILITY",
    "PERFORMANCE",
  ] satisfies [TestType, ...TestType[]]),
  priority: z.enum(["P0", "P1", "P2", "P3"] satisfies [
    Priority,
    ...Priority[],
  ]),
  expectedResult: z
    .string()
    .trim()
    .min(1, "Expected result is required.")
    .max(4_000),
  steps: z.array(scenarioStepSchema).min(1, "At least one step is required."),
  tags: z
    .array(
      z
        .string()
        .trim()
        .toLowerCase()
        .min(1, "Tag cannot be empty.")
        .max(40, "Tags must be 40 characters or fewer.")
    )
    .max(12, "Use at most 12 tags."),
})

export type ScenarioFormData = z.infer<typeof scenarioFormSchema>

export function normalizeScenarioFormPayload(payload: {
  scenarioId?: unknown
  applicationId?: unknown
  moduleId?: unknown
  featureId?: unknown
  title?: unknown
  description?: unknown
  preconditions?: unknown
  type?: unknown
  priority?: unknown
  expectedResult?: unknown
  steps?: unknown
  tags?: unknown
}) {
  return scenarioFormSchema.safeParse({
    scenarioId:
      typeof payload.scenarioId === "string" ? payload.scenarioId : undefined,
    applicationId: payload.applicationId,
    moduleId: payload.moduleId,
    featureId: payload.featureId,
    title: payload.title,
    description: payload.description,
    preconditions: payload.preconditions,
    type: payload.type,
    priority: payload.priority,
    expectedResult: payload.expectedResult,
    steps: payload.steps,
    tags: Array.isArray(payload.tags)
      ? payload.tags
          .map((tag) =>
            typeof tag === "string" ? tag.trim().toLowerCase() : ""
          )
          .filter(Boolean)
          .toSorted()
      : [],
  })
}
