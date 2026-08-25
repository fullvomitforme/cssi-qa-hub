"use client"

import { DownloadIcon, PrinterIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function PrintReportButton({ pdfUrl }: { pdfUrl?: string | null }) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <PrinterIcon data-icon="inline-start" />
        Print / Save PDF
      </Button>
      {pdfUrl ? (
        <Button
          variant="outline"
          size="sm"
          render={<a href={pdfUrl} download />}
        >
          <DownloadIcon data-icon="inline-start" />
          Download PDF
        </Button>
      ) : null}
    </div>
  )
}
