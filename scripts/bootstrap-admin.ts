/**
 * Admin Bootstrap Script
 * 
 * Creates the first ADMIN user in the system. This is a one-time setup script.
 * 
 * Safety:
 * - Requires explicit environment variables
 * - Never prints passwords
 * - Never exposes service-role key
 * - Idempotent - safe to run multiple times
 * 
 * Usage:
 *   BOOTSTRAP_ADMIN_EMAIL=admin@example.com \
 *   BOOTSTRAP_ADMIN_PASSWORD=securePassword123 \
 *   BOOTSTRAP_ADMIN_NAME="Admin User" \
 *   npx tsx scripts/bootstrap-admin.ts
 */

import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

// Load env from .env.local if available
config({ path: ".env.local" })

// Required environment variables
const EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL
const PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD
const NAME = process.env.BOOTSTRAP_ADMIN_NAME
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

function exitWithError(message: string): never {
  console.error(`Error: ${message}`)
  process.exit(1)
}

// Validate required environment variables
if (!EMAIL) exitWithError("BOOTSTRAP_ADMIN_EMAIL is required")
if (!PASSWORD) exitWithError("BOOTSTRAP_ADMIN_PASSWORD is required")
if (!NAME) exitWithError("BOOTSTRAP_ADMIN_NAME is required")
if (!SUPABASE_URL) exitWithError("NEXT_PUBLIC_SUPABASE_URL is required")
if (!SERVICE_KEY) exitWithError("SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is required")

// Validate email format
if (!EMAIL.includes("@")) exitWithError("BOOTSTRAP_ADMIN_EMAIL must be a valid email")

// Validate password strength
if (PASSWORD.length < 8) exitWithError("BOOTSTRAP_ADMIN_PASSWORD must be at least 8 characters")

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
})

async function bootstrap() {
  console.log("Starting admin bootstrap...")
  console.log(`Target email: ${EMAIL}`)
  console.log(`Display name: ${NAME}`)
  console.log("")

  // Check if user already exists
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  })

  if (listError) {
    exitWithError(`Failed to list users: ${listError.message}`)
  }

  const existingUser = existingUsers.users.find(u => u.email === EMAIL)

  if (existingUser) {
    console.log(`User with email ${EMAIL} already exists (ID: ${existingUser.id})`)
    
    // Check if profile already exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", existingUser.id)
      .maybeSingle()
    
    if (profileError) {
      exitWithError(`Failed to check profile: ${profileError.message}`)
    }
    
    if (profile) {
      console.log(`Profile already exists: role=${profile.role}, status=${profile.status}`)
      console.log("")
      console.log("Bootstrap complete - user is already provisioned.")
      return
    }
    
    console.log("Profile missing - will create profile only")
  }

  // Create or update auth user
  let authUserId: string
  
  if (existingUser) {
    // User exists, just need to ensure they're confirmed
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { email_confirm: true }
    )
    if (confirmError) {
      exitWithError(`Failed to confirm user: ${confirmError.message}`)
    }
    authUserId = existingUser.id
    console.log(`Using existing auth user: ${authUserId}`)
  } else {
    // Create new user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { name: NAME },
    })
    
    if (createError) {
      exitWithError(`Failed to create auth user: ${createError.message}`)
    }
    
    if (!newUser.user) {
      exitWithError("Failed to create auth user - no user returned")
    }
    
    authUserId = newUser.user.id
    console.log(`Created auth user: ${authUserId}`)
  }

  // Create or update profile
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: authUserId,
      email: EMAIL,
      full_name: NAME,
      role: "ADMIN" as const,
      status: "ACTIVE" as const,
    },
    { onConflict: "id" }
  )
  
  if (profileError) {
    exitWithError(`Failed to create profile: ${profileError.message}`)
  }
  
  console.log(`Created/updated profile for ${EMAIL}`)
  console.log(`Role: ADMIN, Status: ACTIVE`)
  
  console.log("")
  console.log("✓ Admin bootstrap complete!")
  console.log("")
  console.log("You can now log in with:")
  console.log(`  Email: ${EMAIL}`)
  console.log(`  Password: [your provided password]`)
}

bootstrap().catch(error => {
  console.error("Bootstrap failed:", error)
  process.exit(1)
})
