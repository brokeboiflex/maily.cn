import { useMemo, useRef, useState } from "react"
import type { Editor as TiptapEditor } from "@tiptap/core"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Editor,
  MailboxView,
  type MailyMailboxContactSuggestion,
  type MailyMailboxCounts,
  type MailyMailboxDataSource,
  type MailyMailboxDraftInput,
  type MailyMailboxFolder,
  type MailyMailboxMessageDetail,
} from "@/components/maily"
import { polishLabels, polishMailboxLabels } from "@/polish-labels"

const playgroundBaseUrl = import.meta.env.BASE_URL

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
    labels: ["Promotions"],
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
    direction: "in",
    fromAddress: "billing@platform.example",
    toAddresses: ["studio@maily.cn"],
    ccAddresses: null,
    bccAddresses: null,
    subject: "SMTP queue cleared",
    snippet:
      "All queued delivery attempts have cleared. The last accepted message was newsletter-candidate-42.",
    status: "sent",
    hasAttachments: false,
    isFavorite: false,
    isUnread: false,
    labels: ["Inbox"],
    createdAt: new Date("2026-07-24T17:08:00"),
    bodyText:
      "All queued delivery attempts have cleared. The last accepted message was newsletter-candidate-42.",
    bodyHtml: null,
    attachments: [],
    messageId: "<queue-clear@maily.cn>",
    inReplyTo: null,
    headers: null,
    lastError: null,
    events: [],
  },
  {
    id: "msg-sent-1",
    direction: "out",
    fromAddress: "Maily Studio <studio@maily.cn>",
    toAddresses: ["team@veyme.example"],
    ccAddresses: [],
    bccAddresses: [],
    subject: "Mailbox component handoff",
    snippet:
      "The inbox/sent/drafts/bounced surface is now a backend adapter component.",
    status: "sent",
    hasAttachments: false,
    isFavorite: false,
    isUnread: false,
    labels: ["Sent"],
    createdAt: new Date("2026-07-25T08:40:00"),
    bodyText:
      "The inbox/sent/drafts/bounced surface is now a backend adapter component. You can wire it to CRM, Veyme, or any mailbox API with the same dataSource contract.",
    bodyHtml: null,
    attachments: [],
    messageId: "<mailbox-handoff@maily.cn>",
    inReplyTo: null,
    headers: null,
    lastError: null,
    events: [],
  },
  {
    id: "msg-draft-1",
    direction: "out",
    fromAddress: "Maily Studio <studio@maily.cn>",
    toAddresses: ["jakub@veyme.example"],
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
  { address: "team@veyme.example", displayName: "Veyme Team" },
  { address: "jakub@veyme.example", displayName: "Jakub Kowalski" },
  { address: "ops@maily.cn", displayName: "Maily Operations" },
  { address: "studio@maily.cn", displayName: "Maily Studio" },
]

function folderFor(message: MailyMailboxMessageDetail): MailyMailboxFolder {
  if (message.status === "failed" || message.status === "dsn") return "bounced"
  if (message.status === "draft") return "drafts"
  if (message.direction === "in") return "inbox"
  return "sent"
}

function snippetFrom(text: string | null | undefined) {
  return (text ?? "").replace(/\s+/g, " ").trim().slice(0, 140)
}

