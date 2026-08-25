import "server-only"

import { z } from "zod"

import { getSiteUrl } from "@/lib/app-url"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export class ManagementMutationError extends Error {
  constructor(
    message: string,
    readonly code:
      "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "UNKNOWN" = "UNKNOWN"
  ) {
    super(message)
  }
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user)
    throw new ManagementMutationError("You must be signed in.", "FORBIDDEN")
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.user.id)
    .single()
  if (profile?.role !== "ADMIN")
    throw new ManagementMutationError(
      "Only administrators can manage reference data.",
      "FORBIDDEN"
    )
  return { supabase, userId: user.user.id }
}

export async function createApplicationRecord(input: {
  name: string
  owner: string
}) {
  const parsed = z
    .object({
      name: z.string().trim().min(1).max(120),
      owner: z.string().trim().min(1).max(160),
    })
    .safeParse(input)
  if (!parsed.success)
    throw new ManagementMutationError(
      "Application details are invalid.",
      "VALIDATION"
    )
  const { supabase, userId } = await requireAdmin()
  const slug = parsed.data.name
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  const { error } = await supabase.from("applications").insert({
    name: parsed.data.name,
    slug,
    description: `Owner: ${parsed.data.owner}`,
    created_by: userId,
    updated_by: userId,
  })
  if (error)
    throw new ManagementMutationError(
      error.code === "42501"
        ? "Only administrators can create applications."
        : "Unable to create the application.",
      error.code === "42501" ? "FORBIDDEN" : "UNKNOWN"
    )
}

export async function toggleApplicationRecord(slug: string, active: boolean) {
  const parsed = z
    .object({ slug: z.string().min(1), active: z.boolean() })
    .safeParse({ slug, active })
  if (!parsed.success)
    throw new ManagementMutationError(
      "Application details are invalid.",
      "VALIDATION"
    )
  const { supabase, userId } = await requireAdmin()
  const { error } = await supabase
    .from("applications")
    .update({ is_active: parsed.data.active, updated_by: userId })
    .eq("slug", parsed.data.slug)
  if (error)
    throw new ManagementMutationError("Unable to update the application.")
}

export async function createEnvironmentRecord(input: {
  name: string
  url: string
}) {
  const parsed = z
    .object({
      name: z.string().trim().min(1).max(120),
      url: z.string().trim().max(500),
    })
    .safeParse(input)
  if (!parsed.success)
    throw new ManagementMutationError(
      "Environment details are invalid.",
      "VALIDATION"
    )
  const { supabase, userId } = await requireAdmin()
  const slug = parsed.data.name
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  const { error } = await supabase.from("environments").insert({
    name: parsed.data.name,
    slug,
    base_url: parsed.data.url || null,
    created_by: userId,
    updated_by: userId,
  })
  if (error)
    throw new ManagementMutationError(
      error.code === "42501"
        ? "Only administrators can create environments."
        : "Unable to create the environment.",
      error.code === "42501" ? "FORBIDDEN" : "UNKNOWN"
    )
}

export async function toggleEnvironmentRecord(
  slug: string,
  availability: "AVAILABLE" | "MAINTENANCE" | "RESTRICTED"
) {
  const { supabase, userId } = await requireAdmin()
  const { error } = await supabase
    .from("environments")
    .update({
      availability,
      updated_by: userId,
      last_checked_at: new Date().toISOString(),
    })
    .eq("slug", slug)
  if (error)
    throw new ManagementMutationError("Unable to update the environment.")
}

export async function createReleaseRecord(input: {
  version: string
  application: string
}) {
  const parsed = z
    .object({
      version: z.string().trim().min(1).max(80),
      application: z.string().trim().min(1),
    })
    .safeParse(input)
  if (!parsed.success)
    throw new ManagementMutationError(
      "Release details are invalid.",
      "VALIDATION"
    )
  const { supabase, userId } = await requireAdmin()
  const app = (
    await supabase
      .from("applications")
      .select("id")
      .eq("name", parsed.data.application)
      .single()
  ).data
  if (!app)
    throw new ManagementMutationError(
      "Select an existing application.",
      "VALIDATION"
    )
  const environment = (
    await supabase
      .from("environments")
      .select("id")
      .eq("name", "UAT")
      .maybeSingle()
  ).data
  if (!environment)
    throw new ManagementMutationError(
      "A UAT environment is required to create a release.",
      "VALIDATION"
    )
  const { error } = await supabase.from("releases").insert({
    application_id: app.id,
    environment_id: environment.id,
    version: parsed.data.version,
    build: "pending",
    branch: `release/${parsed.data.version.replace(/^v/, "")}`,
    commit_sha: "pending",
    status: "PLANNED",
    created_by: userId,
    updated_by: userId,
  })
  if (error)
    throw new ManagementMutationError(
      error.code === "42501"
        ? "Only administrators can create releases."
        : "Unable to create the release.",
      error.code === "42501" ? "FORBIDDEN" : "UNKNOWN"
    )
}

