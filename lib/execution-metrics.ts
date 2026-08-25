import type { ExecutionStatus } from "@/types/qa"

export type ExecutionMetrics = {
  total: number
  passed: number
  failed: number
  blocked: number
  skipped: number
  notTested: number
  executed: number
  coverage: number
  passRate: number
}

export function calculateExecutionMetrics(
  executions: ReadonlyArray<{ status: ExecutionStatus }>
): ExecutionMetrics {
  const counts = executions.reduce(
    (result, execution) => {
      result[execution.status] += 1
      return result
    },
    {
      PASS: 0,
      FAIL: 0,
      BLOCKED: 0,
      SKIPPED: 0,
      NOT_TESTED: 0,
    } satisfies Record<ExecutionStatus, number>
  )
  const total = executions.length
  const executed = total - counts.NOT_TESTED

  return {
    total,
    passed: counts.PASS,
    failed: counts.FAIL,
    blocked: counts.BLOCKED,
    skipped: counts.SKIPPED,
    notTested: counts.NOT_TESTED,
    executed,
    coverage: total === 0 ? 0 : roundPercentage((executed / total) * 100),
    passRate:
      executed === 0 ? 0 : roundPercentage((counts.PASS / executed) * 100),
  }
}

function roundPercentage(value: number) {
  return Math.round(value * 10) / 10
}
