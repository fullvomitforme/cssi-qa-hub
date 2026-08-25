import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ScenarioTable } from "@/components/features/scenarios/scenario-table"
import { scenarioSeed } from "@/lib/data/seed"

describe("ScenarioTable", () => {
  it("explains an empty result instead of rendering an empty table", () => {
    render(<ScenarioTable scenarios={[]} />)

    expect(screen.getByText("No scenarios match these filters")).toBeVisible()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  it("renders realistic scenario data and opens the detail sheet", () => {
    const scenario = scenarioSeed[0]
    render(<ScenarioTable scenarios={[scenario]} />)

    expect(screen.getByText(scenario.application)).toBeVisible()
    fireEvent.click(screen.getByText(scenario.title))
    expect(screen.getByText("Open full scenario")).toHaveAttribute(
      "href",
      `/scenarios/${scenario.id}`
    )
    expect(screen.getAllByText("Happy Path")).toHaveLength(2)
  })
})
