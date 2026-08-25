import "server-only"

import { overviewSeed } from "@/lib/data/seed"
import { shouldUseDemoData } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import type { OverviewData } from "@/types/qa"

export async function getOverviewData(input?: {
  releaseId?: string
  environmentId?: string
  startDate?: string
  endDate?: string
}): Promise<OverviewData> {
  if (shouldUseDemoData()) return overviewSeed

  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_overview_dashboard", {
    filter_release_id: input?.releaseId ?? null,
    filter_environment_id: input?.environmentId ?? null,
    filter_start_date: input?.startDate
      ? new Date(input.startDate).toISOString().split("T")[0]
      : null,
    filter_end_date: input?.endDate
      ? new Date(input.endDate).toISOString().split("T")[0]
      : null,
  })

  if (error) throw new Error(`Unable to load overview: ${error.message}`)
  return data as unknown as OverviewData
}
