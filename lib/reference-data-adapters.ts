import type {
  ManagementApplicationItem,
  ManagementEnvironmentItem,
  ManagementReleaseItem,
} from "@/types/qa"

export interface ApplicationRow {
  name: string
  slug: string
  is_active: boolean
}

export interface EnvironmentRow {
  name: string
  slug: string
  base_url: string | null
  availability: "AVAILABLE" | "MAINTENANCE" | "RESTRICTED"
  last_checked_at: string | null
}

export interface ReleaseRow {
  version: string
  build: string | null
  branch: string | null
  commit_sha: string | null
  release_date: string | null
  status:
    "PLANNED" | "TESTING" | "QA_APPROVED" | "REJECTED" | "RELEASED" | "ARCHIVED"
  applications: Array<{ name: string }> | null
  environments: Array<{ name: string }> | null
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
})

export function mapApplicationRow(
  row: ApplicationRow
): ManagementApplicationItem {
  return {
    name: row.name,
    slug: row.slug,
    owner: "Unassigned",
    modules: 0,
    features: 0,
    scenarios: 0,
    coverage: 0,
    status: row.is_active ? "ACTIVE" : "INACTIVE",
  }
}

export function mapEnvironmentRow(
  row: EnvironmentRow
): ManagementEnvironmentItem {
  return {
    name: row.name,
    key: row.slug.toUpperCase().replaceAll("-", "_"),
    url: row.base_url ?? "Not configured",
    applications: 0,
    status: row.availability,
    lastChecked: row.last_checked_at
      ? dateFormatter.format(new Date(row.last_checked_at))
      : "Never",
  }
}

export function mapReleaseRow(row: ReleaseRow): ManagementReleaseItem {
  return {
    application: row.applications?.[0]?.name ?? "Unknown",
    version: row.version,
    build: row.build ?? "pending",
    branch: row.branch ?? "pending",
    commit: row.commit_sha ?? "pending",
    date: row.release_date
      ? dateFormatter.format(new Date(row.release_date))
      : "TBD",
    environment: row.environments?.[0]?.name ?? "Unknown",
    status: row.status,
  }
}
