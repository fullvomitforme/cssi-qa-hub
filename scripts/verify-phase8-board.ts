import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const credentials = {
  admin: ["phase2.admin@localhost.com", "QaHubPhase2!Admin"],
  lead: ["phase2.lead@localhost.com", "QaHubPhase2!Lead"],
  tester: ["phase2.tester@localhost.com", "QaHubPhase2!Tester"],
} as const

async function login(role: keyof typeof credentials) {
  const client = createClient(url, key)
  const [email, password] = credentials[role]
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return client
}

const admin = await login("admin")
const lead = await login("lead")
const tester = await login("tester")
const { data: rows, error: readError } = await admin
  .from("qa_work_items")
  .select("id,status")
  .limit(1)
if (readError) throw readError
const { data: refs } = await admin
  .from("releases")
  .select("id,version,status")
  .limit(10)
const { data: envs } = await admin
  .from("environments")
  .select("id,name")
  .limit(10)
let boardItem = rows?.[0]
if (!boardItem) {
  const { data: adminUser } = await admin.auth.getUser()
  const app = (
    await admin.from("applications").select("id").eq("name", "Portal").single()
  ).data
  const release = refs?.find((item) => item.status === "TESTING")
  const environment = envs?.find((item) => item.name === "UAT")
  if (!adminUser.user || !app || !release || !environment)
    throw new Error("Missing board verification references")
  const created = await admin
    .from("qa_work_items")
    .insert({
      application_id: app.id,
      release_id: release.id,
      environment_id: environment.id,
      title: "Phase 8 verification board item",
      priority: "P2",
      status: "BACKLOG",
      created_by: adminUser.user.id,
      updated_by: adminUser.user.id,
    })
    .select("id,status")
    .single()
  if (created.error || !created.data)
    throw created.error ?? new Error("Unable to create board fixture")
  boardItem = created.data
}

const moveResults = {
  admin: "NOT_TESTED",
  lead: "NOT_TESTED",
  tester: "NOT_TESTED",
}
const item = boardItem
if (item) {
  const target = item.status === "BACKLOG" ? "READY_TO_TEST" : "BACKLOG"
  const adminResult = await admin
    .from("qa_work_items")
    .update({ status: target })
    .eq("id", item.id)
    .select("id")
    .maybeSingle()
  moveResults.admin = adminResult.data ? "ALLOWED" : "DENIED"
  const leadResult = await lead
    .from("qa_work_items")
    .update({ status: item.status })
    .eq("id", item.id)
    .select("id")
    .maybeSingle()
  moveResults.lead = leadResult.data ? "ALLOWED" : "DENIED"
  const { data: leadUser } = await lead.auth.getUser()
  const historyResult = await lead
    .from("qa_work_item_history")
    .insert({
      work_item_id: item.id,
      from_status: item.status,
      to_status: target,
      changed_by: leadUser.user?.id,
      previous_value: { status: item.status },
      new_value: { status: target },
    })
    .select("id")
    .single()
  moveResults.lead = historyResult.data ? "ALLOWED" : "DENIED"
  const testerResult = await tester
    .from("qa_work_items")
    .update({ status: target })
    .eq("id", item.id)
    .select("id")
    .maybeSingle()
  moveResults.tester = testerResult.data ? "ALLOWED_UNEXPECTED" : "DENIED"
  await admin
    .from("qa_work_items")
    .update({ status: item.status })
    .eq("id", item.id)
}

console.log(
  JSON.stringify(
    {
      read: readError ? "ERROR" : "ALLOWED",
      itemCount: rows?.length ?? 0,
      moveResults,
      releases: refs,
      environments: envs,
    },
    null,
    2
  )
)
await admin.auth.signOut()
await lead.auth.signOut()
await tester.auth.signOut()
