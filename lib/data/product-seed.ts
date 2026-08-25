import { calculateExecutionMetrics } from "@/lib/execution-metrics"

export const boardStatuses = [
  "BACKLOG",
  "READY_TO_TEST",
  "IN_TESTING",
  "BLOCKED",
  "FAILED_NEED_FIX",
  "RETEST",
  "PASSED",
  "DONE",
] as const

export type BoardStatus = (typeof boardStatuses)[number]

export type BoardItem = {
  id: string
  title: string
  application: string
  feature: string
  release: string
  environment: string
  priority: "P0" | "P1" | "P2" | "P3"
  assignee: string
  due: string
  scenarios: number
  passed: number
  failed: number
  blocked: number
  untested: number
  status: BoardStatus
}

export const boardItems: BoardItem[] = [
  {
    id: "w1",
    title: "Notification Center",
    application: "Portal",
    feature: "Notifications",
    release: "v1.9.0",
    environment: "UAT",
    priority: "P2",
    assignee: "Andi",
    due: "Aug 27",
    scenarios: 12,
    passed: 0,
    failed: 0,
    blocked: 0,
    untested: 12,
    status: "BACKLOG",
  },
  {
    id: "w2",
    title: "Export Data",
    application: "CRM",
    feature: "Leads",
    release: "v1.9.0",
    environment: "UAT",
    priority: "P3",
    assignee: "Siti",
    due: "Aug 29",
    scenarios: 8,
    passed: 0,
    failed: 0,
    blocked: 0,
    untested: 8,
    status: "BACKLOG",
  },
  {
    id: "w3",
    title: "Document Upload",
    application: "Flowra",
    feature: "Opening Account",
    release: "v1.9.0",
    environment: "UAT",
    priority: "P2",
    assignee: "Budi",
    due: "Aug 30",
    scenarios: 9,
    passed: 0,
    failed: 0,
    blocked: 0,
    untested: 9,
    status: "BACKLOG",
  },
  {
    id: "w4",
    title: "Setup New Password",
    application: "Portal",
    feature: "Authentication",
    release: "v1.9.0",
    environment: "UAT",
    priority: "P1",
    assignee: "Andi",
    due: "Aug 27",
    scenarios: 12,
    passed: 0,
    failed: 0,
    blocked: 0,
    untested: 12,
    status: "READY_TO_TEST",
  },
  {
    id: "w5",
    title: "Lead Management",
    application: "CRM",
    feature: "Leads",
    release: "v1.9.0",
    environment: "UAT",
    priority: "P1",
    assignee: "Siti",
    due: "Aug 28",
    scenarios: 16,
    passed: 2,
    failed: 0,
    blocked: 0,
    untested: 14,
    status: "READY_TO_TEST",
  },
  {
    id: "w6",
    title: "Activity Logs",
    application: "Daily Operation",
    feature: "History",
    release: "v1.9.0",
    environment: "UAT",
    priority: "P2",
    assignee: "Budi",
    due: "Aug 30",
    scenarios: 10,
    passed: 0,
    failed: 0,
    blocked: 0,
    untested: 10,
    status: "READY_TO_TEST",
  },
  {
    id: "w7",
    title: "User Management",
    application: "Portal",
    feature: "RBAC",
    release: "v1.9.0",
    environment: "UAT",
    priority: "P1",
    assignee: "Andi",
    due: "Aug 26",
    scenarios: 18,
    passed: 13,
    failed: 2,
    blocked: 0,
    untested: 3,
    status: "IN_TESTING",
  },
  {
    id: "w8",
    title: "Opening Account",
    application: "Flowra",
    feature: "Submission",
    release: "v1.9.0",
    environment: "UAT",
    priority: "P1",
    assignee: "Budi",
    due: "Aug 28",
    scenarios: 30,
    passed: 21,
    failed: 1,
    blocked: 1,
    untested: 7,
    status: "IN_TESTING",
  },
  {
    id: "w9",
    title: "Integration API",
    application: "CRM",
    feature: "Accounts",
    release: "v1.9.0",
    environment: "UAT",
    priority: "P1",
    assignee: "Siti",
    due: "Aug 27",
    scenarios: 14,
    passed: 9,
    failed: 0,
    blocked: 3,
    untested: 2,
    status: "BLOCKED",
  },
  {
    id: "w10",
    title: "Report Generation",
    application: "ITQM",
    feature: "Approval",
    release: "v1.9.0",
    environment: "UAT",
    priority: "P2",
    assignee: "Andi",
    due: "Aug 29",
    scenarios: 9,
    passed: 5,
    failed: 0,
    blocked: 2,
    untested: 2,
    status: "BLOCKED",
  },
  {
    id: "w11",
    title: "Two Factor Auth",
    application: "Portal",
    feature: "Authentication",
    release: "v1.9.0",
    environment: "UAT",
    priority: "P1",
    assignee: "Andi",
    due: "Aug 26",
    scenarios: 10,
    passed: 7,
    failed: 2,
    blocked: 0,
    untested: 1,
    status: "FAILED_NEED_FIX",
  },
  {
    id: "w12",
    title: "Bulk Import",
    application: "CRM",
    feature: "Leads",
    release: "v1.9.0",
    environment: "UAT",
    priority: "P2",
    assignee: "Siti",
    due: "Aug 27",
    scenarios: 12,
    passed: 8,
    failed: 2,
    blocked: 0,
    untested: 2,
    status: "FAILED_NEED_FIX",
  },
  {
    id: "w13",
    title: "Password Confirmation",
    application: "Portal",
    feature: "Authentication",
    release: "v1.9.0",
    environment: "UAT",
    priority: "P1",
    assignee: "Andi",
    due: "Aug 26",
    scenarios: 6,
    passed: 4,
    failed: 1,
    blocked: 0,
    untested: 1,
    status: "RETEST",
  },
  {
    id: "w14",
    title: "Today Workspace",
    application: "Daily Operation",
    feature: "Tasks",
    release: "v1.9.0",
    environment: "UAT",
    priority: "P2",
    assignee: "Budi",
    due: "Aug 25",
    scenarios: 15,
    passed: 15,
    failed: 0,
    blocked: 0,
    untested: 0,
    status: "PASSED",
  },
  {
    id: "w15",
    title: "Employee Directory",
    application: "Intranet",
    feature: "Directory",
    release: "v2.4.0",
    environment: "STAGING",
    priority: "P3",
    assignee: "Siti",
    due: "Aug 24",
    scenarios: 11,
    passed: 11,
    failed: 0,
    blocked: 0,
    untested: 0,
    status: "DONE",
  },
]

