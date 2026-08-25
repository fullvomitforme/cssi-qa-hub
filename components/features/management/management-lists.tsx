"use client"

import { useState } from "react"
import { MoreHorizontalIcon, PlusIcon, SearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
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
import { members } from "@/lib/data/product-seed"
import type {
  ManagementApplicationItem,
  ManagementEnvironmentItem,
  ManagementReleaseItem,
} from "@/types/qa"
import {
  createApplicationAction,
  createEnvironmentAction,
  createReleaseAction,
  advanceReleaseAction,
  toggleApplicationAction,
  toggleEnvironmentAction,
  updateMemberAction,
} from "@/app/actions/management"

export function ApplicationsList({
  initialItems,
  canManage,
  mode = "demo",
}: {
  initialItems: ManagementApplicationItem[]
  canManage: boolean
  mode?: "demo" | "real"
}) {
  const [items, setItems] = useState<ManagementApplicationItem[]>(() =>
    initialItems.map((item) => ({ ...item }))
  )
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("ALL")
  const [createOpen, setCreateOpen] = useState(false)
  const filtered = items.filter(
    (item) =>
      `${item.name} ${item.owner}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()) &&
      (filter === "ALL" || item.status === filter)
  )

  return (
    <>
      <ManagementToolbar
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
        filterOptions={["ACTIVE", "INACTIVE"]}
        action="Add application"
        canManage={canManage}
        onAdd={() => setCreateOpen(true)}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Application</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead className="text-right">Modules</TableHead>
            <TableHead className="text-right">Features</TableHead>
            <TableHead className="text-right">Scenarios</TableHead>
            <TableHead>Coverage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <EmptyTableRow
              colSpan={canManage ? 8 : 7}
              message="No applications available."
            />
          ) : null}
          {filtered.map((application) => (
            <TableRow key={application.slug}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-md border bg-muted text-xs font-semibold">
                    {application.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="font-medium">{application.name}</span>
                </div>
              </TableCell>
              <TableCell>{application.owner}</TableCell>
              <TableCell className="text-right tabular-nums">
                {application.modules}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {application.features}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {application.scenarios}
              </TableCell>
              <TableCell className="min-w-40">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">Executed</span>
                  <span>{application.coverage}%</span>
                </div>
                <Progress value={application.coverage} />
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    application.status === "ACTIVE" ? "success" : "neutral"
                  }
                >
                  {application.status}
                </Badge>
              </TableCell>
              {canManage ? (
                <Actions
                  label={`Toggle ${application.name} status`}
                  onClick={() =>
                    mode === "real"
                      ? void toggleApplicationAction(
                          application.slug,
                          application.status !== "ACTIVE"
                        ).then(() => window.location.reload())
                      : setItems((current) =>
                          current.map((item) =>
                            item.slug === application.slug
                              ? {
                                  ...item,
                                  status:
                                    item.status === "ACTIVE"
                                      ? "INACTIVE"
                                      : "ACTIVE",
                                }
                              : item
                          )
                        )
                  }
                />
              ) : (
                <TableCell />
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {canManage ? (
        <CreateItemSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          title="Add application"
          description="Add a local application record for this session."
          primaryLabel="Application name"
          secondaryLabel="Owner"
          onCreate={(name, owner) => {
            if (mode === "real") {
              void createApplicationAction({ name, owner }).then(() =>
                window.location.reload()
              )
              return
            }
            setItems((current) => [
              ...current,
              {
                name,
                slug: `${name.toLocaleLowerCase().replaceAll(" ", "-")}-${Date.now()}`,
                owner,
                modules: 0,
                features: 0,
                scenarios: 0,
                coverage: 0,
                status: "ACTIVE",
              },
            ])
            setCreateOpen(false)
          }}
        />
      ) : null}
    </>
  )
}

export function ReleasesList({
  initialItems,
  canManage,
  mode = "demo",
}: {
  initialItems: ManagementReleaseItem[]
  canManage: boolean
  mode?: "demo" | "real"
}) {
  const [items, setItems] = useState<ManagementReleaseItem[]>(() =>
    initialItems.map((item) => ({ ...item }))
  )
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("ALL")
  const [createOpen, setCreateOpen] = useState(false)
  const filtered = items.filter(
    (item) =>
      `${item.application} ${item.version} ${item.build}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()) &&
      (filter === "ALL" || item.status === filter)
  )

  return (
    <>
      <ManagementToolbar
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
        filterOptions={[
          "PLANNED",
          "TESTING",
          "QA_APPROVED",
          "REJECTED",
          "RELEASED",
          "ARCHIVED",
        ]}
        action="Create release"
        canManage={canManage}
        onAdd={() => setCreateOpen(true)}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Application</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Build / Commit</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Release date</TableHead>
            <TableHead>Environment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <EmptyTableRow
              colSpan={canManage ? 8 : 7}
              message="No releases available."
            />
          ) : null}
          {filtered.map((release) => (
            <TableRow
              key={`${release.application}-${release.version}-${release.build}`}
            >
              <TableCell className="font-medium">
                {release.application}
              </TableCell>
              <TableCell>{release.version}</TableCell>
              <TableCell>
                <p className="font-mono text-xs">{release.build}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {release.commit}
                </p>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {release.branch}
              </TableCell>
              <TableCell>{release.date}</TableCell>
              <TableCell>
                <Badge variant="outline">{release.environment}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    release.status === "QA_APPROVED"
                      ? "success"
                      : release.status === "REJECTED"
                        ? "destructive"
                        : release.status === "TESTING"
                          ? "info"
                          : "neutral"
                  }
                >
                  {release.status.replace("_", " ")}
                </Badge>
              </TableCell>
              {canManage ? (
                <Actions
                  label={`Advance ${release.application} ${release.version}`}
                  onClick={() =>
                    mode === "real"
                      ? void advanceReleaseAction(
                          release.version,
                          release.status === "PLANNED"
                            ? "TESTING"
                            : "QA_APPROVED"
                        ).then(() => window.location.reload())
                      : setItems((current) =>
                          current.map((item) =>
                            item === release
                              ? {
                                  ...item,
                                  status:
                                    item.status === "PLANNED"
                                      ? "TESTING"
                                      : "QA_APPROVED",
                                }
                              : item
                          )
                        )
                  }
                />
              ) : (
                <TableCell />
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {canManage ? (
        <CreateItemSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          title="Create release"
          description="Add a planned mock release."
          primaryLabel="Version"
          secondaryLabel="Application"
          onCreate={(version, application) => {
            if (mode === "real") {
              void createReleaseAction({ version, application }).then(() =>
                window.location.reload()
              )
              return
            }
            setItems((current) => [
              ...current,
              {
                application,
                version,
                build: "pending",
                branch: `release/${version.replace(/^v/, "")}`,
                commit: "pending",
                date: "TBD",
                environment: "UAT",
                status: "PLANNED",
              },
            ])
            setCreateOpen(false)
          }}
        />
      ) : null}
    </>
  )
}

export function EnvironmentsList({
  initialItems,
  canManage,
  mode = "demo",
}: {
  initialItems: ManagementEnvironmentItem[]
  canManage: boolean
  mode?: "demo" | "real"
}) {
  const [items, setItems] = useState<ManagementEnvironmentItem[]>(() =>
    initialItems.map((item) => ({ ...item }))
  )
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("ALL")
  const [createOpen, setCreateOpen] = useState(false)
  const filtered = items.filter(
    (item) =>
      `${item.name} ${item.key} ${item.url}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()) &&
      (filter === "ALL" || item.status === filter)
  )

  return (
    <>
      <ManagementToolbar
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
        filterOptions={["AVAILABLE", "MAINTENANCE", "RESTRICTED"]}
        action="Add environment"
        canManage={canManage}
        onAdd={() => setCreateOpen(true)}
      />
      <div className="divide-y">
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            No environments available.
          </div>
        ) : null}
        {filtered.map((environment) => (
          <div
            key={environment.key}
            className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto_auto_auto_auto] sm:items-center"
          >
            <div>
              <p className="font-medium">{environment.name}</p>
              <p className="text-xs text-muted-foreground">{environment.key}</p>
            </div>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {environment.url}
            </p>
            <span className="text-xs">
              {environment.applications} applications
            </span>
            <Badge
              variant={
                environment.status === "AVAILABLE"
                  ? "success"
                  : environment.status === "MAINTENANCE"
                    ? "warning"
                    : "neutral"
              }
            >
              {environment.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Checked {environment.lastChecked}
            </span>
            {canManage ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  mode === "real"
                    ? void toggleEnvironmentAction(
                        environment.key.toLocaleLowerCase(),
                        environment.status === "AVAILABLE"
                          ? "MAINTENANCE"
                          : "AVAILABLE"
                      ).then(() => window.location.reload())
                    : setItems((current) =>
                        current.map((item) =>
                          item.key === environment.key
                            ? {
                                ...item,
                                status:
                                  item.status === "AVAILABLE"
                                    ? "MAINTENANCE"
                                    : "AVAILABLE",
                                lastChecked: "Just now",
                              }
                            : item
                        )
                      )
                }
                aria-label={`Toggle ${environment.name} availability`}
              >
                <MoreHorizontalIcon />
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      {canManage ? (
        <CreateItemSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          title="Add environment"
          description="Add a local environment target."
          primaryLabel="Environment name"
          secondaryLabel="Base URL"
          onCreate={(name, url) => {
            if (mode === "real") {
              void createEnvironmentAction({ name, url }).then(() =>
                window.location.reload()
              )
              return
            }
            setItems((current) => [
              ...current,
              {
                name,
                key: `${name.toLocaleUpperCase().replaceAll(" ", "_")}_${Date.now()}`,
                url,
                applications: 0,
                status: "AVAILABLE",
                lastChecked: "Just now",
              },
            ])
            setCreateOpen(false)
          }}
        />
      ) : null}
    </>
  )
}

type MemberItem = {
  id: string
  name: string
  email: string
  role: "ADMIN" | "QA_LEAD" | "QA_TESTER"
  assignments: number
  activeRuns: number
  lastActive: string
  status: "ACTIVE" | "INACTIVE"
}

export function MembersList({
  initialCreateOpen = false,
  initialItems,
  mode = "demo",
}: {
  initialCreateOpen?: boolean
  initialItems?: MemberItem[]
  mode?: "demo" | "real"
}) {
  const [items, setItems] = useState<MemberItem[]>(
    () =>
      initialItems ??
      members.map((item, index) => ({ ...item, id: `demo-member-${index}` }))
  )
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("ALL")
  const [createOpen, setCreateOpen] = useState(initialCreateOpen)
  const filtered = items.filter(
    (item) =>
      `${item.name} ${item.email} ${item.role}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()) &&
      (filter === "ALL" || item.role === filter)
  )

  return (
    <>
      <ManagementToolbar
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
        filterOptions={["ADMIN", "QA_LEAD", "QA_TESTER"]}
        action="Invite QA member"
        canManage={mode === "demo"}
        onAdd={() => setCreateOpen(true)}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Assignments</TableHead>
            <TableHead className="text-right">Active runs</TableHead>
            <TableHead>Last active</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((member) => (
            <TableRow key={member.email}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full border bg-muted text-xs font-semibold">
                    {member.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{member.role.replace("_", " ")}</Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {member.assignments}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {member.activeRuns}
              </TableCell>
              <TableCell>{member.lastActive}</TableCell>
              <TableCell>
                <Badge
                  variant={member.status === "ACTIVE" ? "success" : "neutral"}
                >
                  {member.status}
                </Badge>
              </TableCell>
              <Actions
                label={`Toggle ${member.name} status`}
                onClick={() =>
                  mode === "real"
                    ? void updateMemberAction(member.id, {
                        role: member.role,
                        status:
                          member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                      }).then(() => window.location.reload())
                    : setItems((current) =>
                        current.map((item) =>
                          item.email === member.email
                            ? {
                                ...item,
                                status:
                                  item.status === "ACTIVE"
                                    ? "INACTIVE"
                                    : "ACTIVE",
                              }
                            : item
                        )
                      )
                }
              />
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {mode === "demo" ? (
        <CreateItemSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          title="Invite QA member"
          description="Add a local QA member row. No invitation will be sent."
          primaryLabel="Full name"
          secondaryLabel="Email"
          onCreate={(name, email) => {
            setItems((current) => [
              ...current,
              {
                id: `demo-member-${Date.now()}`,
                name,
                email,
                role: "QA_TESTER",
                assignments: 0,
                activeRuns: 0,
                lastActive: "Invited locally",
                status: "ACTIVE",
              },
            ])
            setCreateOpen(false)
          }}
        />
      ) : null}
    </>
  )
}

function ManagementToolbar({
  search,
  onSearch,
  filter,
  onFilter,
  filterOptions,
  action,
  canManage,
  onAdd,
}: {
  search: string
  onSearch: (value: string) => void
  filter: string
  onFilter: (value: string) => void
  filterOptions: string[]
  action: string
  canManage: boolean
  onAdd: () => void
}) {
  return (
    <div className="flex items-center gap-2 border-b p-3">
      <div className="relative max-w-80 flex-1">
        <SearchIcon className="absolute top-2 left-2.5 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search…"
          className="pl-8"
        />
      </div>
      <select
        value={filter}
        onChange={(event) => onFilter(event.target.value)}
        aria-label="Filter management list"
        className="h-8 rounded-lg border bg-background px-2 text-sm"
      >
        <option value="ALL">All</option>
        {filterOptions.map((option) => (
          <option key={option}>{option.replaceAll("_", " ")}</option>
        ))}
      </select>
      {canManage ? (
        <Button className="ml-auto" size="sm" onClick={onAdd}>
          <PlusIcon data-icon="inline-start" />
          {action}
        </Button>
      ) : null}
    </div>
  )
}

function EmptyTableRow({
  colSpan,
  message,
}: {
  colSpan: number
  message: string
}) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="py-6 text-center text-sm text-muted-foreground"
      >
        {message}
      </TableCell>
    </TableRow>
  )
}

function Actions({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <TableCell className="text-right">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={label}
        title={label}
        onClick={onClick}
      >
        <MoreHorizontalIcon />
      </Button>
    </TableCell>
  )
}

function CreateItemSheet({
  open,
  onOpenChange,
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  primaryLabel: string
  secondaryLabel: string
  onCreate: (primary: string, secondary: string) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            onCreate(String(form.get("primary")), String(form.get("secondary")))
          }}
        >
          <div className="grid flex-1 gap-4 p-4">
            <label className="text-sm font-medium">
              {primaryLabel}
              <Input name="primary" className="mt-1.5" required />
            </label>
            <label className="text-sm font-medium">
              {secondaryLabel}
              <Input name="secondary" className="mt-1.5" required />
            </label>
            <p className="text-xs text-muted-foreground">
              This change is local to the current browser session.
            </p>
          </div>
          <SheetFooter className="border-t">
            <Button type="submit">Save local item</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
