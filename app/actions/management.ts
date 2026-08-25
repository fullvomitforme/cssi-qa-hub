"use server"

import { revalidatePath } from "next/cache"

import { shouldUseDemoData } from "@/lib/env"
import {
  ManagementMutationError,
  advanceReleaseRecord,
  createApplicationRecord,
  createEnvironmentRecord,
  createReleaseRecord,
  inviteMemberRecord,
  resendMemberInviteRecord,
  toggleApplicationRecord,
  toggleEnvironmentRecord,
  updateMemberRecord,
} from "@/services/management"

type Result = { status: "success" | "error"; message?: string }
function mapError(error: unknown): Result {
  if (error instanceof ManagementMutationError)
    return { status: "error", message: error.message }
  console.error("management mutation failed", error)
  return {
    status: "error",
    message: "Unable to update management data right now.",
  }
}
function guardDemo(): Result | null {
  return shouldUseDemoData()
    ? { status: "error", message: "Demo mode uses local management state." }
    : null
}

export async function createApplicationAction(input: {
  name: string
  owner: string
}): Promise<Result> {
  const demo = guardDemo()
  if (demo) return demo
  try {
    await createApplicationRecord(input)
    revalidatePath("/management/applications")
    return { status: "success" }
  } catch (error) {
    return mapError(error)
  }
}
export async function toggleApplicationAction(
  slug: string,
  active: boolean
): Promise<Result> {
  const demo = guardDemo()
  if (demo) return demo
  try {
    await toggleApplicationRecord(slug, active)
    revalidatePath("/management/applications")
    return { status: "success" }
  } catch (error) {
    return mapError(error)
  }
}
export async function createEnvironmentAction(input: {
  name: string
  url: string
}): Promise<Result> {
  const demo = guardDemo()
  if (demo) return demo
  try {
    await createEnvironmentRecord(input)
    revalidatePath("/management/environments")
    return { status: "success" }
  } catch (error) {
    return mapError(error)
  }
}
export async function toggleEnvironmentAction(
  slug: string,
  availability: "AVAILABLE" | "MAINTENANCE" | "RESTRICTED"
): Promise<Result> {
  const demo = guardDemo()
  if (demo) return demo
  try {
    await toggleEnvironmentRecord(slug, availability)
    revalidatePath("/management/environments")
    return { status: "success" }
  } catch (error) {
    return mapError(error)
  }
}
export async function createReleaseAction(input: {
  version: string
  application: string
}): Promise<Result> {
  const demo = guardDemo()
  if (demo) return demo
  try {
    await createReleaseRecord(input)
    revalidatePath("/management/releases")
    return { status: "success" }
  } catch (error) {
    return mapError(error)
  }
}
export async function advanceReleaseAction(
  version: string,
  status:
    "PLANNED" | "TESTING" | "QA_APPROVED" | "REJECTED" | "RELEASED" | "ARCHIVED"
): Promise<Result> {
  const demo = guardDemo()
  if (demo) return demo
  try {
    await advanceReleaseRecord(version, status)
    revalidatePath("/management/releases")
    return { status: "success" }
  } catch (error) {
    return mapError(error)
  }
}
export async function updateMemberAction(
  id: string,
  input: {
    role: "ADMIN" | "QA_LEAD" | "QA_TESTER"
    status: "ACTIVE" | "INACTIVE"
  }
): Promise<Result> {
  const demo = guardDemo()
  if (demo) return demo
  try {
    await updateMemberRecord(id, input)
    revalidatePath("/management/members")
    return { status: "success" }
  } catch (error) {
    return mapError(error)
  }
}

export async function inviteMemberAction(input: {
  email: string
  fullName: string
  role: "ADMIN" | "QA_LEAD" | "QA_TESTER"
}): Promise<Result> {
  const demo = guardDemo()
  if (demo) return demo
  try {
    await inviteMemberRecord(input)
    revalidatePath("/management/members")
    return { status: "success" }
  } catch (error) {
    return mapError(error)
  }
}

export async function resendMemberInviteAction(id: string): Promise<Result> {
  const demo = guardDemo()
  if (demo) return demo
  try {
    await resendMemberInviteRecord(id)
    revalidatePath("/management/members")
    return { status: "success" }
  } catch (error) {
    return mapError(error)
  }
}
