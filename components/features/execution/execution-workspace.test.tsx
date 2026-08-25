import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ExecutionWorkspace } from "@/components/features/execution/execution-workspace"
import { getTestRunDetail } from "@/lib/data/product-seed"

describe("ExecutionWorkspace", () => {
  it("requires failure details when a scenario is marked failed", () => {
    const run = getTestRunDetail("run-portal-regression")
    expect(run).toBeDefined()

    render(<ExecutionWorkspace run={run!} initialExecutionId="e5" />)

    fireEvent.click(screen.getByRole("button", { name: "Fail" }))

    expect(screen.getByRole("alert")).toHaveTextContent(
      "actual result, failure reason, severity"
    )
    expect(
      screen.getByText("No execution attempts recorded yet.")
    ).toBeInTheDocument()

    fireEvent.change(
      screen.getByPlaceholderText("Describe what actually happened…"),
      {
        target: { value: "The session remained active." },
      }
    )
    fireEvent.change(
      screen.getByPlaceholderText("Explain why this scenario failed…"),
      {
        target: { value: "The timeout event was not processed." },
      }
    )
    fireEvent.change(screen.getByLabelText(/Severity/), {
      target: { value: "HIGH" },
    })

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Fail" }))
    expect(screen.getByText("Attempt 1")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Fail" }))
    expect(screen.getAllByText("Attempt 1")).toHaveLength(1)
  })
})
