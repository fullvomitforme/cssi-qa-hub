import "server-only"

import { overviewSeed } from "@/lib/data/seed"
import { shouldUseDemoData } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import type { OverviewData } from "@/types/qa"

export async function getOverviewData(): Promise<OverviewData> {
  if (shouldUseDemoData()) return overviewSeed

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_overview_dashboard")
  if (error) throw new Error(`Unable to load overview: ${error.message}`)
  return data as unknown as OverviewData
}