export const testPlans = [
  {
    id: "plan-portal",
    name: "Portal v1.9.0 Regression",
    application: "Portal",
    release: "v1.9.0",
    environment: "UAT",
    owner: "Andi Pratama",
    scenarios: 148,
    progress: 65,
    status: "ACTIVE",
    targetDate: "Aug 28, 2026",
  },
  {
    id: "plan-crm",
    name: "CRM v1.9.0 Regression",
    application: "CRM",
    release: "v1.9.0",
    environment: "UAT",
    owner: "Siti Aisyah",
    scenarios: 126,
    progress: 42,
    status: "ACTIVE",
    targetDate: "Aug 30, 2026",
  },
  {
    id: "plan-flowra",
    name: "Flowra Opening Account",
    application: "Flowra",
    release: "v1.9.0",
    environment: "UAT",
    owner: "Budi Santoso",
    scenarios: 94,
    progress: 70,
    status: "ACTIVE",
    targetDate: "Aug 29, 2026",
  },
  {
    id: "plan-itqm",
    name: "ITQM Smoke Test",
    application: "ITQM",
    release: "v1.9.0",
    environment: "STAGING",
    owner: "Andi Pratama",
    scenarios: 38,
    progress: 100,
    status: "COMPLETED",
    targetDate: "Aug 24, 2026",
  },
  {
    id: "plan-daily",
    name: "Daily Ops Approval Regression",
    application: "Daily Operation",
    release: "v1.9.0",
    environment: "UAT",
    owner: "Budi Santoso",
    scenarios: 72,
    progress: 81,
    status: "READY",
    targetDate: "Aug 31, 2026",
  },
  {
    id: "plan-intranet",
    name: "Intranet Employee Portal",
    application: "Intranet",
    release: "v2.4.0",
    environment: "STAGING",
    owner: "Siti Aisyah",
    scenarios: 55,
    progress: 0,
    status: "DRAFT",
    targetDate: "Sep 03, 2026",
  },
] as const

const testRunSeeds = [
  {
    id: "run-portal-regression",
    name: "Portal Regression — v1.9.0",
    application: "Portal",
    release: "v1.9.0",
    build: "8fa2c91",
    environment: "UAT",
    tester: "Andi Pratama",
    status: "IN_PROGRESS",
    started: "Aug 24, 2026",
  },
  {
    id: "run-crm-regression",
    name: "CRM Regression — v1.9.0",
    application: "CRM",
    release: "v1.9.0",
    build: "a829d41",
    environment: "UAT",
    tester: "Siti Aisyah",
    status: "IN_PROGRESS",
    started: "Aug 24, 2026",
  },
  {
    id: "run-flowra-regression",
    name: "Flowra Regression — v1.9.0",
    application: "Flowra",
    release: "v1.9.0",
    build: "a829d41",
    environment: "UAT",
    tester: "Budi Santoso",
    status: "BLOCKED",
    started: "Aug 23, 2026",
  },
  {
    id: "run-itqm-smoke",
    name: "ITQM Smoke Test — v1.9.0",
    application: "ITQM",
    release: "v1.9.0",
    build: "a829d41",
    environment: "STAGING",
    tester: "Andi Pratama",
    status: "COMPLETED",
    started: "Aug 22, 2026",
  },
  {
    id: "run-daily-regression",
    name: "Daily Ops Regression — v1.9.0",
    application: "Daily Operation",
    release: "v1.9.0",
    build: "8fa2c91",
    environment: "UAT",
    tester: "Budi Santoso",
    status: "IN_PROGRESS",
    started: "Aug 25, 2026",
  },
] as const

export const failureItems = [
  {
    id: "f1",
    scenario: "Locked account cannot sign in",
    application: "Portal",
    feature: "Authentication",
    severity: "HIGH",
    status: "OPEN",
    bugReference: "PORTAL-482",
    foundBy: "Andi Pratama",
    foundAt: "Aug 26, 2026 14:23",
    retestStatus: "AWAITING_FIX",
    runId: "run-portal-regression",
    executionId: "e3",
  },
  {
    id: "f2",
    scenario: "Export Leads — CSV Format",
    application: "CRM",
    feature: "Leads",
    severity: "MEDIUM",
    status: "IN_REVIEW",
    bugReference: "CRM-356",
    foundBy: "Siti Aisyah",
    foundAt: "Aug 26, 2026 11:05",
    retestStatus: "READY",
    runId: "run-crm-regression",
    executionId: "crm-e2",
  },
  {
    id: "f3",
    scenario: "Opening Account — Submit",
    application: "Flowra",
    feature: "Submission",
    severity: "HIGH",
    status: "OPEN",
    bugReference: "FLOWRA-201",
    foundBy: "Budi Santoso",
    foundAt: "Aug 25, 2026 16:40",
    retestStatus: "FAILED_AGAIN",
    runId: "run-flowra-regression",
    executionId: "flowra-e2",
  },
  {
    id: "f4",
    scenario: "Edit an employee role",
    application: "Portal",
    feature: "RBAC",
    severity: "CRITICAL",
    status: "FIXED",
    bugReference: "PORTAL-491",
    foundBy: "Andi Pratama",
    foundAt: "Aug 25, 2026 10:18",
    retestStatus: "PASSED",
    runId: "run-portal-regression",
    executionId: "e7",
  },
  {
    id: "f5",
    scenario: "Require a rejection comment",
    application: "Daily Operation",
    feature: "Approval",
    severity: "MEDIUM",
    status: "OPEN",
    bugReference: "DOPS-144",
    foundBy: "Budi Santoso",
    foundAt: "Aug 24, 2026 15:02",
    retestStatus: "AWAITING_FIX",
    runId: "run-daily-regression",
    executionId: "daily-e3",
  },
] as const

