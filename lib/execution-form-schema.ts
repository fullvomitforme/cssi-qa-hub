import { z } from "zod"

const executionStatusSchema = z.enum(["PASS", "FAIL", "BLOCKED", "SKIPPED"])
const severitySchema = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"])
const stepStatusSchema = z.enum(["PASS", "FAIL", "SKIPPED"]).nullable()

const executionStepSchema = z.object({
  id: z.uuid(),
  status: stepStatusSchema,
  actualResult: z.string().trim().max(2000).default(""),
})

export const executionSaveSchema = z
  .object({
    runId: z.uuid(),
    executionId: z.uuid(),
    status: executionStatusSchema,
    actualResult: z.string().trim().max(4000).default(""),
    failureReason: z.string().trim().max(4000).default(""),
    severity: severitySchema.nullable(),
    bugReference: z.string().trim().max(200).default(""),
    steps: z.array(executionStepSchema).min(1),
  })
  .superRefine((value, context) => {
    if (value.status !== "FAIL") {
      return
    }

    if (!value.actualResult) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Actual result is required when failing an execution.",
        path: ["actualResult"],
      })
    }

    if (!value.failureReason) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Failure reason is required when failing an execution.",
        path: ["failureReason"],
      })
    }

    if (!value.severity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Severity is required when failing an execution.",
        path: ["severity"],
      })
    }
  })

export type ExecutionSaveData = z.infer<typeof executionSaveSchema>
