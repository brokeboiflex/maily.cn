import { describe, expect, it } from "vitest"
import type { MailyMailboxMessageDetail } from "@/components/maily/mailbox"
import { messageLeftView } from "./mailbox-view"

const message = (labels: string[], extra = {}): MailyMailboxMessageDetail => ({
  id: "message-1",
  direction: "in",
  fromAddress: "sender@example.com",
  toAddresses: ["me@example.com"],
  subject: "Hello",
  status: "sent",
  createdAt: "2026-10-20T09:00:00.000Z",
  labels,
  ...extra,
})
const labels = [{ id: "label-projects", name: "Projects" }]

describe("messageLeftView", () => {
  it("closes the reader when the message leaves the folder in view", () => {
    const archived = message([])
    expect(
      messageLeftView(archived, { folder: "inbox", labelId: null }, labels)
    ).toBe(true)
    // Archive keeps it in All Mail, so the reader stays.
    expect(
      messageLeftView(archived, { folder: "allMail", labelId: null }, labels)
    ).toBe(false)
  })

  it("keeps the reader in a label view while the message keeps the label", () => {
    const view = { folder: "allMail" as const, labelId: "label-projects" }
    expect(messageLeftView(message(["Projects"]), view, labels)).toBe(false)
    expect(messageLeftView(message(["Projects", "Trash"]), view, labels)).toBe(
      true
    )
    expect(messageLeftView(message([]), view, labels)).toBe(true)
  })

  it("treats a deleted message as gone from every view", () => {
    expect(
      messageLeftView(undefined, { folder: "trash", labelId: null }, labels)
    ).toBe(true)
  })
})
