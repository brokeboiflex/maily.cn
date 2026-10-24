import type {
  MailyMailboxFolder,
  MailyMailboxLabel,
  MailyMailboxMessageDetail,
} from "@/components/maily/mailbox"

/** The folder and label the mailbox shows, reported by its change callbacks. */
export type PlaygroundMailboxView = {
  folder: MailyMailboxFolder
  labelId: string | null
}

/** The showcase stores a message's location as labels on the message. */
export function folderFor(
  message: MailyMailboxMessageDetail
): MailyMailboxFolder {
  if (message.labels?.includes("Trash")) return "trash"
  if (message.labels?.includes("Spam")) return "spam"
  if (message.labels?.includes("Inbox")) return "inbox"
  if (message.status === "draft") return "drafts"
  if (message.direction === "in") return "allMail"
  return "sent"
}

/** Whether a folder's list shows a message, as listMessages filters it. */
export function inFolder(
  message: MailyMailboxMessageDetail,
  folder: MailyMailboxFolder
): boolean {
  const location = folderFor(message)
  if (folder === "allMail")
    return (
      location !== "spam" && location !== "trash" && message.status !== "draft"
    )
  if (folder === "starred")
    return (
      Boolean(message.isFavorite) && location !== "spam" && location !== "trash"
    )
  return location === folder
}

/**
 * Whether an action moved a message out of the folder or label in view, so the
 * reader closes. A deleted message (undefined) has always left it.
 */
export function messageLeftView(
  message: MailyMailboxMessageDetail | undefined,
  view: PlaygroundMailboxView,
  labels: readonly MailyMailboxLabel[]
): boolean {
  if (!message) return true
  if (!view.labelId) return !inFolder(message, view.folder)
  const label = labels.find((item) => item.id === view.labelId)
  return (
    !label ||
    !(message.labels ?? []).includes(label.name) ||
    !inFolder(message, "allMail")
  )
}
