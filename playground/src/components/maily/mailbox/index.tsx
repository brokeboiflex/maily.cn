"use client"
import * as React from "react"
import { useControllableState } from "./use-controllable-state"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Field, FieldLabel, FieldSet } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Editor, type EditorProps } from "../editor"
import {
  ToggleGroupCompat,
  ToggleGroupCompatItem,
} from "../editor/components/ui/toggle-group-compat"
import { cn } from "@/lib/utils"

import {
  filterMailboxContactSuggestions,
  type MailyMailboxContactSuggestion,
} from "./contacts"
import { getMailboxReplyAllRecipients } from "./reply-all"
import {
  clearPendingSendReceipt,
  readPendingSendReceipts,
  retainPendingSendReceipt,
} from "./send-recovery"
import { buildMailboxSearchQuery, type MailyMailboxSearchQuery } from "./search"
export type { MailyMailboxSearchQuery } from "./search"
import { groupMailboxMessagesByThread } from "./conversations"
import {
  Archive,
  Inbox,
  MailOpen,
  Trash2,
  Star,
  Ban,
  ShieldAlert,
  Flag,
  Filter,
  Languages,
  Printer,
  Download,
  CodeIcon,
  AlertCircle,
  Smile,
  Send,
  FileText,
  ArrowLeft,
  Pencil,
  Plus,
  Tag,
  MoreVertical,
  Menu,
  X,
  Search,
  LoaderCircleIcon,
  RotateCwIcon,
  ChevronRight,
  Paperclip,
  ExternalLink,
  Reply,
  ReplyAll,
  Forward,
} from "lucide-react"

export {
  filterMailboxContactSuggestions,
  type MailyMailboxContactSuggestion,
} from "./contacts"

export type MailyMailboxFolder =
  | "inbox"
  | "sent"
  | "drafts"
  | "bounced"
  | "spam"
  | "trash"
  | "allMail"
  | "starred"

export type MailyMailboxLabel = { id: string; name: string }

export type MailyMailboxMessageStatus =
  | "draft"
  | "queued"
  | "sent"
  | "failed"
  | "dsn"

export type MailyMailboxAccount = {
  id?: string
  address?: string
  displayName?: string | null
}

export type MailyMailboxMessageRow = {
  _revision?: string
  id: string
  direction: "in" | "out"
  fromAddress: string
  toAddresses: string[]
  subject: string | null
  snippet?: string | null
  status: MailyMailboxMessageStatus
  hasAttachments?: boolean
  isFavorite?: boolean
  isUnread?: boolean
  labels?: string[]
  threadId?: string
  createdAt: string | Date
}

export type MailyMailboxAttachment = {
  id?: string
  filename: string
  contentType?: string
  size?: number
}

export type MailyMailboxAttachmentDownloadInput = {
  messageId: string
  attachment: MailyMailboxAttachment
  /** Position in getMessage().attachments; filenames need not be unique. */
  attachmentIndex: number
}

export type MailyMailboxEvent = {
  id: string
  type: string
  detail?: unknown
  createdAt: string | Date
}

export type MailyMailboxMessageDetail = MailyMailboxMessageRow & {
  ccAddresses?: string[] | null
  bccAddresses?: string[] | null
  messageId?: string | null
  inReplyTo?: string | null
  headers?: Record<string, string> | null
  bodyText?: string | null
  bodyHtml?: string | null
  attachments?: MailyMailboxAttachment[]
  lastError?: string | null
  events?: MailyMailboxEvent[]
}

export type MailyMailboxMessageList = {
  items: MailyMailboxMessageRow[]
  nextCursor?: string | null
  /** Total rows matching the current folder and search, when the host knows it. */
  total?: number
}

export type MailyMailboxCounts = Record<MailyMailboxFolder, number>

export type MailyMailboxDraftInput = {
  /** Revision observed with the editable draft, forwarded by the host as If-Match. */
  revision?: string
  to: string[]
  cc: string[]
  bcc: string[]
  subject: string | null
  text: string | null
  html?: string | null
  inReplyTo?: string | null
  attachments?: MailyMailboxUploadedAttachment[]
}

export type MailyMailboxUploadedAttachment = {
  id: string
  filename: string
  contentType?: string
  size?: number
}

export type MailyMailboxThread = {
  threadId: string
  messages: MailyMailboxMessageDetail[]
}

export type MailyMailboxComposeValues = {
  to: string
  cc: string
  bcc: string
  subject: string
  text: string
  html?: string | null
  attachments?: MailyMailboxUploadedAttachment[]
}

export type MailyMailboxComposeBodyMode = "plainText" | "mailyEditor"

type MaybePromise<T> = T | Promise<T>

export type MailyMailboxMessageAction =
  | "archive"
  | "delete"
  | "restore"
  | "notSpam"
  | "deleteForever"
  | "favorite"
  | "markUnread"
  | "markRead"
  | "blockSender"
  | "reportSpam"
  | "reportPhishing"
  | "reportIllegal"
  | "filterSimilar"
  | "translate"
  | "print"
  | "download"
  | "showOriginal"
  | "feedback"
  | "react"

export type MailyMailboxMessageActionInput = {
  messageId: string
  action: MailyMailboxMessageAction
  value?: string | boolean | null
}

export type MailyMailboxMessageActionResult =
  | void
  | { id?: string }
  | { undo?: { token: string; expiresAt?: string | number | Date } }
  | MailyMailboxMessageDetail

export type MailyMailboxMessageActionEvent = MailyMailboxMessageActionInput & {
  message: MailyMailboxMessageDetail
}

export type MailyMailboxDataSource = {
  listMessages: (params: {
    folder: MailyMailboxFolder
    q?: string
    search?: MailyMailboxSearchQuery
    cursor?: string
    limit?: number
    labelId?: string
  }) => MaybePromise<MailyMailboxMessageList>
  getMessage: (messageId: string) => MaybePromise<MailyMailboxMessageDetail>
  getThread?: (threadId: string) => MaybePromise<MailyMailboxThread>
  /** Return the archived RFC822 source as text; never reconstruct it from the DTO. */
  getMessageSource?: (messageId: string) => MaybePromise<string>
  /** Fetch and save the file using host storage/authentication. */
  downloadAttachment?: (
    input: MailyMailboxAttachmentDownloadInput
  ) => MaybePromise<void>
  getCounts?: () => MaybePromise<Partial<MailyMailboxCounts>>
  listLabels?: () => MaybePromise<MailyMailboxLabel[]>
  createLabel?: (name: string) => MaybePromise<MailyMailboxLabel>
  renameLabel?: (
    labelId: string,
    name: string
  ) => MaybePromise<MailyMailboxLabel>
  deleteLabel?: (labelId: string) => MaybePromise<void>
  applyLabel?: (messageIds: string[], labelId: string) => MaybePromise<void>
  removeLabel?: (messageIds: string[], labelId: string) => MaybePromise<void>
  runBulkMessageAction?: (input: {
    messageIds: string[]
    action: MailyMailboxMessageAction
    value?: string | boolean | null
  }) => MaybePromise<MailyMailboxMessageActionResult>
  undoMessageAction?: (token: string) => MaybePromise<void>
  uploadAttachment?: (
    file: File
  ) => MaybePromise<MailyMailboxUploadedAttachment>
  discardUploadedAttachment?: (
    attachment: MailyMailboxUploadedAttachment
  ) => MaybePromise<void>
  listContactSuggestions?: (params: {
    q?: string
    limit?: number
  }) => MaybePromise<MailyMailboxContactSuggestion[]>
  createDraft: (
    draft: MailyMailboxDraftInput
  ) => MaybePromise<
    { id: string; _revision?: string } | MailyMailboxMessageDetail
  >
  updateDraft: (
    messageId: string,
    draft: MailyMailboxDraftInput
  ) => MaybePromise<
    { id: string; _revision?: string } | MailyMailboxMessageDetail
  >
  discardDraft: (messageId: string) => MaybePromise<void | { id: string }>
  sendDraft: (messageId: string) => MaybePromise<void | {
    id?: string
    messageId?: string
    status?: string
  }>
  runMessageAction?: (
    input: MailyMailboxMessageActionInput
  ) => MaybePromise<MailyMailboxMessageActionResult>
}

export const defaultMailboxLabels = {
  "compose.new": "Compose",
  "compose.editDraft": "Edit draft",
  "compose.discard": "Discard",
  "compose.saveDraft": "Save draft",
  "compose.send": "Send",
  "compose.saved": "Draft saved.",
  "compose.sent": "Message sent.",
  "compose.discarded": "Draft discarded.",
  "compose.wrote": "On {date}, {sender} wrote:",
  "compose.forwardedHeader": "Forwarded message",
  "compose.mode.plainText": "Plain text",
  "compose.mode.mailyEditor": "Visual editor",
  "folders.inbox": "Inbox",
  "folders.allMail": "All Mail",
  "folders.starred": "Starred",
  "folders.sent": "Sent",
  "folders.drafts": "Drafts",
  "folders.bounced": "Failed delivery",
  "folders.spam": "Spam",
  "folders.trash": "Trash",
  "actions.reply": "Reply",
  "actions.replyAll": "Reply all",
  "actions.forward": "Forward",
  "actions.more": "More",
  "actions.favorite": "Add star",
  "actions.unfavorite": "Remove star",
  "actions.react": "Add reaction",
  "actions.archive": "Archive",
  "actions.reportSpam": "Report spam",
  "actions.delete": "Delete",
  "actions.restore": "Move to Inbox",
  "actions.notSpam": "Not spam",
  "actions.deleteForever": "Delete forever",
  "actions.markUnread": "Mark as unread",
  "actions.markRead": "Mark as read",
  "actions.selectAll": "Select all on this page",
  "actions.clearSelection": "Clear selection",
  "actions.cancel": "Cancel",
  "actions.selectConversation": "Select conversation: {subject}",
  "actions.deselectConversation": "Deselect conversation: {subject}",
  "actions.moveToInbox": "Move to Inbox",
  "actions.applyLabel": "Apply label",
  "actions.createLabel": "Create label",
  "labels.heading": "Labels",
  "labels.name": "Label name",
  "labels.description": "Organize your messages with a label.",
  "search.clear": "Clear search",
  "search.submit": "Search",
  "selection.count": "{count} selected",
  "actions.renameLabel": "Rename label",
  "actions.deleteLabel": "Delete label",
  "actions.removeLabel": "Remove label",
  "actions.loadMore": "Load more",
  "pagination.previous": "Newer",
  "pagination.next": "Older",
  "pagination.range": "{start}–{end}",
  "pagination.rangeWithTotal": "{start}–{end} of {total}",
  "actions.undo": "Undo",
  "actions.completed": "Action completed",
  "search.from": "From",
  "search.to": "To",
  "search.subject": "Subject",
  "search.after": "After (YYYY/MM/DD)",
  "search.before": "Before (YYYY/MM/DD)",
  "search.hasAttachments": "Has attachments",
  "search.unread": "Unread",
  "search.global": "Search all mail",
  "search.advanced": "Advanced search",
  "actions.confirm": "Confirm",
  "compose.attach": "Attach files",
  "compose.removeAttachment": "Remove {filename}",
  "compose.stay": "Keep editing",
  "compose.autosaved": "Saved automatically",
  "compose.saving": "Saving…",
  "compose.saveError": "Could not save changes. Your edits are still here.",
  "compose.unsavedConfirm": "Discard unsaved changes?",
  "compose.attachmentUploadError": "Could not upload {filename}. Try again.",
  "thread.messages": "{count} messages in this conversation",
  "actions.blockSender": "Block sender",
  "actions.reportPhishing": "Report phishing",
  "actions.reportIllegal": "Report illegal content",
  "actions.filterSimilar": "Filter messages like this",
  "actions.translate": "Translate",
  "actions.print": "Print",
  "actions.download": "Download message",
  "actions.showOriginal": "Show original",
  "navigation.menu": "Main menu",
  "navigation.close": "Close menu",
  "navigation.back": "Back to list",
  "source.back": "Back to message",
  "source.retry": "Retry",
  "source.error":
    "The original message could not be loaded. It may no longer be available.",
  "actions.feedback": "Share feedback",
  "actions.openExternal": "Open in new window",
  searchPlaceholder: "Search mail",
  refresh: "Refresh",
  loading: "Loading",
  "empty.noSelection": "Select a message",
  "empty.noSelectionDesc": "Choose a message or start a new draft.",
  "empty.inbox": "No messages in the inbox.",
  "empty.allMail": "No messages in All Mail.",
  "empty.starred": "No starred messages.",
  "empty.sent": "No sent messages yet.",
  "empty.drafts": "No drafts yet.",
  "empty.bounced": "No bounced messages.",
  "empty.spam": "No spam messages.",
  "empty.trash": "No messages in Trash.",
  "message.unknownSender": "Unknown sender",
  "message.noSubject": "(no subject)",
  "message.noBody": "No message body.",
  "message.toPrefix": "to",
  "message.cc": "cc",
  "message.bcc": "bcc",
  "message.to": "To",
  "contacts.recipientPlaceholder": "name@example.com, other@example.com",
  "contacts.noSuggestions": "No contacts found.",
  "message.subject": "Subject",
  "message.body": "Body",
  "message.bounced": "Bounced",
  "message.queued": "Queued",
  "message.attachments": "Attachments ({count})",
  "attachment.download": "Download {filename}",
  "attachment.downloading": "Downloading {filename}",
  "attachment.sizeBytes": "{size} B",
  "attachment.sizeKB": "{size} KB",
  "attachment.sizeMB": "{size} MB",
  "attachment.sizeGB": "{size} GB",
  "attachment.sizeTB": "{size} TB",
  "errors.attachmentDownload": "Could not download {filename}. Try again.",
  "errors.refresh": "Could not refresh the mailbox.",
  "errors.detail": "Could not load the message.",
  "errors.saveDraft": "Could not save the draft.",
  "errors.send": "Could not send the message.",
  "errors.discard": "Could not discard the draft.",
  "errors.messageAction": "Could not update the message.",
} as const

export type MailyMailboxLabelKey = keyof typeof defaultMailboxLabels
export type MailyMailboxLabels = Record<MailyMailboxLabelKey, string>

export type MailyMailboxViewProps = {
  account?: MailyMailboxAccount
  /** Opaque actor/account identity for pending-send recovery and UI lifetime. */
  recoveryScope?: string
  dataSource: MailyMailboxDataSource
  messageActions?: readonly MailyMailboxMessageAction[]
  labels?: MailyMailboxLabels
  className?: string
  initialFolder?: MailyMailboxFolder
  /** Controlled navigation values are authoritative; callbacks request changes. */
  folder?: MailyMailboxFolder
  onFolderChange?: (folder: MailyMailboxFolder) => void
  search?: string
  defaultSearch?: string
  onSearchChange?: (search: string) => void
  searchFilters?: Omit<MailyMailboxSearchQuery, "text">
  defaultSearchFilters?: Omit<MailyMailboxSearchQuery, "text">
  onSearchFiltersChange?: (
    filters: Omit<MailyMailboxSearchQuery, "text">
  ) => void
  searchScope?: "folder" | "allMail"
  defaultSearchScope?: "folder" | "allMail"
  onSearchScopeChange?: (scope: "folder" | "allMail") => void
  selectedLabelId?: string | null
  defaultSelectedLabelId?: string | null
  onSelectedLabelIdChange?: (id: string | null) => void
  selectedMessageId?: string | null
  defaultSelectedMessageId?: string | null
  onSelectedMessageIdChange?: (id: string | null) => void
  selectedMessageIds?: string[]
  defaultSelectedMessageIds?: string[]
  onSelectedMessageIdsChange?: (ids: string[]) => void

  markReadOnOpen?: boolean
  pollIntervalMs?: number
  pageSize?: number
  contactSuggestions?: MailyMailboxContactSuggestion[]
  contactSuggestionLimit?: number
  defaultComposeBodyMode?: MailyMailboxComposeBodyMode
  allowComposeBodyModeSwitch?: boolean
  composeEditorProps?: Omit<
    EditorProps,
    "contentHtml" | "contentJson" | "onCreate" | "onUpdate"
  >
  onError?: (error: unknown, action: string) => void
  onSent?: (result: unknown) => void
  onDraftSaved?: (messageId: string) => void
  onMessageAction?: (event: MailyMailboxMessageActionEvent) => void
  formatDate?: (date: string | Date, mode: "short" | "long") => string
}

const FOLDERS: MailyMailboxFolder[] = [
  "inbox",
  "starred",
  "sent",
  "drafts",
  "allMail",
  "spam",
  "trash",
]

const DEFAULT_POLL_INTERVAL_MS = 60_000
const DEFAULT_PAGE_SIZE = 50
const DEFAULT_CONTACT_SUGGESTION_LIMIT = 8
const DEFAULT_MESSAGE_ACTIONS: readonly MailyMailboxMessageAction[] = []

const TOOLBAR_LEADING_MESSAGE_ACTIONS = [
  "restore",
  "notSpam",
  "deleteForever",
  "archive",
  "reportSpam",
  "delete",
  "markUnread",
  "markRead",
] as const satisfies readonly MailyMailboxMessageAction[]

const TOOLBAR_TRAILING_MESSAGE_ACTIONS = [
  "print",
  "showOriginal",
] as const satisfies readonly MailyMailboxMessageAction[]

const HEADER_MESSAGE_ACTIONS = [
  "favorite",
  "react",
] as const satisfies readonly MailyMailboxMessageAction[]

type MessageActionMetadata = {
  label: MailyMailboxLabelKey
  toolbarLabel?: MailyMailboxLabelKey
  icon: (className: string) => React.ReactNode
  value?: string | boolean | null
  variant?: "default" | "destructive"
}