function createMessageFromDraft(
  draft: MailyMailboxDraftInput,
  status: "draft" | "sent"
): MailyMailboxMessageDetail {
  const now = new Date()
  return {
    id: `msg-${status}-${now.getTime()}`,
    direction: "out",
    fromAddress: "Maily Studio <studio@maily.cn>",
    toAddresses: draft.to,
    ccAddresses: draft.cc,
    bccAddresses: draft.bcc,
    subject: draft.subject,
    snippet: snippetFrom(draft.text),
    status,
    hasAttachments: false,
    createdAt: now,
    bodyText: draft.text,
    bodyHtml: draft.html ?? null,
    attachments: [],
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

  const writeMessages = (next: MailyMailboxMessageDetail[]) => {
    messagesRef.current = next
    setMessages(next)
  }

  return useMemo(
    () => ({
      listMessages: async ({ folder, q }) => {
        const search = q?.trim().toLowerCase()
        const items = messagesRef.current
          .filter((message) => folderFor(message) === folder)
          .filter((message) => {
            if (!search) return true
            return [
              message.fromAddress,
              message.toAddresses.join(", "),
              message.subject ?? "",
              message.snippet ?? "",
              message.bodyText ?? "",
            ]
              .join(" ")
              .toLowerCase()
              .includes(search)
          })
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        return { items, nextCursor: null }
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
            acc[folderFor(message)] += 1
            return acc
          },
          { inbox: 0, sent: 0, drafts: 0, bounced: 0 }
        )
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
        writeMessages([created, ...messagesRef.current])
        return { id: created.id }
      },
      updateDraft: async (messageId, draft) => {
        const next = messagesRef.current.map((message) =>
          message.id === messageId
            ? {
                ...message,
                toAddresses: draft.to,
                ccAddresses: draft.cc,
                bccAddresses: draft.bcc,
                subject: draft.subject,
                snippet: snippetFrom(draft.text),
                bodyText: draft.text,
                bodyHtml: draft.html ?? null,
              }
            : message
        )
        writeMessages(next)
        return { id: messageId }
      },
      discardDraft: async (messageId) => {
        writeMessages(
          messagesRef.current.filter((item) => item.id !== messageId)
        )
      },
      sendDraft: async (messageId) => {
        const now = new Date()
        const next = messagesRef.current.map((message) =>
          message.id === messageId
            ? {
                ...message,
                status: "sent" as const,
                createdAt: now,
                messageId: `<${now.getTime()}@maily.cn>`,
              }
            : message
        )
        writeMessages(next)
        return { id: messageId, messageId: `<${now.getTime()}@maily.cn>` }
      },
      runMessageAction: async ({ messageId, action, value }) => {
        if (action === "archive" || action === "delete") {
          writeMessages(
            messagesRef.current.filter((message) => message.id !== messageId)
          )
          return { id: messageId }
        }

        if (
          action === "reportSpam" ||
          action === "reportPhishing" ||
          action === "reportIllegal"
        ) {
          const next = messagesRef.current.map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  labels: [
                    ...(message.labels ?? []).filter(
                      (label) => label !== "Inbox"
                    ),
                    "Reported",
                  ],
                }
              : message
          )
          writeMessages(next)
          return { id: messageId }
        }

        const next = messagesRef.current.map((message) => {
          if (message.id !== messageId) return message
          if (action === "favorite") {
            return { ...message, isFavorite: Boolean(value) }
          }
          if (action === "markUnread") {
            return { ...message, isUnread: Boolean(value) }
          }
          if (action === "blockSender") {
            return {
              ...message,
              labels: [...(message.labels ?? []), "Blocked"],
            }
          }
          if (action === "react") {
            return {
              ...message,
              labels: [...(message.labels ?? []), "Reacted"],
            }
          }
          return message
        })
        writeMessages(next)
        return next.find((message) => message.id === messageId)
      },
    }),
    []
  )
}

export function App() {
  const [json, setJson] = useState<unknown>(null)
  const [polish, setPolish] = useState(true)
  const mailboxDataSource = usePlaygroundMailbox()

  return (
    <div className="min-h-svh bg-muted/30 p-4 md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-medium">Maily playground</h1>
            <p className="text-sm text-muted-foreground">
              Editor and inbox/outbox components installed from the local shadcn
              registry.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPolish((p) => !p)}
            >
              {polish ? "Język: Polski" : "Language: English"}
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <section className="grid gap-3">
          <div>
            <h2 className="text-sm font-medium">Inbox / outbox view</h2>
            <p className="text-sm text-muted-foreground">
              Same component shape as the CRM/Veyme mailbox, backed here by a
              local dataSource adapter.
            </p>
          </div>
          <MailboxView
            account={{
              address: "studio@maily.cn",
              displayName: "Maily Studio",
            }}
            dataSource={mailboxDataSource}
            pollIntervalMs={0}
            labels={polish ? polishMailboxLabels : undefined}
          />
        </section>

        <section className="grid gap-3">
          <div>
            <h2 className="text-sm font-medium">Email editor</h2>
          </div>
          <Editor
            key={polish ? "pl" : "en"}
            labels={polish ? polishLabels : undefined}
            contentJson={{ type: "doc", content: [{ type: "paragraph" }] }}
            onUpdate={(editor: TiptapEditor) => setJson(editor.getJSON())}
          />
        </section>

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">
            Editor JSON
          </summary>
          <pre className="mt-2 overflow-auto rounded bg-background p-3">
            {JSON.stringify(json, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}

export default App
