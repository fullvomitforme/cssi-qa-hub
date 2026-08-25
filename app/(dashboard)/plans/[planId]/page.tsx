import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRightIcon } from "lucide-react"

import { PlanEditor } from "@/components/features/plans/plan-editor"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toPlanFormValues } from "@/lib/plan-adapters"
import { requireUser } from "@/services/auth"
import { getPlan, listPlanReferences } from "@/services/plans"
import { listScenarioHierarchy } from "@/services/scenarios"

export const metadata: Metadata = { title: "Plan Detail" }

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
})

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>
}) {
  const { planId } = await params
  const [profile, plan, references, scenarioHierarchy] = await Promise.all([
    requireUser(),
    getPlan(planId),
    listPlanReferences(),
    listScenarioHierarchy(),
  ])

  if (!plan) notFound()

  return (
    <main className="flex min-w-0 flex-col gap-4 p-4 lg:p-6">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-xs text-muted-foreground"
      >
        <Link href="/plans" className="hover:underline">
          Test Plans
        </Link>
        <ChevronRightIcon aria-hidden="true" />
        <span>{plan.application}</span>
      </nav>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{plan.application}</Badge>
            <Badge variant="neutral">{plan.environment}</Badge>
            <Badge variant="outline">{plan.status}</Badge>
          </div>
          <h1 className="text-xl font-semibold">{plan.name}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {plan.description || "No plan description recorded."}
          </p>
        </div>
        {profile.role !== "QA_TESTER" ? (
          <PlanEditor
            initialValues={toPlanFormValues(plan)}
            planId={plan.id}
            references={references}
            role={profile.role}
            scenarioHierarchy={scenarioHierarchy}
          />
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Included Scenarios</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <ol className="divide-y">
                {plan.scenarios.map((scenario) => (
                  <li key={scenario.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {scenario.position}. {scenario.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {scenario.application} · {scenario.module} /{" "}
                          {scenario.feature}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">{scenario.type}</Badge>
                        <Badge variant="neutral">{scenario.priority}</Badge>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Assigned QA Members</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <ul className="divide-y">
                {plan.assignments.map((assignment) => (
                  <li
                    key={assignment.profileId}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{assignment.fullName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {assignment.role} · {assignment.email}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {dateFormatter.format(new Date(assignment.assignedAt))}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader className="border-b">
            <CardTitle>Plan Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Release</dt>
                <dd className="mt-1 font-medium">{plan.release}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Environment</dt>
                <dd className="mt-1 font-medium">{plan.environment}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Owner</dt>
                <dd className="mt-1 font-medium">{plan.owner}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Start date</dt>
                <dd className="mt-1 font-medium">
                  {plan.startDate
                    ? dateFormatter.format(new Date(plan.startDate))
                    : "Not scheduled"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  Target completion
                </dt>
                <dd className="mt-1 font-medium">
                  {plan.targetCompletion
                    ? dateFormatter.format(new Date(plan.targetCompletion))
                    : "Not scheduled"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Created</dt>
                <dd className="mt-1">
                  {dateFormatter.format(new Date(plan.createdAt))}
                  <br />
                  <span className="text-muted-foreground">
                    by {plan.createdBy}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Last updated</dt>
                <dd className="mt-1">
                  {dateFormatter.format(new Date(plan.updatedAt))}
                  <br />
                  <span className="text-muted-foreground">
                    by {plan.updatedBy}
                  </span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
