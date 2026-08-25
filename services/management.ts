import "server-only"

import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export class ManagementMutationError extends Error {
  constructor(
    message: string,
    readonly code: "FORBIDDEN" | "VALIDATION" | "UNKNOWN" = "UNKNOWN"
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
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,email,role,status,updated_at")
    .order("full_name")
  if (error) throw new Error(`Unable to load members: ${error.message}`)
  return data ?? []
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
