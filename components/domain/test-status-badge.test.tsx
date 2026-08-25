import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { TestStatusBadge } from "@/components/domain/test-status-badge"

describe("TestStatusBadge", () => {
  it.each([
    ["PASS", "Passed"],
    ["FAIL", "Failed"],
    ["BLOCKED", "Blocked"],
    ["SKIPPED", "Skipped"],
    ["NOT_TESTED", "Not Tested"],
  ] as const)("renders a text label for %s", (status, label) => {
    render(<TestStatusBadge status={status} />)

    expect(screen.getByText(label)).toBeVisible()
  })
})
