import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { getProtectedRouteRedirect } from "@/lib/auth-access"
import { demoProfile } from "@/lib/data/seed"
import { shouldUseDemoData } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import type { CurrentProfile, UserRole } from "@/types/qa"

interface ProfileRow {
  id: string
  full_name: string
  email: string
  role: UserRole
  status: "ACTIVE" | "INACTIVE"
  avatar_url: string | null
}

export type AuthAccessState =
  | { kind: "active"; profile: CurrentProfile }
  | { kind: "unauthenticated" }
  | { kind: "unprovisioned"; email: string }

export const getAuthAccessState = cache(async (): Promise<AuthAccessState> => {
  if (shouldUseDemoData()) {
    return { kind: "active", profile: demoProfile }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { kind: "unauthenticated" }
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, status, avatar_url")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>()

  if (error) {
    throw new Error(`Unable to load profile access state: ${error.message}`)
  }

  if (!data || data.status !== "ACTIVE") {
    return { kind: "unprovisioned", email: user.email ?? "" }
  }

  return {
    kind: "active",
    profile: {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      role: data.role,
      isActive: true,
      avatarUrl: data.avatar_url,
    },
  }
})

export const getCurrentProfile = cache(
  async (): Promise<CurrentProfile | null> => {
    const access = await getAuthAccessState()
    return access.kind === "active" ? access.profile : null
  }
)

export async function requireUser() {
  const access = await getAuthAccessState()
  if (access.kind !== "active") {
    const destination = getProtectedRouteRedirect(access.kind) ?? "/login"
    redirect(destination)
  }

  return access.profile
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = await createClient()
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  const supabase = await createClient()
  return supabase.auth.signOut({ scope: "global" })
}
