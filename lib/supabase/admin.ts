import "server-only"

import { createClient } from "@supabase/supabase-js"

import { env } from "@/lib/env"
import { serverEnv } from "@/lib/env.server"

export function createAdminClient() {
  if (!env.supabaseUrl || !serverEnv.supabaseSecretKey) {
    throw new Error("Supabase admin client is not configured")
  }

  return createClient(env.supabaseUrl, serverEnv.supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}
