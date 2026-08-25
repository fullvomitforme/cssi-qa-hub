import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ExecutionWorkspace } from "@/components/features/execution/execution-workspace"
import { getTestRunDetail } from "@/lib/data/product-seed"
import { buildDemoExecutionWorkspaceFromRun } from "@/lib/execution-adapters"

vi.mock("@/app/actions/executions", () => ({
  saveExecutionAction: vi.fn(),
}))

describe("ExecutionWorkspace", () => {
  it("requires failure details when a scenario is marked failed", async () => {
    const run = getTestRunDetail("run-portal-regression")
    expect(run).toBeDefined()

    render(
      <ExecutionWorkspace
        run={buildDemoExecutionWorkspaceFromRun(run!)}
        initialExecutionId="e5"
      />
    )

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
    const severityTrigger = screen.getByRole("combobox", { name: /severity/i })
    await userEvent.click(severityTrigger)
    const highOption = await screen.findByRole("option", { name: "HIGH" })
    await userEvent.click(highOption)

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Fail" }))
    expect(screen.getByText("Attempt 1")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Fail" }))
    expect(screen.getAllByText("Attempt 1")).toHaveLength(1)
  })
})
