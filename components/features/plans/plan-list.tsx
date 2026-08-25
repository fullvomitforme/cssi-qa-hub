"use client"

import { useState } from "react"
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

const variants = {
  ACTIVE: "success",
  COMPLETED: "neutral",
  READY: "info",
  DRAFT: "outline",
} as const

export function PlanList() {
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState("")
  const plans = testPlans.filter((plan) =>
    `${plan.name} ${plan.application}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase())
  )

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
        <Select defaultValue="all">
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
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
              <TableRow key={plan.id} className="cursor-pointer">
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
          <form className="flex flex-1 flex-col">
            <div className="space-y-4 p-4">
              <label className="block text-sm font-medium">
                Plan name
                <Input
                  className="mt-1.5"
                  placeholder="Portal v1.10.0 Regression"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium">
                  Application
                  <Select defaultValue="portal">
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portal">Portal</SelectItem>
                      <SelectItem value="crm">CRM</SelectItem>
                      <SelectItem value="flowra">Flowra</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
                <label className="block text-sm font-medium">
                  Environment
                  <Select defaultValue="uat">
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uat">UAT</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
              </div>
              <label className="block text-sm font-medium">
                Release
                <Input className="mt-1.5" defaultValue="v1.9.0" />
              </label>
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
                >
                  Browse Scenario Library
                </Button>
              </div>
            </div>
            <SheetFooter className="border-t">
              <Button type="button" onClick={() => setCreateOpen(false)}>
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
