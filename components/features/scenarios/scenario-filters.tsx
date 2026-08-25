"use client"

import { useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ScenarioHierarchy } from "@/types/qa"

export function ScenarioFilters({
  hierarchy,
  values,
}: {
  hierarchy: ScenarioHierarchy
  values: {
    search?: string
    application?: string
    module?: string
    feature?: string
    type?: string
    priority?: string
    updated?: string
  }
}) {
  const filterKey = `${values.application ?? ""}:${values.module ?? ""}:${values.feature ?? ""}`

  return (
    <ScenarioFiltersInner
      key={filterKey}
      hierarchy={hierarchy}
      values={values}
    />
  )
}

function ScenarioFiltersInner({
  hierarchy,
  values,
}: {
  hierarchy: ScenarioHierarchy
  values: {
    search?: string
    application?: string
    module?: string
    feature?: string
    type?: string
    priority?: string
    updated?: string
  }
}) {
  const [application, setApplication] = useState(values.application ?? "")
  const [module, setModule] = useState(values.module ?? "")
  const [feature, setFeature] = useState(values.feature ?? "")

  const moduleOptions = useMemo(
    () =>
      hierarchy.modules.filter(
        (item) => !application || item.applicationSlug === application
      ),
    [application, hierarchy.modules]
  )

  const featureOptions = useMemo(
    () =>
      hierarchy.features.filter(
        (item) =>
          (!application || item.applicationSlug === application) &&
          (!module || item.moduleSlug === module)
      ),
    [application, hierarchy.features, module]
  )
  const selectedModule = moduleOptions.some((item) => item.slug === module)
    ? module
    : ""
  const selectedFeature = featureOptions.some((item) => item.slug === feature)
    ? feature
    : ""

  return (
    <form
      method="get"
      className="flex flex-wrap items-center gap-2 border-b p-3"
    >
      <div className="relative min-w-60 flex-1 lg:max-w-sm">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          name="search"
          defaultValue={values.search}
          placeholder="Search scenarios…"
          className="pl-8"
        />
      </div>
      <label className="sr-only" htmlFor="application">
        Application
      </label>
      <select
        id="application"
        name="application"
        value={application}
        onChange={(event) => {
          setApplication(event.target.value)
          setModule("")
          setFeature("")
        }}
        className="h-8 rounded-lg border bg-background px-2 text-sm"
      >
        <option value="">All applications</option>
        {hierarchy.applications.map((applicationOption) => (
          <option key={applicationOption.id} value={applicationOption.slug}>
            {applicationOption.name}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="module">
        Module
      </label>
      <select
        id="module"
        name="module"
        value={selectedModule}
        onChange={(event) => {
          setModule(event.target.value)
          setFeature("")
        }}
        className="h-8 rounded-lg border bg-background px-2 text-sm"
      >
        <option value="">All modules</option>
        {moduleOptions.map((moduleOption) => (
          <option key={moduleOption.id} value={moduleOption.slug}>
            {moduleOption.name}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="feature">
        Feature
      </label>
      <select
        id="feature"
        name="feature"
        value={selectedFeature}
        onChange={(event) => setFeature(event.target.value)}
        className="h-8 rounded-lg border bg-background px-2 text-sm"
      >
        <option value="">All features</option>
        {featureOptions.map((featureOption) => (
          <option key={featureOption.id} value={featureOption.slug}>
            {featureOption.name}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="type">
        Test type
      </label>
      <select
        id="type"
        name="type"
        defaultValue={values.type ?? ""}
        className="h-8 rounded-lg border bg-background px-2 text-sm"
      >
        <option value="">All types</option>
        {[
          "HAPPY_PATH",
          "VALIDATION",
          "NEGATIVE",
          "PERMISSION",
          "EDGE_CASE",
          "INTEGRATION",
          "REGRESSION",
          "RESPONSIVE",
          "ACCESSIBILITY",
          "PERFORMANCE",
        ].map((type) => (
          <option key={type} value={type}>
            {type.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="updated">
        Updated
      </label>
      <select
        id="updated"
        name="updated"
        defaultValue={values.updated ?? ""}
        className="h-8 rounded-lg border bg-background px-2 text-sm"
      >
        <option value="">Any updated date</option>
        <option value="3d">Updated in 3 days</option>
        <option value="7d">Updated in 7 days</option>
        <option value="30d">Updated in 30 days</option>
      </select>
      <label className="sr-only" htmlFor="priority">
        Priority
      </label>
      <select
        id="priority"
        name="priority"
        defaultValue={values.priority ?? ""}
        className="h-8 rounded-lg border bg-background px-2 text-sm"
      >
        <option value="">All priorities</option>
        <option value="P0">P0 Critical</option>
        <option value="P1">P1 High</option>
        <option value="P2">P2 Medium</option>
        <option value="P3">P3 Low</option>
      </select>
      <Button type="submit" size="sm">
        Apply filters
      </Button>
    </form>
  )
}
