import {
  AppWindowIcon,
  BellRingIcon,
  BugIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  FlaskConicalIcon,
  GaugeIcon,
  LayoutDashboardIcon,
  MessageSquareTextIcon,
  MonitorCogIcon,
  PanelsTopLeftIcon,
  RocketIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

import type { UserRole } from "@/types/qa"

export type NavigationItem = {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
  roles?: readonly UserRole[]
}

type NavigationGroup = {
  label: string | null
  items: readonly NavigationItem[]
}

export const navigation: readonly NavigationGroup[] = [
  {
    label: null,
    items: [{ title: "Overview", href: "/overview", icon: GaugeIcon }],
  },
  {
    label: "Work",
    items: [
      {
        title: "QA Board",
        href: "/work",
        icon: LayoutDashboardIcon,
        badge: "18",
      },
    ],
  },
  {
    label: "Testing",
    items: [
      { title: "Test Plans", href: "/plans", icon: ClipboardListIcon },
      { title: "Test Runs", href: "/runs", icon: FlaskConicalIcon },
      { title: "Test Scenarios", href: "/scenarios", icon: ClipboardCheckIcon },
    ],
  },
  {
    label: "Findings",
    items: [
      { title: "Failures", href: "/findings/failures", icon: BugIcon },
      {
        title: "Feedback",
        href: "/findings/feedback",
        icon: MessageSquareTextIcon,
      },
    ],
  },
  {
    label: "Reports",
    items: [{ title: "Reports", href: "/reports", icon: ScrollTextIcon }],
  },
  {
    label: "Management",
    items: [
      {
        title: "Applications",
        href: "/management/applications",
        icon: AppWindowIcon,
        roles: ["ADMIN", "QA_LEAD"],
      },
      {
        title: "Releases",
        href: "/management/releases",
        icon: RocketIcon,
        roles: ["ADMIN", "QA_LEAD"],
      },
      {
        title: "Environments",
        href: "/management/environments",
        icon: MonitorCogIcon,
        roles: ["ADMIN", "QA_LEAD"],
      },
      {
        title: "QA Members",
        href: "/management/members",
        icon: UsersIcon,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: null,
    items: [{ title: "Settings", href: "/settings", icon: SettingsIcon }],
  },
]

export const commandItems: readonly NavigationItem[] = [
  ...navigation.flatMap((group) => group.items),
  {
    title: "Portal — Login with valid credentials",
    href: "/scenarios/20000000-0000-4000-8000-000000000001",
    icon: ShieldCheckIcon,
  },
  {
    title: "Portal Regression v1.9.0",
    href: "/runs/run-portal-regression",
    icon: PanelsTopLeftIcon,
  },
  { title: "Unread QA notifications", href: "/overview", icon: BellRingIcon },
]

export function getNavigationForRole(
  role: UserRole
): readonly NavigationGroup[] {
  return navigation
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.roles || item.roles.includes(role)
      ),
    }))
    .filter((group) => group.items.length > 0)
}