export const feedbackItems = [
  {
    id: "fb1",
    type: "COPY",
    title: "Use “Save Draft” for the secondary action",
    description:
      "The current label says Save, which is ambiguous before submission.",
    application: "Flowra",
    scenario: "Save opening account draft",
    severity: "LOW",
    status: "OPEN",
    author: "Budi Santoso",
    createdAt: "Aug 26, 2026 15:12",
    executionStatus: "PASS",
  },
  {
    id: "fb2",
    type: "UX",
    title: "Preserve lead filters after returning from detail",
    description:
      "Returning to the list resets filters and slows repetitive verification.",
    application: "CRM",
    scenario: "Open filtered lead detail",
    severity: "MEDIUM",
    status: "IN_REVIEW",
    author: "Siti Aisyah",
    createdAt: "Aug 26, 2026 12:44",
    executionStatus: "PASS",
  },
  {
    id: "fb3",
    type: "BUG",
    title: "Notification badge count does not refresh",
    description:
      "The count remains stale until the entire Portal is refreshed.",
    application: "Portal",
    scenario: "Mark notification as read",
    severity: "MEDIUM",
    status: "LINKED",
    author: "Andi Pratama",
    createdAt: "Aug 25, 2026 17:28",
    executionStatus: "FAIL",
  },
  {
    id: "fb4",
    type: "IMPROVEMENT",
    title: "Show approval owner in task history",
    description:
      "Adding the owner would make investigation easier for operations users.",
    application: "Daily Operation",
    scenario: "Review task approval history",
    severity: "LOW",
    status: "OPEN",
    author: "Budi Santoso",
    createdAt: "Aug 25, 2026 13:20",
    executionStatus: "PASS",
  },
  {
    id: "fb5",
    type: "QUESTION",
    title: "Should archived announcements remain searchable?",
    description:
      "The acceptance criteria does not define archive search behavior.",
    application: "Intranet",
    scenario: "Search employee announcements",
    severity: "LOW",
    status: "ANSWERED",
    author: "Siti Aisyah",
    createdAt: "Aug 24, 2026 09:10",
    executionStatus: "BLOCKED",
  },
] as const

export const reports = [
  {
    id: "QA-PORTAL-2026-0081",
    number: "QA-PORTAL-2026-0081",
    application: "Portal",
    release: "v1.9.0",
    environment: "UAT",
    result: "CONDITIONAL_PASS",
    generatedBy: "Andi Pratama",
    generatedAt: "Aug 26, 2026 17:30",
  },
  {
    id: "QA-CRM-2026-0034",
    number: "QA-CRM-2026-0034",
    application: "CRM",
    release: "v1.9.0",
    environment: "UAT",
    result: "FAIL",
    generatedBy: "Siti Aisyah",
    generatedAt: "Aug 25, 2026 18:05",
  },
  {
    id: "QA-FLOWRA-2026-0028",
    number: "QA-FLOWRA-2026-0028",
    application: "Flowra",
    release: "v1.9.0",
    environment: "UAT",
    result: "CONDITIONAL_PASS",
    generatedBy: "Budi Santoso",
    generatedAt: "Aug 25, 2026 16:20",
  },
  {
    id: "QA-ITQM-2026-0019",
    number: "QA-ITQM-2026-0019",
    application: "ITQM",
    release: "v1.9.0",
    environment: "STAGING",
    result: "PASS",
    generatedBy: "Andi Pratama",
    generatedAt: "Aug 24, 2026 14:10",
  },
] as const

export const applications = [
  {
    name: "Portal",
    slug: "portal",
    owner: "Platform Engineering",
    modules: 8,
    features: 34,
    scenarios: 286,
    coverage: 92,
    status: "ACTIVE",
  },
  {
    name: "CRM",
    slug: "crm",
    owner: "Sales Technology",
    modules: 9,
    features: 41,
    scenarios: 254,
    coverage: 87,
    status: "ACTIVE",
  },
  {
    name: "Flowra",
    slug: "flowra",
    owner: "Digital Onboarding",
    modules: 6,
    features: 38,
    scenarios: 221,
    coverage: 72,
    status: "ACTIVE",
  },
  {
    name: "Daily Operation",
    slug: "daily-operation",
    owner: "Operations Technology",
    modules: 7,
    features: 29,
    scenarios: 184,
    coverage: 81,
    status: "ACTIVE",
  },
  {
    name: "ITQM",
    slug: "itqm",
    owner: "IT Governance",
    modules: 6,
    features: 25,
    scenarios: 169,
    coverage: 96,
    status: "ACTIVE",
  },
  {
    name: "Intranet",
    slug: "intranet",
    owner: "Corporate Services",
    modules: 5,
    features: 20,
    scenarios: 134,
    coverage: 65,
    status: "ACTIVE",
  },
] as const

