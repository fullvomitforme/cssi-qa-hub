import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const creds = {
  admin: ["phase2.admin@localhost.com", "QaHubPhase2!Admin"],
  lead: ["phase2.lead@localhost.com", "QaHubPhase2!Lead"],
  tester: ["phase2.tester@localhost.com", "QaHubPhase2!Tester"],
} as const
async function login(role: keyof typeof creds) {
  const client = createClient(url, key)
  const [email, password] = creds[role]
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return client
}
const admin = await login("admin")
const lead = await login("lead")
const tester = await login("tester")
const application = await admin
  .from("applications")
  .select("slug,is_active")
  .eq("slug", "portal")
  .single()
const environment = await admin
  .from("environments")
  .select("slug,availability")
  .eq("slug", "uat")
  .single()
const release = await admin
  .from("releases")
  .select("version,status")
  .limit(1)
  .single()
if (application.error || environment.error || release.error)
  throw application.error ?? environment.error ?? release.error
const appAdmin = await admin
  .from("applications")
  .update({ is_active: application.data.is_active })
  .eq("slug", "portal")
  .select("slug")
  .maybeSingle()
const appLead = await lead
  .from("applications")
  .update({ is_active: application.data.is_active })
  .eq("slug", "portal")
  .select("slug")
  .maybeSingle()
const envAdmin = await admin
  .from("environments")
  .update({ availability: environment.data.availability })
  .eq("slug", "uat")
  .select("slug")
  .maybeSingle()
const envTester = await tester
  .from("environments")
  .update({ availability: environment.data.availability })
  .eq("slug", "uat")
  .select("slug")
  .maybeSingle()
const releaseAdmin = await admin
  .from("releases")
  .update({ status: release.data.status })
  .eq("version", release.data.version)
  .select("version")
  .maybeSingle()
const releaseLead = await lead
  .from("releases")
  .update({ status: release.data.status })
  .eq("version", release.data.version)
  .select("version")
  .maybeSingle()
console.log(
  JSON.stringify(
    {
      applications: {
        admin: appAdmin.data ? "ALLOWED" : "DENIED",
        qaLead: appLead.data ? "ALLOWED_UNEXPECTED" : "DENIED",
      },
      environments: {
        admin: envAdmin.data ? "ALLOWED" : "DENIED",
        qaTester: envTester.data ? "ALLOWED_UNEXPECTED" : "DENIED",
      },
      releases: {
        admin: releaseAdmin.data ? "ALLOWED" : "DENIED",
        qaLead: releaseLead.data ? "ALLOWED_UNEXPECTED" : "DENIED",
      },
    },
    null,
    2
  )
)
await admin.auth.signOut()
await lead.auth.signOut()
await tester.auth.signOut()
