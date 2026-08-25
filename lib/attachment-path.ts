const unsafeFilenamePattern = /[^a-zA-Z0-9._-]+/g

export const attachmentAllowedMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "video/mp4",
] as const

export const attachmentAcceptAttribute = attachmentAllowedMimeTypes.join(",")

export const attachmentMaxBytes = 50 * 1024 * 1024

export function sanitizeAttachmentFilename(filename: string) {
  const trimmed = filename.trim()
  const normalized = trimmed
    .replace(/\\/g, "-")
    .replace(/\//g, "-")
    .replace(unsafeFilenamePattern, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .replace(/\.+$/g, "")
    .replace(/^-+/, "")
    .replace(/-+$/g, "")

  return normalized.length > 0 ? normalized : "attachment"
}

export function buildExecutionAttachmentPath(
  executionId: string,
  filename: string
) {
  return `${executionId}/${crypto.randomUUID()}-${sanitizeAttachmentFilename(filename)}`
}
