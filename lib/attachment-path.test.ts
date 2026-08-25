import { describe, expect, it } from "vitest"

import {
  attachmentAcceptAttribute,
  attachmentAllowedMimeTypes,
  attachmentMaxBytes,
  buildExecutionAttachmentPath,
  sanitizeAttachmentFilename,
} from "@/lib/attachment-path"

describe("attachment path helpers", () => {
  it("sanitizes unsafe filenames for storage paths", () => {
    expect(
      sanitizeAttachmentFilename("../ portal login screenshot ?.png")
    ).toBe("portal-login-screenshot-.png")
    expect(sanitizeAttachmentFilename("   ")).toBe("attachment")
  })

  it("builds paths under the execution id folder", () => {
    const path = buildExecutionAttachmentPath(
      "11111111-1111-4111-8111-111111111111",
      "login proof.png"
    )

    expect(path).toMatch(
      /^11111111-1111-4111-8111-111111111111\/[0-9a-f-]+-login-proof\.png$/
    )
  })

  it("exposes the storage constraints used by the evidence UI", () => {
    expect(attachmentAllowedMimeTypes).toContain("application/pdf")
    expect(attachmentAcceptAttribute).toContain("video/mp4")
    expect(attachmentMaxBytes).toBe(50 * 1024 * 1024)
  })
})
