"use client"

import { useMemo, useState } from "react"
import { CalendarDaysIcon, PlusIcon, SearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { testPlans } from "@/lib/data/product-seed"
import { scenarioSeed } from "@/lib/data/seed"

const variants = {
  ACTIVE: "success",
  COMPLETED: "neutral",
  READY: "info",
  DRAFT: "outline",
} as const

type LocalPlan = {
  id: string
  name: string
  application: string
  release: string
  environment: string
  owner: string
  scenarios: number
  progress: number
  status: keyof typeof variants
  targetDate: string
}

export function PlanList({
  initialCreateOpen = false,
}: {
  initialCreateOpen?: boolean
}) {
  const [allPlans, setAllPlans] = useState<LocalPlan[]>(() =>
    testPlans.map((plan) => ({ ...plan }))
  )
  const [createOpen, setCreateOpen] = useState(initialCreateOpen)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [scenarioBrowserOpen, setScenarioBrowserOpen] = useState(false)
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([])
  const selectedScenarioIdSet = useMemo(
    () => new Set(selectedScenarioIds),
    [selectedScenarioIds]
  )
  const plans = allPlans.filter(
    (plan) =>
      `${plan.name} ${plan.application}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()) &&
      (status === "all" || plan.status === status)
  )

  function createPlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const plan: LocalPlan = {
      id: `local-plan-${Date.now()}`,
      name: String(form.get("name")),
      application: String(form.get("application")),
      release: String(form.get("release")),
      environment: String(form.get("environment")),
      owner: String(form.get("owner")),
      scenarios: selectedScenarioIds.length,
      progress: 0,
      status: "DRAFT",
      targetDate: String(form.get("targetDate")),
    }
    setAllPlans((current) => [plan, ...current])
    setSelectedScenarioIds([])
    setScenarioBrowserOpen(false)
    setCreateOpen(false)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <div className="relative min-w-56 flex-1 sm:max-w-80">
          <SearchIcon className="absolute top-2 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search plans…"
            className="pl-8"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value ?? "all")}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="READY">Ready</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          Create Test Plan
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Release / Environment</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-right">Scenarios</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Target date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>
                  <p className="font-medium">{plan.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {plan.application}
                  </p>
                </TableCell>
                <TableCell>
                  <p>{plan.release}</p>
                  <p className="text-xs text-muted-foreground">
                    {plan.environment}
                  </p>
                </TableCell>
                <TableCell>{plan.owner}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {plan.scenarios}
                </TableCell>
                <TableCell className="min-w-40">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Coverage</span>
                    <span className="tabular-nums">{plan.progress}%</span>
                  </div>
                  <Progress value={plan.progress} />
                </TableCell>
                <TableCell>
                  <Badge variant={variants[plan.status]}>{plan.status}</Badge>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <CalendarDaysIcon className="size-3.5 text-muted-foreground" />
                    {plan.targetDate}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader className="border-b">
            <SheetTitle>Create Test Plan</SheetTitle>
            <SheetDescription>
              Define what should be tested in this release cycle.
            </SheetDescription>
          </SheetHeader>
          <form className="flex flex-1 flex-col" onSubmit={createPlan}>
            <div className="space-y-4 p-4">
              <label className="block text-sm font-medium">
                Plan name
                <Input
                  name="name"
                  className="mt-1.5"
                  placeholder="Portal v1.10.0 Regression"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium">
                  Application
                  <select
                    name="application"
                    className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                  >
                    {[
                      "Portal",
                      "CRM",
                      "Flowra",
                      "Daily Operation",
                      "ITQM",
                      "Intranet",
                    ].map((application) => (
                      <option key={application}>{application}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium">
                  Environment
                  <select
                    name="environment"
                    className="mt-1.5 h-8 w-full rounded-lg border bg-background px-2"
                  >
                    <option>UAT</option>
                    <option>STAGING</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm font-medium">
                Release
                <Input
                  name="release"
                  className="mt-1.5"
                  defaultValue="v1.9.0"
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium">
                  Owner
                  <Input
                    name="owner"
                    className="mt-1.5"
                    defaultValue="Andi Pratama"
                    required
                  />
                </label>
                <label className="block text-sm font-medium">
                  Target date
                  <Input
                    name="targetDate"
                    className="mt-1.5"
                    defaultValue="Sep 03, 2026"
                    required
                  />
                </label>
              </div>
              <label className="block text-sm font-medium">
                Description
                <textarea
                  className="mt-1.5 min-h-24 w-full rounded-lg border bg-transparent p-2 text-sm"
                  placeholder="Regression scope, risks, and exit criteria…"
                />
              </label>
              <div className="rounded-md border border-dashed p-4 text-center">
                <p className="text-sm font-medium">Select scenarios</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Scenario bulk selection opens after the plan shell is saved.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setScenarioBrowserOpen((open) => !open)}
                >
                  {scenarioBrowserOpen
                    ? "Hide Scenario Library"
                    : "Browse Scenario Library"}
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  {selectedScenarioIds.length} selected
                </p>
              </div>
              {scenarioBrowserOpen ? (
                <div className="max-h-56 divide-y overflow-y-auto rounded-md border">
                  {scenarioSeed.map((scenario) => (
                    <label
                      key={scenario.id}
                      className="flex cursor-pointer items-start gap-2 p-3 text-left hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        checked={selectedScenarioIdSet.has(scenario.id)}
                        onChange={(event) =>
                          setSelectedScenarioIds((current) =>
                            event.target.checked
                              ? [...current, scenario.id]
                              : current.filter((id) => id !== scenario.id)
                          )
                        }
                        className="mt-0.5"
                      />
                      <span>
                        <span className="block text-sm font-medium">
                          {scenario.title}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {scenario.application} · {scenario.module} /{" "}
                          {scenario.feature}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
            <SheetFooter className="border-t">
              <Button type="submit" disabled={selectedScenarioIds.length === 0}>
                Create draft plan
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
