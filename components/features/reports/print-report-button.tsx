"use client"

import { PrinterIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function PrintReportButton() {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()}>
      <PrinterIcon data-icon="inline-start" />
      Print / Save PDF
    </Button>
  )
}
