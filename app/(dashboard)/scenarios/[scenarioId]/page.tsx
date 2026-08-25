import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRightIcon, PencilIcon } from "lucide-react"

import { PriorityBadge } from "@/components/domain/priority-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getScenario } from "@/services/scenarios"
import { requireUser } from "@/services/auth"

export const metadata: Metadata = { title: "Scenario Detail" }

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
})

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>
}) {
  const { scenarioId } = await params
  const [profile, scenario] = await Promise.all([
    requireUser(),
    getScenario(scenarioId),
  ])
  if (!scenario) notFound()

  return (
    <main className="flex min-w-0 flex-col gap-4 p-4 lg:p-6">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-xs text-muted-foreground"
      >
        <Link href="/scenarios" className="hover:underline">
          Test Scenarios
        </Link>
        <ChevronRightIcon aria-hidden="true" />
        <span>{scenario.application}</span>
        <ChevronRightIcon aria-hidden="true" />
        <span>{scenario.module}</span>
      </nav>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={scenario.priority} />
            <Badge variant="outline">
              {scenario.type.replaceAll("_", " ")}
            </Badge>
            {scenario.tags.map((tag) => (
              <Badge key={tag} variant="neutral">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="text-xl font-semibold">{scenario.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {scenario.description}
          </p>
        </div>
        {profile.role !== "QA_TESTER" ? (
          <Button
            variant="outline"
            size="sm"
            disabled
            title="Persisted scenario editing will be available after backend integration."
          >
            <PencilIcon data-icon="inline-start" />
            Edit Scenario
          </Button>
        ) : null}
      </div>
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Preconditions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-6 whitespace-pre-wrap">
                {scenario.preconditions}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Test Steps</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <ol className="divide-y">
                {scenario.steps.map((step) => (
                  <li
                    key={step.position}
                    className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 px-4 py-3"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums">
                      {step.position}
                    </span>
                    <div>
                      <p>{step.instruction}</p>
                      {step.expectedResult ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Expected: {step.expectedResult}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Expected Result</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-6 whitespace-pre-wrap">
                {scenario.expectedResult}
              </p>
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit">
          <CardHeader className="border-b">
            <CardTitle>Scenario Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Application</dt>
                <dd className="mt-1 font-medium">{scenario.application}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  Module / Feature
                </dt>
                <dd className="mt-1">
                  {scenario.module} / {scenario.feature}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Created</dt>
                <dd className="mt-1">
                  {dateFormatter.format(new Date(scenario.createdAt))}
                  <br />
                  <span className="text-muted-foreground">
                    by {scenario.createdBy}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Last updated</dt>
                <dd className="mt-1">
                  {dateFormatter.format(new Date(scenario.updatedAt))}
                  <br />
                  <span className="text-muted-foreground">
                    by {scenario.updatedBy}
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
