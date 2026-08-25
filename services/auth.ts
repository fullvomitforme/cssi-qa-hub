import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { demoProfile } from "@/lib/data/seed"
import { env, isSupabaseConfigured } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import type { CurrentProfile, UserRole } from "@/types/qa"

interface ProfileRow {
  id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url: string | null
}

export const getCurrentProfile = cache(
  async (): Promise<CurrentProfile | null> => {
    if (env.demoMode && !isSupabaseConfigured()) return demoProfile

    const supabase = await createClient()
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims()
    const userId = claimsData?.claims?.sub

    if (claimsError || !userId) return null

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, avatar_url")
      .eq("id", userId)
      .single<ProfileRow>()

    if (error || !data) return null

    return {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      role: data.role,
      avatarUrl: data.avatar_url,
    }
  }
)

export async function requireUser() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")
  return profile
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = await createClient()
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  const supabase = await createClient()
  return supabase.auth.signOut()
}
