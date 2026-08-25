import "server-only"

import { headers } from "next/headers"

export async function getSiteUrl() {
  const headerStore = await headers()
  const protocol = headerStore.get("x-forwarded-proto") ?? "http"
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host")

  if (!host) {
    return "http://localhost:3000"
  }

  return `${protocol}://${host}`
}
