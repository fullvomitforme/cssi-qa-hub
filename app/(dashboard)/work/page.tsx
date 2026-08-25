import type { Metadata } from "next"

import { QABoard } from "@/components/features/board/qa-board"

export const metadata: Metadata = { title: "QA Board" }

export default function WorkPage() {
  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-start justify-between gap-4 border-b px-4 py-4 lg:px-6">
        <div>
          <h1 className="text-xl font-semibold">QA Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Move feature-level QA work through testing, fixes, and final
            acceptance.
          </p>
        </div>
      </div>
      <QABoard />
    </main>
  )
}
