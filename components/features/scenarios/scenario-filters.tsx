import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ScenarioFilters({
  values,
}: {
  values: {
    search?: string
    application?: string
    type?: string
    priority?: string
  }
}) {
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
        defaultValue={values.application ?? ""}
        className="h-8 rounded-lg border bg-background px-2 text-sm"
      >
        <option value="">All applications</option>
        <option value="portal">Portal</option>
        <option value="crm">CRM</option>
        <option value="flowra">Flowra</option>
        <option value="daily-operation">Daily Operation</option>
        <option value="itqm">ITQM</option>
        <option value="intranet">Intranet</option>
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
