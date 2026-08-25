"use client"

import { createBrowserClient } from "@supabase/ssr"

import { env } from "@/lib/env"

export function createClient() {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    throw new Error("Supabase browser client is not configured")
  }

  return createBrowserClient(env.supabaseUrl, env.supabasePublishableKey)
}