export async function advanceReleaseRecord(
  version: string,
  nextStatus:
    "PLANNED" | "TESTING" | "QA_APPROVED" | "REJECTED" | "RELEASED" | "ARCHIVED"
) {
  const { supabase, userId } = await requireAdmin()
  const { error } = await supabase
    .from("releases")
    .update({ status: nextStatus, updated_by: userId })
    .eq("version", version)
  if (error) throw new ManagementMutationError("Unable to update the release.")
}

export async function listMemberRecords() {
  const { supabase } = await requireAdmin()
  const admin = createAdminClient()
  const [{ data, error }, { data: authUsers, error: authError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id,full_name,email,role,status,updated_at")
        .order("full_name"),
      admin.auth.admin.listUsers(),
    ])

  if (authError) {
    throw new Error(`Unable to load invited users: ${authError.message}`)
  }
  if (error) throw new Error(`Unable to load members: ${error.message}`)

  const authUsersById = new Map(
    (authUsers?.users ?? []).map((user) => [user.id, user])
  )

  return (data ?? []).map((item) => {
    const authUser = authUsersById.get(item.id)
    const invitationPending =
      authUser !== undefined &&
      !authUser.email_confirmed_at &&
      !authUser.last_sign_in_at

    return {
      ...item,
      invitation_pending: invitationPending,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
      email_confirmed_at: authUser?.email_confirmed_at ?? null,
    }
  })
}

export async function inviteMemberRecord(input: {
  email: string
  fullName: string
  role: "ADMIN" | "QA_LEAD" | "QA_TESTER"
}) {
  const parsed = z
    .object({
      email: z.email(),
      fullName: z.string().trim().min(1).max(160),
      role: z.enum(["ADMIN", "QA_LEAD", "QA_TESTER"]),
    })
    .safeParse(input)
  if (!parsed.success)
    throw new ManagementMutationError(
      "Member invitation details are invalid.",
      "VALIDATION"
    )

  const { supabase } = await requireAdmin()
  const admin = createAdminClient()
  const redirectTo = `${await getSiteUrl()}/auth/confirm?next=/auth/set-password`

  const { data: invitation, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
      data: { name: parsed.data.fullName },
      redirectTo,
    })

  if (inviteError || !invitation.user) {
    throw new ManagementMutationError(
      inviteError?.message.includes("already been registered")
        ? "That email address is already registered."
        : "Unable to send the invitation.",
      inviteError?.status === 422 ? "VALIDATION" : "UNKNOWN"
    )
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: invitation.user.id,
      email: parsed.data.email,
      full_name: parsed.data.fullName,
      role: parsed.data.role,
      status: "ACTIVE",
    },
    { onConflict: "id" }
  )
  if (profileError) {
    throw new ManagementMutationError(
      `Invitation sent, but provisioning the QA profile failed: ${profileError.message}`
    )
  }
}

export async function resendMemberInviteRecord(id: string) {
  const parsed = z.object({ id: z.uuid() }).safeParse({ id })
  if (!parsed.success)
    throw new ManagementMutationError(
      "The selected member is invalid.",
      "VALIDATION"
    )

  const { supabase } = await requireAdmin()
  const admin = createAdminClient()
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,full_name")
    .eq("id", parsed.data.id)
    .single()
  if (profileError || !profile)
    throw new ManagementMutationError("The selected member no longer exists.")

  const { data: authUsers, error: authError } =
    await admin.auth.admin.listUsers()
  if (authError) {
    throw new ManagementMutationError("Unable to load the invited member.")
  }
  const authUser = authUsers.users.find((user) => user.id === parsed.data.id)
  if (!authUser)
    throw new ManagementMutationError(
      "The selected member does not have an auth identity yet.",
      "NOT_FOUND"
    )
  if (authUser.email_confirmed_at) {
    throw new ManagementMutationError(
      "This member has already accepted their invitation.",
      "VALIDATION"
    )
  }

  const redirectTo = `${await getSiteUrl()}/auth/confirm?next=/auth/set-password`
  const { error: resendError } = await admin.auth.admin.inviteUserByEmail(
    profile.email,
    {
      data: { name: profile.full_name },
      redirectTo,
    }
  )
  if (resendError)
    throw new ManagementMutationError("Unable to resend the invitation.")
}

export async function updateMemberRecord(
  id: string,
  input: {
    role: "ADMIN" | "QA_LEAD" | "QA_TESTER"
    status: "ACTIVE" | "INACTIVE"
  }
) {
  const parsed = z
    .object({
      id: z.uuid(),
      role: z.enum(["ADMIN", "QA_LEAD", "QA_TESTER"]),
      status: z.enum(["ACTIVE", "INACTIVE"]),
    })
    .safeParse({ id, ...input })
  if (!parsed.success)
    throw new ManagementMutationError(
      "Member details are invalid.",
      "VALIDATION"
    )
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role, status: parsed.data.status })
    .eq("id", parsed.data.id)
  if (error)
    throw new ManagementMutationError(
      error.code === "42501"
        ? "Only administrators can update members."
        : "Unable to update the member.",
      error.code === "42501" ? "FORBIDDEN" : "UNKNOWN"
    )
}
