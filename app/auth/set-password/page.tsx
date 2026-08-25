import type { Metadata } from "next"
import { LockKeyholeIcon } from "lucide-react"
import { redirect } from "next/navigation"

import { SetPasswordForm } from "@/components/features/auth/set-password-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getAuthAccessState } from "@/services/auth"

export const metadata: Metadata = { title: "Complete account setup" }

export default async function SetPasswordPage() {
  const access = await getAuthAccessState()

  if (access.kind === "unauthenticated") {
    redirect("/login?error=Your+invitation+session+has+expired")
  }
  if (access.kind === "unprovisioned" || access.kind === "inactive") {
    redirect("/access")
  }

  return (
    <main className="grid min-h-svh place-items-center bg-muted p-4">
      <Card className="w-full max-w-sm rounded-lg shadow-sm">
        <CardHeader>
          <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-foreground text-background">
            <LockKeyholeIcon aria-hidden="true" />
          </div>
          <CardTitle>Complete your QA Hub account</CardTitle>
          <CardDescription>
            Set your password to finish accepting the invitation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SetPasswordForm />
        </CardContent>
      </Card>
    </main>
  )
}