export const releases = [
  {
    application: "Portal",
    version: "v1.9.0",
    build: "8fa2c91",
    branch: "release/1.9",
    commit: "8fa2c91b42e",
    date: "Aug 28, 2026",
    environment: "UAT",
    status: "TESTING",
  },
  {
    application: "CRM",
    version: "v1.9.0",
    build: "a829d41",
    branch: "release/1.9",
    commit: "a829d41806c",
    date: "Aug 30, 2026",
    environment: "UAT",
    status: "TESTING",
  },
  {
    application: "Flowra",
    version: "v1.9.0",
    build: "a829d41",
    branch: "release/1.9",
    commit: "a829d41c219",
    date: "Aug 29, 2026",
    environment: "UAT",
    status: "REJECTED",
  },
  {
    application: "ITQM",
    version: "v1.9.0",
    build: "a829d41",
    branch: "release/1.9",
    commit: "a829d412d92",
    date: "Aug 26, 2026",
    environment: "STAGING",
    status: "QA_APPROVED",
  },
  {
    application: "Intranet",
    version: "v2.4.0",
    build: "1c02fe8",
    branch: "release/2.4",
    commit: "1c02fe8a440",
    date: "Sep 03, 2026",
    environment: "STAGING",
    status: "PLANNED",
  },
] as const

export const environments = [
  {
    name: "Local",
    key: "LOCAL",
    url: "http://localhost",
    applications: 6,
    status: "AVAILABLE",
    lastChecked: "Just now",
  },
  {
    name: "Development",
    key: "DEVELOPMENT",
    url: "https://dev.kbvs.internal",
    applications: 6,
    status: "AVAILABLE",
    lastChecked: "2 min ago",
  },
  {
    name: "UAT",
    key: "UAT",
    url: "https://uat.kbvs.internal",
    applications: 6,
    status: "AVAILABLE",
    lastChecked: "1 min ago",
  },
  {
    name: "Staging",
    key: "STAGING",
    url: "https://staging.kbvs.internal",
    applications: 6,
    status: "MAINTENANCE",
    lastChecked: "8 min ago",
  },
  {
    name: "Production",
    key: "PRODUCTION",
    url: "https://app.kbvs.co.id",
    applications: 6,
    status: "RESTRICTED",
    lastChecked: "5 min ago",
  },
] as const

export const members = [
  {
    name: "Andi Pratama",
    email: "andi.pratama@kbvalbury.com",
    role: "QA_LEAD",
    assignments: 5,
    activeRuns: 2,
    lastActive: "Now",
    status: "ACTIVE",
  },
  {
    name: "Siti Aisyah",
    email: "siti.aisyah@kbvalbury.com",
    role: "ADMIN",
    assignments: 4,
    activeRuns: 1,
    lastActive: "6 min ago",
    status: "ACTIVE",
  },
  {
    name: "Budi Santoso",
    email: "budi.santoso@kbvalbury.com",
    role: "QA_TESTER",
    assignments: 7,
    activeRuns: 2,
    lastActive: "12 min ago",
    status: "ACTIVE",
  },
  {
    name: "Dewi Larasati",
    email: "dewi.larasati@kbvalbury.com",
    role: "QA_TESTER",
    assignments: 3,
    activeRuns: 0,
    lastActive: "Yesterday",
    status: "ACTIVE",
  },
] as const

export type MockExecution = {
  id: string
  module: string
  title: string
  description: string
  preconditions: string
  steps: string[]
  expectedResult: string
  actualResult: string
  status: "PASS" | "FAIL" | "BLOCKED" | "SKIPPED" | "NOT_TESTED"
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | null
  failureReason: string
  bugReference: string
  tester: string
  testedAt: string | null
  attempts?: MockExecutionAttempt[]
  feedback?: MockExecutionFeedback[]
}

export type MockExecutionAttempt = {
  number: number
  status: Exclude<MockExecution["status"], "NOT_TESTED">
  build: string
  testedAt: string
}

export type MockExecutionFeedback = {
  id: string
  type: "BUG" | "UX" | "COPY" | "IMPROVEMENT" | "QUESTION"
  comment: string
  author: string
  createdAt: string
}

