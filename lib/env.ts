import { z } from "zod"

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_QA_DEMO_MODE: z.enum(["true", "false"]).default("false"),
})

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_QA_DEMO_MODE: process.env.NEXT_PUBLIC_QA_DEMO_MODE,
})

if (!parsed.success) {
  throw new Error(
    `Invalid public environment: ${z.prettifyError(parsed.error)}`
  )
}

export const env = {
  supabaseUrl: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
  supabasePublishableKey: parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  demoMode:
    parsed.data.NEXT_PUBLIC_QA_DEMO_MODE === "true" ||
    (!parsed.data.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NODE_ENV !== "production"),
}

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabasePublishableKey)
}

export function shouldUseDemoData() {
  return env.demoMode
}
