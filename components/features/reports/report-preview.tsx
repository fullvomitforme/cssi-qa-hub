import { CheckIcon, FileImageIcon, ShieldCheckIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"

const moduleResults = [
  {
    module: "Authentication",
    scenarios: [
      ["Login with valid credentials", "PASS"],
      ["Reject invalid password", "PASS"],
      ["Locked account cannot sign in", "FAIL"],
      ["Logout clears active session", "PASS"],
      ["Session expiration", "NOT TESTED"],
    ],
  },
  {
    module: "User Management",
    scenarios: [
      ["Create standard employee", "PASS"],
      ["Edit employee role", "PASS"],
      ["Delete user with active assignments", "BLOCKED"],
      ["Search employee directory", "PASS"],
    ],
  },
  {
    module: "Notifications",
    scenarios: [
      ["Open notification detail", "PASS"],
      ["Mark notification as read", "FAIL"],
      ["Bulk clear notifications", "PASS"],
    ],
  },
] as const

export function ReportPreview() {
  return (
    <article className="report-paper mx-auto w-full max-w-5xl border bg-background text-foreground">
      <header className="flex items-start justify-between gap-8 border-b-2 border-foreground p-8">
        <div>
          <p className="text-xs font-semibold tracking-widest">
            KB VALBURY SEKURITAS
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            QA TEST EXECUTION REPORT
          </h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            QA-PORTAL-2026-0081
          </p>
        </div>
        <div className="flex size-14 items-center justify-center rounded-lg border-2 border-foreground">
          <ShieldCheckIcon className="size-7" />
        </div>
      </header>
      <section className="grid grid-cols-2 gap-x-12 gap-y-4 border-b p-8 text-sm md:grid-cols-4">
        {[
          ["Application", "Portal"],
          ["Release", "v1.9.0"],
          ["Build", "a829d41"],
          ["Environment", "UAT"],
          ["Test Period", "24–26 August 2026"],
          ["QA Members", "Andi Pratama / Budi Santoso"],
          ["Branch", "release/1.9"],
          ["Generated", "26 August 2026, 17:30"],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              {label}
            </p>
            <p className="mt-1 font-medium">{value}</p>
          </div>
        ))}
      </section>
      <section className="border-b p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Executive Summary
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              Release readiness assessment
            </h2>
          </div>
          <Badge variant="warning" className="px-3 py-1">
            CONDITIONAL PASS
          </Badge>
        </div>
        <div className="mt-6 grid grid-cols-3 divide-x border md:grid-cols-6">
          {[
            ["Total", "148"],
            ["Executed", "142"],
            ["Passed", "131"],
            ["Failed", "7"],
            ["Blocked", "4"],
            ["Not Tested", "6"],
          ].map(([label, value]) => (
            <div key={label} className="p-4 text-center">
              <p className="text-xl font-semibold tabular-nums">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="border-l-2 border-success-border bg-success-bg p-4">
            <p className="text-xs font-semibold text-success-text uppercase">
              Pass rate
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">92.25%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Passed / executed scenarios
            </p>
          </div>
          <div className="border-l-2 border-primary bg-muted p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Coverage
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">95.95%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Executed / total scenarios
            </p>
          </div>
        </div>
      </section>
      <section className="border-b p-8">
        <h2 className="text-base font-semibold">Scenario Results by Module</h2>
        <div className="mt-4 divide-y border">
          {moduleResults.map((group) => (
            <section key={group.module}>
              <header className="flex items-center justify-between bg-muted/40 px-4 py-2.5">
                <h3 className="text-sm font-semibold">{group.module}</h3>
                <span className="text-xs text-muted-foreground">
                  {
                    group.scenarios.filter(([, status]) => status === "PASS")
                      .length
                  }{" "}
                  passed / {group.scenarios.length} total
                </span>
              </header>
              <div className="divide-y">
                {group.scenarios.map(([scenario, status]) => (
                  <div
                    key={scenario}
                    className="flex items-center gap-3 px-4 py-2 text-sm"
                  >
                    {status === "PASS" ? (
                      <CheckIcon className="size-4 text-success-text" />
                    ) : status === "FAIL" ? (
                      <XIcon className="size-4 text-destructive" />
                    ) : (
                      <span className="size-4 rounded-full border" />
                    )}
                    <span>{scenario}</span>
                    <Badge
                      variant={
                        status === "PASS"
                          ? "success"
                          : status === "FAIL"
                            ? "destructive"
                            : status === "BLOCKED"
                              ? "warning"
                              : "neutral"
                      }
                      className="ml-auto"
                    >
                      {status}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
      <section className="border-b p-8">
        <h2 className="text-base font-semibold">Failed Scenario Detail</h2>
        <div className="mt-4 border">
          <div className="flex items-center justify-between border-b bg-destructive/5 px-4 py-3">
            <div>
              <p className="font-medium">Locked account cannot sign in</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Portal / Authentication · PORTAL-482
              </p>
            </div>
            <Badge variant="destructive">HIGH</Badge>
          </div>
          <dl className="grid gap-4 p-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">
                Expected Result
              </dt>
              <dd className="mt-1 leading-5">
                Access is denied and support guidance is shown without creating
                a session.
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">
                Actual Result
              </dt>
              <dd className="mt-1 leading-5">
                The dashboard appeared briefly before the user was redirected to
                the locked-account screen.
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">
                Failure Reason
              </dt>
              <dd className="mt-1 leading-5">
                Authorization is evaluated after protected content hydrates.
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">
                Execution
              </dt>
              <dd className="mt-1 leading-5">
                Andi Pratama · 25 August 2026, 10:26
                <br />
                Build a829d41 · Attempt 1
              </dd>
            </div>
          </dl>
          <div className="border-t p-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              EVIDENCE
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="overflow-hidden rounded-md border">
                <div className="flex h-7 items-center gap-1 border-b bg-muted px-2">
                  <span className="size-2 rounded-full bg-muted-foreground" />
                  <span className="size-2 rounded-full bg-muted-foreground" />
                  <span className="ml-2 text-xs text-muted-foreground">
                    portal.uat.kbvs.internal/dashboard
                  </span>
                </div>
                <div className="flex aspect-video items-center justify-center bg-muted/30">
                  <div className="w-3/4 border bg-background p-4 text-center">
                    <p className="text-xs font-semibold">Portal Dashboard</p>
                    <p className="mt-2 text-xs text-destructive">
                      Session revoked
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex aspect-video flex-col items-center justify-center rounded-md border bg-muted/30 text-muted-foreground">
                <FileImageIcon className="size-7" />
                <p className="mt-2 text-xs">network-session-log.png</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="grid border-b md:grid-cols-2">
        <div className="border-b p-8 md:border-r md:border-b-0">
          <h2 className="text-base font-semibold">Findings Summary</h2>
          <div className="mt-4 grid grid-cols-4 divide-x border">
            {[
              ["Critical", "1"],
              ["High", "3"],
              ["Medium", "5"],
              ["Low", "2"],
            ].map(([label, value]) => (
              <div key={label} className="p-3 text-center">
                <p className="text-lg font-semibold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm">
            <strong>8 unresolved</strong> findings remain across the tested
            release scope.
          </p>
        </div>
        <div className="p-8">
          <h2 className="text-base font-semibold">Conclusion</h2>
          <p className="mt-4 text-sm leading-6">
            Release can proceed after resolution and successful retest of
            PORTAL-482 and PORTAL-491. Remaining medium and low findings are
            accepted for follow-up in v1.9.1.
          </p>
        </div>
      </section>
      <section className="grid grid-cols-3 divide-x p-8">
        <div className="pr-6">
          <p className="text-xs text-muted-foreground uppercase">Prepared By</p>
          <div className="mt-10 border-t pt-2">
            <p className="text-sm font-medium">Andi Pratama</p>
            <p className="text-xs text-muted-foreground">
              QA Lead · Aug 26, 17:30
            </p>
          </div>
        </div>
        <div className="px-6">
          <p className="text-xs text-muted-foreground uppercase">Reviewed By</p>
          <div className="mt-10 border-t pt-2">
            <p className="text-sm font-medium">Siti Aisyah</p>
            <p className="text-xs text-muted-foreground">
              Administrator · Aug 26, 18:05
            </p>
          </div>
        </div>
        <div className="pl-6">
          <p className="text-xs text-muted-foreground uppercase">Approved By</p>
          <div className="mt-10 border-t pt-2">
            <p className="text-sm font-medium">Rina Mahendra</p>
            <p className="text-xs text-muted-foreground">
              Head of Technology · Pending
            </p>
          </div>
        </div>
      </section>
    </article>
  )
}