export const portalExecutions: MockExecution[] = [
  {
    id: "e1",
    module: "Authentication",
    title: "Login with valid credentials",
    description:
      "Authenticate an active employee using a valid employee ID and password.",
    preconditions: "An active Portal account exists.",
    steps: [
      "Open the Portal login page",
      "Enter a valid employee ID",
      "Enter the correct password",
      "Select Sign In",
    ],
    expectedResult: "A session is created and the Portal dashboard opens.",
    actualResult: "Dashboard opened and session cookie was created.",
    status: "PASS",
    severity: null,
    failureReason: "",
    bugReference: "",
    tester: "Andi Pratama",
    testedAt: "Aug 25, 2026 10:12",
  },
  {
    id: "e2",
    module: "Authentication",
    title: "Reject invalid password",
    description: "Confirm invalid credentials do not create a session.",
    preconditions: "An active Portal account exists.",
    steps: [
      "Open login",
      "Enter valid employee ID",
      "Enter an invalid password",
      "Select Sign In",
    ],
    expectedResult:
      "Access is denied with a clear error and no session is created.",
    actualResult: "Access denied and message displayed.",
    status: "PASS",
    severity: null,
    failureReason: "",
    bugReference: "",
    tester: "Andi Pratama",
    testedAt: "Aug 25, 2026 10:18",
  },
  {
    id: "e3",
    module: "Authentication",
    title: "Locked account cannot sign in",
    description: "Verify locked employees are prevented from signing in.",
    preconditions: "Employee account is locked by an administrator.",
    steps: ["Open login", "Enter locked account credentials", "Select Sign In"],
    expectedResult: "Access is denied and support guidance is shown.",
    actualResult:
      "User reached the dashboard for roughly two seconds before being redirected.",
    status: "FAIL",
    severity: "HIGH",
    failureReason: "Authorization check happens after dashboard hydration.",
    bugReference: "PORTAL-482",
    tester: "Andi Pratama",
    testedAt: "Aug 25, 2026 10:26",
    attempts: [
      {
        number: 1,
        status: "FAIL",
        build: "8fa2c91",
        testedAt: "Aug 24, 2026 16:18",
      },
      {
        number: 2,
        status: "FAIL",
        build: "8fa2c91",
        testedAt: "Aug 25, 2026 10:26",
      },
    ],
    feedback: [
      {
        id: "ef-portal-1",
        type: "BUG",
        comment: "The protected dashboard flashes before access is revoked.",
        author: "Andi Pratama",
        createdAt: "Aug 25, 2026 10:29",
      },
    ],
  },
  {
    id: "e4",
    module: "Authentication",
    title: "Logout clears the active session",
    description: "Ensure logout invalidates the current session.",
    preconditions: "User is signed in.",
    steps: ["Open account menu", "Select Sign Out", "Use browser Back"],
    expectedResult:
      "Login page remains visible and protected content cannot be reopened.",
    actualResult: "Session cleared successfully.",
    status: "PASS",
    severity: null,
    failureReason: "",
    bugReference: "",
    tester: "Andi Pratama",
    testedAt: "Aug 25, 2026 10:34",
  },
  {
    id: "e5",
    module: "Authentication",
    title: "Session expiration after inactivity",
    description: "Verify the session timeout flow and return path.",
    preconditions:
      "User is signed in and the timeout is configured to 30 minutes.",
    steps: ["Leave the page idle", "Attempt a protected action after timeout"],
    expectedResult: "The session expires with an explanation and return URL.",
    actualResult: "",
    status: "NOT_TESTED",
    severity: null,
    failureReason: "",
    bugReference: "",
    tester: "Andi Pratama",
    testedAt: null,
  },
  {
    id: "e6",
    module: "User Management",
    title: "Create a standard employee user",
    description: "Create a user with the standard employee role.",
    preconditions: "Tester has ADMIN user-management permission.",
    steps: [
      "Open Users",
      "Select Add User",
      "Complete required fields",
      "Assign Employee role",
      "Save",
    ],
    expectedResult: "The active user is created and appears in search.",
    actualResult: "User created and searchable.",
    status: "PASS",
    severity: null,
    failureReason: "",
    bugReference: "",
    tester: "Andi Pratama",
    testedAt: "Aug 25, 2026 11:06",
  },
  {
    id: "e7",
    module: "User Management",
    title: "Edit an employee role",
    description:
      "Change an existing employee role and verify permission refresh.",
    preconditions: "An active employee user exists.",
    steps: [
      "Open user detail",
      "Change role",
      "Save",
      "Reauthenticate as the employee",
    ],
    expectedResult:
      "New navigation permissions apply immediately after sign-in.",
    actualResult: "New permissions applied immediately after sign-in.",
    status: "PASS",
    severity: null,
    failureReason: "Permission cache was stale before the fix.",
    bugReference: "PORTAL-491",
    tester: "Andi Pratama",
    testedAt: "Aug 26, 2026 09:42",
    attempts: [
      {
        number: 1,
        status: "FAIL",
        build: "8fa2c91",
        testedAt: "Aug 25, 2026 10:18",
      },
      {
        number: 2,
        status: "PASS",
        build: "8fb13aa",
        testedAt: "Aug 26, 2026 09:42",
      },
    ],
  },
  {
    id: "e8",
    module: "User Management",
    title: "Delete user with active assignments",
    description: "Verify safe handling for users with assigned QA work.",
    preconditions: "User has an active assignment.",
    steps: ["Open user detail", "Select Delete"],
    expectedResult: "Deletion is blocked with reassignment guidance.",
    actualResult: "Assignment service returned 503.",
    status: "BLOCKED",
    severity: null,
    failureReason: "Assignment dependency unavailable in UAT.",
    bugReference: "",
    tester: "Andi Pratama",
    testedAt: "Aug 25, 2026 11:32",
  },
]

function mockExecution(
  execution: Omit<
    MockExecution,
    "actualResult" | "failureReason" | "bugReference" | "testedAt"
  > &
    Partial<
      Pick<
        MockExecution,
        "actualResult" | "failureReason" | "bugReference" | "testedAt"
      >
    >
): MockExecution {
  return {
    actualResult: "",
    failureReason: "",
    bugReference: "",
    testedAt: null,
    ...execution,
  }
}

const crmExecutions: MockExecution[] = [
  mockExecution({
    id: "crm-e1",
    module: "Leads",
    title: "Create a qualified lead",
    description: "Create a lead with complete qualification details.",
    preconditions: "Tester has create access to CRM Leads.",
    steps: [
      "Open Leads",
      "Select New Lead",
      "Complete required fields",
      "Save",
    ],
    expectedResult: "The qualified lead appears in the active pipeline.",
    actualResult: "Lead created and visible in the Qualified view.",
    status: "PASS",
    severity: null,
    tester: "Siti Aisyah",
    testedAt: "Aug 25, 2026 09:15",
  }),
  mockExecution({
    id: "crm-e2",
    module: "Leads",
    title: "Export filtered leads to CSV",
    description: "Ensure CSV export preserves active filters.",
    preconditions: "Qualified leads exist and export permission is granted.",
    steps: ["Filter leads to Qualified", "Select Export CSV", "Open the file"],
    expectedResult: "Only qualified leads are included in the CSV.",
    actualResult: "Archived leads were included in the export.",
    status: "FAIL",
    severity: "MEDIUM",
    failureReason: "Export ignored the archived-state filter.",
    bugReference: "CRM-356",
    tester: "Siti Aisyah",
    testedAt: "Aug 25, 2026 11:05",
    attempts: [
      {
        number: 1,
        status: "FAIL",
        build: "91ac020",
        testedAt: "Aug 24, 2026 15:42",
      },
      {
        number: 2,
        status: "FAIL",
        build: "a829d41",
        testedAt: "Aug 25, 2026 11:05",
      },
    ],
  }),
  mockExecution({
    id: "crm-e3",
    module: "Accounts",
    title: "Link lead to an existing account",
    description: "Associate a converted lead with an existing account.",
    preconditions: "A converted lead and active account exist.",
    steps: [
      "Open converted lead",
      "Select Link Account",
      "Choose account",
      "Confirm",
    ],
    expectedResult: "The account relationship is visible from both records.",
    actualResult: "Relationship created in both views.",
    status: "PASS",
    severity: null,
    tester: "Siti Aisyah",
    testedAt: "Aug 25, 2026 12:10",
  }),
  mockExecution({
    id: "crm-e4",
    module: "Activities",
    title: "Record a customer call",
    description: "Save a call activity against a lead.",
    preconditions: "An active lead exists.",
    steps: ["Open lead", "Add Call activity", "Enter notes", "Save"],
    expectedResult: "The call appears in the activity timeline.",
    status: "SKIPPED",
    severity: null,
    tester: "Siti Aisyah",
    testedAt: "Aug 25, 2026 13:02",
  }),
  mockExecution({
    id: "crm-e5",
    module: "Permissions",
    title: "Restrict lead deletion to managers",
    description: "Verify standard agents cannot delete leads.",
    preconditions: "Tester is signed in as a standard sales agent.",
    steps: ["Open lead actions", "Inspect available destructive actions"],
    expectedResult: "Delete is not available to the standard agent.",
    status: "NOT_TESTED",
    severity: null,
    tester: "Siti Aisyah",
  }),
]

