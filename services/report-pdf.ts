import "server-only"

import type { MockReportDetail } from "@/lib/data/product-seed"

function escapePdfText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
}

export function buildReportPdf(report: MockReportDetail): Uint8Array {
  const lines = [
    "KB VALBURY SEKURITAS",
    "QA TEST EXECUTION REPORT",
    report.number,
    `Application: ${report.application}`,
    `Release: ${report.release}`,
    `Build: ${report.build}`,
    `Environment: ${report.environment}`,
    `Result: ${report.result}`,
    `Coverage: ${report.summary.total ? ((report.summary.executed / report.summary.total) * 100).toFixed(2) : "0.00"}%`,
    `Pass rate: ${report.summary.executed ? ((report.summary.passed / report.summary.executed) * 100).toFixed(2) : "0.00"}%`,
    `Conclusion: ${report.conclusion}`,
    `Prepared by: ${report.preparedBy}`,
    `Reviewed by: ${report.reviewedBy}`,
    `Approved by: ${report.approvedBy}`,
  ]
  const stream = [
    "BT",
    "/F1 11 Tf",
    "72 760 Td",
    ...lines.flatMap((line, index) => [
      index ? "0 -18 Td" : "",
      `(${escapePdfText(line)}) Tj`,
    ]),
    "ET",
  ]
    .filter(Boolean)
    .join("\n")
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ]
  let pdf = "%PDF-1.4\n"
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets[index + 1] = pdf.length
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n `)
    .join(
      "\n"
    )}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return new TextEncoder().encode(pdf)
}
