export type AccessDecision = "active" | "unauthenticated" | "unprovisioned"

export function getProtectedRouteRedirect(decision: AccessDecision) {
  switch (decision) {
    case "unauthenticated":
      return "/login"
    case "unprovisioned":
      return "/access?reason=unprovisioned"
    default:
      return null
  }
}

export function getLoginRedirect(decision: AccessDecision) {
  switch (decision) {
    case "active":
      return "/overview"
    case "unprovisioned":
      return "/access?reason=unprovisioned"
    default:
      return null
  }
}
