import type { Metadata } from "next"
import { FeedbackWorkspace } from "@/components/features/findings/feedback-workspace"

export const metadata: Metadata = { title: "Feedback" }
export default function FeedbackPage() {
  return (
    <main className="min-w-0">
      <div className="border-b px-4 py-4 lg:px-6">
        <h1 className="text-xl font-semibold">Feedback</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Capture bugs, UX notes, copy changes, questions, and improvements
          independently from execution status.
        </p>
      </div>
      <FeedbackWorkspace />
    </main>
  )
}
