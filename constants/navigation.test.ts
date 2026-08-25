import { describe, expect, it } from "vitest"

import { getNavigationForRole } from "@/constants/navigation"

describe("getNavigationForRole", () => {
  it("hides management items from QA testers", () => {
    const items = getNavigationForRole("QA_TESTER").flatMap(
      (group) => group.items
    )

    expect(items.some((item) => item.href.startsWith("/management"))).toBe(
      false
    )
  })

  it("keeps releases visible to QA leads", () => {
    const items = getNavigationForRole("QA_LEAD").flatMap(
      (group) => group.items
    )

    expect(items.some((item) => item.href === "/management/releases")).toBe(
      true
    )
    expect(items.some((item) => item.href === "/management/members")).toBe(
      false
    )
  })
})
