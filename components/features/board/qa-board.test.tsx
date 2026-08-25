import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { QABoard } from "@/components/features/board/qa-board"

describe("QABoard deep-link state", () => {
  it("opens the requested work item", () => {
    render(<QABoard initialItemId="w1" />)

    expect(
      screen.getByRole("heading", { name: "Notification Center" })
    ).toBeInTheDocument()
  })

  it("opens local creation from the create query state", () => {
    render(<QABoard initialCreateOpen />)

    expect(
      screen.getByRole("heading", { name: "Add work item" })
    ).toBeInTheDocument()
  })
})
