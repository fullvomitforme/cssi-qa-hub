"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { signInWithPassword, signOut } from "@/services/auth"

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect("/login?error=Enter+a+valid+email+and+password")

  const { error } = await signInWithPassword(
    parsed.data.email,
    parsed.data.password
  )
  if (error) redirect("/login?error=Unable+to+sign+in+with+those+credentials")
  redirect("/overview")
}

export async function logoutAction() {
  await signOut()
  redirect("/login")
}
