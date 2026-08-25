export type UserRole = "ADMIN" | "QA_LEAD" | "QA_TESTER"

export type Priority = "P0" | "P1" | "P2" | "P3"

export type TestType =
  | "HAPPY_PATH"
  | "VALIDATION"
  | "NEGATIVE"
  | "PERMISSION"
  | "EDGE_CASE"
  | "INTEGRATION"
  | "REGRESSION"
  | "RESPONSIVE"
  | "ACCESSIBILITY"
  | "PERFORMANCE"

export type ExecutionStatus =
  "NOT_TESTED" | "PASS" | "FAIL" | "BLOCKED" | "SKIPPED"

export interface CurrentProfile {
  id: string
  fullName: string
  email: string
  role: UserRole
  isActive: boolean
  avatarUrl: string | null
}

export interface ManagementApplicationItem {
  name: string
  slug: string
  owner: string
  modules: number
  features: number
  scenarios: number
  coverage: number
  status: "ACTIVE" | "INACTIVE"
}

export interface ManagementReleaseItem {
  application: string
  version: string
  build: string
  branch: string
  commit: string
  date: string
  environment: string
  status:
    "PLANNED" | "TESTING" | "QA_APPROVED" | "REJECTED" | "RELEASED" | "ARCHIVED"
}

export interface ManagementEnvironmentItem {
  name: string
  key: string
  url: string
  applications: number
  status: "AVAILABLE" | "MAINTENANCE" | "RESTRICTED"
  lastChecked: string
}

export interface ScenarioSummary {
  id: string
  application: string
  applicationSlug: string
  module: string
  feature: string
  title: string
  description: string
  priority: Priority
  type: TestType
  tags: string[]
  stepCount: number
  updatedAt: string
}

export interface ScenarioStep {
  id?: string
  position: number
  instruction: string
  expectedResult?: string
}

export interface ScenarioDetail extends ScenarioSummary {
  applicationId?: string
  moduleId?: string
  moduleSlug?: string
  featureId?: string
  featureSlug?: string
  preconditions: string
  steps: ScenarioStep[]
  expectedResult: string
  createdBy: string
  updatedBy: string
  createdAt: string
}

export interface ScenarioQuery {
  search?: string
  application?: string
  module?: string
  feature?: string
  type?: TestType
  priority?: Priority
  updated?: "3d" | "7d" | "30d"
  page: number
  pageSize: number
}

export interface ScenarioPage {
  items: ScenarioSummary[]
  total: number
  page: number
  pageSize: number
}

export interface ScenarioApplicationOption {
  id: string
  name: string
  slug: string
}

export interface ScenarioModuleOption {
  id: string
  applicationId: string
  applicationSlug: string
  name: string
  slug: string
}

export interface ScenarioFeatureOption {
  id: string
  applicationId: string
  applicationSlug: string
  moduleId: string
  moduleSlug: string
  name: string
  slug: string
}

export interface ScenarioHierarchy {
  applications: ScenarioApplicationOption[]
  modules: ScenarioModuleOption[]
  features: ScenarioFeatureOption[]
}

export interface ScenarioFormValues {
  applicationId: string
  moduleId: string
  featureId: string
  title: string
  description: string
  preconditions: string
  type: TestType
  priority: Priority
  expectedResult: string
  steps: Array<{
    id?: string
    instruction: string
    expectedResult: string
  }>
  tags: string[]
}

export type PlanStatus = "DRAFT" | "READY" | "ACTIVE" | "COMPLETED" | "ARCHIVED"

export interface PlanSummary {
  id: string
  name: string
  application: string
  applicationSlug: string
  release: string
  environment: string
  owner: string
  scenarioCount: number
  progress: number | null
  status: PlanStatus
  targetDate: string | null
}

export interface PlanScenarioItem {
  id: string
  scenarioId: string
  title: string
  application: string
  module: string
  feature: string
  priority: Priority
  type: TestType
  position: number
}

export interface PlanAssignment {
  profileId: string
  fullName: string
  email: string
  role: UserRole
  assignedAt: string
}

export interface PlanDetail extends PlanSummary {
  applicationId: string
  releaseId: string
  environmentId: string
  ownerId: string
  description: string
  startDate: string | null
  targetCompletion: string | null
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  scenarios: PlanScenarioItem[]
  assignments: PlanAssignment[]
}

export interface PlanQuery {
  search?: string
  status?: PlanStatus
}

export interface PlanReferenceOption {
  id: string
  name: string
  slug?: string
}

export interface PlanReleaseOption {
  id: string
  applicationId: string
  environmentId: string
  version: string
  build: string | null
  status: ManagementReleaseItem["status"]
}

export interface PlanProfileOption {
  id: string
  fullName: string
  email: string
  role: UserRole
}

export interface PlanReferences {
  applications: PlanReferenceOption[]
  environments: PlanReferenceOption[]
  releases: PlanReleaseOption[]
  ownerOptions: PlanProfileOption[]
  assigneeOptions: PlanProfileOption[]
}

export interface PlanFormValues {
  name: string
  applicationId: string
  releaseId: string
  environmentId: string
  ownerId: string
  description: string
  startDate: string
  targetCompletion: string
  status: PlanStatus
  scenarioIds: string[]
  assignmentProfileIds: string[]
}

export interface PlanScenarioQuery {
  applicationId?: string
  module?: string
  feature?: string
  priority?: Priority
  search?: string
  type?: TestType
}

export interface OverviewMetric {
  label: string
  value: number
  context: string
  tone: "default" | "success" | "destructive" | "warning" | "neutral"
}

export interface ApplicationProgress {
  application: string
  slug: string
  coverage: number
  passRate: number
  failed: number
  blocked: number
  notTested: number
}

export interface StatusDistributionItem {
  status: Exclude<ExecutionStatus, "NOT_TESTED">
  count: number
  percentage: number
}

export interface TrendPoint {
  date: string
  passed: number
  failed: number
  blocked: number
}

export interface RecentRun {
  id: string
  name: string
  environment: string
  build: string
  status: "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED"
  progress: number
}

export interface TopFailure {
  id: string
  scenario: string
  application: string
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  bugReference: string
  foundBy: string
  foundAt: string
}

export interface OverviewData {
  metrics: OverviewMetric[]
  applications: ApplicationProgress[]
  distribution: StatusDistributionItem[]
  trend: TrendPoint[]
  recentRuns: RecentRun[]
  topFailures: TopFailure[]
}
