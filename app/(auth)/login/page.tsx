import type { Metadata } from "next"
import Image from "next/image"
import { LockKeyholeIcon } from "lucide-react"
import { redirect } from "next/navigation"

import { loginAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { env } from "@/lib/env"
import { getLoginRedirect } from "@/lib/auth-access"
import { getAuthAccessState } from "@/services/auth"

export const metadata: Metadata = { title: "Sign in" }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const access = await getAuthAccessState()
  const destination = getLoginRedirect(access.kind)
  if (destination) redirect(destination)

  const { error } = await searchParams

  return (
    <main className="grid min-h-svh place-items-center bg-muted p-4">
      <Card className="w-full max-w-sm rounded-lg shadow-sm">
        <CardHeader>
          <div className="mb-2">
            <Image
              src="/kb_valbury_logo.png"
              alt="KB Valbury"
              width={36}
              height={36}
              className="h-9 w-auto"
              priority
            />
          </div>
          <CardTitle>Sign in to QA Hub</CardTitle>
          <CardDescription>
            Use your KBVS QA account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {env.demoMode ? (
            <div className="mb-4 border border-warning-border bg-warning-bg p-3 text-sm text-warning-text">
              Local demo mode is active. Open{" "}
              <a className="underline" href="/overview">
                the overview
              </a>{" "}
              without signing in.
            </div>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="mb-4 border border-destructive bg-background p-3 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}
          <form action={loginAction} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Email
              <Input name="email" type="email" autoComplete="email" required />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Password
              <Input
                name="password"
                type="password"
                autoComplete="current-password"
                minLength={8}
                required
              />
            </label>
            <Button type="submit">
              <LockKeyholeIcon data-icon="inline-start" />
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
