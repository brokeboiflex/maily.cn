import { useEffect, useMemo, useRef, useState } from "react"
import type { Editor as TiptapEditor, JSONContent } from "@tiptap/core"
import { Braces, Code2, ExternalLink, Palette } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Editor } from "@/components/maily"
import {
  getVariableSuggestions,
  VariableExtension,
} from "@/components/maily/extensions"
import { render as renderEmail } from "@/lib/maily-render"
import {
  DEFAULT_RENDERER_THEME,
  loadFont,
  type RendererThemeOptions,
} from "@/lib/maily-render/shared"
import {
  MailboxView,
  type MailyMailboxContactSuggestion,
  type MailyMailboxCounts,
  type MailyMailboxDataSource,
  type MailyMailboxDraftInput,
  type MailyMailboxFolder,
  type MailyMailboxMessageAction,
  type MailyMailboxMessageDetail,
  type MailyMailboxSearchQuery,
  type MailyMailboxLabel,
} from "@/components/maily/mailbox"
import { polishLabels, polishMailboxLabels } from "@/polish-labels"

const playgroundBaseUrl = import.meta.env.BASE_URL
const attachmentContents: Record<string, string> = {
  "queue-report":
    "All queued delivery attempts have cleared. The last accepted message was newsletter-candidate-42.\n",
  "queue-empty": "",
}
const emailPreviewTheme: RendererThemeOptions = DEFAULT_RENDERER_THEME
const emailPreviewFontClassName = "[font-family:Inter,sans-serif]"
const playgroundMessageActions = [
  "archive",
  "delete",
  "restore",
  "notSpam",
  "deleteForever",
  "favorite",
  "markUnread",
  "blockSender",
  "reportSpam",
  "reportPhishing",
  "reportIllegal",
  "react",
] as const satisfies readonly MailyMailboxMessageAction[]

const initialEditorContent: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Design your next email with Maily" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Hi ",
        },
        {
          type: "variable",
          attrs: {
            id: "first_name",
            label: "First name",
            fallback: "there",
            required: false,
          },
        },
        {
          type: "text",
          text: ", start typing, select text to format it, or enter / to explore the email blocks.",
        },
      ],
    },
  ],
}

const playgroundVariableExtension = VariableExtension.configure({
  suggestion: getVariableSuggestions("@"),
  variables: [
    {
      name: "first_name",
      label: "First name",
      required: false,
    },
    {
      name: "company_name",
      label: "Company name",
      required: false,
    },
    {
      name: "unsubscribe_url",
      label: "Unsubscribe URL",
      required: true,
      hideDefaultValue: true,
    },
  ],
})

