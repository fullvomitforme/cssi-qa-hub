import "server-only"

import {
  applications as applicationSeed,
  environments as environmentSeed,
  releases as releaseSeed,
} from "@/lib/data/product-seed"
import { shouldUseDemoData } from "@/lib/env"
import {
  mapApplicationRow,
  mapEnvironmentRow,
  mapReleaseRow,
  type ApplicationRow,
  type EnvironmentRow,
  type ReleaseRow,
} from "@/lib/reference-data-adapters"
import { createClient } from "@/lib/supabase/server"
import type {
  ManagementApplicationItem,
  ManagementEnvironmentItem,
  ManagementReleaseItem,
} from "@/types/qa"

export async function listApplications(): Promise<ManagementApplicationItem[]> {
  if (shouldUseDemoData()) {
    return applicationSeed.map((item) => ({ ...item }))
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("applications")
    .select("name, slug, is_active")
    .order("name", { ascending: true })

  if (error) {
    throw new Error(`Unable to load applications: ${error.message}`)
  }

  return (data as ApplicationRow[]).map(mapApplicationRow)
}

export async function listEnvironments(): Promise<ManagementEnvironmentItem[]> {
  if (shouldUseDemoData()) {
    return environmentSeed.map((item) => ({ ...item }))
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("environments")
    .select("name, slug, base_url, availability, last_checked_at")
    .order("name", { ascending: true })

  if (error) {
    throw new Error(`Unable to load environments: ${error.message}`)
  }

  return (data as EnvironmentRow[]).map(mapEnvironmentRow)
}

export async function listReleases(): Promise<ManagementReleaseItem[]> {
  if (shouldUseDemoData()) {
    return releaseSeed.map((item) => ({ ...item }))
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("releases")
    .select(
      "version, build, branch, commit_sha, release_date, status, applications!inner(name), environments!inner(name)"
    )
    .order("release_date", { ascending: false, nullsFirst: false })
    .order("version", { ascending: false })

  if (error) {
    throw new Error(`Unable to load releases: ${error.message}`)
  }

  return (data as unknown as ReleaseRow[]).map(mapReleaseRow)
}
