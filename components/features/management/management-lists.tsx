import { MoreHorizontalIcon, PlusIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  applications,
  environments,
  members,
  releases,
} from "@/lib/data/product-seed"

export function ApplicationsList() {
  return (
    <>
      <CommandBar action="Add application" />
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
          {applications.map((application) => (
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
                <Badge variant="success">{application.status}</Badge>
              </TableCell>
              <Actions />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}

export function ReleasesList() {
  return (
    <>
      <CommandBar action="Create release" />
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
          {releases.map((release) => (
            <TableRow key={`${release.application}-${release.version}`}>
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
              <Actions />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}

export function EnvironmentsList() {
  return (
    <>
      <CommandBar action="Add environment" />
      <div className="divide-y">
        {environments.map((environment) => (
          <div
            key={environment.key}
            className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto_auto_auto] sm:items-center"
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
          </div>
        ))}
      </div>
    </>
  )
}

export function MembersList() {
  return (
    <>
      <CommandBar action="Invite QA member" />
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
          {members.map((member) => (
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
                <Badge variant="success">{member.status}</Badge>
              </TableCell>
              <Actions />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}

function CommandBar({ action }: { action: string }) {
  return (
    <div className="flex items-center gap-2 border-b p-3">
      <Button variant="outline" size="sm">
        Search
      </Button>
      <Button variant="outline" size="sm">
        Filter
      </Button>
      <Button className="ml-auto" size="sm">
        <PlusIcon data-icon="inline-start" />
        {action}
      </Button>
    </div>
  )
}
function Actions() {
  return (
    <TableCell className="text-right">
      <Button variant="ghost" size="icon-sm" aria-label="Open row actions">
        <MoreHorizontalIcon />
      </Button>
    </TableCell>
  )
}
