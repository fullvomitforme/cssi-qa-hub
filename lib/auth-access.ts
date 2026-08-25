export type AccessDecision =
  "active" | "unauthenticated" | "unprovisioned" | "inactive"

export function getProtectedRouteRedirect(decision: AccessDecision) {
  switch (decision) {
    case "unauthenticated":
      return "/login"
    case "unprovisioned":
      return "/access?reason=unprovisioned"
    case "inactive":
      return "/access?reason=inactive"
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
    case "inactive":
      return "/access?reason=inactive"
    default:
      return null
  }
}