const flowraExecutions: MockExecution[] = [
  mockExecution({
    id: "flowra-e1",
    module: "Opening Account",
    title: "Restore personal data after autosave",
    description: "Resume a saved application without losing personal data.",
    preconditions: "A draft individual account application exists.",
    steps: ["Complete Personal Data", "Wait for autosave", "Reopen the draft"],
    expectedResult: "Saved values are restored at the last completed section.",
    actualResult: "All personal fields restored correctly.",
    status: "PASS",
    severity: null,
    tester: "Budi Santoso",
    testedAt: "Aug 25, 2026 09:40",
  }),
  mockExecution({
    id: "flowra-e2",
    module: "Opening Account",
    title: "Submit a complete individual application",
    description: "Submit the full onboarding workflow for review.",
    preconditions: "All required onboarding sections are complete.",
    steps: ["Review summary", "Accept declarations", "Select Submit"],
    expectedResult:
      "Application enters the review queue with a reference number.",
    actualResult: "Submission returned an incomplete-document error.",
    status: "FAIL",
    severity: "HIGH",
    failureReason:
      "A previously uploaded identity file was not attached to submission.",
    bugReference: "FLOWRA-201",
    tester: "Budi Santoso",
    testedAt: "Aug 25, 2026 16:40",
  }),
  mockExecution({
    id: "flowra-e3",
    module: "Documents",
    title: "Upload identity document",
    description: "Attach a supported identity image to an application.",
    preconditions: "A draft application is open.",
    steps: ["Open Documents", "Choose JPG file", "Confirm upload"],
    expectedResult:
      "The document preview appears with a successful scan status.",
    actualResult: "Preview and scan status displayed.",
    status: "PASS",
    severity: null,
    tester: "Budi Santoso",
    testedAt: "Aug 25, 2026 14:08",
  }),
  mockExecution({
    id: "flowra-e4",
    module: "Risk Review",
    title: "Load suitability questionnaire",
    description: "Open the investor suitability questions.",
    preconditions: "Risk scoring API is available.",
    steps: ["Open Risk Review", "Wait for questionnaire"],
    expectedResult: "Questions load with the current scoring rules.",
    actualResult: "Risk scoring API is unavailable in UAT.",
    status: "BLOCKED",
    severity: null,
    failureReason: "Dependency health check is failing.",
    tester: "Budi Santoso",
    testedAt: "Aug 25, 2026 14:22",
  }),
  mockExecution({
    id: "flowra-e5",
    module: "Notifications",
    title: "Send submission confirmation",
    description: "Notify the applicant after successful submission.",
    preconditions: "A valid application is ready to submit.",
    steps: ["Submit application", "Check registered email"],
    expectedResult: "A confirmation email includes the application reference.",
    status: "NOT_TESTED",
    severity: null,
    tester: "Budi Santoso",
  }),
]

const itqmExecutions: MockExecution[] = [
  mockExecution({
    id: "itqm-e1",
    module: "Development Request",
    title: "Create a development request",
    description: "Submit a complete development request for review.",
    preconditions: "Tester has request creation access.",
    steps: ["Open Requests", "Select New", "Complete fields", "Submit"],
    expectedResult: "The request enters the approval queue.",
    actualResult: "Request submitted successfully.",
    status: "PASS",
    severity: null,
    tester: "Andi Pratama",
    testedAt: "Aug 24, 2026 10:05",
  }),
  mockExecution({
    id: "itqm-e2",
    module: "Development Request",
    title: "Restrict approval to assigned approvers",
    description: "Prevent unassigned users from approving requests.",
    preconditions: "Tester is not an assigned approver.",
    steps: ["Open pending request", "Inspect approval actions"],
    expectedResult: "Approval controls are unavailable.",
    actualResult: "No approval controls rendered.",
    status: "PASS",
    severity: null,
    tester: "Andi Pratama",
    testedAt: "Aug 24, 2026 10:30",
  }),
  mockExecution({
    id: "itqm-e3",
    module: "Reports",
    title: "Export approval history",
    description: "Download the approval audit history.",
    preconditions: "Approved requests exist.",
    steps: ["Open Reports", "Choose Approval History", "Export"],
    expectedResult: "The export includes every approval transition.",
    actualResult: "Export matched the audit history.",
    status: "PASS",
    severity: null,
    tester: "Andi Pratama",
    testedAt: "Aug 24, 2026 11:15",
  }),
  mockExecution({
    id: "itqm-e4",
    module: "Dashboard",
    title: "Display overdue requests",
    description: "Highlight requests beyond their target date.",
    preconditions: "At least one overdue request exists.",
    steps: ["Open dashboard", "Review overdue section"],
    expectedResult: "Overdue requests are clearly identified.",
    actualResult: "All overdue requests displayed.",
    status: "PASS",
    severity: null,
    tester: "Andi Pratama",
    testedAt: "Aug 24, 2026 11:42",
  }),
]