function RenderedEmailPreview({ json }: { json: JSONContent }) {
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const renderKey = useMemo(() => JSON.stringify(json), [json])

  useEffect(() => {
    let active = true

    setHtml(null)
    setError(null)

    renderEmail(json, { theme: emailPreviewTheme })
      .then((nextHtml) => {
        if (active) setHtml(nextHtml)
      })
      .catch((cause) => {
        if (!active) return
        setError(
          cause instanceof Error ? cause.message : "Unable to render email."
        )
      })

    return () => {
      active = false
    }
  }, [json, renderKey])

  if (error) {
    return (
      <div className="flex min-h-[320px] items-center justify-center px-4 text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (!html) {
    return (
      <div className="flex min-h-[320px] items-center justify-center px-4 text-sm text-muted-foreground">
        Rendering email...
      </div>
    )
  }

  return (
    <iframe
      title="Rendered email preview"
      className="h-[480px] w-full rounded-md border-0 bg-background"
      sandbox=""
      srcDoc={html}
    />
  )
}

const promotionalNewsletterText = `The July Launch Kit is live.

Build a polished campaign in minutes with new launch sections, product grids, countdown-ready CTAs, and reusable brand footers.

Use code LAUNCH20 for 20% off annual plans through Friday.

Explore the kit: https://maily.cn/templates/launch-kit

You are receiving this because you subscribed to Maily product updates.`

const promotionalNewsletterHtml = `
  <div style="display:none;max-height:0;overflow:hidden;color:#ffffff;opacity:0;">
    New launch sections, product grids, and reusable campaign blocks are ready.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f4f1ea;">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border-collapse:collapse;background:#ffffff;border:1px solid #e5dfd4;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:22px 28px 18px 28px;border-bottom:1px solid #eee7dc;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:21px;line-height:1.2;font-weight:700;color:#141414;">
                    maily.cn
                  </td>
                  <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.4;color:#777064;">
                    July Launch Kit
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td>
              <img src="${playgroundBaseUrl}maily-cn-hero.png" width="640" alt="Maily email builder preview" style="display:block;width:100%;max-width:640px;height:auto;border:0;" />
            </td>
          </tr>

          <tr>
            <td style="padding:34px 32px 12px 32px;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:13px;line-height:1.4;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#b45a24;">
                New this week
              </div>
              <h1 style="margin:10px 0 14px 0;font-size:34px;line-height:1.08;color:#141414;font-weight:800;">
                Ship your launch newsletter before lunch.
              </h1>
              <p style="margin:0;font-size:16px;line-height:1.65;color:#4a4640;">
                The July Launch Kit adds ready-to-edit promo sections, product cards, image-led stories, and brand footers designed for campaigns that need to look finished fast.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 32px 30px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                <tr>
                  <td style="border-radius:999px;background:#141414;">
                    <a href="https://maily.cn/templates/launch-kit" style="display:inline-block;padding:14px 22px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1;font-weight:700;color:#ffffff;text-decoration:none;">
                      Explore the kit
                    </a>
                  </td>
                  <td style="padding-left:14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.4;color:#777064;">
                    20% off annual plans with code <strong style="color:#141414;">LAUNCH20</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 30px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                <tr>
                  <td width="50%" valign="top" style="padding:18px 18px 18px 0;border-top:1px solid #eee7dc;">
                    <h2 style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.25;color:#141414;">
                      Promo blocks
                    </h2>
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#5f5a52;">
                      Hero, offer, feature, pricing, and social-proof sections that match your shadcn theme.
                    </p>
                  </td>
                  <td width="50%" valign="top" style="padding:18px 0 18px 18px;border-top:1px solid #eee7dc;">
                    <h2 style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.25;color:#141414;">
                      Email-safe output
                    </h2>
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#5f5a52;">
                      Rendered with inline styles, safe fallbacks, and predictable mobile-ready tables.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px;background:#171615;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 8px 0;font-size:15px;line-height:1.55;color:#ffffff;font-weight:700;">
                Launch window ends Friday.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#c8c0b4;">
                Upgrade before the weekend and keep the new campaign kit, reusable saved blocks, and priority template imports in your workspace.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 32px 28px 32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#8a8378;">
              You are receiving this because you subscribed to Maily product updates.
              <br />
              Maily Studio, 226 Market Street, San Francisco, CA
              <br />
              <a href="https://maily.cn/preferences" style="color:#6f6558;text-decoration:underline;">Manage preferences</a>
              <span style="color:#c8c0b4;"> | </span>
              <a href="https://maily.cn/unsubscribe" style="color:#6f6558;text-decoration:underline;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`

const baseMessages: MailyMailboxMessageDetail[] = [
  {
    id: "msg-in-1",
    threadId: "thread-launch-kit",
    direction: "in",
    fromAddress: "Maily Studio <hello@maily.cn>",
    toAddresses: ["studio@maily.cn"],
    ccAddresses: [],
    bccAddresses: null,
    subject: "The July Launch Kit is live",
    snippet:
      "New launch sections, product grids, and reusable campaign blocks are ready.",
    status: "sent",
    hasAttachments: false,
    isFavorite: true,
    isUnread: true,
    labels: ["Inbox", "Promotions"],
    createdAt: new Date("2026-07-25T09:20:00"),
    bodyText: promotionalNewsletterText,
    bodyHtml: promotionalNewsletterHtml,
    attachments: [],
    messageId: "<july-launch-kit@maily.cn>",
    inReplyTo: null,
    headers: null,
    lastError: null,
    events: [],
  },
  {
    id: "msg-in-2",
    threadId: "thread-queue-clear",
    direction: "in",
    fromAddress: "billing@platform.example",
    toAddresses: ["studio@maily.cn"],
    ccAddresses: null,
    bccAddresses: null,
    subject: "SMTP queue cleared",
    snippet:
      "All queued delivery attempts have cleared. The last accepted message was newsletter-candidate-42.",
    status: "sent",
    hasAttachments: true,
    isFavorite: false,
    isUnread: false,
    labels: ["Inbox"],
    createdAt: new Date("2026-07-24T17:08:00"),
    bodyText:
      "All queued delivery attempts have cleared. The last accepted message was newsletter-candidate-42.",
    bodyHtml: null,
    attachments: [
      {
        id: "queue-report",
        filename: "delivery-report.txt",
        contentType: "text/plain",
        size: new Blob([attachmentContents["queue-report"]]).size,
      },
      {
        id: "queue-empty",
        filename: "delivery-errors.txt",
        contentType: "text/plain",
        size: 0,
      },
    ],
    messageId: "<queue-clear@maily.cn>",
    inReplyTo: null,
    headers: null,
    lastError: null,
    events: [],
  },
  {
    id: "msg-sent-1",
    threadId: "thread-mailbox-handoff",
    direction: "out",
    fromAddress: "Maily Studio <studio@maily.cn>",
    toAddresses: ["team@example.com"],
    ccAddresses: [],
    bccAddresses: [],
    subject: "Mailbox component handoff",
    snippet:
      "The inbox/sent/drafts surface is now a backend adapter component.",
    status: "sent",
    hasAttachments: false,
    isFavorite: false,
    isUnread: false,
    labels: ["Sent"],
    createdAt: new Date("2026-07-25T08:40:00"),
    bodyText:
      "The inbox/sent/drafts surface is now a backend adapter component. You can wire it to your mailbox API with the dataSource contract.",
    bodyHtml: null,
    attachments: [],
    messageId: "<mailbox-handoff@maily.cn>",
    inReplyTo: null,
    headers: null,
    lastError: null,
    events: [],
  },
  {
    id: "msg-in-handoff-reply",
    threadId: "thread-mailbox-handoff",
    direction: "in",
    fromAddress: "Example Team <team@example.com>",
    toAddresses: ["studio@maily.cn"],
    subject: "Re: Mailbox component handoff",
    snippet:
      "The handoff is received. We will connect the data adapter this week.",
    status: "sent",
    hasAttachments: false,
    isFavorite: false,
    isUnread: true,
    labels: ["Inbox", "Projects"],
    createdAt: new Date("2026-07-25T09:00:00"),
    bodyText:
      "The handoff is received. We will connect the data adapter this week.",
    bodyHtml: null,
    attachments: [],
    messageId: "<mailbox-handoff-reply@example.com>",
    inReplyTo: "<mailbox-handoff@maily.cn>",
    headers: null,
    lastError: null,
    events: [],
  },
  {
    id: "msg-draft-1",
    _revision: "1",
    threadId: "thread-playground-draft",
    direction: "out",
    fromAddress: "Maily Studio <studio@maily.cn>",
    toAddresses: ["alex@example.com"],
    ccAddresses: [],
    bccAddresses: [],
    subject: "Draft: inbox/outbox playground",
    snippet: "This draft is editable inside the MailboxView compose pane.",
    status: "draft",
    hasAttachments: false,
    isFavorite: false,
    isUnread: false,
    labels: ["Draft"],
    createdAt: new Date("2026-07-25T10:12:00"),
    bodyText: "This draft is editable inside the MailboxView compose pane.",
    bodyHtml: null,
    attachments: [],
    messageId: null,
    inReplyTo: null,
    headers: null,
    lastError: null,
    events: [],
  },
  {
    id: "msg-bounced-1",
    threadId: "thread-old-launch",
    direction: "out",
    fromAddress: "Maily Studio <studio@maily.cn>",
    toAddresses: ["old-address@example.invalid"],
    ccAddresses: [],
    bccAddresses: [],
    subject: "Old launch checklist",
    snippet: "Recipient domain rejected the message.",
    status: "failed",
    hasAttachments: false,
    isFavorite: false,
    isUnread: false,
    labels: ["Bounced"],
    createdAt: new Date("2026-07-23T15:44:00"),
    bodyText: "Recipient domain rejected the message.",
    bodyHtml: null,
    attachments: [],
    messageId: "<failed-launch@maily.cn>",
    inReplyTo: null,
    headers: null,
    lastError: "550 5.1.1 recipient rejected",
    events: [],
  },
]

const contactSuggestions: MailyMailboxContactSuggestion[] = [
  { address: "mia@northstar.example", displayName: "Mia Nowak" },
  { address: "billing@platform.example", displayName: "Platform Billing" },
  { address: "team@example.com", displayName: "Example Team" },
  { address: "alex@example.com", displayName: "Alex Morgan" },
  { address: "ops@maily.cn", displayName: "Maily Operations" },
  { address: "studio@maily.cn", displayName: "Maily Studio" },
]

function folderFor(message: MailyMailboxMessageDetail): MailyMailboxFolder {
  if (message.labels?.includes("Trash")) return "trash"
  if (message.labels?.includes("Spam")) return "spam"
  if (message.labels?.includes("Inbox")) return "inbox"
  if (message.status === "draft") return "drafts"
  if (message.direction === "in") return "allMail"
  return "sent"
}

const playgroundLabels: MailyMailboxLabel[] = [
  { id: "label-promotions", name: "Promotions" },
  { id: "label-projects", name: "Projects" },
]

function searchMatches(
  message: MailyMailboxMessageDetail,
  query?: MailyMailboxSearchQuery,
  availableLabels = playgroundLabels
) {
  if (!query) return true
  const includes = (value: string | null | undefined, term?: string) =>
    !term || (value ?? "").toLowerCase().includes(term.trim().toLowerCase())
  const allAddresses = [
    ...message.toAddresses,
    ...(message.ccAddresses ?? []),
    ...(message.bccAddresses ?? []),
  ].join(" ")
  const labels = message.labels ?? []
  const dateBoundary = (value: string) => {
    const date = new Date(value.replaceAll("/", "-"))
    return date.getTime()
  }
  const label = availableLabels.find((item) => item.id === query.labelId)
  return (
    includes(
      [
        message.subject ?? "",
        message.snippet ?? "",
        message.bodyText ?? "",
      ].join(" "),
      query.text
    ) &&
    includes(message.fromAddress, query.from) &&
    includes(allAddresses, query.to) &&
    includes(message.subject, query.subject) &&
    (query.hasAttachments === undefined ||
      Boolean(message.attachments?.length) === query.hasAttachments) &&
    (!query.after ||
      new Date(message.createdAt).getTime() >= dateBoundary(query.after)) &&
    (!query.before ||
      new Date(message.createdAt).getTime() < dateBoundary(query.before)) &&
    (query.unread === undefined ||
      Boolean(message.isUnread) === query.unread) &&
    (query.starred === undefined ||
      Boolean(message.isFavorite) === query.starred) &&
    (!query.labelId || Boolean(label && labels.includes(label.name)))
  )
}

function snippetFrom(text: string | null | undefined) {
  return (text ?? "").replace(/\s+/g, " ").trim().slice(0, 140)
}

function createMessageFromDraft(
  draft: MailyMailboxDraftInput,
  status: "draft" | "sent"
): MailyMailboxMessageDetail {
  const now = new Date()
  const id = `msg-${status}-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`
  return {
    id,
    threadId: draft.inReplyTo ? `thread-${draft.inReplyTo}` : id,
    direction: "out",
    fromAddress: "Maily Studio <studio@maily.cn>",
    toAddresses: draft.to,
    ccAddresses: draft.cc,
    bccAddresses: draft.bcc,
    subject: draft.subject,
    snippet: snippetFrom(draft.text),
    status,
    hasAttachments: Boolean(draft.attachments?.length),
    isFavorite: false,
    isUnread: false,
    labels: [status === "draft" ? "Draft" : "Sent"],
    createdAt: now,
    bodyText: draft.text,
    bodyHtml: draft.html ?? null,
    attachments: draft.attachments ?? [],
    messageId: status === "sent" ? `<${now.getTime()}@maily.cn>` : null,
    inReplyTo: draft.inReplyTo ?? null,
    headers: null,
    lastError: null,
    events: [],
  }
}

function usePlaygroundMailbox(): MailyMailboxDataSource {
  const [messages, setMessages] =
    useState<MailyMailboxMessageDetail[]>(baseMessages)
  const messagesRef = useRef(messages)
  const labelsRef = useRef(playgroundLabels.map((label) => ({ ...label })))
  const revisionCounter = useRef(2)
  const uploadedFiles = useRef(new Map<string, File>())
  const undoSnapshots = useRef(
    new Map<
      string,
      {
        expiresAt: number
        entries: Array<{
          before: MailyMailboxMessageDetail
          after: MailyMailboxMessageDetail
        }>
      }
    >()
  )

  const writeMessages = (next: MailyMailboxMessageDetail[]) => {
    const previouslyOwned = new Set(
      messagesRef.current.flatMap((message) =>
        (message.attachments ?? []).map((attachment) => attachment.id)
      )
    )
    const stillOwned = new Set(
      next.flatMap((message) =>
        (message.attachments ?? []).map((attachment) => attachment.id)
      )
    )
    for (const id of previouslyOwned) {
      if (id && !stillOwned.has(id)) uploadedFiles.current.delete(id)
    }
    messagesRef.current = next
    setMessages(next)
  }

  const applyMessageAction: NonNullable<
    MailyMailboxDataSource["runMessageAction"]
  > = async ({ messageId, action, value }) => {
    const existing = messagesRef.current.find(
      (message) => message.id === messageId
    )
    if (!existing) throw new Error("Message not found")
    if (action === "deleteForever") {
      writeMessages(
        messagesRef.current.filter((message) => message.id !== messageId)
      )
      return { id: messageId }
    }
    if (action === "archive") {
      const original = messagesRef.current.find(
        (message) => message.id === messageId
      )
      if (!original) throw new Error("Message not found")
      const before = { ...original, labels: [...(original.labels ?? [])] }
      const after = {
        ...before,
        labels: before.labels?.filter((label) => label !== "Inbox"),
      }
      const token = `undo-${crypto.randomUUID()}`
      const expiresAt = Date.now() + 5000
      undoSnapshots.current.set(token, {
        entries: [{ before, after }],
        expiresAt,
      })
      writeMessages(
        messagesRef.current.map((message) =>
          message.id === messageId ? after : message
        )
      )
      return { undo: { token, expiresAt } }
    }
    if (action === "delete" || action === "restore" || action === "notSpam") {
      writeMessages(
        messagesRef.current.map((message) =>
          message.id === messageId
            ? {
                ...message,
                labels: [
                  ...(message.labels ?? []).filter(
                    (label) =>
                      label !== "Trash" &&
                      label !== "Inbox" &&
                      (action === "delete" || label !== "Spam")
                  ),
                  ...(action === "delete" ? ["Trash"] : ["Inbox"]),
                ],
              }
            : message
        )
      )
      return { id: messageId }
    }
    if (
      action === "reportSpam" ||
      action === "reportPhishing" ||
      action === "reportIllegal"
    ) {
      writeMessages(
        messagesRef.current.map((message) =>
          message.id === messageId
            ? {
                ...message,
                labels: [
                  ...(message.labels ?? []).filter(
                    (label) =>
                      label !== "Inbox" && label !== "Trash" && label !== "Spam"
                  ),
                  "Spam",
                ],
              }
            : message
        )
      )
      return { id: messageId }
    }
    const next = messagesRef.current.map((message) => {
      if (message.id !== messageId) return message
      if (action === "favorite")
        return { ...message, isFavorite: Boolean(value) }
      if (action === "markUnread")
        return { ...message, isUnread: Boolean(value) }
      if (action === "markRead") return { ...message, isUnread: false }
      if (action === "blockSender")
        return { ...message, labels: [...(message.labels ?? []), "Blocked"] }
      if (action === "react")
        return { ...message, labels: [...(message.labels ?? []), "Reacted"] }
      return message
    })
    writeMessages(next)
    return next.find((message) => message.id === messageId)
  }

  return useMemo(
    () => ({
      listMessages: async ({
        folder,
        q,
        search: advanced,
        cursor,
        limit = 20,
        labelId,
      }) => {
        const query: MailyMailboxSearchQuery = {
          ...advanced,
          text: advanced ? advanced.text : q,
          ...(labelId ? { labelId } : {}),
        }
        const all = messagesRef.current
          .filter((message) => {
            const location = folderFor(message)
            if (folder === "allMail")
              return (
                location !== "spam" &&
                location !== "trash" &&
                message.status !== "draft"
              )
            if (folder === "starred")
              return (
                Boolean(message.isFavorite) &&
                location !== "spam" &&
                location !== "trash"
              )
            return location === folder
          })
          .filter((message) => searchMatches(message, query, labelsRef.current))
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        const parsedCursor = cursor ? Number.parseInt(cursor, 10) : 0
        const offset =
          Number.isFinite(parsedCursor) && parsedCursor >= 0 ? parsedCursor : 0
        const items = all.slice(offset, offset + limit)
        const nextOffset = offset + items.length
        return {
          items,
          total: all.length,
          nextCursor: nextOffset < all.length ? String(nextOffset) : null,
        }
      },
      getMessage: async (messageId) => {
        const message = messagesRef.current.find(
          (item) => item.id === messageId
        )
        if (!message) throw new Error("Message not found")
        return message
      },
      getCounts: async () => {
        return messagesRef.current.reduce<MailyMailboxCounts>(
          (acc, message) => {
            const folder = folderFor(message)
            acc[folder] += 1
            if (
              folder !== "spam" &&
              folder !== "trash" &&
              folder !== "allMail" &&
              message.status !== "draft"
            )
              acc.allMail += 1
            if (message.isFavorite && folder !== "spam" && folder !== "trash")
              acc.starred += 1
            return acc
          },
          {
            inbox: 0,
            allMail: 0,
            starred: 0,
            sent: 0,
            drafts: 0,
            bounced: 0,
            spam: 0,
            trash: 0,
          }
        )
      },
      getThread: async (threadId) => ({
        threadId,
        messages: messagesRef.current
          .filter((message) => (message.threadId ?? message.id) === threadId)
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ),
      }),
      listLabels: async () => labelsRef.current.map((label) => ({ ...label })),
      createLabel: async (name) => {
        name = name.trim()
        if (
          !name ||
          labelsRef.current.some(
            (label) => label.name.toLowerCase() === name.toLowerCase()
          ) ||
          ["Inbox", "Sent", "Draft", "Bounced", "Spam", "Trash"].some(
            (reserved) => reserved.toLowerCase() === name.toLowerCase()
          )
        )
          throw new Error("Label name is empty or already used")
        const label = { id: `label-${crypto.randomUUID()}`, name }
        labelsRef.current.push(label)
        return label
      },
      renameLabel: async (labelId, name) => {
        const label = labelsRef.current.find((item) => item.id === labelId)
        if (!label) throw new Error("Label not found")
        name = name.trim()
        if (
          !name ||
          labelsRef.current.some(
            (other) =>
              other.id !== labelId &&
              other.name.toLowerCase() === name.toLowerCase()
          ) ||
          ["Inbox", "Sent", "Draft", "Bounced", "Spam", "Trash"].some(
            (reserved) => reserved.toLowerCase() === name.toLowerCase()
          )
        )
          throw new Error("Label name is empty or already used")
        const oldName = label.name
        label.name = name
        writeMessages(
          messagesRef.current.map((message) => ({
            ...message,
            labels: message.labels?.map((item) =>
              item === oldName ? name : item
            ),
          }))
        )
        return label
      },
      deleteLabel: async (labelId) => {
        const label = labelsRef.current.find((item) => item.id === labelId)
        if (!label) return
        labelsRef.current.splice(labelsRef.current.indexOf(label), 1)
        writeMessages(
          messagesRef.current.map((message) => ({
            ...message,
            labels: message.labels?.filter((item) => item !== label.name),
          }))
        )
      },
      applyLabel: async (messageIds, labelId) => {
        const label = labelsRef.current.find((item) => item.id === labelId)
        if (!label) throw new Error("Label not found")
        const selected = new Set(messageIds)
        writeMessages(
          messagesRef.current.map((message) =>
            selected.has(message.id)
              ? {
                  ...message,
                  labels: [...new Set([...(message.labels ?? []), label.name])],
                }
              : message
          )
        )
      },
      removeLabel: async (messageIds, labelId) => {
        const label = labelsRef.current.find((item) => item.id === labelId)
        if (!label) return
        const selected = new Set(messageIds)
        writeMessages(
          messagesRef.current.map((message) =>
            selected.has(message.id)
              ? {
                  ...message,
                  labels: message.labels?.filter((item) => item !== label.name),
                }
              : message
          )
        )
      },
      uploadAttachment: async (file) => {
        const ref = {
          id: `upload-${crypto.randomUUID()}`,
          filename: file.name,
          contentType: file.type || undefined,
          size: file.size,
        }
        uploadedFiles.current.set(ref.id, file)
        return ref
      },
      discardUploadedAttachment: async (attachment) => {
        if (
          !messagesRef.current.some((message) =>
            message.attachments?.some((saved) => saved.id === attachment.id)
          )
        )
          uploadedFiles.current.delete(attachment.id)
      },
      downloadAttachment: async ({
        messageId,
        attachment,
        attachmentIndex,
      }) => {
        const message = messagesRef.current.find(
          (item) => item.id === messageId
        )
        const stored = message?.attachments?.[attachmentIndex]
        if (
          !stored?.id ||
          stored.id !== attachment.id ||
          (!(stored.id in attachmentContents) &&
            !uploadedFiles.current.has(stored.id))
        ) {
          throw new Error("Attachment not found")
        }
        const blob = uploadedFiles.current.has(stored.id)
          ? uploadedFiles.current.get(stored.id)!
          : new Blob([attachmentContents[stored.id]], {
              type: stored.contentType,
            })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = stored.filename
        document.body.append(link)
        link.click()
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      },
      listContactSuggestions: async ({ q, limit = 8 }) => {
        const query = q?.trim().toLowerCase()
        return contactSuggestions
          .filter((contact) => {
            if (!query) return true
            return [contact.displayName ?? "", contact.address]
              .join(" ")
              .toLowerCase()
              .includes(query)
          })
          .slice(0, limit)
      },
      createDraft: async (draft) => {
        const created = createMessageFromDraft(draft, "draft")
        created.threadId =
          messagesRef.current.find(
            (message) => message.messageId === draft.inReplyTo
          )?.threadId ?? created.id
        created._revision = String(revisionCounter.current++)
        writeMessages([created, ...messagesRef.current])
        return { id: created.id, _revision: created._revision }
      },
      updateDraft: async (messageId, draft) => {
        const existing = messagesRef.current.find(
          (message) => message.id === messageId
        )
        if (!existing || existing.status !== "draft")
          throw new Error("Draft not found")
        if (draft.revision !== existing._revision)
          throw new Error("Draft revision is stale")
        const next = messagesRef.current.map((message) =>
          message.id === messageId
            ? {
                ...message,
                _revision: String(revisionCounter.current++),
                toAddresses: draft.to,
                ccAddresses: draft.cc,
                bccAddresses: draft.bcc,
                subject: draft.subject,
                snippet: snippetFrom(draft.text),
                bodyText: draft.text,
                bodyHtml: draft.html ?? null,
                attachments: draft.attachments ?? [],
                hasAttachments: Boolean(draft.attachments?.length),
                inReplyTo: draft.inReplyTo ?? message.inReplyTo ?? null,
              }
            : message
        )
        writeMessages(next)
        return {
          id: messageId,
          _revision: next.find((message) => message.id === messageId)
            ?._revision,
        }
      },
      discardDraft: async (messageId) => {
        writeMessages(
          messagesRef.current.filter((item) => item.id !== messageId)
        )
      },
      sendDraft: async (messageId) => {
        const existing = messagesRef.current.find(
          (message) => message.id === messageId
        )
        if (!existing || existing.status !== "draft")
          throw new Error("Draft not found")
        const now = new Date()
        const sentMessageId = `<${now.getTime()}@maily.cn>`
        const next = messagesRef.current.map((message) =>
          message.id === messageId
            ? {
                ...message,
                status: "sent" as const,
                createdAt: now,
                messageId: sentMessageId,
                _revision: String(revisionCounter.current++),
                labels: [
                  ...(message.labels ?? []).filter(
                    (label) => label !== "Draft"
                  ),
                  "Sent",
                ],
              }
            : message
        )
        writeMessages(next)
        return { id: messageId, messageId: sentMessageId }
      },
      runMessageAction: applyMessageAction,
      runBulkMessageAction: async ({ messageIds, action, value }) => {
        if (
          messageIds.some(
            (id) => !messagesRef.current.some((message) => message.id === id)
          )
        )
          throw new Error("Message not found")
        if (action === "archive") {
          const selected = new Set(messageIds)
          const before = messagesRef.current
            .filter((message) => selected.has(message.id))
            .map((message) => ({
              ...message,
              labels: [...(message.labels ?? [])],
            }))
          const next = messagesRef.current.map((message) =>
            selected.has(message.id)
              ? {
                  ...message,
                  labels: (message.labels ?? []).filter(
                    (label) => label !== "Inbox"
                  ),
                }
              : message
          )
          const after = next.filter((message) => selected.has(message.id))
          const token = `undo-${crypto.randomUUID()}`
          const expiresAt = Date.now() + 5000
          undoSnapshots.current.set(token, {
            entries: before.map((item) => ({
              before: item,
              after: after.find((message) => message.id === item.id)!,
            })),
            expiresAt,
          })
          writeMessages(next)
          return { undo: { token, expiresAt } }
        }
        for (const messageId of new Set(messageIds)) {
          await applyMessageAction({ messageId, action, value })
        }
      },
      emptyFolder: async (folder) => {
        if (folder !== "spam" && folder !== "trash")
          throw new Error("Folder cannot be emptied")
        writeMessages(
          messagesRef.current.filter((message) => folderFor(message) !== folder)
        )
      },
      undoMessageAction: async (token) => {
        const receipt = undoSnapshots.current.get(token)
        if (!receipt || Date.now() > receipt.expiresAt)
          throw new Error("Undo expired")
        undoSnapshots.current.delete(token)
        const currentById = new Map(
          messagesRef.current.map((message) => [message.id, message])
        )
        for (const { after } of receipt.entries) {
          if (
            JSON.stringify(currentById.get(after.id)) !== JSON.stringify(after)
          ) {
            throw new Error("Message changed after the action")
          }
        }
        const beforeById = new Map(
          receipt.entries.map(({ before }) => [before.id, before])
        )
        writeMessages(
          messagesRef.current.map(
            (message) => beforeById.get(message.id) ?? message
          )
        )
      },
    }),
    []
  )
}