const MESSAGE_ACTION_METADATA: Record<
  MailyMailboxMessageAction,
  MessageActionMetadata
> = {
  archive: {
    label: "actions.archive",
    icon: (className) => <Archive className={className} />,
  },
  restore: {
    label: "actions.restore",
    icon: (className) => <Inbox className={className} />,
  },
  notSpam: {
    label: "actions.notSpam",
    icon: (className) => <MailOpen className={className} />,
  },
  deleteForever: {
    label: "actions.deleteForever",
    icon: (className) => <Trash2 className={className} />,
    variant: "destructive",
  },
  delete: {
    label: "actions.delete",
    icon: (className) => <Trash2 className={className} />,
    variant: "destructive",
  },
  favorite: {
    label: "actions.favorite",
    icon: (className) => <Star className={className} />,
  },
  markUnread: {
    label: "actions.markUnread",
    icon: (className) => <MailOpen className={className} />,
    value: true,
  },
  markRead: {
    label: "actions.markRead",
    icon: (className) => <MailOpen className={className} />,
    value: true,
  },
  blockSender: {
    label: "actions.blockSender",
    icon: (className) => <Ban className={className} />,
  },
  reportSpam: {
    label: "actions.reportSpam",
    icon: (className) => <ShieldAlert className={className} />,
  },
  reportPhishing: {
    label: "actions.reportPhishing",
    icon: (className) => <Flag className={className} />,
  },
  reportIllegal: {
    label: "actions.reportIllegal",
    icon: (className) => <Flag className={className} />,
  },
  filterSimilar: {
    label: "actions.filterSimilar",
    icon: (className) => <Filter className={className} />,
  },
  translate: {
    label: "actions.translate",
    icon: (className) => <Languages className={className} />,
  },
  print: {
    label: "actions.print",
    icon: (className) => <Printer className={className} />,
  },
  download: {
    label: "actions.download",
    icon: (className) => <Download className={className} />,
  },
  showOriginal: {
    label: "actions.showOriginal",
    toolbarLabel: "actions.openExternal",
    icon: (className) => <CodeIcon className={className} />,
  },
  feedback: {
    label: "actions.feedback",
    icon: (className) => <AlertCircle className={className} />,
  },
  react: {
    label: "actions.react",
    icon: (className) => <Smile className={className} />,
    value: "smile",
  },
}

function emptyCounts(): MailyMailboxCounts {
  return {
    inbox: 0,
    allMail: 0,
    starred: 0,
    sent: 0,
    drafts: 0,
    bounced: 0,
    spam: 0,
    trash: 0,
  }
}

function emptyComposeValues(): MailyMailboxComposeValues {
  return {
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    text: "",
    html: null,
  }
}

function detailToComposeValues(
  detail: MailyMailboxMessageDetail
): MailyMailboxComposeValues {
  return {
    to: (detail.toAddresses ?? []).join(", "),
    cc: (detail.ccAddresses ?? []).join(", "),
    bcc: (detail.bccAddresses ?? []).join(", "),
    subject: detail.subject ?? "",
    text: detail.bodyText ?? "",
    html: detail.bodyHtml ?? null,
    attachments:
      detail.attachments?.flatMap((attachment) =>
        attachment.id
          ? [
              {
                id: attachment.id,
                filename: attachment.filename,
                contentType: attachment.contentType,
                size: attachment.size,
              },
            ]
          : []
      ) ?? [],
  }
}

function parseAddresses(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export function composeValuesToMailboxDraft(
  values: MailyMailboxComposeValues,
  inReplyTo?: string | null
): MailyMailboxDraftInput {
  return {
    to: parseAddresses(values.to),
    cc: parseAddresses(values.cc),
    bcc: parseAddresses(values.bcc),
    subject: values.subject.trim() || null,
    text: values.text.length > 0 ? values.text : null,
    html: values.html?.trim() ? values.html : null,
    inReplyTo: inReplyTo ?? null,
    attachments: values.attachments?.map((attachment) => ({ ...attachment })),
  }
}

function formatRecipients(addrs: string[] | null | undefined): string {
  return (addrs ?? []).join(", ")
}

function defaultFormatDate(
  date: string | Date,
  mode: "short" | "long"
): string {
  const value = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(value.getTime())) return ""

  if (mode === "short") {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(value)
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}

function subjectWithPrefix(prefix: "Re:" | "Fwd:", subject: string | null) {
  const clean = subject?.trim() || ""
  if (!clean) return prefix
  return clean.toLowerCase().startsWith(prefix.toLowerCase())
    ? clean
    : `${prefix} ${clean}`
}

function quotedBody(text: string | null | undefined) {
  return (text ?? "")
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n")
}

function createReplyComposeValues(
  detail: MailyMailboxMessageDetail,
  intro: string
): MailyMailboxComposeValues {
  return {
    to: detail.fromAddress,
    cc: "",
    bcc: "",
    subject: subjectWithPrefix("Re:", detail.subject),
    text: `\n\n${intro}\n${quotedBody(detail.bodyText)}`,
    html: null,
  }
}

function createReplyAllComposeValues(
  detail: MailyMailboxMessageDetail,
  intro: string,
  ownAddresses: readonly (string | null | undefined)[]
): MailyMailboxComposeValues {
  const recipients = getMailboxReplyAllRecipients(detail, ownAddresses)
  return {
    ...createReplyComposeValues(detail, intro),
    to: recipients.to.join(", "),
    cc: recipients.cc.join(", "),
  }
}

function createForwardComposeValues(
  detail: MailyMailboxMessageDetail,
  header: string
): MailyMailboxComposeValues {
  const recipients = formatRecipients(detail.toAddresses)
  return {
    to: "",
    cc: "",
    bcc: "",
    subject: subjectWithPrefix("Fwd:", detail.subject),
    text: `\n\n---------- ${header} ----------\nFrom: ${detail.fromAddress}\nTo: ${recipients}\nSubject: ${detail.subject ?? ""}\n\n${detail.bodyText ?? ""}`,
    html: null,
  }
}

function senderInitial(addr: string): string {
  return (addr.trim()[0] ?? "?").toUpperCase()
}

function interpolate(label: string, vars?: Record<string, string | number>) {
  if (!vars) return label
  return label.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] === undefined ? `{${key}}` : String(vars[key])
  )
}

function folderIcon(folder: MailyMailboxFolder, className: string) {
  switch (folder) {
    case "inbox":
      return <Inbox className={className} />
    case "allMail":
      return <Archive className={className} />
    case "starred":
      return <Star className={className} />
    case "sent":
      return <Send className={className} />
    case "drafts":
      return <FileText className={className} />
    case "spam":
      return <ShieldAlert className={className} />
    case "trash":
      return <Trash2 className={className} />
    case "bounced":
      return <AlertCircle className={className} />
  }
}

function errorLabelForAction(action: string): MailyMailboxLabelKey {
  switch (action) {
    case "detail":
      return "errors.detail"
    case "saveDraft":
      return "errors.saveDraft"
    case "sendDraft":
      return "errors.send"
    case "discardDraft":
      return "errors.discard"
    case "messageAction":
      return "errors.messageAction"
    default:
      return "errors.refresh"
  }
}

export function MailboxView(props: MailyMailboxViewProps) {
  return (
    <TooltipProvider>
      <MailboxSession
        key={props.recoveryScope ?? props.account?.id ?? "mailbox"}
        {...props}
      />
    </TooltipProvider>
  )
}