const dailyExecutions: MockExecution[] = [
  mockExecution({
    id: "daily-e1",
    module: "Today Workspace",
    title: "Load assigned daily tasks",
    description: "Show all operational tasks assigned for today.",
    preconditions: "Tester has active task assignments.",
    steps: ["Open Today Workspace", "Review assigned tasks"],
    expectedResult: "All current assignments are visible.",
    actualResult: "Assignments loaded correctly.",
    status: "PASS",
    severity: null,
    tester: "Budi Santoso",
    testedAt: "Aug 25, 2026 08:35",
  }),
  mockExecution({
    id: "daily-e2",
    module: "Today Workspace",
    title: "Prevent incomplete task submission",
    description: "Block submission while required items are incomplete.",
    preconditions: "One required task item is incomplete.",
    steps: ["Leave required item incomplete", "Select Submit"],
    expectedResult: "Submission is blocked with clear guidance.",
    actualResult: "Submission blocked and item highlighted.",
    status: "PASS",
    severity: null,
    tester: "Budi Santoso",
    testedAt: "Aug 25, 2026 09:02",
  }),
  mockExecution({
    id: "daily-e3",
    module: "Approvals",
    title: "Require a rejection comment",
    description: "Prevent approval rejection without a reason.",
    preconditions: "A task is awaiting approval.",
    steps: ["Select Reject", "Leave comment empty", "Confirm"],
    expectedResult: "A rejection comment is required.",
    actualResult: "The task was rejected without a comment.",
    status: "FAIL",
    severity: "MEDIUM",
    failureReason: "The rejection endpoint does not validate the comment.",
    bugReference: "DOPS-144",
    tester: "Budi Santoso",
    testedAt: "Aug 24, 2026 15:02",
    attempts: [
      {
        number: 1,
        status: "FAIL",
        build: "8fa2c91",
        testedAt: "Aug 24, 2026 15:02",
      },
    ],
  }),
  mockExecution({
    id: "daily-e4",
    module: "History",
    title: "Review task activity history",
    description: "Display every task status transition.",
    preconditions: "A task has multiple status changes.",
    steps: ["Open task", "Select History"],
    expectedResult: "Chronological status history is visible.",
    actualResult: "History displayed in chronological order.",
    status: "PASS",
    severity: null,
    tester: "Budi Santoso",
    testedAt: "Aug 25, 2026 11:24",
  }),
  mockExecution({
    id: "daily-e5",
    module: "History",
    title: "Filter history by owner",
    description: "Limit history results to one task owner.",
    preconditions: "History contains tasks from several owners.",
    steps: ["Open History", "Choose owner filter"],
    expectedResult: "Only the selected owner's records remain.",
    status: "NOT_TESTED",
    severity: null,
    tester: "Budi Santoso",
  }),
]

export type MockRunDetail = (typeof testRunSeeds)[number] & {
  progress: number
  passRate: number
  endDate: string
  executions: MockExecution[]
}

export const testRunDetails: MockRunDetail[] = testRunSeeds.map((run) => {
  const executions =
    run.id === "run-portal-regression"
      ? portalExecutions
      : run.id === "run-crm-regression"
        ? crmExecutions
        : run.id === "run-flowra-regression"
          ? flowraExecutions
          : run.id === "run-itqm-smoke"
            ? itqmExecutions
            : dailyExecutions
  const metrics = calculateExecutionMetrics(executions)

  return {
    ...run,
    progress: metrics.coverage,
    passRate: metrics.passRate,
    endDate:
      run.id === "run-daily-regression" ? "Aug 27, 2026" : "Aug 26, 2026",
    executions,
  }
})

export const testRuns = testRunDetails.map((run) => ({
  id: run.id,
  name: run.name,
  application: run.application,
  release: run.release,
  build: run.build,
  environment: run.environment,
  tester: run.tester,
  progress: run.progress,
  passRate: run.passRate,
  status: run.status,
  started: run.started,
}))

const runAliases: Record<string, string> = {
  "run-portal": "run-portal-regression",
  "run-crm": "run-crm-regression",
  "run-flowra": "run-flowra-regression",
  "run-itqm": "run-itqm-smoke",
  "run-daily": "run-daily-regression",
}

export function getTestRunDetail(id: string) {
  const canonicalId = runAliases[id] ?? id
  return testRunDetails.find((run) => run.id === canonicalId)
}

export type MockReportScenarioStatus =
  "PASS" | "FAIL" | "BLOCKED" | "NOT TESTED"

export type MockReportDetail = (typeof reports)[number] & {
  build: string
  period: string
  members: string
  branch: string
  summary: {
    total: number
    executed: number
    passed: number
    failed: number
    blocked: number
    notTested: number
  }
  modules: Array<{
    module: string
    scenarios: Array<[string, MockReportScenarioStatus]>
  }>
  primaryFailure: {
    scenario: string
    feature: string
    bugReference: string
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
    expected: string
    actual: string
    reason: string
    tester: string
  }
  findings: [number, number, number, number]
  unresolved: number
  conclusion: string
  preparedBy: string
  reviewedBy: string
  approvedBy: string
}

