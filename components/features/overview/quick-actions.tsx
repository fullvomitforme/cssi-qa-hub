import Link from "next/link"
import {
  ClipboardPlusIcon,
  FlaskConicalIcon,
  ListPlusIcon,
  UserPlusIcon,
} from "lucide-react"

const actions = [
  {
    label: "Create New Test Plan",
    href: "/plans?create=true",
    icon: ClipboardPlusIcon,
  },
  {
    label: "Start New Test Run",
    href: "/runs?create=true",
    icon: FlaskConicalIcon,
  },
  {
    label: "Add New Scenario",
    href: "/scenarios?create=true",
    icon: ListPlusIcon,
  },
  {
    label: "Invite QA Member",
    href: "/management/members?invite=true",
    icon: UserPlusIcon,
  },
] as const

export function QuickActions() {
  return (
    <nav aria-label="Quick actions" className="p-2">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="flex h-9 items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-accent"
        >
          <action.icon className="size-4 text-muted-foreground" />
          {action.label}
        </Link>
      ))}
    </nav>
  )
}