function MailboxSession(props: MailyMailboxViewProps) {
  const {
    dataSource,
    messageActions = DEFAULT_MESSAGE_ACTIONS,
    labels = defaultMailboxLabels,
    className,
    initialFolder = "inbox",
    markReadOnOpen = false,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    pageSize = DEFAULT_PAGE_SIZE,
    contactSuggestions = [],
    contactSuggestionLimit = DEFAULT_CONTACT_SUGGESTION_LIMIT,
    defaultComposeBodyMode = "plainText",
    allowComposeBodyModeSwitch = true,
    composeEditorProps,
    onError,
    onSent,
    onDraftSaved,
    onMessageAction,
    formatDate = defaultFormatDate,
  } = props

  const lifetime = React.useMemo(
    () => ({ active: true, epoch: 0 }),
    [dataSource]
  )
  React.useLayoutEffect(() => {
    lifetime.active = true
    return () => {
      lifetime.active = false
      lifetime.epoch += 1
    }
  }, [lifetime])
  const previousDataSource = React.useRef(dataSource)
  React.useLayoutEffect(() => {
    if (previousDataSource.current !== dataSource) {
      previousDataSource.current = dataSource
      if (props.selectedMessageId === undefined) setSelectedId(null)
      if (props.selectedMessageIds === undefined) setSelectedIds([])
      composeDraftRef.current = null
      composeRevision.current = undefined
      setComposeDraftId(null)
      setComposeSeed(null)
      setComposeInReplyTo(null)
      setSendUnresolved(false)
      setLabelForm(null)
      setSaving(false)
      setSending(false)
      setDiscarding(false)
      setLoadingMore(false)
      setMessageActionPending(null)
      setRefreshing(false)
    }
    setComposeOpen(false)
    composeDirty.current = false
    composeOwned.current = false
    setUndoReceipt(null)
    setMailboxLabels([])
    setThread(null)
    pendingFolderRequest.current = null
    pendingReaderRequest.current = null
    pendingBackRequest.current = false
  }, [dataSource])
  const captureLifetime = React.useCallback(() => {
    const epoch = lifetime.epoch
    return () => lifetime.active && lifetime.epoch === epoch
  }, [lifetime])

  const t = React.useCallback(
    (key: MailyMailboxLabelKey, vars?: Record<string, string | number>) =>
      interpolate(labels[key], vars),
    [labels]
  )
  const enabledMessageActions = React.useMemo(
    () =>
      Array.from(new Set(messageActions)).filter(
        (action) =>
          !!dataSource.runMessageAction ||
          (action === "showOriginal" && !!dataSource.getMessageSource)
      ),
    [dataSource.runMessageAction, dataSource.getMessageSource, messageActions]
  )

  const [folder, setFolder] = useControllableState(
    props.folder,
    initialFolder,
    props.onFolderChange
  )
  const [search, setSearch] = useControllableState(
    props.search,
    props.defaultSearch ?? "",
    props.onSearchChange
  )
  const filtersKey = JSON.stringify(props.searchFilters)
  const controlledSearchFilters = React.useMemo(
    () => props.searchFilters,
    [filtersKey]
  )
  const [searchFields, setSearchFields] = useControllableState(
    controlledSearchFilters,
    props.defaultSearchFilters ?? {},
    props.onSearchFiltersChange
  )
  const [advancedSearchOpen, setAdvancedSearchOpen] = React.useState(false)
  const [searchDraft, setSearchDraft] = React.useState<MailyMailboxSearchQuery>(
    {}
  )
  const [searchScope, setSearchScope] = useControllableState(
    props.searchScope,
    props.defaultSearchScope ?? "folder",
    props.onSearchScopeChange
  )
  const globalSearch = searchScope === "allMail"
  const setGlobalSearch = React.useCallback(
    (value: boolean) => setSearchScope(value ? "allMail" : "folder"),
    [setSearchScope]
  )
  const [selectedLabelId, setSelectedLabelId] = useControllableState(
    props.selectedLabelId,
    props.defaultSelectedLabelId ?? null,
    props.onSelectedLabelIdChange
  )
  const labelSelection = React.useRef({ id: selectedLabelId, epoch: 0 })
  React.useLayoutEffect(() => {
    if (labelSelection.current.id !== selectedLabelId)
      labelSelection.current = {
        id: selectedLabelId,
        epoch: labelSelection.current.epoch + 1,
      }
  }, [selectedLabelId])
  const [mailboxLabels, setMailboxLabels] = React.useState<MailyMailboxLabel[]>(
    []
  )
  const [labelForm, updateLabelForm] = React.useState<{
    mode: "create" | "rename" | "delete"
    label?: MailyMailboxLabel
  } | null>(null)
  const labelFormOwner = React.useRef(labelForm)
  const setLabelForm = (next: typeof labelForm) => {
    labelFormOwner.current = next
    updateLabelForm(next)
  }
  const [labelName, setLabelName] = React.useState("")
  const [selectedIds, setSelectedIds] = useControllableState(
    props.selectedMessageIds,
    props.defaultSelectedMessageIds ?? [],
    props.onSelectedMessageIdsChange
  )
  const [undoReceipt, setUndoReceipt] = React.useState<{
    token: string
    expiresAt?: string | number | Date
  } | null>(null)
  const [selectedId, setSelectedId] = useControllableState(
    props.selectedMessageId,
    props.defaultSelectedMessageId ?? null,
    props.onSelectedMessageIdChange
  )
  const readerSelection = React.useRef({ id: selectedId, epoch: 0 })
  React.useLayoutEffect(() => {
    if (readerSelection.current.id !== selectedId)
      readerSelection.current = {
        id: selectedId,
        epoch: readerSelection.current.epoch + 1,
      }
  }, [selectedId])

  const bulkSelection = React.useRef({
    key: JSON.stringify(selectedIds),
    epoch: 0,
  })
  const bulkSelectionKey = JSON.stringify(selectedIds)
  React.useLayoutEffect(() => {
    if (bulkSelection.current.key !== bulkSelectionKey)
      bulkSelection.current = {
        key: bulkSelectionKey,
        epoch: bulkSelection.current.epoch + 1,
      }
  }, [bulkSelectionKey])

  const mailboxRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const lastMessageTrigger = React.useRef<HTMLElement | null>(null)
  const [compact, setCompact] = React.useState(false)
  const [navigationOpen, setNavigationOpen] = React.useState(false)
  React.useEffect(() => {
    const element = mailboxRef.current
    if (!element || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(([entry]) => {
      setCompact(entry.contentRect.width < 768)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const [composeOpen, setComposeOpen] = React.useState(false)
  const [composeDraftId, setComposeDraftId] = React.useState<string | null>(
    null
  )
  const [composeSeed, setComposeSeed] =
    React.useState<MailyMailboxComposeValues | null>(null)
  const [composeInReplyTo, setComposeInReplyTo] = React.useState<string | null>(
    null
  )

  const [counts, setCounts] = React.useState<MailyMailboxCounts>(emptyCounts)
  const [messages, setMessages] = React.useState<MailyMailboxMessageList>({
    items: [],
    nextCursor: null,
  })
  const [thread, setThread] = React.useState<MailyMailboxThread | null>(null)
  const [detail, setDetail] = React.useState<MailyMailboxMessageDetail | null>(
    null
  )

  const [messagesLoading, setMessagesLoading] = React.useState(true)
  const [detailLoading, setDetailLoading] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)
  // Each source lifetime owns its locks; an old finally cannot unlock a new action.
  const composeLock = React.useMemo(() => ({ current: false }), [lifetime])
  const composeDirty = React.useMemo(() => ({ current: false }), [lifetime])
  const composeOwned = React.useMemo(() => ({ current: false }), [lifetime])
  const pendingFolderRequest = React.useRef<{
    folder: MailyMailboxFolder
    labelId: string | null
  } | null>(null)
  const pendingBackRequest = React.useRef(false)
  const pendingReaderRequest = React.useRef<MailyMailboxMessageRow | null>(null)
  const [pendingNavigation, setPendingNavigation] = React.useState<
    (() => void) | null
  >(null)
  const allowComposeNavigation = (navigate: () => void) => {
    if (!composeDirty.current) return true
    setPendingNavigation(() => navigate)
    return false
  }
  const composeRevision = React.useMemo(
    () => ({ current: undefined as string | undefined }),
    [lifetime]
  )
  const pendingSendRef = React.useMemo(
    () => ({ current: null as string | null }),
    [lifetime]
  )
  const recoveryUnavailableRef = React.useMemo(
    () => ({ current: false }),
    [lifetime]
  )
  const [sendUnresolved, setSendUnresolved] = React.useState(false)
  const recoveryKey = props.account?.id
    ? `maily:pending-send:${props.recoveryScope ?? props.account.id}`
    : null
  React.useEffect(() => {
    if (!recoveryKey) return
    let draftId: string | null = null
    try {
      const legacyKey = props.account?.id
        ? `maily:pending-send:${props.account.id}`
        : null
      if (
        legacyKey &&
        legacyKey !== recoveryKey &&
        readPendingSendReceipts(legacyKey).length
      ) {
        // An older receipt has no actor identity. Keep the flow blocked until
        // its original operation is reconciled; never resend as a new actor.
        recoveryUnavailableRef.current = true
        setSendUnresolved(true)
        setErrorKey(errorLabelForAction("sendDraft"))
        return
      }
      const receipts = readPendingSendReceipts(recoveryKey)
      if (receipts.length > 1) {
        // Multiple acknowledged intents cannot be identified by the current
        // composer. Retain all receipts for explicit host reconciliation.
        recoveryUnavailableRef.current = true
        setSendUnresolved(true)
        setErrorKey(errorLabelForAction("sendDraft"))
        return
      }
      draftId = receipts[0] ?? null
    } catch {
      recoveryUnavailableRef.current = true
      setSendUnresolved(true)
      setErrorKey(errorLabelForAction("sendDraft"))
    }
    if (draftId) {
      pendingSendRef.current = draftId
      composeDraftRef.current = draftId
      setComposeDraftId(draftId)
      setSelectedId(draftId)
      setComposeOpen(true)
      setSendUnresolved(true)
    }
  }, [recoveryKey, props.account?.id, lifetime])
  const composeDraftRef = React.useMemo(
    () => ({ current: null as string | null }),
    [lifetime]
  )
  const messagesGeneration = React.useRef(0)
  const pageCursorsRef = React.useRef<
    Array<{ cursor?: string; start: number }>
  >([{ start: 1 }])
  const pageIndexRef = React.useRef(0)
  const [pageIndex, setPageIndex] = React.useState(0)
  const pageChangeLock = React.useMemo(() => ({ current: false }), [lifetime])
  const hasPreviousPage = pageIndex > 0
  const pageStart = messages.items.length
    ? (pageCursorsRef.current[pageIndex]?.start ?? 1)
    : 0
  const pageEnd = messages.items.length
    ? pageStart + messages.items.length - 1
    : 0
  const pageTotal = messages.total
  const countsGeneration = React.useRef(0)
  React.useEffect(
    () => () => {
      messagesGeneration.current += 1
      countsGeneration.current += 1
    },
    []
  )
  const [saving, setSaving] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [discarding, setDiscarding] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [messageActionPending, setMessageActionPending] =
    React.useState<MailyMailboxMessageAction | null>(null)
  const [errorKey, setErrorKey] = React.useState<MailyMailboxLabelKey | null>(
    null
  )

  const reportError = React.useCallback(
    (error: unknown, action: string) => {
      setErrorKey(errorLabelForAction(action))
      onError?.(error, action)
    },
    [onError]
  )

  const queryKey = JSON.stringify([
    folder,
    globalSearch,
    search,
    searchFields,
    selectedLabelId,
  ])
  const queryOwner = React.useRef({ key: queryKey, epoch: 0 })
  React.useLayoutEffect(() => {
    if (queryOwner.current.key === queryKey) return
    queryOwner.current = {
      key: queryKey,
      epoch: queryOwner.current.epoch + 1,
    }
    messagesGeneration.current += 1
    pageChangeLock.current = false
    setRefreshing(false)
    setLoadingMore(false)
    setErrorKey(null)
  }, [queryKey, pageChangeLock])
  const beginMessageRead = React.useCallback(() => {
    const isCurrent = captureLifetime()
    const query = queryOwner.current
    if (!isCurrent() || query.key !== queryKey) return () => false
    const generation = ++messagesGeneration.current
    // The new read takes ownership of shared progress indicators and paging.
    pageChangeLock.current = false
    setRefreshing(false)
    setLoadingMore(false)
    return () =>
      isCurrent() &&
      query.key === queryKey &&
      queryOwner.current === query &&
      messagesGeneration.current === generation
  }, [captureLifetime, queryKey, pageChangeLock])
  const structuredSearch = React.useMemo<MailyMailboxSearchQuery>(
    () => ({
      ...searchFields,
      text: search.trim() || undefined,
      labelId: selectedLabelId ?? searchFields.labelId,
    }),
    [search, searchFields, selectedLabelId]
  )
  const serializedSearch =
    buildMailboxSearchQuery(structuredSearch) || undefined

  const loadContactSuggestions = React.useCallback(
    async (q: string) => {
      if (dataSource.listContactSuggestions) {
        return dataSource.listContactSuggestions({
          q,
          limit: contactSuggestionLimit,
        })
      }

      return filterMailboxContactSuggestions(
        contactSuggestions,
        q,
        contactSuggestionLimit
      )
    },
    [contactSuggestionLimit, contactSuggestions, dataSource]
  )

  const refreshCounts = React.useCallback(async () => {
    const isCurrent = captureLifetime()
    if (!isCurrent()) return
    if (!dataSource.getCounts) {
      setCounts(emptyCounts())
      return
    }
    const generation = ++countsGeneration.current
    const next = await dataSource.getCounts()
    if (!isCurrent()) return
    if (generation !== countsGeneration.current) return
    setCounts({ ...emptyCounts(), ...next })
  }, [captureLifetime, dataSource])

  const refreshMessages = React.useCallback(
    async (
      preservePages: boolean,
      folderOverride: MailyMailboxFolder | undefined,
      isCurrent: () => boolean
    ) => {
      if (!isCurrent()) return
      const nextFolder =
        (props.folder === undefined ? folderOverride : undefined) ??
        (globalSearch ? "allMail" : folder)
      const keepPages =
        preservePages && nextFolder === (globalSearch ? "allMail" : folder)
      if (!keepPages) {
        pageCursorsRef.current = [{ start: 1 }]
        pageIndexRef.current = 0
        setPageIndex(0)
        // An active draft owns its detail hydration independently of list
        // pagination, including a recovered send before the first list loads.
      }
      let currentIndex = pageIndexRef.current
      // Rebuild the cursor chain after mutations/polling: a host cursor can
      // depend on the preceding page. Keep only the requested page visible.
      const refreshedPages: Array<{ cursor?: string; start: number }> = [
        { start: 1 },
      ]
      let cursor: string | undefined
      let start = 1
      let total: number | undefined
      for (let index = 0; index <= currentIndex; index += 1) {
        const page = await dataSource.listMessages({
          folder: nextFolder,
          q: serializedSearch,
          search: structuredSearch,
          labelId: selectedLabelId ?? undefined,
          cursor,
          limit: pageSize,
        })
        if (!isCurrent()) return
        total = page.total ?? total
        const atTarget = index === currentIndex
        if (atTarget || !page.nextCursor) {
          if (!page.items.length && index > 0) {
            currentIndex = index - 1
            index = -1
            cursor = undefined
            start = 1
            refreshedPages.splice(1)
            continue
          }
          if (index !== pageIndexRef.current) {
            if (props.selectedMessageIds === undefined) setSelectedIds([])
            if (
              props.selectedMessageId === undefined &&
              !composeDraftRef.current
            )
              setSelectedId(null)
          }
          pageIndexRef.current = index
          pageCursorsRef.current = refreshedPages
          setPageIndex(index)
          setMessages({ ...page, total })
          return
        }
        cursor = page.nextCursor ?? undefined
        start += page.items.length
        refreshedPages.push({ cursor, start })
      }
    },
    [
      dataSource,
      folder,
      globalSearch,
      pageSize,
      structuredSearch,
      serializedSearch,
      selectedLabelId,
    ]
  )

  const refreshMailbox = React.useCallback(
    async (folderOverride?: MailyMailboxFolder) => {
      const isCurrent = beginMessageRead()
      if (!isCurrent()) return
      setRefreshing(true)
      try {
        await Promise.all([
          refreshCounts(),
          refreshMessages(true, folderOverride, isCurrent),
        ])
        if (!isCurrent()) return
        setErrorKey(null)
      } catch (error) {
        if (!isCurrent()) return
        reportError(error, "refresh")
      } finally {
        if (isCurrent()) setRefreshing(false)
        if (isCurrent()) setMessagesLoading(false)
      }
    },
    [beginMessageRead, refreshCounts, refreshMessages, reportError]
  )

  const latestRefreshMailbox = React.useRef(refreshMailbox)
  React.useLayoutEffect(() => {
    latestRefreshMailbox.current = refreshMailbox
  }, [refreshMailbox])

  const changePage = React.useCallback(
    async (direction: "previous" | "next") => {
      if (pageChangeLock.current || messagesLoading) return
      const currentIndex = pageIndexRef.current
      const nextIndex =
        direction === "next" ? currentIndex + 1 : currentIndex - 1
      if (nextIndex < 0 || (direction === "next" && !messages.nextCursor))
        return
      const isCurrent = beginMessageRead()
      if (!isCurrent()) return
      const target =
        direction === "next"
          ? { cursor: messages.nextCursor ?? undefined, start: pageEnd + 1 }
          : pageCursorsRef.current[nextIndex]
      pageChangeLock.current = true
      setLoadingMore(true)
      try {
        const page = await dataSource.listMessages({
          folder: globalSearch ? "allMail" : folder,
          q: serializedSearch,
          search: structuredSearch,
          labelId: selectedLabelId ?? undefined,
          cursor: target?.cursor,
          limit: pageSize,
        })
        if (!isCurrent()) return
        if (!page.items.length && direction === "next") {
          setMessages((current) => ({
            ...current,
            nextCursor: null,
            total: page.total ?? current.total,
          }))
          return
        }
        pageCursorsRef.current = [
          ...pageCursorsRef.current.slice(0, nextIndex),
          target,
        ]
        pageIndexRef.current = nextIndex
        setPageIndex(nextIndex)
        if (props.selectedMessageIds === undefined) setSelectedIds([])
        if (props.selectedMessageId === undefined && !composeDraftRef.current)
          setSelectedId(null)
        setMessages({ ...page, total: page.total ?? messages.total })
      } catch (error) {
        if (isCurrent()) reportError(error, "refresh")
      } finally {
        if (isCurrent()) {
          pageChangeLock.current = false
          setLoadingMore(false)
        }
      }
    },
    [
      beginMessageRead,
      dataSource,
      folder,
      globalSearch,
      messagesLoading,
      messages.nextCursor,
      messages.total,
      pageEnd,
      pageSize,
      pageChangeLock,
      reportError,
      structuredSearch,
      serializedSearch,
      selectedLabelId,
    ]
  )

  const labelsGeneration = React.useRef(0)
  React.useEffect(() => {
    let cancelled = false
    const generation = ++labelsGeneration.current
    if (!dataSource.listLabels) {
      setMailboxLabels([])
      return
    }
    Promise.resolve(dataSource.listLabels())
      .then((next) => {
        if (!cancelled && generation === labelsGeneration.current)
          setMailboxLabels(next)
      })
      .catch((error) => {
        if (!cancelled && generation === labelsGeneration.current)
          reportError(error, "messageAction")
      })
    return () => {
      cancelled = true
    }
  }, [dataSource, reportError])

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      const isCurrent = beginMessageRead()
      setMessagesLoading(true)
      try {
        await Promise.all([
          refreshCounts(),
          refreshMessages(false, undefined, isCurrent),
        ])
      } catch (error) {
        if (!cancelled && isCurrent()) {
          reportError(error, "refresh")
          setMessages({ items: [], nextCursor: null })
        }
      } finally {
        if (!cancelled && isCurrent()) setMessagesLoading(false)
      }
    }

    run()
    if (pollIntervalMs <= 0)
      return () => {
        cancelled = true
      }

    const id = window.setInterval(() => {
      const isCurrent = beginMessageRead()
      Promise.all([
        refreshCounts(),
        refreshMessages(true, undefined, isCurrent),
      ])
        .catch((error) => {
          if (!cancelled && isCurrent()) reportError(error, "refresh")
        })
        .finally(() => {
          if (!cancelled && isCurrent()) setMessagesLoading(false)
        })
    }, pollIntervalMs)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [
    pollIntervalMs,
    beginMessageRead,
    refreshCounts,
    refreshMessages,
    reportError,
  ])

  const [detailRevision, invalidateDetail] = React.useReducer(
    (n: number) => n + 1,
    0
  )
  const [threadRevision, invalidateThread] = React.useReducer(
    (n: number) => n + 1,
    0
  )
  const [threadDetailOverride, setThreadDetailOverride] = React.useState<{
    selection: typeof readerSelection.current
    detail: MailyMailboxMessageDetail
  } | null>(null)
  React.useLayoutEffect(() => {
    setThreadDetailOverride(null)
  }, [dataSource, selectedId])
  const clearReaderAfterMutation = () => {
    setSelectedId(null)
    setDetail(null)
    setThreadDetailOverride(null)
    // A host may keep the same selected ID after a mutation. Re-read its
    // actual backend state rather than overriding that controlled selection.
    if (props.selectedMessageId != null) invalidateDetail()
  }

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      if (!selectedId) {
        setDetail(null)
        setThread(null)
        return
      }

      setDetailLoading(true)
      setDetail(null)
      try {
        const next = await dataSource.getMessage(selectedId)
        if (!cancelled) {
          // Parent-accepted selection may point outside the loaded page. Hydrate
          // an unopened draft, but never replace an owned dirty/send session.
          if (
            !composeOpen &&
            !composeDirty.current &&
            !composeLock.current &&
            !pendingSendRef.current &&
            !recoveryUnavailableRef.current &&
            composeDraftRef.current !== next.id
          ) {
            const isDraft = next.status === "draft"
            composeDraftRef.current = isDraft ? next.id : null
            composeRevision.current = isDraft ? next._revision : undefined
            composeOwned.current = false
            setComposeSession((session) => session + 1)
            setComposeDraftId(isDraft ? next.id : null)
            setComposeSeed(null)
            setComposeInReplyTo(isDraft ? (next.inReplyTo ?? null) : null)
            setComposeOpen(isDraft)
          }
          if (composeDraftRef.current === next.id && !composeOwned.current) {
            composeRevision.current = next._revision
            setComposeInReplyTo(next.inReplyTo ?? null)
            composeOwned.current = true
          }
          setDetail(next)
          setErrorKey(null)
        }
      } catch (error) {
        if (!cancelled) {
          setDetail(null)
          reportError(error, "detail")
        }
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [dataSource, reportError, selectedId, detailRevision])

  const selectedRow = messages.items.find((row) => row.id === selectedId)
  const selectedThreadId =
    selectedRow?.threadId ??
    (detail?.id === selectedId ? detail.threadId : undefined)
  React.useEffect(() => {
    let cancelled = false
    const threadId = selectedThreadId
    setThread(null)
    if (!threadId || !dataSource.getThread) {
      return
    }
    Promise.resolve(dataSource.getThread(threadId))
      .then((value) => {
        if (!cancelled && value.threadId === threadId) setThread(value)
      })
      .catch((error) => {
        if (!cancelled) reportError(error, "detail")
      })
    return () => {
      cancelled = true
    }
  }, [
    dataSource,
    reportError,
    selectedId,
    selectedThreadId,
    threadRevision,
    detailRevision,
  ])

  const selectFolder = (
    next: MailyMailboxFolder,
    labelId: string | null = null,
    acceptedByHost = false
  ) => {
    if (
      composeLock.current ||
      pendingSendRef.current ||
      recoveryUnavailableRef.current
    )
      return
    if (!allowComposeNavigation(() => selectFolder(next, labelId))) return
    pendingBackRequest.current = false
    if (props.folder !== undefined && next !== folder) {
      pendingFolderRequest.current = { folder: next, labelId }
      setFolder(next)
      return
    }
    setNavigationOpen(false)
    composeDirty.current = false
    composeOwned.current = false
    messagesGeneration.current += 1
    composeDraftRef.current = null
    composeRevision.current = undefined
    setFolder(next)
    if (!acceptedByHost || props.searchScope === undefined)
      setGlobalSearch(false)
    if (!acceptedByHost || props.search === undefined) setSearch("")
    if (!acceptedByHost || props.searchFilters === undefined)
      setSearchFields({})
    setAdvancedSearchOpen(false)
    if (
      !acceptedByHost ||
      props.selectedLabelId === undefined ||
      labelId !== null
    )
      setSelectedLabelId(labelId)
    if (!acceptedByHost || props.selectedMessageIds === undefined)
      setSelectedIds([])
    if (!acceptedByHost || props.selectedMessageId === undefined)
      setSelectedId(null)
    setComposeOpen(false)
    setComposeDraftId(null)
    setComposeSeed(null)
    setComposeInReplyTo(null)
  }

  const previousControlledFolder = React.useRef(folder)
  React.useEffect(() => {
    if (previousControlledFolder.current === folder) return
    previousControlledFolder.current = folder
    if (props.folder === undefined) return
    const request = pendingFolderRequest.current
    pendingFolderRequest.current = null
    if (request?.folder === folder) {
      selectFolder(folder, request.labelId, true)
      return
    }
    // External navigation updates the list without discarding a live composer.
    if (props.search === undefined) setSearch("")
    if (props.searchFilters === undefined) setSearchFields({})
    if (props.searchScope === undefined) setGlobalSearch(false)
    if (props.selectedLabelId === undefined) setSelectedLabelId(null)
  }, [folder])

  const committedSearchKey = JSON.stringify([search, searchFields])
  const previousControlledSearch = React.useRef(committedSearchKey)
  React.useEffect(() => {
    if (previousControlledSearch.current === committedSearchKey) return
    previousControlledSearch.current = committedSearchKey
    if (props.search === undefined && props.searchFilters === undefined) return
    if (props.searchScope === undefined) {
      setGlobalSearch(
        !!search.trim() || Object.values(searchFields).some(Boolean)
      )
    }
    if (props.selectedLabelId === undefined) setSelectedLabelId(null)
  }, [committedSearchKey])

  const previousQuery = React.useRef(queryKey)
  React.useEffect(() => {
    if (previousQuery.current !== queryKey) {
      previousQuery.current = queryKey
      if (props.selectedMessageIds === undefined) setSelectedIds([])
      if (props.selectedMessageId === undefined && !composeDraftRef.current)
        setSelectedId(null)
    }
  }, [
    queryKey,
    props.selectedMessageIds,
    props.selectedMessageId,
    setSelectedIds,
    setSelectedId,
  ])

  const [composeSession, setComposeSession] = React.useState(0)
  const composeIntent = React.useMemo(() => ({}), [lifetime, composeSession])
  const currentComposeIntent = React.useRef(composeIntent)
  React.useLayoutEffect(() => {
    currentComposeIntent.current = composeIntent
  }, [composeIntent])
  const captureCompose = () => {
    const isCurrent = captureLifetime()
    return () => isCurrent() && currentComposeIntent.current === composeIntent
  }

  const selectMessage = (row: MailyMailboxMessageRow) => {
    if (
      composeLock.current ||
      pendingSendRef.current ||
      recoveryUnavailableRef.current
    )
      return
    if (composeOpen && composeDraftId === row.id) return
    if (!allowComposeNavigation(() => selectMessage(row))) return
    pendingBackRequest.current = false
    if (props.selectedMessageId !== undefined && row.id !== selectedId) {
      pendingReaderRequest.current = row
      setSelectedId(row.id)
      return
    }
    composeDirty.current = false
    composeOwned.current = false
    setComposeSession((session) => session + 1)
    composeDraftRef.current = row.status === "draft" ? row.id : null
    composeRevision.current = row.status === "draft" ? row._revision : undefined
    setSelectedId(row.id)
    if (row.status === "draft") {
      setComposeDraftId(row.id)
      setComposeSeed(null)
      setComposeInReplyTo(null)
      setComposeOpen(true)
      return
    }
    setComposeOpen(false)
    setComposeDraftId(null)
    setComposeSeed(null)
    setComposeInReplyTo(null)
  }

  React.useEffect(() => {
    const requested = pendingReaderRequest.current
    if (!requested || requested.id !== selectedId) return
    pendingReaderRequest.current = null
    selectMessage(requested)
  }, [selectedId])

  const openNewDraft = () => {
    if (
      composeLock.current ||
      pendingSendRef.current ||
      recoveryUnavailableRef.current
    )
      return
    if (!allowComposeNavigation(openNewDraft)) return
    pendingBackRequest.current = false
    setNavigationOpen(false)
    composeDirty.current = false
    composeOwned.current = false
    setComposeSession((session) => session + 1)
    composeDraftRef.current = null
    composeRevision.current = undefined
    setSelectedId(null)
    setDetail(null)
    setComposeDraftId(null)
    setComposeSeed(null)
    setComposeInReplyTo(null)
    setComposeOpen(true)
  }

  const draftInReplyTo = composeInReplyTo

  const composeHydrated =
    !composeDraftId || detail?.id === composeDraftId || composeOwned.current

  const saveDraft = async (
    values: MailyMailboxComposeValues
  ): Promise<boolean> => {
    const isCurrent = captureCompose()
    if (!isCurrent()) return false
    if (!composeHydrated) return false
    const draft = composeValuesToMailboxDraft(values, draftInReplyTo)
    draft.revision = composeRevision.current
    if (
      composeLock.current ||
      pendingSendRef.current ||
      recoveryUnavailableRef.current
    )
      return false
    composeLock.current = true
    setSaving(true)
    try {
      const currentDraftId = composeDraftRef.current ?? composeDraftId
      if (currentDraftId) {
        const saved = await dataSource.updateDraft(currentDraftId, draft)
        if (!isCurrent()) return true
        composeRevision.current = saved._revision
        onDraftSaved?.(currentDraftId)
      } else {
        const created = await dataSource.createDraft(draft)
        if (!isCurrent()) return true
        const createdId = created.id
        composeOwned.current = true
        composeRevision.current = created._revision
        composeDraftRef.current = createdId
        setComposeDraftId(createdId)
        setSelectedId(createdId)
        setFolder("drafts")
        onDraftSaved?.(createdId)
      }
      await latestRefreshMailbox.current(composeDraftId ? undefined : "drafts")
      if (!isCurrent()) return false
      setErrorKey(null)
      return true
    } catch (error) {
      if (!isCurrent()) return false
      reportError(error, "saveDraft")
      return false
    } finally {
      composeLock.current = false
      if (isCurrent()) setSaving(false)
    }
  }

  const sendDraft = async (
    values: MailyMailboxComposeValues,
    onPrepared?: () => void
  ) => {
    const isLifetimeCurrent = captureLifetime()
    const isCurrent = captureCompose()
    const selection = readerSelection.current

    if (!isCurrent()) return
    if (!composeHydrated && !pendingSendRef.current) return
    const draft = composeValuesToMailboxDraft(values, draftInReplyTo)
    draft.revision = composeRevision.current
    if (composeLock.current) return
    composeLock.current = true
    let draftId = composeDraftRef.current ?? composeDraftId
    const preparesNewDraft = !draftId
    const ownsSelection = () =>
      readerSelection.current === selection ||
      (preparesNewDraft &&
        readerSelection.current.id === draftId &&
        readerSelection.current.epoch === selection.epoch + 1)
    setSending(true)
    try {
      if (recoveryUnavailableRef.current)
        throw new Error("errors.idempotency.storage-unavailable")
      if (!recoveryKey)
        throw new Error("errors.idempotency.storage-unavailable")
      const storageProbe = `${recoveryKey}:probe`
      window.sessionStorage.setItem(storageProbe, "1")
      if (window.sessionStorage.getItem(storageProbe) !== "1")
        throw new Error("errors.idempotency.storage-unavailable")
      window.sessionStorage.removeItem(storageProbe)
      if (pendingSendRef.current) {
        draftId = pendingSendRef.current
      } else if (draftId) {
        const saved = await dataSource.updateDraft(draftId, draft)
        if (isCurrent()) composeRevision.current = saved._revision
      } else {
        const created = await dataSource.createDraft(draft)
        draftId = created.id
        if (isCurrent()) {
          composeRevision.current = created._revision
          composeDraftRef.current = draftId
          setComposeDraftId(draftId)
          setSelectedId(draftId)
        }
      }

      // Acknowledgment hands the captured form's uploaded references to the
      // draft, even if that form departed. Its callback owns its own lifecycle.
      onPrepared?.()
      // Persist the actual draft before send: its create receipt is already complete.
      // A reload must recover this draft rather than create another message.
      if (!recoveryKey)
        throw new Error("errors.idempotency.storage-unavailable")
      retainPendingSendReceipt(recoveryKey, draftId)
      if (!isCurrent()) return
      pendingSendRef.current = draftId
      setSendUnresolved(true)
      const result = await dataSource.sendDraft(draftId)
      if (recoveryKey) {
        try {
          clearPendingSendReceipt(recoveryKey, draftId)
        } catch {
          if (!isCurrent()) return
          /* In-page recovery remains available. */
        }
      }
      if (!isCurrent()) return
      pendingSendRef.current = null
      setSendUnresolved(false)
      onSent?.(result)
      setComposeOpen(false)
      composeDraftRef.current = null
      composeRevision.current = undefined
      setComposeDraftId(null)
      setComposeSeed(null)
      setComposeInReplyTo(null)
      if (ownsSelection()) clearReaderAfterMutation()
      setFolder("sent")
      await latestRefreshMailbox.current("sent")
      if (!isCurrent()) return
      setErrorKey(null)
    } catch (error) {
      if (!isCurrent()) return
      reportError(error, "sendDraft")
    } finally {
      composeLock.current = false
      if (isLifetimeCurrent()) setSending(false)
    }
  }

  const discardDraft = async () => {
    const isCurrent = captureLifetime()
    const selection = readerSelection.current
    const ownsSelection = () => readerSelection.current === selection
    if (!isCurrent()) return
    if (
      composeLock.current ||
      pendingSendRef.current ||
      recoveryUnavailableRef.current
    )
      return
    composeLock.current = true
    setDiscarding(true)
    try {
      if (composeDraftId) {
        await dataSource.discardDraft(composeDraftId)
        if (!isCurrent()) return
      }
      setComposeOpen(false)
      composeDraftRef.current = null
      composeRevision.current = undefined
      setComposeDraftId(null)
      setComposeSeed(null)
      setComposeInReplyTo(null)
      if (ownsSelection()) clearReaderAfterMutation()
      await latestRefreshMailbox.current()
      if (!isCurrent()) return
      setErrorKey(null)
    } catch (error) {
      if (!isCurrent()) return
      reportError(error, "discardDraft")
    } finally {
      composeLock.current = false
      if (isCurrent()) setDiscarding(false)
    }
  }

  const openReply = (message: MailyMailboxMessageDetail, replyAll = false) => {
    if (
      composeLock.current ||
      pendingSendRef.current ||
      recoveryUnavailableRef.current
    )
      return
    if (!allowComposeNavigation(() => openReply(message, replyAll))) return
    composeDirty.current = false
    composeOwned.current = false
    setComposeSession((session) => session + 1)
    composeDraftRef.current = null
    composeRevision.current = undefined
    const date = formatDate(message.createdAt, "long")
    setSelectedId(message.id)
    setComposeDraftId(null)
    // A storage row ID is not an RFC Message-ID. Mail without that header
    // remains replyable, but cannot supply an In-Reply-To header.
    setComposeInReplyTo(message.messageId || null)
    const intro = t("compose.wrote", { date, sender: message.fromAddress })
    setComposeSeed(
      replyAll
        ? createReplyAllComposeValues(message, intro, [props.account?.address])
        : createReplyComposeValues(message, intro)
    )
    setComposeOpen(true)
  }

  const openForward = (message: MailyMailboxMessageDetail) => {
    if (
      composeLock.current ||
      pendingSendRef.current ||
      recoveryUnavailableRef.current
    )
      return
    if (!allowComposeNavigation(() => openForward(message))) return
    composeDirty.current = false
    composeOwned.current = false
    setComposeSession((session) => session + 1)
    composeDraftRef.current = null
    composeRevision.current = undefined
    setSelectedId(message.id)
    setComposeDraftId(null)
    setComposeInReplyTo(null)
    setComposeSeed(
      createForwardComposeValues(message, t("compose.forwardedHeader"))
    )
    setComposeOpen(true)
  }

  const runMessageAction = async (
    message: MailyMailboxMessageDetail,
    action: MailyMailboxMessageAction,
    value?: string | boolean | null
  ) => {
    const isCurrent = captureLifetime()
    const selectionEpoch = readerSelection.current.epoch
    const ownsReader = () =>
      readerSelection.current.id === message.id &&
      readerSelection.current.epoch === selectionEpoch
    if (!isCurrent()) return
    if (
      !dataSource.runMessageAction ||
      composeLock.current ||
      pendingSendRef.current ||
      recoveryUnavailableRef.current
    )
      return
    composeLock.current = true
    setMessageActionPending(action)
    try {
      const input: MailyMailboxMessageActionInput = {
        messageId: message.id,
        action,
        value,
      }
      const result = await dataSource.runMessageAction(input)
      if (!isCurrent()) return
      onMessageAction?.({ ...input, message })

      if (
        result &&
        "undo" in result &&
        result.undo &&
        action !== "deleteForever"
      ) {
        setUndoReceipt(result.undo)
      }

      if (
        ownsReader() &&
        (action === "archive" ||
          action === "delete" ||
          action === "restore" ||
          action === "notSpam" ||
          action === "deleteForever" ||
          action === "reportSpam" ||
          action === "reportPhishing" ||
          action === "reportIllegal")
      ) {
        clearReaderAfterMutation()
      } else if (ownsReader() && result && "fromAddress" in result) {
        setDetail(result)
        setThreadDetailOverride({
          selection: readerSelection.current,
          detail: result,
        })
        invalidateThread()
      } else if (ownsReader()) {
        try {
          const nextDetail = await dataSource.getMessage(message.id)
          if (!isCurrent()) return
          if (ownsReader()) {
            setDetail(nextDetail)
            setThreadDetailOverride({
              selection: readerSelection.current,
              detail: nextDetail,
            })
            invalidateThread()
          }
          if (!isCurrent()) return
        } catch {
          if (!isCurrent()) return
          if (ownsReader()) {
            setSelectedId(null)
            setDetail(null)
          }
        }
      }

      await latestRefreshMailbox.current()
      if (!isCurrent()) return
      setErrorKey(null)
    } catch (error) {
      if (!isCurrent()) return
      if (action === "markRead") autoReadMessageIds.delete(message.id)
      reportError(error, "messageAction")
    } finally {
      composeLock.current = false
      if (isCurrent()) setMessageActionPending(null)
    }
  }

  const autoReadMessageIds = React.useMemo(
    () => new Set<string>(),
    [dataSource]
  )
  React.useEffect(() => {
    if (
      !markReadOnOpen ||
      !detail?.isUnread ||
      !enabledMessageActions.includes("markRead") ||
      autoReadMessageIds.has(detail.id)
    )
      return
    if (
      composeLock.current ||
      pendingSendRef.current ||
      recoveryUnavailableRef.current
    )
      return
    autoReadMessageIds.add(detail.id)
    void runMessageAction(detail, "markRead", true)
  }, [
    detail,
    enabledMessageActions,
    markReadOnOpen,
    autoReadMessageIds,
    composeLock,
  ])

  const runBulkAction = async (
    action: MailyMailboxMessageAction,
    value?: string | boolean | null
  ) => {
    if (
      action === "deleteForever" &&
      (globalSearch || (folder !== "trash" && folder !== "spam"))
    )
      return
    if (action === "notSpam" && (globalSearch || folder !== "spam")) return
    if (action === "archive" && (globalSearch || folder !== "inbox")) return
    const ids = [...selectedIds]
    const selectedSet = bulkSelection.current
    const reader = readerSelection.current
    const isCurrent = captureLifetime()
    if (!ids.length || !dataSource.runBulkMessageAction || !isCurrent()) return
    if (
      composeLock.current ||
      pendingSendRef.current ||
      recoveryUnavailableRef.current
    )
      return
    composeLock.current = true
    setMessageActionPending(action)
    try {
      const result = await dataSource.runBulkMessageAction({
        messageIds: ids,
        action,
        value,
      })
      if (!isCurrent()) return
      if (
        result &&
        "undo" in result &&
        result.undo &&
        action !== "deleteForever"
      )
        setUndoReceipt(result.undo)
      if (bulkSelection.current === selectedSet) setSelectedIds([])
      if (readerSelection.current === reader) clearReaderAfterMutation()
      await latestRefreshMailbox.current()
    } catch (error) {
      if (isCurrent()) reportError(error, "messageAction")
    } finally {
      composeLock.current = false
      if (isCurrent()) setMessageActionPending(null)
    }
  }

  const runUndo = async () => {
    if (
      !undoReceipt ||
      !dataSource.undoMessageAction ||
      composeLock.current ||
      pendingSendRef.current ||
      recoveryUnavailableRef.current
    )
      return
    if (
      undoReceipt.expiresAt &&
      new Date(undoReceipt.expiresAt).getTime() <= Date.now()
    ) {
      setUndoReceipt(null)
      return
    }
    const isCurrent = captureLifetime()
    composeLock.current = true
    try {
      await dataSource.undoMessageAction(undoReceipt.token)
      if (!isCurrent()) return
      setUndoReceipt(null)
      await latestRefreshMailbox.current()
    } catch (error) {
      if (isCurrent()) reportError(error, "messageAction")
    } finally {
      composeLock.current = false
    }
  }

  React.useEffect(() => {
    if (!undoReceipt?.expiresAt) return
    const expiresAt = new Date(undoReceipt.expiresAt).getTime()
    if (!Number.isFinite(expiresAt)) return
    const timeout = window.setTimeout(
      () => setUndoReceipt(null),
      Math.max(0, expiresAt - Date.now())
    )
    return () => window.clearTimeout(timeout)
  }, [undoReceipt])

  const mutateLabel = async (
    operation: "create" | "rename" | "delete",
    label?: MailyMailboxLabel,
    requestedName?: string
  ) => {
    if (
      !dataSource.listLabels ||
      composeLock.current ||
      pendingSendRef.current ||
      recoveryUnavailableRef.current
    )
      return
    const name = requestedName?.trim()
    if (operation !== "delete" && (!name || name.length > 128)) return
    const isCurrent = captureLifetime()
    const selectedLabel = labelSelection.current
    const form = labelFormOwner.current
    composeLock.current = true
    try {
      if (operation === "create" && dataSource.createLabel)
        await dataSource.createLabel(name!)
      if (operation === "rename" && label && name && dataSource.renameLabel)
        await dataSource.renameLabel(label.id, name)
      if (operation === "delete" && label && dataSource.deleteLabel) {
        await dataSource.deleteLabel(label.id)
        if (!isCurrent()) return
        if (
          labelSelection.current === selectedLabel &&
          selectedLabel.id === label.id
        )
          setSelectedLabelId(null)
      }
      if (!isCurrent()) return
      const generation = ++labelsGeneration.current
      const nextLabels = await dataSource.listLabels()
      if (!isCurrent()) return
      if (generation === labelsGeneration.current) setMailboxLabels(nextLabels)
      if (labelFormOwner.current === form) {
        setLabelForm(null)
        setLabelName("")
      }
      await latestRefreshMailbox.current()
    } catch (error) {
      if (isCurrent()) reportError(error, "messageAction")
    } finally {
      composeLock.current = false
    }
  }

  const applyLabelToSelection = async (labelId: string, remove = false) => {
    if (
      !selectedIds.length ||
      composeLock.current ||
      pendingSendRef.current ||
      recoveryUnavailableRef.current
    )
      return
    const action = remove ? dataSource.removeLabel : dataSource.applyLabel
    if (!action) return
    const isCurrent = captureLifetime()
    composeLock.current = true
    try {
      await action(selectedIds, labelId)
      if (!isCurrent()) return
      await latestRefreshMailbox.current()
    } catch (error) {
      if (isCurrent()) reportError(error, "messageAction")
    } finally {
      composeLock.current = false
    }
  }

  const labelInputId = React.useId()

  const initialComposeValues = React.useMemo(() => {
    if (composeDraftId && detail?.id === composeDraftId) {
      return detailToComposeValues(detail)
    }
    return composeSeed ?? emptyComposeValues()
  }, [composeDraftId, composeSeed, detail])

  const labelDialogContent = (
    <DialogContent
      showCloseButton={false}
      className="sm:max-w-sm"
      onKeyDown={(event) => {
        // Radix focuses before its passive Escape listener registers. Preserve
        // immediate dismissal in this leaf dialog even if an older layer consumed
        // the key during registration; host modality/focus behavior stays intact.
        if (event.key === "Escape") {
          event.preventDefault()
          setLabelForm(null)
        }
      }}
    >
      <DialogHeader>
        <DialogTitle>
          {t(
            labelForm?.mode === "delete"
              ? "actions.deleteLabel"
              : labelForm?.mode === "rename"
                ? "actions.renameLabel"
                : "actions.createLabel"
          )}
        </DialogTitle>
        <DialogDescription>
          {labelForm?.mode === "delete"
            ? labelForm.label?.name
            : t("labels.description")}
        </DialogDescription>
      </DialogHeader>
      {labelForm?.mode === "delete" ? (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setLabelForm(null)}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => void mutateLabel("delete", labelForm.label)}
          >
            {t("actions.deleteLabel")}
          </Button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (labelForm)
              void mutateLabel(labelForm.mode, labelForm.label, labelName)
          }}
        >
          <Field>
            <FieldLabel htmlFor={labelInputId}>{t("labels.name")}</FieldLabel>
            <Input
              id={labelInputId}
              value={labelName}
              maxLength={128}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setLabelName(event.target.value)
              }
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLabelForm(null)}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={!labelName.trim()}>
              {t(
                labelForm?.mode === "rename"
                  ? "actions.renameLabel"
                  : "actions.createLabel"
              )}
            </Button>
          </div>
        </form>
      )}
    </DialogContent>
  )

  const returnToList = () => {
    if (
      composeLock.current ||
      pendingSendRef.current ||
      recoveryUnavailableRef.current
    )
      return
    if (!allowComposeNavigation(returnToList)) return
    if (props.selectedMessageId !== undefined && selectedId !== null) {
      pendingBackRequest.current = true
      setSelectedId(null)
      return
    }
    setSelectedId(null)
    setComposeOpen(false)
    composeDraftRef.current = null
    composeRevision.current = undefined
    setComposeDraftId(null)
    setComposeSeed(null)
    setComposeInReplyTo(null)
    composeOwned.current = false
  }
  React.useEffect(() => {
    if (pendingBackRequest.current && selectedId === null) {
      pendingBackRequest.current = false
      returnToList()
    }
  }, [selectedId])
  const detailOpen = composeOpen || !!selectedId
  const previousDetailOpen = React.useRef(detailOpen)
  React.useEffect(() => {
    if (previousDetailOpen.current && !detailOpen) {
      const target = lastMessageTrigger.current
      if (target?.isConnected) target.focus({ preventScroll: true })
      else listRef.current?.focus({ preventScroll: true })
    }
    previousDetailOpen.current = detailOpen
  }, [detailOpen])
  const focusBack = React.useCallback((node: HTMLButtonElement | null) => {
    if (
      node &&
      (document.activeElement === document.body ||
        document.activeElement === lastMessageTrigger.current)
    ) {
      node.focus({ preventScroll: true })
    }
  }, [])
  const backButton = (
    <MailboxIconButton
      type="button"
      variant="ghost"
      size="icon"
      className="size-11 shrink-0"
      ref={focusBack}
      data-mailbox-back
      aria-label={t("navigation.back")}
      onClick={returnToList}
      disabled={saving || sending || discarding || sendUnresolved}
    >
      <ArrowLeft className="size-4" />
    </MailboxIconButton>
  )
  const navigation = (
    <div className="flex shrink-0 flex-col gap-2 p-3 [&_button]:min-h-11">
      <Button
        type="button"
        size="icon"
        onClick={openNewDraft}
        className="w-full justify-start gap-2 px-2.5"
        aria-label={t("compose.new")}
      >
        <Pencil className="size-4" />
        <span className="inline min-w-0 truncate">{t("compose.new")}</span>
      </Button>
      <nav className="flex w-full flex-col gap-0.5">
        {FOLDERS.map((item) => {
          const active = folder === item && !selectedLabelId && !globalSearch
          const count = counts[item] ?? 0
          return (
            <Button
              key={item}
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t(`folders.${item}`)}
              aria-current={active ? "page" : undefined}
              onClick={() => selectFolder(item)}
              className={cn(
                "relative w-full justify-start gap-2 px-2.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active &&
                  "bg-sidebar-accent font-medium text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {folderIcon(item, "size-4")}
              <span className="inline min-w-0 flex-1 truncate text-left">
                {t(`folders.${item}`)}
              </span>
              {count > 0 && (
                <span className="min-w-[2ch] text-right text-xs text-muted-foreground tabular-nums">
                  {count}
                </span>
              )}
            </Button>
          )
        })}
      </nav>
      {dataSource.listLabels && (
        <>
          <div className="mt-4 flex w-full items-center justify-between">
            <span className="inline px-2.5 text-sm font-medium">
              {t("labels.heading")}
            </span>
            {dataSource.createLabel && (
              <Dialog
                open={labelForm?.mode === "create"}
                onOpenChange={(open) => {
                  if (!open) setLabelForm(null)
                }}
              >
                <DialogTrigger asChild>
                  <MailboxIconButton
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("actions.createLabel")}
                    onClick={() => {
                      setLabelForm({ mode: "create" })
                      setLabelName("")
                    }}
                  >
                    <Plus className="size-4" />
                  </MailboxIconButton>
                </DialogTrigger>
                {labelDialogContent}
              </Dialog>
            )}
          </div>
          <ul className="w-full space-y-0.5">
            {mailboxLabels.map((label) => (
              <li key={label.id} className="group flex items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "min-w-0 flex-1 justify-start gap-2",
                    selectedLabelId === label.id && "bg-accent font-medium"
                  )}
                  aria-label={label.name}
                  aria-current={
                    selectedLabelId === label.id ? "page" : undefined
                  }
                  onClick={() => {
                    const navigate = () => {
                      selectFolder("allMail", label.id)
                    }
                    if (
                      !composeLock.current &&
                      allowComposeNavigation(navigate)
                    )
                      navigate()
                  }}
                >
                  <Tag className="size-4 shrink-0" />
                  <span className="inline min-w-0 truncate">{label.name}</span>
                </Button>
                {(dataSource.renameLabel || dataSource.deleteLabel) && (
                  <Dialog
                    open={labelForm?.label?.id === label.id}
                    onOpenChange={(open) => {
                      if (!open) setLabelForm(null)
                    }}
                  >
                    <DropdownMenu>
                      <DialogTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <MailboxIconButton
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="inline-flex size-11 shrink-0"
                            aria-label={`${t("actions.more")}: ${label.name}`}
                          >
                            <MoreVertical className="size-4" />
                          </MailboxIconButton>
                        </DropdownMenuTrigger>
                      </DialogTrigger>
                      <DropdownMenuContent align="start">
                        {dataSource.renameLabel && (
                          <DropdownMenuItem
                            onClick={() => {
                              setLabelForm({ mode: "rename", label })
                              setLabelName(label.name)
                            }}
                          >
                            {t("actions.renameLabel")}
                          </DropdownMenuItem>
                        )}
                        {dataSource.deleteLabel && (
                          <DropdownMenuItem
                            onClick={() =>
                              setLabelForm({ mode: "delete", label })
                            }
                          >
                            {t("actions.deleteLabel")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {labelDialogContent}
                  </Dialog>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )

  return (
    <div
      ref={mailboxRef}
      className={cn(
        "maily-mailbox @container/mailbox flex h-[42rem] max-h-[calc(100dvh-2rem)] min-h-0 min-w-0 overflow-hidden rounded-lg border border-border bg-background text-foreground",
        className
      )}
    >
      {!compact && (
        <aside
          aria-label={t("navigation.menu")}
          className="flex w-52 shrink-0 flex-col overflow-y-auto border-r border-border bg-muted/30"
        >
          {navigation}
        </aside>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center border-b border-border">
          {compact && (
            <Sheet open={navigationOpen} onOpenChange={setNavigationOpen}>
              <SheetTrigger asChild>
                <MailboxIconButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-1 size-11 shrink-0"
                  aria-label={t("navigation.menu")}
                >
                  <Menu className="size-5" />
                </MailboxIconButton>
              </SheetTrigger>
              <SheetContent
                side="left"
                showCloseButton={false}
                aria-describedby={undefined}
                className="flex w-72 max-w-[calc(100vw-3rem)] flex-col gap-0 p-0"
              >
                <SheetHeader className="flex-row items-center justify-between p-3">
                  <SheetTitle>{t("navigation.menu")}</SheetTitle>
                  <SheetClose asChild>
                    <MailboxIconButton
                      variant="ghost"
                      size="icon"
                      className="size-11"
                      aria-label={t("navigation.close")}
                    >
                      <X className="size-4" />
                    </MailboxIconButton>
                  </SheetClose>
                </SheetHeader>
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                  {navigation}
                </div>
              </SheetContent>
            </Sheet>
          )}
          <div className="min-w-0 flex-1 p-2">
            <InputGroup className="h-11 bg-muted/30">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                value={search}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setSearch(event.target.value)
                  if (props.search !== undefined) return
                  setGlobalSearch(!!event.target.value.trim())
                  setSelectedLabelId(null)
                }}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
                className="h-10 min-w-0 px-1.5 py-0 text-base"
              />
              <InputGroupAddon align="inline-end">
                {(search || Object.keys(searchFields).length > 0) && (
                  <MailboxIconButton
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-11"
                    aria-label={t("search.clear")}
                    onClick={() => {
                      setSearch("")
                      if (props.search !== undefined) return
                      setSearchFields({})
                      setGlobalSearch(false)
                    }}
                  >
                    <X className="size-4" />
                  </MailboxIconButton>
                )}
                <Popover
                  open={advancedSearchOpen}
                  onOpenChange={(open) => {
                    if (open) setSearchDraft(searchFields)
                    setAdvancedSearchOpen(open)
                  }}
                >
                  <PopoverTrigger asChild>
                    <MailboxIconButton
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-11"
                      aria-label={t("search.advanced")}
                    >
                      <Filter className="size-4" />
                    </MailboxIconButton>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-80 max-w-[calc(100vw-2rem)] p-4"
                  >
                    <form
                      className="space-y-3"
                      onSubmit={(event) => {
                        event.preventDefault()
                        setSearchFields(searchDraft)
                        if (props.searchFilters === undefined) {
                          setGlobalSearch(true)
                          setSelectedLabelId(null)
                        }
                        setAdvancedSearchOpen(false)
                      }}
                    >
                      {(
                        ["from", "to", "subject", "after", "before"] as const
                      ).map((key) => (
                        <Field
                          key={key}
                          orientation="horizontal"
                          className="grid grid-cols-[6rem_1fr] items-center gap-2"
                        >
                          <FieldLabel htmlFor={`${labelInputId}-search-${key}`}>
                            {t(`search.${key}`)}
                          </FieldLabel>
                          <Input
                            id={`${labelInputId}-search-${key}`}
                            value={searchDraft[key] ?? ""}
                            onChange={(
                              event: React.ChangeEvent<HTMLInputElement>
                            ) => {
                              setSearchDraft((current) => ({
                                ...current,
                                [key]: event.target.value || undefined,
                              }))
                            }}
                          />
                        </Field>
                      ))}
                      {(["hasAttachments", "unread"] as const).map((key) => (
                        <Field key={key} orientation="horizontal">
                          <Checkbox
                            id={`${labelInputId}-search-${key}`}
                            checked={!!searchDraft[key]}
                            onCheckedChange={(checked) => {
                              setSearchDraft((current) => ({
                                ...current,
                                [key]: checked === true || undefined,
                              }))
                            }}
                          />
                          <FieldLabel htmlFor={`${labelInputId}-search-${key}`}>
                            {t(`search.${key}`)}
                          </FieldLabel>
                        </Field>
                      ))}
                      <div className="flex justify-end">
                        <Button type="submit" size="sm">
                          {t("search.submit")}
                        </Button>
                      </div>
                    </form>
                  </PopoverContent>
                </Popover>
              </InputGroupAddon>
              {refreshing && (
                <InputGroupAddon align="inline-end">
                  <LoaderCircleIcon
                    className="size-4 animate-spin"
                    aria-label={t("refresh")}
                  />
                </InputGroupAddon>
              )}
            </InputGroup>
          </div>
        </div>
        {pendingNavigation && (
          <Dialog
            open
            onOpenChange={(open) => {
              if (!open) setPendingNavigation(null)
            }}
          >
            <DialogContent
              showCloseButton={false}
              className="sm:max-w-sm"
              aria-describedby={undefined}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault()
                  setPendingNavigation(null)
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>{t("compose.unsavedConfirm")}</DialogTitle>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPendingNavigation(null)}
                >
                  {t("compose.stay")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    const navigate = pendingNavigation
                    composeDirty.current = false
                    setPendingNavigation(null)
                    navigate()
                  }}
                >
                  {t("compose.discard")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        {errorKey && (
          <div
            role="status"
            className="flex shrink-0 items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span>{t(errorKey)}</span>
          </div>
        )}
        {undoReceipt && dataSource.undoMessageAction && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 bg-foreground px-3 py-2 text-sm text-background"
          >
            <span>{t("actions.completed")}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={
                !!messageActionPending || saving || sending || discarding
              }
              onClick={() => void runUndo()}
            >
              {t("actions.undo")}
            </Button>
          </div>
        )}
        <div
          ref={listRef}
          tabIndex={-1}
          hidden={detailOpen}
          className={cn(
            "min-h-0 flex-1 flex-col outline-none",
            detailOpen ? "hidden" : "flex"
          )}
        >
          <div className="flex min-h-11 flex-wrap items-center gap-x-0 gap-y-1 border-b border-border py-1 pr-2">
            {(dataSource.runBulkMessageAction ||
              dataSource.applyLabel ||
              dataSource.removeLabel) && (
              <Label className="flex size-11 shrink-0 items-center justify-center">
                <MailboxTooltip label={t("actions.selectAll")}>
                  <Checkbox
                    aria-label={t("actions.selectAll")}
                    checked={
                      messages.items.length > 0 &&
                      messages.items.every((message) =>
                        selectedIds.includes(message.id)
                      )
                    }
                    disabled={
                      !messages.items.length || messagesLoading || loadingMore
                    }
                    onCheckedChange={(checked) =>
                      setSelectedIds(
                        checked === true
                          ? messages.items.map((message) => message.id)
                          : []
                      )
                    }
                  />
                </MailboxTooltip>
              </Label>
            )}
            {selectedIds.length > 0 && (
              <div className="flex min-w-0 flex-wrap items-center gap-1">
                <span className="sr-only">
                  {t("selection.count", { count: selectedIds.length })}
                </span>
                {dataSource.runBulkMessageAction &&
                  Array.from(new Set(messageActions))
                    .filter((action) =>
                      [
                        "archive",
                        "delete",
                        "reportSpam",
                        "markRead",
                        "markUnread",
                        "restore",
                        "notSpam",
                        "deleteForever",
                      ].includes(action)
                    )
                    .filter((action) => {
                      if (action === "markRead")
                        return messages.items.some(
                          (row) => selectedIds.includes(row.id) && row.isUnread
                        )
                      if (action === "markUnread")
                        return messages.items.some(
                          (row) => selectedIds.includes(row.id) && !row.isUnread
                        )
                      if (action === "archive")
                        return !globalSearch && folder === "inbox"
                      if (action === "restore")
                        return (
                          folder === "trash" ||
                          folder === "allMail" ||
                          folder === "starred"
                        )
                      if (action === "notSpam")
                        return !globalSearch && folder === "spam"
                      if (action === "deleteForever")
                        return (
                          !globalSearch &&
                          (folder === "trash" || folder === "spam")
                        )
                      if (action === "delete" || action === "reportSpam")
                        return (
                          globalSearch ||
                          (folder !== "trash" && folder !== "spam")
                        )
                      return true
                    })
                    .map((action) => (
                      <MailboxIconButton
                        key={action}
                        type="button"
                        size="icon"
                        className="size-11"
                        variant="ghost"
                        aria-label={t(MESSAGE_ACTION_METADATA[action].label)}
                        disabled={!!messageActionPending}
                        onClick={() =>
                          void runBulkAction(
                            action,
                            MESSAGE_ACTION_METADATA[action].value
                          )
                        }
                      >
                        {MESSAGE_ACTION_METADATA[action].icon("size-4")}
                      </MailboxIconButton>
                    ))}
                {mailboxLabels.length > 0 &&
                  (dataSource.applyLabel || dataSource.removeLabel) && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <MailboxIconButton
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-11"
                          aria-label={t(
                            dataSource.applyLabel
                              ? "actions.applyLabel"
                              : "actions.removeLabel"
                          )}
                        >
                          <Tag className="size-4" />
                        </MailboxIconButton>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-56 space-y-1">
                        {mailboxLabels.map((label, labelIndex) => {
                          const checked = messages.items
                            .filter((row) => selectedIds.includes(row.id))
                            .every(
                              (row) =>
                                row.labels?.includes(label.id) ||
                                row.labels?.includes(label.name)
                            )
                          return (
                            <Field
                              key={label.id}
                              orientation="horizontal"
                              className="gap-2 rounded-sm px-2 py-1.5 hover:bg-accent"
                            >
                              <Checkbox
                                id={`${labelInputId}-apply-${labelIndex}`}
                                checked={checked}
                                disabled={
                                  checked
                                    ? !dataSource.removeLabel
                                    : !dataSource.applyLabel
                                }
                                onCheckedChange={(value) =>
                                  void applyLabelToSelection(
                                    label.id,
                                    value !== true
                                  )
                                }
                              />
                              <FieldLabel
                                htmlFor={`${labelInputId}-apply-${labelIndex}`}
                                className="min-w-0 truncate"
                              >
                                {label.name}
                              </FieldLabel>
                            </Field>
                          )
                        })}
                      </PopoverContent>
                    </Popover>
                  )}
              </div>
            )}
            {selectedIds.length === 0 && (
              <MailboxIconButton
                type="button"
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label={t("refresh")}
                disabled={refreshing || loadingMore}
                onClick={() => void refreshMailbox()}
              >
                <RotateCwIcon
                  className={cn("size-4", refreshing && "animate-spin")}
                />
              </MailboxIconButton>
            )}
            <div className="ml-auto flex items-center gap-1">
              <span
                className="px-1 text-xs whitespace-nowrap text-muted-foreground tabular-nums"
                aria-live="polite"
              >
                {t(
                  pageTotal === undefined
                    ? "pagination.range"
                    : "pagination.rangeWithTotal",
                  { start: pageStart, end: pageEnd, total: pageTotal ?? 0 }
                )}
              </span>
              <MailboxIconButton
                type="button"
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label={t("pagination.previous")}
                disabled={
                  !hasPreviousPage ||
                  messagesLoading ||
                  loadingMore ||
                  refreshing
                }
                onClick={() => void changePage("previous")}
              >
                <ChevronRight className="size-4 rotate-180" />
              </MailboxIconButton>
              <MailboxIconButton
                type="button"
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label={t("pagination.next")}
                disabled={
                  !messages.nextCursor ||
                  messagesLoading ||
                  loadingMore ||
                  refreshing
                }
                onClick={() => void changePage("next")}
              >
                <ChevronRight className="size-4" />
              </MailboxIconButton>
            </div>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <MessageList
              folder={globalSearch ? "allMail" : folder}
              labels={labels}
              rows={messages.items}
              isLoading={messagesLoading}
              selectedId={selectedId}
              selectedIds={selectedIds}
              onSelect={(row) => {
                lastMessageTrigger.current =
                  document.activeElement as HTMLElement
                selectMessage(row)
              }}
              onToggleSelection={
                dataSource.runBulkMessageAction ||
                dataSource.applyLabel ||
                dataSource.removeLabel
                  ? (ids) =>
                      setSelectedIds((current) =>
                        ids.every((id) => current.includes(id))
                          ? current.filter((id) => !ids.includes(id))
                          : [...new Set([...current, ...ids])]
                      )
                  : undefined
              }
              onToggleFavorite={
                enabledMessageActions.includes("favorite")
                  ? (row) =>
                      void runMessageAction(row, "favorite", !row.isFavorite)
                  : undefined
              }
              formatDate={formatDate}
            />
          </ScrollArea>
        </div>
        {detailOpen && (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {composeOpen ? (
              <>
                <div className="flex min-h-12 items-center border-b border-border px-2">
                  {backButton}
                </div>
                <ScrollArea className="min-h-0 flex-1">
                  {!composeHydrated ? (
                    <div role="status" className="p-5">
                      {t("loading")}
                    </div>
                  ) : (
                    <Compose
                      key={composeSession}
                      initialValues={initialComposeValues}
                      labels={labels}
                      loadContactSuggestions={loadContactSuggestions}
                      defaultBodyMode={defaultComposeBodyMode}
                      allowBodyModeSwitch={allowComposeBodyModeSwitch}
                      editorProps={composeEditorProps}
                      isExistingDraft={!!composeDraftId}
                      isSaving={saving}
                      isSendUnresolved={sendUnresolved}
                      isSending={sending}
                      isDiscarding={discarding}
                      ownershipToken={lifetime}
                      uploadAttachment={dataSource.uploadAttachment}
                      discardUploadedAttachment={
                        dataSource.discardUploadedAttachment
                      }
                      onError={onError}
                      onDirtyChange={(dirty) => {
                        composeDirty.current = dirty
                      }}
                      onSave={saveDraft}
                      onSend={sendDraft}
                      onDiscard={discardDraft}
                    />
                  )}
                </ScrollArea>
              </>
            ) : selectedId ? (
              <MessageReader
                key={selectedId}
                backButton={backButton}
                getMessageSource={dataSource.getMessageSource}
                thread={thread}
                threadDetailOverride={
                  threadDetailOverride?.selection === readerSelection.current
                    ? threadDetailOverride.detail
                    : null
                }
                detail={detail}
                isLoading={detailLoading}
                labels={labels}
                formatDate={formatDate}
                messageActions={enabledMessageActions.filter((action) => {
                  if (action === "restore")
                    return (
                      folder === "trash" ||
                      folder === "allMail" ||
                      folder === "starred"
                    )
                  if (action === "notSpam")
                    return !globalSearch && folder === "spam"
                  if (action === "deleteForever")
                    return (
                      !globalSearch && (folder === "trash" || folder === "spam")
                    )
                  if (
                    action === "delete" ||
                    action === "archive" ||
                    action === "reportSpam"
                  ) {
                    if (action === "archive")
                      return !globalSearch && folder === "inbox"
                    return (
                      globalSearch || (folder !== "trash" && folder !== "spam")
                    )
                  }
                  return true
                })}
                actionPending={messageActionPending}
                onReply={openReply}
                onReplyAll={(message) => openReply(message, true)}
                onForward={openForward}
                onRunAction={runMessageAction}
                downloadAttachment={dataSource.downloadAttachment}
                onError={onError}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export const InboxOutboxView = MailboxView

function MessageList(props: {
  folder: MailyMailboxFolder
  labels: MailyMailboxLabels
  rows: MailyMailboxMessageRow[]
  isLoading: boolean
  selectedId: string | null
  selectedIds: string[]
  onSelect: (row: MailyMailboxMessageRow) => void
  onToggleSelection?: (ids: string[]) => void
  onToggleFavorite?: (row: MailyMailboxMessageRow) => void
  formatDate: (date: string | Date, mode: "short" | "long") => string
}) {
  const {
    folder,
    labels,
    rows,
    isLoading,
    selectedId,
    selectedIds,
    onSelect,
    onToggleSelection,
    onToggleFavorite,
    formatDate,
  } = props
  const t = (
    key: MailyMailboxLabelKey,
    vars?: Record<string, string | number>
  ) => interpolate(labels[key], vars)

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
        <LoaderCircleIcon className="size-4 animate-spin" />
        {t("loading")}
      </div>
    )
  }

  if (rows.length === 0) {
    return <EmptyState className="h-full" title={t(`empty.${folder}`)} />
  }

  return (
    <div className="@container/list min-w-0 [contain:inline-size]">
      <ul className="divide-y divide-border">
        {groupMailboxMessagesByThread(rows).map((conversation) => {
          const groupRows = conversation.messages
          const row = groupRows[groupRows.length - 1]
          const conversationIds = groupRows.map((item) => item.id)
          const active = groupRows.some((item) => item.id === selectedId)
          const allSelected = conversationIds.every((id) =>
            selectedIds.includes(id)
          )
          const display =
            row.direction === "in"
              ? row.fromAddress
              : formatRecipients(row.toAddresses)

          return (
            <li
              key={conversation.threadId ?? row.id}
              className={cn(
                "flex min-w-0 items-stretch",
                (active || allSelected) && "bg-accent",
                !row.isUnread && "bg-muted/20"
              )}
            >
              {onToggleSelection && (
                <Label className="flex size-11 shrink-0 items-center justify-center">
                  <MailboxTooltip
                    label={t(
                      allSelected
                        ? "actions.deselectConversation"
                        : "actions.selectConversation",
                      { subject: row.subject || t("message.noSubject") }
                    )}
                  >
                    <Checkbox
                      aria-label={t(
                        allSelected
                          ? "actions.deselectConversation"
                          : "actions.selectConversation",
                        { subject: row.subject || t("message.noSubject") }
                      )}
                      checked={allSelected}
                      onCheckedChange={() =>
                        onToggleSelection?.(conversationIds)
                      }
                    />
                  </MailboxTooltip>
                </Label>
              )}
              {onToggleFavorite && (
                <MailboxIconButton
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-11 shrink-0"
                  aria-label={t(
                    row.isFavorite ? "actions.unfavorite" : "actions.favorite"
                  )}
                  onClick={() => onToggleFavorite(row)}
                >
                  <Star
                    className={cn(
                      "size-4 text-muted-foreground",
                      row.isFavorite && "fill-current text-amber-500"
                    )}
                  />
                </MailboxIconButton>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={() => onSelect(row)}
                className={cn(
                  "grid h-auto min-h-11 min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 rounded-none px-2 py-2 text-left font-normal whitespace-normal hover:bg-accent @3xl/list:grid-cols-[12rem_minmax(0,1fr)_auto]",
                  active && "bg-accent"
                )}
              >
                <span
                  className={cn(
                    "col-start-1 row-start-1 min-w-0 truncate text-sm",
                    row.isUnread ? "font-semibold" : "font-medium"
                  )}
                >
                  {display || t("message.unknownSender")}
                </span>
                <span className="col-span-2 col-start-1 row-start-2 flex min-w-0 flex-col @3xl/list:col-span-1 @3xl/list:col-start-2 @3xl/list:row-start-1 @3xl/list:flex-row @3xl/list:items-center @3xl/list:gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 @3xl/list:max-w-[65%] @3xl/list:shrink-0">
                    {row.isFavorite && !onToggleFavorite && (
                      <Star className="size-3.5 shrink-0 fill-current text-amber-500" />
                    )}
                    <span
                      className={cn(
                        "truncate text-sm",
                        row.isUnread && "font-semibold"
                      )}
                    >
                      {row.subject || t("message.noSubject")}
                    </span>
                    {groupRows.length > 1 && (
                      <Badge variant="outline">{groupRows.length}</Badge>
                    )}
                    {row.hasAttachments && (
                      <Paperclip className="size-3 shrink-0 text-muted-foreground" />
                    )}
                  </span>
                  {row.snippet && (
                    <span className="min-w-0 truncate text-sm text-muted-foreground">
                      {row.snippet}
                    </span>
                  )}
                </span>
                <span className="col-start-2 row-start-1 text-xs text-muted-foreground @3xl/list:col-start-3">
                  {formatDate(row.createdAt, "short")}
                </span>
                {(row.status === "failed" || row.status === "dsn") && (
                  <Badge variant="destructive" className="self-start">
                    {t("message.bounced")}
                  </Badge>
                )}
                {row.status === "queued" && (
                  <Badge variant="outline" className="self-start">
                    {t("message.queued")}
                  </Badge>
                )}
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Source is rendered as escaped text, never as HTML or an iframe. */
function MessageSource(props: {
  messageId: string
  getSource: NonNullable<MailyMailboxDataSource["getMessageSource"]>
  labels: MailyMailboxLabels
  onBack: () => void
  onError: MailyMailboxViewProps["onError"]
}) {
  const { messageId, getSource, labels, onBack, onError } = props
  const [source, setSource] = React.useState<string | null>(null)
  const [failed, setFailed] = React.useState(false)
  const [attempt, setAttempt] = React.useState(0)
  const errorHandler = React.useRef(onError)
  errorHandler.current = onError
  React.useEffect(() => {
    let active = true
    setSource(null)
    setFailed(false)
    Promise.resolve()
      .then(() => getSource(messageId))
      .then(
        (value) => {
          if (active) setSource(value)
        },
        (error) => {
          if (!active) return
          setFailed(true)
          errorHandler.current?.(error, "messageSource")
        }
      )
    return () => {
      active = false
    }
  }, [getSource, messageId, attempt])

  return (
    <section
      className="flex h-full min-h-0 flex-col"
      aria-label={labels["actions.showOriginal"]}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border p-3">
        <Button variant="outline" onClick={onBack}>
          {labels["source.back"]}
        </Button>
      </div>
      {failed ? (
        <div className="space-y-3 p-5">
          <p role="alert" className="text-sm">
            {labels["source.error"]}
          </p>
          <Button
            variant="outline"
            onClick={() => setAttempt((value) => value + 1)}
          >
            {labels["source.retry"]}
          </Button>
        </div>
      ) : source === null ? (
        <p role="status" className="p-5 text-sm text-muted-foreground">
          {labels.loading}
        </p>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <pre
            className="p-5 font-mono text-xs break-all whitespace-pre-wrap"
            tabIndex={0}
          >
            {source}
          </pre>
        </ScrollArea>
      )}
    </section>
  )
}

function MessageReader(props: {
  backButton: React.ReactNode
  getMessageSource: MailyMailboxDataSource["getMessageSource"]
  thread?: MailyMailboxThread | null
  threadDetailOverride?: MailyMailboxMessageDetail | null
  detail: MailyMailboxMessageDetail | null
  isLoading: boolean
  labels: MailyMailboxLabels
  formatDate: (date: string | Date, mode: "short" | "long") => string
  messageActions: readonly MailyMailboxMessageAction[]
  actionPending: MailyMailboxMessageAction | null
  onReply: (detail: MailyMailboxMessageDetail) => void
  onReplyAll: (detail: MailyMailboxMessageDetail) => void
  onForward: (detail: MailyMailboxMessageDetail) => void
  downloadAttachment: MailyMailboxDataSource["downloadAttachment"]
  onError: MailyMailboxViewProps["onError"]
  onRunAction: (
    detail: MailyMailboxMessageDetail,
    action: MailyMailboxMessageAction,
    value?: string | boolean | null
  ) => Promise<void>
}) {
  const {
    detail,
    isLoading,
    labels,
    formatDate,
    messageActions,
    actionPending,
    onReply,
    onReplyAll,
    onForward,
    onRunAction,
  } = props
  const t = (
    key: MailyMailboxLabelKey,
    vars?: Record<string, string | number>
  ) => interpolate(labels[key], vars)

  const [showSource, setShowSource] = React.useState(false)
  const runReaderAction: typeof onRunAction = async (
    message,
    action,
    value
  ) => {
    if (action === "showOriginal" && props.getMessageSource) {
      setShowSource(true)
      return
    }
    await onRunAction(message, action, value)
  }

  if (showSource && detail && props.getMessageSource) {
    return (
      <MessageSource
        messageId={detail.id}
        getSource={props.getMessageSource}
        labels={labels}
        onBack={() => setShowSource(false)}
        onError={props.onError}
      />
    )
  }

  if (isLoading) {
    return (
      <>
        <div className="flex min-h-12 shrink-0 items-center border-b border-border px-2">
          {props.backButton}
        </div>
        <div
          role="status"
          className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <LoaderCircleIcon className="size-4 animate-spin" />
          {t("loading")}
        </div>
      </>
    )
  }

  if (!detail)
    return (
      <div className="flex min-h-12 items-center border-b border-border px-2">
        {props.backButton}
      </div>
    )

  const threadDetail = props.threadDetailOverride
  const threadMessages =
    props.thread?.threadId && props.thread.threadId === detail.threadId
      ? !threadDetail
        ? props.thread.messages
        : props.thread.messages.some(
              (message) => message.id === threadDetail.id
            )
          ? props.thread.messages.map((message) =>
              message.id === threadDetail.id ? threadDetail : message
            )
          : [...props.thread.messages, threadDetail]
      : [detail]
  const labelsToShow = detail.labels ?? []
  const isFavorite = detail.isFavorite ?? false
  const enabledActions = new Set(messageActions)
  const toolbarLeadingActions = TOOLBAR_LEADING_MESSAGE_ACTIONS.filter(
    (action) => enabledActions.has(action)
  )
  const toolbarTrailingActions = TOOLBAR_TRAILING_MESSAGE_ACTIONS.filter(
    (action) => enabledActions.has(action)
  )
  const headerActions = HEADER_MESSAGE_ACTIONS.filter((action) =>
    enabledActions.has(action)
  )
  const run = (
    action: MailyMailboxMessageAction,
    value?: string | boolean | null
  ) => runReaderAction(detail, action, value)
  const actionLabel = (
    action: MailyMailboxMessageAction,
    mode: "button" | "menu"
  ) => {
    if (action === "favorite" && isFavorite) return t("actions.unfavorite")
    if (action === "showOriginal" && props.getMessageSource)
      return t("actions.showOriginal")
    const metadata = MESSAGE_ACTION_METADATA[action]
    return t(
      mode === "button" && metadata.toolbarLabel
        ? metadata.toolbarLabel
        : metadata.label
    )
  }
  const actionValue = (action: MailyMailboxMessageAction) => {
    if (action === "favorite") return !isFavorite
    return MESSAGE_ACTION_METADATA[action].value
  }
  const actionIconClassName = (action: MailyMailboxMessageAction) =>
    cn(
      "size-4",
      action === "favorite" && isFavorite && "fill-current text-amber-500"
    )
  const renderActionButton = (action: MailyMailboxMessageAction) => (
    <MessageActionButton
      key={action}
      label={actionLabel(action, "button")}
      className={
        action === "react" ? "hidden @md/mailbox:inline-flex" : undefined
      }
      pending={actionPending === action}
      pressed={action === "favorite" ? isFavorite : undefined}
      onClick={() => run(action, actionValue(action))}
    >
      {action === "showOriginal" && !props.getMessageSource ? (
        <ExternalLink className="size-4" />
      ) : (
        MESSAGE_ACTION_METADATA[action].icon(actionIconClassName(action))
      )}
    </MessageActionButton>
  )

  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-1 border-b border-border px-2 py-1">
        <div className="flex flex-wrap items-center gap-1">
          {props.backButton}
          {toolbarLeadingActions.map(renderActionButton)}
        </div>
        <div className="flex items-center gap-1">
          {toolbarTrailingActions.map(renderActionButton)}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="min-w-0 [contain:inline-size]">
          <div className="flex flex-col gap-4 px-3 pt-4 @lg/mailbox:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="min-w-0 text-xl leading-tight font-semibold [overflow-wrap:anywhere] break-words">
                    {detail.subject || t("message.noSubject")}
                  </h2>
                  {labelsToShow.map((label) => (
                    <Badge key={label} variant="secondary">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-1">
                {headerActions.map(renderActionButton)}
                <MessageActionButton
                  label={t("actions.reply")}
                  pending={false}
                  onClick={() => onReply(detail)}
                >
                  <Reply className="size-4" />
                </MessageActionButton>
                <MessageActionButton
                  className={
                    messageActions.length > 0
                      ? "hidden @md/mailbox:inline-flex"
                      : undefined
                  }
                  label={t("actions.replyAll")}
                  pending={false}
                  onClick={() => onReplyAll(detail)}
                >
                  <ReplyAll className="size-4" />
                </MessageActionButton>
                <MessageActionButton
                  className={
                    messageActions.length > 0
                      ? "hidden @md/mailbox:inline-flex"
                      : undefined
                  }
                  label={t("actions.forward")}
                  pending={false}
                  onClick={() => onForward(detail)}
                >
                  <Forward className="size-4" />
                </MessageActionButton>
                {messageActions.length > 0 && (
                  <MessageMoreMenu
                    detail={detail}
                    labels={labels}
                    messageActions={messageActions}
                    actionPending={actionPending}
                    isFavorite={isFavorite}
                    onRunAction={runReaderAction}
                    onReplyAll={() => onReplyAll(detail)}
                    onForward={() => onForward(detail)}
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback>
                  {senderInitial(detail.fromAddress)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="truncate text-sm font-medium">
                    {detail.fromAddress}
                  </span>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(detail.createdAt, "long")}
                  </time>
                </div>
                <div className="text-xs [overflow-wrap:anywhere] break-words text-muted-foreground">
                  {t("message.toPrefix")}{" "}
                  <span>{formatRecipients(detail.toAddresses)}</span>
                  {detail.ccAddresses && detail.ccAddresses.length > 0 && (
                    <>
                      {" - "}
                      {t("message.cc")}{" "}
                      <span>{formatRecipients(detail.ccAddresses)}</span>
                    </>
                  )}
                </div>
                {detail.lastError && (
                  <div className="mt-1 text-xs text-destructive">
                    {detail.lastError}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="min-w-0 pt-4">
            {threadMessages.map((message) => (
              <section
                key={message.id}
                className="mx-5 my-3 border-b border-border pb-4 last:border-b-0"
              >
                {threadMessages.length > 1 && (
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{message.fromAddress}</span>
                    <time>{formatDate(message.createdAt, "long")}</time>
                  </div>
                )}
                <div className="px-2">
                  {message.bodyHtml ? (
                    <HtmlBody html={message.bodyHtml} />
                  ) : message.bodyText ? (
                    <pre className="py-2 font-sans text-sm leading-relaxed [overflow-wrap:anywhere] break-words whitespace-pre-wrap">
                      {message.bodyText}
                    </pre>
                  ) : (
                    <p className="px-4 py-2 text-sm text-muted-foreground">
                      {t("message.noBody")}
                    </p>
                  )}
                </div>
                {message.attachments && message.attachments.length > 0 && (
                  <section
                    aria-label={t("message.attachments", {
                      count: message.attachments.length,
                    })}
                    className="mx-3 my-4 border-t border-border pt-4"
                  >
                    <h3 className="mb-3 text-sm font-medium">
                      {t("message.attachments", {
                        count: message.attachments.length,
                      })}
                    </h3>
                    <ul className="space-y-2">
                      {message.attachments.map(
                        (attachment, attachmentIndex) => (
                          <li
                            key={`${message.id}:${attachment.id ?? attachmentIndex}`}
                          >
                            <MessageAttachment
                              messageId={message.id}
                              attachment={attachment}
                              attachmentIndex={attachmentIndex}
                              labels={labels}
                              downloadAttachment={props.downloadAttachment}
                              onError={props.onError}
                            />
                          </li>
                        )
                      )}
                    </ul>
                  </section>
                )}
              </section>
            ))}
          </div>
        </div>
      </ScrollArea>
    </article>
  )
}

function MessageAttachment({
  messageId,
  attachment,
  attachmentIndex,
  labels,
  downloadAttachment,
  onError,
}: MailyMailboxAttachmentDownloadInput & {
  labels: MailyMailboxLabels
  downloadAttachment: MailyMailboxDataSource["downloadAttachment"]
  onError: MailyMailboxViewProps["onError"]
}) {
  const [pending, setPending] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const inFlight = React.useRef(false)
  const mounted = React.useRef(false)
  React.useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const t = (
    key: MailyMailboxLabelKey,
    vars?: Record<string, string | number>
  ) => interpolate(labels[key], vars)
  const downloadLabel = t(
    pending ? "attachment.downloading" : "attachment.download",
    { filename: attachment.filename }
  )
  const sizeLabels = [
    "attachment.sizeBytes",
    "attachment.sizeKB",
    "attachment.sizeMB",
    "attachment.sizeGB",
    "attachment.sizeTB",
  ] as const
  let sizeLabel: string | undefined
  if (
    typeof attachment.size === "number" &&
    Number.isFinite(attachment.size) &&
    attachment.size >= 0
  ) {
    let size = attachment.size
    let unit = 0
    while (size >= 1024 && unit < sizeLabels.length - 1) {
      size /= 1024
      unit++
    }
    sizeLabel = t(sizeLabels[unit], { size: Number(size.toFixed(1)) })
  }
  const metadata = [attachment.contentType, sizeLabel]
    .filter(Boolean)
    .join(" · ")

  const download = async () => {
    if (!downloadAttachment || inFlight.current) return
    inFlight.current = true
    setPending(true)
    setFailed(false)
    try {
      await downloadAttachment({ messageId, attachment, attachmentIndex })
    } catch (error) {
      if (mounted.current) {
        setFailed(true)
        onError?.(error, "attachmentDownload")
      }
    } finally {
      inFlight.current = false
      if (mounted.current) setPending(false)
    }
  }

  return (
    <Attachment className="w-full flex-nowrap" aria-busy={pending}>
      <AttachmentMedia>
        <FileText className="size-4" aria-hidden="true" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle className="[overflow-wrap:anywhere] whitespace-normal">
          {attachment.filename}
        </AttachmentTitle>
        {metadata && (
          <AttachmentDescription className="[overflow-wrap:anywhere] whitespace-normal">
            {metadata}
          </AttachmentDescription>
        )}
        {failed && (
          <p
            role="alert"
            className="mt-1 text-xs [overflow-wrap:anywhere] text-destructive"
          >
            {t("errors.attachmentDownload", { filename: attachment.filename })}
          </p>
        )}
      </AttachmentContent>
      {downloadAttachment && (
        <AttachmentActions>
          <MailboxTooltip label={downloadLabel}>
            <AttachmentAction
              type="button"
              size="icon"
              aria-label={downloadLabel}
              disabled={pending}
              onClick={download}
            >
              {pending ? (
                <LoaderCircleIcon
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
            </AttachmentAction>
          </MailboxTooltip>
        </AttachmentActions>
      )}
    </Attachment>
  )
}

/** A neutral tooltip trigger preserves the nested control's own primitive state. */
function MailboxTooltip({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center",
            className
          )}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

// Forward trigger props/ref through to the host Button for Popover/Dialog/Sheet/Menu composition.
const MailboxIconButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button> & {
    "aria-label": string
    tooltipClassName?: string
  }
>(({ title: _title, className, tooltipClassName, ...props }, ref) => (
  <MailboxTooltip label={props["aria-label"]} className={tooltipClassName}>
    <Button
      {...props}
      ref={ref}
      className={cn("size-11 shrink-0", className)}
    />
  </MailboxTooltip>
))
MailboxIconButton.displayName = "MailboxIconButton"

function MessageActionButton(props: {
  label: string
  pending: boolean
  pressed?: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <MailboxIconButton
      type="button"
      variant="ghost"
      size="icon"
      aria-label={props.label}
      aria-pressed={props.pressed}
      disabled={props.pending}
      onClick={props.onClick}
      className="size-11 shrink-0"
      tooltipClassName={props.className}
    >
      {props.pending ? (
        <LoaderCircleIcon className="size-4 animate-spin" />
      ) : (
        props.children
      )}
    </MailboxIconButton>
  )
}

function MessageMoreMenu(props: {
  onReplyAll: () => void
  onForward: () => void
  detail: MailyMailboxMessageDetail
  labels: MailyMailboxLabels
  messageActions: readonly MailyMailboxMessageAction[]
  actionPending: MailyMailboxMessageAction | null
  isFavorite: boolean
  onRunAction: (
    detail: MailyMailboxMessageDetail,
    action: MailyMailboxMessageAction,
    value?: string | boolean | null
  ) => Promise<void>
}) {
  const {
    detail,
    labels,
    messageActions,
    actionPending,
    isFavorite,
    onRunAction,
  } = props
  const t = (
    key: MailyMailboxLabelKey,
    vars?: Record<string, string | number>
  ) => interpolate(labels[key], vars)
  const item = (action: MailyMailboxMessageAction) => {
    const metadata = MESSAGE_ACTION_METADATA[action]
    const label =
      action === "favorite" && isFavorite
        ? t("actions.unfavorite")
        : t(metadata.label)
    const value = action === "favorite" ? !isFavorite : metadata.value

    return (
      <DropdownMenuItem
        key={action}
        onClick={() => onRunAction(detail, action, value)}
        disabled={actionPending !== null}
        variant={metadata.variant}
      >
        {actionPending === action ? (
          <LoaderCircleIcon className="size-4 animate-spin" />
        ) : (
          metadata.icon(
            cn(
              "size-4",
              action === "favorite" &&
                isFavorite &&
                "fill-current text-amber-500"
            )
          )
        )}
        {label}
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <MailboxIconButton
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
          aria-label={t("actions.more")}
        >
          <MoreVertical className="size-4" />
        </MailboxIconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 max-w-[calc(100vw-2rem)]"
      >
        <DropdownMenuItem onClick={props.onReplyAll}>
          <ReplyAll className="size-4" />
          {t("actions.replyAll")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={props.onForward}>
          <Forward className="size-4" />
          {t("actions.forward")}
        </DropdownMenuItem>
        {messageActions.map((action) => item(action))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function HtmlBody({ html }: { html: string }) {
  const ref = React.useRef<HTMLIFrameElement>(null)

  const handleLoad = () => {
    const frame = ref.current
    if (!frame) return
    try {
      const doc = frame.contentDocument
      if (!doc) return
      const h = Math.max(
        doc.body.scrollHeight,
        doc.documentElement.scrollHeight
      )
      frame.style.height = `${h + 8}px`
      doc.addEventListener(
        "wheel",
        (event) => {
          const viewport = frame.closest(
            '[data-slot="scroll-area-viewport"]'
          ) as HTMLElement | null
          if (!viewport) return
          const maxTop = viewport.scrollHeight - viewport.clientHeight
          if (maxTop <= 0) return
          const unit =
            event.deltaMode === 1
              ? 16
              : event.deltaMode === 2
                ? viewport.clientHeight
                : 1
          const nextTop = Math.max(
            0,
            Math.min(maxTop, viewport.scrollTop + event.deltaY * unit)
          )
          viewport.scrollTop = nextTop
          event.preventDefault()
          event.stopPropagation()
        },
        { passive: false }
      )
    } catch {
      frame.style.height = "50vh"
    }
  }

  const srcDoc = `<!doctype html><html><head><meta charset="utf-8"><style>
:root { color-scheme: light; }
html, body { margin: 0; padding: 0; background: #ffffff; }
body {
  padding: 8px 16px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #202124;
  word-wrap: break-word;
}
img { max-width: 100%; height: auto; }
table { max-width: 100%; }
a { color: #1a73e8; }
blockquote { margin: 0; padding: 4px 0 4px 12px; border-left: 2px solid #dadce0; color: #5f6368; }
</style></head><body>${html}</body></html>`

  return (
    <iframe
      ref={ref}
      title="message-html"
      sandbox="allow-same-origin"
      srcDoc={srcDoc}
      onLoad={handleLoad}
      className="block w-full bg-white"
      style={{ height: "240px" }}
    />
  )
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function plainTextToHtml(value: string) {
  const text = value.trim()
  if (!text) return undefined

  return text
    .split(/\n{2,}/)
    .map((paragraph) => {
      const html = paragraph
        .split("\n")
        .map((line) => escapeHtml(line))
        .join("<br>")
      return `<p>${html}</p>`
    })
    .join("")
}

function composeHtmlContent(values: MailyMailboxComposeValues) {
  return values.html?.trim() || plainTextToHtml(values.text)
}

function Compose(props: {
  initialValues: MailyMailboxComposeValues
  labels: MailyMailboxLabels
  loadContactSuggestions: (
    q: string
  ) => MaybePromise<MailyMailboxContactSuggestion[]>
  defaultBodyMode: MailyMailboxComposeBodyMode
  allowBodyModeSwitch: boolean
  editorProps?: Omit<
    EditorProps,
    "contentHtml" | "contentJson" | "onCreate" | "onUpdate"
  >
  isExistingDraft: boolean
  isSendUnresolved?: boolean
  isSaving: boolean
  isSending: boolean
  isDiscarding: boolean
  ownershipToken: object
  uploadAttachment?: MailyMailboxDataSource["uploadAttachment"]
  discardUploadedAttachment?: MailyMailboxDataSource["discardUploadedAttachment"]
  onError?: MailyMailboxViewProps["onError"]
  onDirtyChange: (dirty: boolean) => void
  onSave: (values: MailyMailboxComposeValues) => Promise<boolean>
  onSend: (
    values: MailyMailboxComposeValues,
    onPrepared?: () => void
  ) => Promise<void>
  onDiscard: () => Promise<void>
}) {
  const {
    initialValues,
    labels,
    loadContactSuggestions,
    defaultBodyMode,
    allowBodyModeSwitch,
    editorProps,
    isExistingDraft,
    isSaving,
    isSendUnresolved = false,
    isSending,
    isDiscarding,
    ownershipToken,
    uploadAttachment,
    discardUploadedAttachment,
    onError,
    onDirtyChange,
    onSave,
    onSend,
    onDiscard,
  } = props
  const subjectInputId = React.useId()
  const bodyInputId = React.useId()
  const bodyLabelId = React.useId()
  const [values, setValues] =
    React.useState<MailyMailboxComposeValues>(initialValues)
  const [acknowledged, setAcknowledged] = React.useState(() =>
    JSON.stringify(initialValues)
  )
  const [hasAcknowledgedWrite, setHasAcknowledgedWrite] =
    React.useState(isExistingDraft)
  const [saveError, setSaveError] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const uploadInput = React.useRef<HTMLInputElement>(null)
  const uploadLock = React.useRef(false)
  const alive = React.useRef(false)
  const uploadOwner = React.useMemo(
    () => ({ active: true }),
    [ownershipToken, uploadAttachment]
  )
  const ownedUploads = React.useRef(
    new Map<string, MailyMailboxUploadedAttachment>()
  )
  const saveLock = React.useRef(false)
  const valuesRef = React.useRef(values)
  valuesRef.current = values
  React.useLayoutEffect(() => {
    alive.current = true
    uploadOwner.active = true
    return () => {
      alive.current = false
      uploadOwner.active = false
      for (const attachment of ownedUploads.current.values())
        void Promise.resolve(discardUploadedAttachment?.(attachment)).catch(
          (error) => onError?.(error, "attachmentDiscard")
        )
      ownedUploads.current.clear()
    }
  }, [uploadOwner])
  const serialized = JSON.stringify(values)
  const dirty = serialized !== acknowledged
  React.useLayoutEffect(() => {
    onDirtyChange(dirty || uploading)
  }, [dirty, uploading, onDirtyChange])
  React.useEffect(() => {
    if (!dirty && !uploading) return
    const protect = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", protect)
    return () => window.removeEventListener("beforeunload", protect)
  }, [dirty, uploading])
  const save = async (snapshot: MailyMailboxComposeValues) => {
    if (saveLock.current || uploadLock.current) return
    const owner = uploadOwner
    saveLock.current = true
    const pendingAttachments = (snapshot.attachments ?? []).filter(
      (attachment) => ownedUploads.current.delete(attachment.id)
    )
    try {
      const accepted = await onSave(snapshot)
      if (!accepted) {
        for (const attachment of pendingAttachments) {
          if (owner.active) ownedUploads.current.set(attachment.id, attachment)
          else
            void Promise.resolve(discardUploadedAttachment?.(attachment)).catch(
              (error) => onError?.(error, "attachmentDiscard")
            )
        }
      }
      if (!owner.active) return false
      if (accepted) {
        for (const attachment of snapshot.attachments ?? [])
          ownedUploads.current.delete(attachment.id)
        setHasAcknowledgedWrite(true)
        setAcknowledged(JSON.stringify(snapshot))
      }
      setSaveError(!accepted)
      return accepted
    } finally {
      saveLock.current = false
    }
  }
  React.useEffect(() => {
    if (
      !dirty ||
      isSaving ||
      isSending ||
      isDiscarding ||
      isSendUnresolved ||
      uploading ||
      saveError
    )
      return
    const timer = window.setTimeout(() => {
      void save(valuesRef.current)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [
    serialized,
    acknowledged,
    isSaving,
    isSending,
    isDiscarding,
    isSendUnresolved,
    uploading,
    saveError,
  ])
  const uploadFiles = async (files: File[]) => {
    if (!uploadAttachment || uploadLock.current) return
    uploadLock.current = true
    setUploading(true)
    setUploadError(null)
    try {
      for (const file of files) {
        if (!uploadOwner.active) break
        try {
          const attachment = await uploadAttachment(file)
          if (!uploadOwner.active) {
            await discardUploadedAttachment?.(attachment)
            continue
          }
          ownedUploads.current.set(attachment.id, attachment)
          setValues((previous) => ({
            ...previous,
            attachments: [...(previous.attachments ?? []), attachment],
          }))
        } catch (error) {
          if (alive.current) {
            setUploadError(file.name)
            onError?.(error, "attachmentUpload")
          }
        }
      }
    } finally {
      uploadLock.current = false
      if (alive.current) setUploading(false)
    }
  }
  const [bodyMode, setBodyMode] =
    React.useState<MailyMailboxComposeBodyMode>(defaultBodyMode)
  const [editorRevision, setEditorRevision] = React.useState(0)
  const [showCc, setShowCc] = React.useState(
    () => initialValues.cc.trim().length > 0
  )
  const [showBcc, setShowBcc] = React.useState(
    () => initialValues.bcc.trim().length > 0
  )
  const [focusRecipient, setFocusRecipient] = React.useState<
    "cc" | "bcc" | null
  >(null)
  const toInputId = React.useId()
  const ccInputId = React.useId()
  const bccInputId = React.useId()
  const t = (
    key: MailyMailboxLabelKey,
    vars?: Record<string, string | number>
  ) => interpolate(labels[key], vars)

  // Compose is mounted only with hydrated content and keyed by draft identity.
  // Later reads must not replace edits owned by this mounted compose session.

  const set = (key: keyof MailyMailboxComposeValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const setBodyText = (value: string) =>
    setValues((prev) => ({
      ...prev,
      text: value,
      html: bodyMode === "plainText" ? null : prev.html,
    }))

  const updateFromEditor = React.useCallback(
    (editor: Parameters<NonNullable<EditorProps["onUpdate"]>>[0]) => {
      const text = editor.getText({ blockSeparator: "\n" })
      const html = editor.getHTML()
      setValues((prev) => ({ ...prev, text, html }))
    },
    []
  )

  const submit = async () => {
    if (uploadLock.current) return
    const snapshot = valuesRef.current
    const pendingAttachments = (snapshot.attachments ?? []).filter(
      (attachment) => ownedUploads.current.delete(attachment.id)
    )
    let prepared = false
    try {
      await onSend(snapshot, () => {
        prepared = true
        if (uploadOwner.active) {
          setHasAcknowledgedWrite(true)
          setAcknowledged(JSON.stringify(snapshot))
        }
      })
    } finally {
      if (!prepared)
        for (const attachment of pendingAttachments) {
          if (uploadOwner.active)
            ownedUploads.current.set(attachment.id, attachment)
          else
            void Promise.resolve(discardUploadedAttachment?.(attachment)).catch(
              (error) => onError?.(error, "attachmentDiscard")
            )
        }
    }
  }

  const switchBodyMode = (nextMode: MailyMailboxComposeBodyMode) => {
    if (nextMode === bodyMode) return
    setBodyMode(nextMode)
    if (nextMode === "mailyEditor") {
      setEditorRevision((revision) => revision + 1)
    }
  }

  const editorConfig = editorProps?.config
  const editorBodyClassName = cn("mt-2 min-h-56", editorConfig?.bodyClassName)
  const editorContentClassName = cn("min-h-48", editorConfig?.contentClassName)

  return (
    <form
      className="flex min-h-0 min-w-0 flex-col gap-4 p-3 [contain:inline-size] @lg/mailbox:p-5"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <div className="flex flex-col gap-2 @lg/mailbox:flex-row @lg/mailbox:items-center @lg/mailbox:justify-between">
        <h2 className="text-lg font-semibold">
          {isExistingDraft ? t("compose.editDraft") : t("compose.new")}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="min-h-11"
            variant="ghost"
            onClick={() => onDiscard()}
            disabled={isSaving || isSending || isDiscarding || isSendUnresolved}
          >
            <Trash2 className="size-4" />
            {t("compose.discard")}
          </Button>
          <Button
            type="button"
            size="sm"
            className="min-h-11"
            variant="outline"
            onClick={() => {
              setSaveError(false)
              void save(values)
            }}
            disabled={isSaving || isSending || isDiscarding || isSendUnresolved}
          >
            {isSaving && <LoaderCircleIcon className="size-4 animate-spin" />}
            {t("compose.saveDraft")}
          </Button>
          <Button
            type="submit"
            size="sm"
            className="min-h-11"
            disabled={isSaving || isSending || isDiscarding || uploading}
          >
            {isSending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {t("compose.send")}
          </Button>
        </div>
      </div>

      <div role="status" className="text-sm text-muted-foreground">
        {saveError
          ? t("compose.saveError")
          : isSaving
            ? t("compose.saving")
            : !dirty && hasAcknowledgedWrite
              ? t("compose.autosaved")
              : null}
      </div>
      {uploadAttachment && (
        <div className="flex flex-col gap-2">
          {/* shadcn-audit-ignore-next-line invisible native file picker */}
          <input
            ref={uploadInput}
            type="file"
            multiple
            hidden
            onChange={(event) => {
              const files = Array.from(event.target.files ?? [])
              event.target.value = ""
              void uploadFiles(files)
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            disabled={
              uploading ||
              isSaving ||
              isSending ||
              isDiscarding ||
              isSendUnresolved
            }
            onClick={() => uploadInput.current?.click()}
          >
            {uploading ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <Paperclip className="size-4" />
            )}
            {t("compose.attach")}
          </Button>
          {uploadError && (
            <p role="alert">
              {t("compose.attachmentUploadError", { filename: uploadError })}
            </p>
          )}
        </div>
      )}
      {(values.attachments ?? []).map((attachment, index) => (
        <Attachment key={`${attachment.id}:${index}`}>
          <AttachmentContent>
            <AttachmentTitle>{attachment.filename}</AttachmentTitle>
          </AttachmentContent>
          <AttachmentActions>
            <MailboxTooltip
              label={t("compose.removeAttachment", {
                filename: attachment.filename,
              })}
            >
              <AttachmentAction
                type="button"
                disabled={
                  isSaving ||
                  isSending ||
                  isDiscarding ||
                  isSendUnresolved ||
                  uploading
                }
                aria-label={t("compose.removeAttachment", {
                  filename: attachment.filename,
                })}
                onClick={() => {
                  if (ownedUploads.current.delete(attachment.id))
                    void Promise.resolve(
                      discardUploadedAttachment?.(attachment)
                    ).catch((error) => onError?.(error, "attachmentDiscard"))
                  setValues((previous) => ({
                    ...previous,
                    attachments: previous.attachments?.filter(
                      (_, position) => position !== index
                    ),
                  }))
                }}
              >
                <X className="size-4" />
              </AttachmentAction>
            </MailboxTooltip>
          </AttachmentActions>
        </Attachment>
      ))}
      <FieldSet
        disabled={isSaving || isSending || isDiscarding || isSendUnresolved}
        className="flex min-h-0 flex-1 flex-col gap-3"
      >
        <RecipientField
          id={toInputId}
          label={t("message.to")}
          actions={
            (!showCc || !showBcc) && (
              <div className="flex items-center gap-1">
                {!showCc && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setShowCc(true)
                      setFocusRecipient("cc")
                    }}
                    className="h-auto rounded-sm px-1 py-0 text-sm font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                  >
                    {t("message.cc")}
                  </Button>
                )}
                {!showBcc && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setShowBcc(true)
                      setFocusRecipient("bcc")
                    }}
                    className="h-auto rounded-sm px-1 py-0 text-sm font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                  >
                    {t("message.bcc")}
                  </Button>
                )}
              </div>
            )
          }
        >
          <RecipientAutocompleteInput
            id={toInputId}
            value={values.to}
            onChange={(value) => set("to", value)}
            placeholder=""
            emptyLabel={t("contacts.noSuggestions")}
            loadingLabel={t("loading")}
            loadSuggestions={loadContactSuggestions}
            className="h-7 px-2.5 py-0"
          />
        </RecipientField>
        {showCc && (
          <RecipientField id={ccInputId} label={t("message.cc")}>
            <RecipientAutocompleteInput
              id={ccInputId}
              value={values.cc}
              onChange={(value) => set("cc", value)}
              placeholder=""
              emptyLabel={t("contacts.noSuggestions")}
              loadingLabel={t("loading")}
              loadSuggestions={loadContactSuggestions}
              autoFocus={focusRecipient === "cc"}
              className="h-7 px-2.5 py-0"
            />
          </RecipientField>
        )}
        {showBcc && (
          <RecipientField id={bccInputId} label={t("message.bcc")}>
            <RecipientAutocompleteInput
              id={bccInputId}
              value={values.bcc}
              onChange={(value) => set("bcc", value)}
              placeholder=""
              emptyLabel={t("contacts.noSuggestions")}
              loadingLabel={t("loading")}
              loadSuggestions={loadContactSuggestions}
              autoFocus={focusRecipient === "bcc"}
              className="h-7 px-2.5 py-0"
            />
          </RecipientField>
        )}
        <Field>
          <FieldLabel htmlFor={subjectInputId}>
            {t("message.subject")}
          </FieldLabel>
          <Input
            id={subjectInputId}
            name="subject"
            value={values.subject}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              set("subject", event.target.value)
            }
          />
        </Field>
        <Field className="min-h-0 flex-1 gap-1.5" aria-labelledby={bodyLabelId}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label
              id={bodyLabelId}
              htmlFor={bodyMode === "plainText" ? bodyInputId : undefined}
            >
              {t("message.body")}
            </Label>
            {allowBodyModeSwitch && (
              <ToggleGroupCompat
                selectionMode="single"
                value={bodyMode}
                className="gap-1"
              >
                <ToggleGroupCompatItem
                  type="button"
                  value="plainText"
                  pressed={bodyMode === "plainText"}
                  onClick={() => switchBodyMode("plainText")}
                  size="sm"
                  className="min-h-11"
                >
                  {t("compose.mode.plainText")}
                </ToggleGroupCompatItem>
                <ToggleGroupCompatItem
                  type="button"
                  value="mailyEditor"
                  pressed={bodyMode === "mailyEditor"}
                  onClick={() => switchBodyMode("mailyEditor")}
                  size="sm"
                  className="min-h-11"
                >
                  {t("compose.mode.mailyEditor")}
                </ToggleGroupCompatItem>
              </ToggleGroupCompat>
            )}
          </div>
          {bodyMode === "mailyEditor" ? (
            <Editor
              {...editorProps}
              editable={
                !isSaving && !isSending && !isDiscarding && !isSendUnresolved
              }
              key={editorRevision}
              contentHtml={composeHtmlContent(values)}
              onCreate={updateFromEditor}
              onUpdate={updateFromEditor}
              config={{
                ...editorConfig,
                hasMenuBar: editorConfig?.hasMenuBar ?? true,
                wrapClassName: cn("min-h-0", editorConfig?.wrapClassName),
                bodyClassName: editorBodyClassName,
                contentClassName: editorContentClassName,
                autofocus: editorConfig?.autofocus ?? "end",
              }}
            />
          ) : (
            <Textarea
              id={bodyInputId}
              value={values.text}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                setBodyText(event.target.value)
              }
              className="h-full min-h-40 resize-none"
            />
          )}
        </Field>
      </FieldSet>
    </form>
  )
}

const RECIPIENT_SEPARATOR_PATTERN = /[,;\n]/

function recipientTokenForCaret(value: string, caret: number) {
  const position = Math.max(0, Math.min(caret, value.length))
  let start = position
  let end = position

  while (start > 0 && !RECIPIENT_SEPARATOR_PATTERN.test(value[start - 1])) {
    start -= 1
  }
  while (end < value.length && !RECIPIENT_SEPARATOR_PATTERN.test(value[end])) {
    end += 1
  }

  return {
    start,
    end,
    query: value.slice(start, end).trim(),
  }
}

function formatContactSuggestion(
  suggestion: MailyMailboxContactSuggestion
): string {
  const displayName = suggestion.displayName?.trim()
  if (!displayName) return suggestion.address
  return `${displayName} <${suggestion.address}>`
}

function replaceRecipientToken(
  value: string,
  caret: number,
  suggestion: MailyMailboxContactSuggestion
) {
  const token = recipientTokenForCaret(value, caret)
  const before = value.slice(0, token.start)
  const replacement = formatContactSuggestion(suggestion)
  let after = value.slice(token.end)

  if (!after) {
    after = ", "
  } else if (/^[,;]/.test(after)) {
    after = after.replace(/^([,;])\s*/, "$1 ")
  } else if (/^\n/.test(after)) {
    after = after.replace(/^\n\s*/, "\n")
  } else {
    after = `, ${after.trimStart()}`
  }

  const leadingSpace = before.length > 0 && !/[\s\n]$/.test(before) ? " " : ""
  const nextValue = `${before}${leadingSpace}${replacement}${after}`

  return {
    value: nextValue,
    caret: before.length + leadingSpace.length + replacement.length + 2,
  }
}

function RecipientAutocompleteInput(props: {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  emptyLabel: string
  loadingLabel: string
  loadSuggestions: (q: string) => MaybePromise<MailyMailboxContactSuggestion[]>
  autoFocus?: boolean
  className?: string
}) {
  const {
    id,
    value,
    onChange,
    placeholder,
    emptyLabel,
    loadingLabel,
    loadSuggestions,
    autoFocus,
    className,
  } = props
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const caretRef = React.useRef(0)
  const requestRef = React.useRef(0)
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [suggestions, setSuggestions] = React.useState<
    MailyMailboxContactSuggestion[]
  >([])

  const updateQuery = React.useCallback((nextValue: string, caret: number) => {
    caretRef.current = caret
    const nextQuery = recipientTokenForCaret(nextValue, caret).query
    setQuery(nextQuery)
    setOpen(nextQuery.length > 0)
  }, [])

  React.useEffect(() => {
    const requestId = ++requestRef.current
    const q = query.trim()
    if (!open || !q) {
      setSuggestions([])
      setLoading(false)
      return
    }

    setLoading(true)

    const timer = window.setTimeout(() => {
      Promise.resolve(loadSuggestions(q))
        .then((next) => {
          if (requestRef.current === requestId) {
            setSuggestions(next)
          }
        })
        .catch(() => {
          if (requestRef.current === requestId) setSuggestions([])
        })
        .finally(() => {
          if (requestRef.current === requestId) {
            setLoading(false)
          }
        })
    }, 150)

    return () => {
      window.clearTimeout(timer)
      requestRef.current += 1
    }
  }, [loadSuggestions, open, query])

  React.useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus()
    }
  }, [autoFocus])

  React.useEffect(() => {
    if (!open) return

    const frame = window.requestAnimationFrame(() => {
      const input = inputRef.current
      if (!input) return

      input.focus()
      input.setSelectionRange(caretRef.current, caretRef.current)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [open])

  const selectSuggestion = (suggestion: MailyMailboxContactSuggestion) => {
    const next = replaceRecipientToken(value, caretRef.current, suggestion)
    onChange(next.value)
    setOpen(false)
    setQuery("")
    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(next.caret, next.caret)
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild data-slot="input-group-control">
        <InputGroupInput
          id={id}
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const nextValue = event.target.value
            onChange(nextValue)
            updateQuery(
              nextValue,
              event.target.selectionStart ?? nextValue.length
            )
          }}
          onFocus={(event: React.FocusEvent<HTMLInputElement>) =>
            updateQuery(
              event.currentTarget.value,
              event.currentTarget.selectionStart ??
                event.currentTarget.value.length
            )
          }
          onClick={(event: React.MouseEvent<HTMLInputElement>) =>
            updateQuery(
              event.currentTarget.value,
              event.currentTarget.selectionStart ??
                event.currentTarget.value.length
            )
          }
          onKeyUp={(event: React.KeyboardEvent<HTMLInputElement>) =>
            updateQuery(
              event.currentTarget.value,
              event.currentTarget.selectionStart ??
                event.currentTarget.value.length
            )
          }
          onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Escape") setOpen(false)
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={className}
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        style={{
          width: "var(--radix-popover-trigger-width, var(--anchor-width))",
        }}
        className="max-w-[calc(100vw-2rem)] min-w-[min(18rem,calc(100vw-2rem))] p-0"
      >
        <Command shouldFilter={false}>
          <CommandList className="max-h-56">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                <LoaderCircleIcon className="size-4 animate-spin" />
                {loadingLabel}
              </div>
            ) : suggestions.length > 0 ? (
              <CommandGroup>
                {suggestions.map((suggestion) => {
                  const label = formatContactSuggestion(suggestion)
                  return (
                    <CommandItem
                      key={suggestion.id ?? suggestion.address}
                      value={`${suggestion.displayName ?? ""} ${suggestion.address}`}
                      onSelect={() => selectSuggestion(suggestion)}
                      className="cursor-pointer"
                    >
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback>
                          {senderInitial(
                            suggestion.displayName || suggestion.address
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {suggestion.displayName || suggestion.address}
                        </span>
                        {suggestion.displayName && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {suggestion.address}
                          </span>
                        )}
                      </span>
                      <span className="sr-only">{label}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ) : (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                {emptyLabel}
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function RecipientField(props: {
  id: string
  label: string
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <Field
      orientation="horizontal"
      className="grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] items-center gap-2 border-b border-border py-1"
    >
      <FieldLabel
        htmlFor={props.id}
        className="shrink-0 font-medium text-muted-foreground"
      >
        {props.label}
      </FieldLabel>
      <InputGroup className="h-8 border-0 bg-input/40 shadow-none dark:bg-input/30">
        {props.children}
        {props.actions && (
          <InputGroupAddon align="inline-end" className="pr-1">
            {props.actions}
          </InputGroupAddon>
        )}
      </InputGroup>
    </Field>
  )
}

function EmptyState(props: {
  title: string
  description?: string
  className?: string
}) {
  return (
    <Empty className={cn("min-h-40 border-0 px-5 py-8", props.className)}>
      <EmptyHeader>
        <EmptyTitle>{props.title}</EmptyTitle>
        {props.description && (
          <EmptyDescription>{props.description}</EmptyDescription>
        )}
      </EmptyHeader>
    </Empty>
  )
}