const reportModules: Record<string, MockReportDetail["modules"]> = {
  Portal: [
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
      ],
    },
  ],
  CRM: [
    {
      module: "Leads",
      scenarios: [
        ["Create a qualified lead", "PASS"],
        ["Export filtered leads to CSV", "FAIL"],
        ["Convert lead to account", "PASS"],
      ],
    },
    {
      module: "Activities",
      scenarios: [
        ["Record a customer call", "NOT TESTED"],
        ["Filter activities by owner", "BLOCKED"],
      ],
    },
  ],
  Flowra: [
    {
      module: "Opening Account",
      scenarios: [
        ["Restore personal data after autosave", "PASS"],
        ["Submit a complete individual application", "FAIL"],
        ["Upload identity document", "PASS"],
      ],
    },
    {
      module: "Risk Review",
      scenarios: [["Load suitability questionnaire", "BLOCKED"]],
    },
  ],
  ITQM: [
    {
      module: "Development Request",
      scenarios: [
        ["Create a development request", "PASS"],
        ["Restrict approval to assigned approvers", "PASS"],
        ["Export approval history", "PASS"],
        ["Display overdue requests", "PASS"],
      ],
    },
  ],
}

const reportOverrides: Record<
  string,
  Pick<
    MockReportDetail,
    | "build"
    | "period"
    | "members"
    | "branch"
    | "summary"
    | "primaryFailure"
    | "findings"
    | "unresolved"
    | "conclusion"
    | "preparedBy"
    | "reviewedBy"
    | "approvedBy"
  >
> = {
  Portal: {
    build: "a829d41",
    period: "24–26 August 2026",
    members: "Andi Pratama / Budi Santoso",
    branch: "release/1.9",
    summary: {
      total: 148,
      executed: 142,
      passed: 131,
      failed: 7,
      blocked: 4,
      notTested: 6,
    },
    primaryFailure: {
      scenario: "Locked account cannot sign in",
      feature: "Authentication",
      bugReference: "PORTAL-482",
      severity: "HIGH",
      expected:
        "Access is denied and support guidance is shown without creating a session.",
      actual:
        "The dashboard appeared briefly before redirecting to the locked-account screen.",
      reason: "Authorization is evaluated after protected content hydrates.",
      tester: "Andi Pratama · 25 August 2026, 10:26",
    },
    findings: [1, 3, 5, 2],
    unresolved: 8,
    conclusion:
      "Release can proceed after resolution and successful retest of PORTAL-482 and PORTAL-491. Remaining medium and low findings are accepted for v1.9.1.",
    preparedBy: "Andi Pratama",
    reviewedBy: "Siti Aisyah",
    approvedBy: "Rina Mahendra",
  },
  CRM: {
    build: "a829d41",
    period: "24–25 August 2026",
    members: "Siti Aisyah / Dewi Larasati",
    branch: "release/1.9",
    summary: {
      total: 126,
      executed: 106,
      passed: 82,
      failed: 16,
      blocked: 8,
      notTested: 20,
    },
    primaryFailure: {
      scenario: "Export filtered leads to CSV",
      feature: "Leads",
      bugReference: "CRM-356",
      severity: "MEDIUM",
      expected: "The CSV contains only leads matching the active filters.",
      actual: "Archived leads were included in the exported file.",
      reason: "The export query ignored the archived-state filter.",
      tester: "Siti Aisyah · 25 August 2026, 11:05",
    },
    findings: [2, 5, 9, 4],
    unresolved: 15,
    conclusion:
      "CRM v1.9.0 is not ready for release. Lead export and permission failures require fixes and a focused regression pass.",
    preparedBy: "Siti Aisyah",
    reviewedBy: "Andi Pratama",
    approvedBy: "Rina Mahendra",
  },
  Flowra: {
    build: "a829d41",
    period: "23–25 August 2026",
    members: "Budi Santoso / Andi Pratama",
    branch: "release/1.9",
    summary: {
      total: 94,
      executed: 76,
      passed: 64,
      failed: 7,
      blocked: 5,
      notTested: 18,
    },
    primaryFailure: {
      scenario: "Submit a complete individual application",
      feature: "Opening Account",
      bugReference: "FLOWRA-201",
      severity: "HIGH",
      expected: "The application enters review with a reference number.",
      actual: "Submission returned an incomplete-document error.",
      reason:
        "A previously uploaded identity file was omitted from submission.",
      tester: "Budi Santoso · 25 August 2026, 16:40",
    },
    findings: [0, 4, 6, 3],
    unresolved: 9,
    conclusion:
      "Flowra may proceed conditionally after FLOWRA-201 is fixed and the submission path passes retest.",
    preparedBy: "Budi Santoso",
    reviewedBy: "Andi Pratama",
    approvedBy: "Rina Mahendra",
  },
  ITQM: {
    build: "a829d41",
    period: "22–24 August 2026",
    members: "Andi Pratama",
    branch: "release/1.9",
    summary: {
      total: 38,
      executed: 38,
      passed: 37,
      failed: 0,
      blocked: 1,
      notTested: 0,
    },
    primaryFailure: {
      scenario: "Approval dependency availability",
      feature: "Development Request",
      bugReference: "ITQM-88",
      severity: "LOW",
      expected:
        "Approval dependency remains available throughout smoke testing.",
      actual: "One transient timeout was observed and recovered on retry.",
      reason: "UAT dependency restarted during the test window.",
      tester: "Andi Pratama · 24 August 2026, 13:30",
    },
    findings: [0, 0, 0, 1],
    unresolved: 0,
    conclusion:
      "ITQM smoke testing passed. The transient dependency note is accepted and does not block release.",
    preparedBy: "Andi Pratama",
    reviewedBy: "Siti Aisyah",
    approvedBy: "Rina Mahendra",
  },
}

export const reportDetails: MockReportDetail[] = reports.map((report) => ({
  ...report,
  ...reportOverrides[report.application],
  modules: reportModules[report.application],
}))

const reportAliases: Record<string, string> = {
  "report-portal": "QA-PORTAL-2026-0081",
  "report-crm": "QA-CRM-2026-0034",
  "report-flowra": "QA-FLOWRA-2026-0028",
  "report-itqm": "QA-ITQM-2026-0019",
}

export function getReportDetail(id: string) {
  const canonicalId = reportAliases[id] ?? id
  return reportDetails.find((report) => report.id === canonicalId)
}
