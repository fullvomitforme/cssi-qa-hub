import type { Metadata } from "next"
import Link from "next/link"
import { AlertCircleIcon, LockKeyholeIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = { title: "Access required" }

const accessMessages = {
  unprovisioned: {
    title: "QA Hub access is not available for this account",
    description:
      "Your account authenticated successfully, but QA Hub access has not been provisioned or is currently disabled. Contact a QA Hub administrator to continue.",
  },
  inactive: {
    title: "This QA Hub account is inactive",
    description:
      "Your profile exists, but an administrator has disabled access. Contact a QA Hub administrator if you need access restored.",
  },
} as const

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: keyof typeof accessMessages }>
}) {
  const { reason } = await searchParams
  const content = accessMessages[reason ?? "unprovisioned"]

  return (
    <main className="grid min-h-svh place-items-center bg-muted p-4">
      <Card className="w-full max-w-lg rounded-lg shadow-sm">
        <CardHeader>
          <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-foreground text-background">
            <AlertCircleIcon aria-hidden="true" />
          </div>
          <CardTitle>{content.title}</CardTitle>
          <CardDescription>{content.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link href="/login" />}>
            <LockKeyholeIcon data-icon="inline-start" />
            Return to sign in
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
