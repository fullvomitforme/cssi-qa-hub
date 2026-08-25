import { describe, expect, it } from "vitest"

import { getLoginRedirect, getProtectedRouteRedirect } from "@/lib/auth-access"

describe("getProtectedRouteRedirect", () => {
  it("redirects unauthenticated requests to login", () => {
    expect(getProtectedRouteRedirect("unauthenticated")).toBe("/login")
  })

  it("redirects signed-in users without QA Hub access to the access page", () => {
    expect(getProtectedRouteRedirect("unprovisioned")).toBe(
      "/access?reason=unprovisioned"
    )
  })

  it("allows active users through", () => {
    expect(getProtectedRouteRedirect("active")).toBeNull()
  })
})

describe("getLoginRedirect", () => {
  it("sends active users to overview", () => {
    expect(getLoginRedirect("active")).toBe("/overview")
  })

  it("sends unprovisioned users to the access page", () => {
    expect(getLoginRedirect("unprovisioned")).toBe(
      "/access?reason=unprovisioned"
    )
  })

  it("keeps unauthenticated users on the login screen", () => {
    expect(getLoginRedirect("unauthenticated")).toBeNull()
  })
})

describe("Auth route guards", () => {
  it("should not redirect authenticated users to login", () => {
    const decision = "active"
    const redirectToLogin = getLoginRedirect(decision)
    expect(redirectToLogin).toBe("/overview")
  })

  it("should handle unauthenticated users gracefully", () => {
    const decision = "unauthenticated"
    const redirectToProtected = getProtectedRouteRedirect(decision)
    expect(redirectToProtected).toBe("/login")
  })
})
