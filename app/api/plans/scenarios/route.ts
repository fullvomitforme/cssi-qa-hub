import { NextResponse } from "next/server"
import { z } from "zod"

import { getCurrentProfile } from "@/services/auth"
import { listPlanSelectableScenarios } from "@/services/plans"
import type { Priority, TestType } from "@/types/qa"

const querySchema = z.object({
  applicationId: z.string().uuid().optional(),
  feature: z.string().trim().max(80).optional(),
  module: z.string().trim().max(80).optional(),
  priority: z.enum(["P0", "P1", "P2", "P3"]).optional(),
  search: z.string().trim().max(120).optional(),
  type: z
    .enum([
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
    ])
    .optional(),
})

export async function GET(request: Request) {
  const profile = await getCurrentProfile()
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const parsed = querySchema.safeParse({
    applicationId: url.searchParams.get("applicationId") ?? undefined,
    feature: url.searchParams.get("feature") ?? undefined,
    module: url.searchParams.get("module") ?? undefined,
    priority: url.searchParams.get("priority") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 })
  }

  try {
    const scenarios = await listPlanSelectableScenarios({
      ...parsed.data,
      priority: parsed.data.priority as Priority | undefined,
      type: parsed.data.type as TestType | undefined,
      page: 1,
      pageSize: 25,
      updated: undefined,
      application: undefined,
    })

    return NextResponse.json({ items: scenarios })
  } catch (error) {
    console.error("plan scenario library failed", error)
    return NextResponse.json(
      { error: "Unable to load scenarios" },
      { status: 500 }
    )
  }
}