export function App() {
  const [json, setJson] = useState<unknown>(null)
  const [polish, setPolish] = useState(false)
  const mailboxDataSource = usePlaygroundMailbox()

  useEffect(() => {
    if (emailPreviewTheme.font) {
      loadFont(emailPreviewTheme.font)
    }
  }, [])

  return (
    <div className="min-h-svh bg-background">
      <header className="mx-auto max-w-5xl px-4 pt-16 pb-10">
        <div className="animate-demo-intro text-center">
          <img
            src={`${playgroundBaseUrl}maily-cn-hero.png`}
            alt=""
            aria-hidden="true"
            className="mx-auto mb-6 size-14 rounded-2xl object-cover ring-1 ring-foreground/10"
          />
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Maily for shadcn
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-balance text-muted-foreground">
            A production-ready email editor, renderer, and mailbox that installs
            as source through shadcn and follows your application&apos;s theme.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="outline" className="rounded-full px-4">
              <a
                href="https://github.com/brokeboiflex/maily.cn"
                target="_blank"
                rel="noreferrer"
              >
                <Code2 />
                GitHub
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-4">
              <a
                href={`${playgroundBaseUrl}r/maily.json`}
                target="_blank"
                rel="noreferrer"
              >
                <Braces />
                Registry
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-4">
              <a
                href="https://github.com/brokeboiflex/shadcn-theme-provider"
                target="_blank"
                rel="noreferrer"
              >
                <Palette />
                Theme provider
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <ThemeToggle />
          <ToggleGroup
            type="single"
            value={polish ? "pl" : "en"}
            onValueChange={(value) => {
              if (value) setPolish(value === "pl")
            }}
            variant="outline"
            spacing={0}
            aria-label="Language"
          >
            <ToggleGroupItem value="en">English</ToggleGroupItem>
            <ToggleGroupItem value="pl">Polski</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl min-w-0 gap-6 px-4 pb-20">
        <section className="min-w-0" aria-labelledby="editor-demo-title">
          <Card className="min-w-0">
            <CardHeader className="border-b">
              <CardTitle>
                <h2 id="editor-demo-title">Email editor</h2>
              </CardTitle>
              <CardDescription>
                Compose responsive emails with blocks, inline formatting,
                variables, uploads, and email-safe rendering.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0">
              <Editor
                key={polish ? "pl" : "en"}
                labels={polish ? polishLabels : undefined}
                contentJson={initialEditorContent}
                extensions={[playgroundVariableExtension]}
                config={{
                  bodyClassName: "min-h-72",
                  contentClassName: emailPreviewFontClassName,
                  renderPreview: ({ json }) => (
                    <RenderedEmailPreview json={json} />
                  ),
                }}
                onUpdate={(editor: TiptapEditor) => setJson(editor.getJSON())}
              />
            </CardContent>
          </Card>
        </section>

        <section className="min-w-0" aria-labelledby="mailbox-demo-title">
          <Card className="min-w-0 gap-0 py-0">
            <CardHeader className="border-b py-4">
              <CardTitle>
                <h2 id="mailbox-demo-title">Inbox and outbox</h2>
              </CardTitle>
              <CardDescription>
                A backend-agnostic mailbox with folders, message reading,
                drafts, rich compose, and caller-owned actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="min-w-0 overflow-x-auto">
                <MailboxView
                  account={{
                    id: "playground-account",
                    address: "studio@maily.cn",
                    displayName: "Maily Studio",
                  }}
                  recoveryScope="maily-playground:studio-account"
                  dataSource={mailboxDataSource}
                  messageActions={playgroundMessageActions}
                  pageSize={2}
                  pollIntervalMs={0}
                  labels={polish ? polishMailboxLabels : undefined}
                  className="max-h-none min-w-[56rem] rounded-none! border-0!"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <details className="text-xs">
          <summary className="w-fit cursor-pointer text-muted-foreground">
            Editor JSON
          </summary>
          <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-muted p-4 text-foreground">
            {JSON.stringify(json, null, 2)}
          </pre>
        </details>

        <section
          className="mt-6 min-w-0"
          aria-labelledby="other-projects-title"
        >
          <div className="mb-5">
            <h2
              id="other-projects-title"
              className="text-2xl font-semibold tracking-tight"
            >
              Check out my other projects
            </h2>
            <p className="mt-2 text-muted-foreground">
              More open-source tools built for React and shadcn/ui.
            </p>
          </div>

          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>
                <h3>shadcn-theme-provider</h3>
              </CardTitle>
              <CardDescription>
                Dual-axis theming for mode and palette switching, built for
                React and shadcn/ui.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <a
                  href="https://brokeboiflex.github.io/shadcn-theme-provider-demo/"
                  target="_blank"
                  rel="noreferrer"
                >
                  View demo
                  <ExternalLink />
                </a>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}

export default App
