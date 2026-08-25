import { redirect } from "next/navigation"

import { requireUser } from "@/services/auth"

export default async function ManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireUser()
  if (profile.role === "QA_TESTER") redirect("/overview")
  return children
}
