import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const client = createClient(url, key)
const { error: signInError } = await client.auth.signInWithPassword({
  email: "phase2.lead@localhost.com",
  password: "QaHubPhase2!Lead",
})
if (signInError) throw signInError
const { data, error } = await client.rpc("get_overview_dashboard")
if (error) throw error
const overview = data as {
  metrics: Array<{ label: string; value: number }>
  applications: unknown[]
  distribution: unknown[]
  trend: unknown[]
  recentRuns: unknown[]
  topFailures: unknown[]
}
console.log(
  JSON.stringify(
    {
      metrics: overview.metrics,
      applications: overview.applications.length,
      distribution: overview.distribution.length,
      trend: overview.trend.length,
      recentRuns: overview.recentRuns.length,
      topFailures: overview.topFailures.length,
    },
    null,
    2
  )
)
await client.auth.signOut()
