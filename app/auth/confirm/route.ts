import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

const supportedTypes: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email",
  "email_change",
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/overview"

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.search = ""

  if (tokenHash && type && supportedTypes.includes(type)) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })

    if (!error) {
      return NextResponse.redirect(redirectTo)
    }
  }

  const failureRedirect = request.nextUrl.clone()
  failureRedirect.pathname = "/login"
  failureRedirect.search =
    "?error=Invitation+or+confirmation+link+is+invalid+or+expired"
  return NextResponse.redirect(failureRedirect)
}
