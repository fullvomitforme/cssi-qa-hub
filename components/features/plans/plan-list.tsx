"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarDaysIcon, PlusIcon, SearchIcon } from "lucide-react"

import { createPlanAction, type PlanActionState } from "@/app/actions/plans"
import { PlanFormSheet } from "@/components/features/plans/plan-form-sheet"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PlanReferences, PlanSummary, ScenarioHierarchy } from "@/types/qa"

const variants = {
  ACTIVE: "success",
  ARCHIVED: "outline",
  COMPLETED: "neutral",
  DRAFT: "outline",
  READY: "info",
} as const

export function PlanList({
  canManage,
  filters,
  initialCreateOpen = false,
  initialPlans,
  isDemoMode,
  references,
  scenarioHierarchy,
}: {
  canManage: boolean
  filters: { search?: string; status?: string }
  initialCreateOpen?: boolean
  initialPlans: PlanSummary[]
  isDemoMode: boolean
  references: PlanReferences
  scenarioHierarchy: ScenarioHierarchy
}) {
  const [plans, setPlans] = useState(initialPlans)
  const [createOpen, setCreateOpen] = useState(initialCreateOpen)
  const [search, setSearch] = useState(filters.search ?? "")
  const [status, setStatus] = useState(filters.status ?? "all")
  const [notice, setNotice] = useState<string | null>(null)

  function applyFilters(nextSearch: string, nextStatus: string) {
    const params = new URLSearchParams()
    if (nextSearch) params.set("search", nextSearch)
    if (nextStatus !== "all") params.set("status", nextStatus)
    window.location.href = `/plans${params.size > 0 ? `?${params.toString()}` : ""}`
  }

  async function createLocalPlanAction(
    _: PlanActionState,
    formData: FormData
  ): Promise<PlanActionState> {
    const application = references.applications.find(
      (item) => item.id === String(formData.get("applicationId"))
    )
    const environment = references.environments.find(
      (item) => item.id === String(formData.get("environmentId"))
    )
    const release = references.releases.find(
      (item) => item.id === String(formData.get("releaseId"))
    )
    const owner = references.ownerOptions.find(
      (item) => item.id === String(formData.get("ownerId"))
    )
    const scenarioIds = JSON.parse(
      String(formData.get("scenarioIds") ?? "[]")
    ) as string[]

    if (!application || !environment || !release || !owner) {
      return {
        status: "error",
        message: "Demo plan references are incomplete.",
      }
    }

    const nextPlan: PlanSummary = {
      id: `local-plan-${Date.now()}`,
      name: String(formData.get("name") ?? ""),
      application: application.name,
      applicationSlug: application.slug ?? "unknown",
      release: release.version,
      environment: environment.name,
      owner: owner.fullName,
      scenarioCount: scenarioIds.length,
      progress: 0,
      status: String(
        formData.get("status") ?? "DRAFT"
      ) as PlanSummary["status"],
      targetDate: String(formData.get("targetCompletion") ?? ""),
    }

    setPlans((current) => [nextPlan, ...current])
    setNotice("Local demo plan created in this browser session.")

    return {
      status: "success",
      message: "Local plan created.",
      planId: nextPlan.id,
    }
  }

  return (
    <>
      {notice ? (
        <p className="mx-3 mt-3 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
          {notice}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <div className="relative min-w-56 flex-1 sm:max-w-80">
          <SearchIcon className="absolute top-2 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") applyFilters(search, status)
            }}
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
            <SelectItem value="ARCHIVED">Archived</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          onClick={() => applyFilters(search, status)}
        >
          Apply filters
        </Button>
        {canManage ? (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            Create Test Plan
          </Button>
        ) : null}
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
                  {plan.id.startsWith("local-plan-") ? (
                    <p className="font-medium">{plan.name}</p>
                  ) : (
                    <Link
                      href={`/plans/${plan.id}`}
                      className="font-medium hover:underline"
                    >
                      {plan.name}
                    </Link>
                  )}
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
                  {plan.scenarioCount}
                </TableCell>
                <TableCell className="min-w-40">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Coverage</span>
                    <span className="tabular-nums">
                      {plan.progress === null ? "—" : `${plan.progress}%`}
                    </span>
                  </div>
                  <Progress value={plan.progress ?? 0} />
                </TableCell>
                <TableCell>
                  <Badge variant={variants[plan.status]}>{plan.status}</Badge>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <CalendarDaysIcon className="size-3.5 text-muted-foreground" />
                    {plan.targetDate ?? "Not scheduled"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {plans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No test plans match the current filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {canManage ? (
        <PlanFormSheet
          action={isDemoMode ? createLocalPlanAction : createPlanAction}
          description={
            isDemoMode
              ? "Create a local draft plan for demo mode."
              : "Define persisted plan scope, assignees, and target dates."
          }
          initialValues={
            isDemoMode
              ? {
                  name: "",
                  applicationId: references.applications[0]?.id ?? "",
                  releaseId: references.releases[0]?.id ?? "",
                  environmentId: references.environments[0]?.id ?? "",
                  ownerId: references.ownerOptions[0]?.id ?? "",
                  description: "",
                  startDate: "2026-08-25",
                  targetCompletion: "2026-09-03",
                  status: "DRAFT",
                  scenarioIds: [],
                  assignmentProfileIds: [],
                }
              : undefined
          }
          onOpenChange={setCreateOpen}
          onSuccess={(planId) => {
            setCreateOpen(false)
            if (!isDemoMode) {
              setNotice(`Plan saved. Open /plans/${planId} to review details.`)
            }
          }}
          open={createOpen}
          references={references}
          scenarioHierarchy={scenarioHierarchy}
          submitLabel={isDemoMode ? "Create local plan" : "Create test plan"}
          title="Create Test Plan"
        />
      ) : null}
    </>
  )
}
