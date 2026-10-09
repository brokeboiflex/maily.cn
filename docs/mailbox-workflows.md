# Mailbox workflows

The component follows Gmail's documented [archive workflow](https://support.google.com/mail/answer/6576), [label management](https://support.google.com/mail/answer/118708), [search filters](https://support.google.com/mail/answer/7190), [reply behavior](https://support.google.com/mail/answer/6585), and [conversation grouping](https://support.google.com/mail/answer/5900). Its shell uses Gmail no-split list-to-message navigation and shadcn ScrollArea.

## Adapter ownership

Maily owns local controls and request lifetimes. The host owns authenticated storage, mailbox membership, provider mutations, attachment persistence, classifier behavior and retention. Capabilities are optional: controls requiring them must be hidden or disabled when the adapter cannot perform them. Existing adapters keep working without providing the new capabilities.

All Mail includes archived messages and excludes Spam and Trash. Starred is a filtered view of favorite messages. Archive removes Inbox membership without deleting the message; Move to Inbox restores membership.

Pagination uses listMessages cursor/limit and returned nextCursor. Each navigation replaces the current page; Newer/Older arrows use cursor history. Refresh replays the fresh cursor chain to the current page and falls back when the last page empties. Optional `total` supplies the exact query count; without it only the known range is shown, never a fabricated total. Pages belong to the same folder/search generation. Structured search fields are passed to the host; provider-specific operator parsing remains with the adapter.

Reply all excludes the account's own address and deduplicates recipient email identities, preserving sender/To recipients in To and Cc recipients in Cc. It never copies Bcc. RFC messageId remains the reply threading header; storage row IDs are not RFC IDs. Conversation grouping uses explicit host thread IDs.

Uploaded attachments are persisted host references in draft input. Acknowledged draft saves transfer ownership to the persisted draft; unsaved discarded uploads belong to the uploader cleanup capability. Save/send must not race pending uploads.

Bulk actions operate on selected message IDs. Empty Trash and Delete all spam require the host's folder-wide emptyFolder callback, so messages beyond the loaded page are included. Label IDs identify labels independently of names.

Undo requires a host-issued token and an undoMessageAction callback. The host defines reversibility and expiration; the UI must never manufacture a reversal from message fields.

Autosave must preserve the revision observed with editable content, mark only acknowledged captured values clean, and retain newer changes as dirty. Failed saves and unknown sends must preserve the existing recovery behavior. Navigation and unload protection must not silently discard unsaved content.

## Capabilities

| Capability     | Contract                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Read state     | Enable `markRead`/`markUnread` in `messageActions`; `markReadOnOpen` opts into marking unread messages when opened.                                    |
| Conversations  | Supply `threadId` on rows/details and `getThread(threadId)` returning `{ threadId, messages }`.                                                        |
| Uploads        | `uploadAttachment(file)` returns an immutable `{ id, filename, contentType?, size? }` reference; draft writes receive `attachments`.                   |
| Upload cleanup | `discardUploadedAttachment(reference)` handles unacknowledged removed/stale uploads; hosts clean removed persisted refs after draft/message mutations. |
| Bulk           | `runBulkMessageAction({ messageIds, action, value? })` performs one selected-set mutation.                                                             |
| Empty folder   | `emptyFolder('trash' \| 'spam')` permanently removes the entire folder after confirmation.                                                             |
| Labels         | `listLabels`, `createLabel`, `renameLabel`, `deleteLabel`, `applyLabel` and `removeLabel` keep immutable label IDs separate from names.                |
| Undo           | Single/bulk actions may return `{ undo: { token, expiresAt? } }`; `undoMessageAction(token)` reverses the host operation.                              |

Autosave waits one second after edits; failures remain visible and require an explicit retry. New compose sessions show saved status only after an acknowledged write. The send pipeline prepares once and retains its receipt for unresolved sends.

The header select-all Checkbox covers the current page, and each conversation Checkbox covers its visible members. Empty-folder callbacks cover unloaded messages as well. Structured search accepts text, sender, recipient, subject, date boundaries, unread, starred, attachment and label filters; the search-bar filter Popover stages common filters until Search is submitted; ordinary search uses All Mail.

## Intentional adaptations

The component remains backend-agnostic and uses a shared list/message content area and keeps the rich/plain compose switch. Provider retention, spam training and delivery remain outside Maily. Snooze, scheduled send and keyboard shortcuts are explicitly outside this change.

## Playground

The showcase uses two-message pages and an explicit handoff conversation so paging and threads can be exercised directly. Its adapter stores mail, labels and uploaded file bytes in memory; reload resets them. Date-only search uses inclusive UTC start and exclusive UTC end. Undo tokens expire after five seconds and validate affected rows without reverting unrelated edits. This demonstrates component/adapter behavior, not provider delivery or durable storage.

## Validation

The core suite passes 85 tests, including eleven controlled-state regressions,
24 feature regressions, two thread/compose ownership regressions and the
existing unknown-send, stale prepared-draft and upload lifetime regressions.
Canonical TypeScript, changed-file Prettier and primitive audit pass.
The clean Radix/Base/Bun registry compatibility matrix and playground production
build pass. New action icon mappings were checked against all five installed
icon-library exports before registry generation. The existing documented Base ScrollArea unused-import
exception applies only to host-owned source.

Chromium exercised paging, explicit two-message conversations, Reply all,
autosave/reopen, sent attachment downloads with matching file bytes, bulk
archive/undo, archive recovery, Starred, label creation/rename/delete, advanced
global search and confirmed folder-wide spam deletion. All delivery/storage
operations used the in-memory showcase adapter. No provider delivery, durable
backend persistence, publication or deployment was performed.

Gmail reference correction: default navigation is Inbox, Starred, Sent, Drafts,
All Mail, Spam and Trash. Gmail delivers bounce notifications as emails in Inbox
or Spam, not a dedicated failure folder. Failed outgoing rows in the playground
remain in Sent with their existing delivery details; the legacy adapter folder
type is retained for compatibility. Reference: https://support.google.com/mail/answer/6596.

## Gmail interaction audit

Reference evidence: the supplied Gmail sidebar screenshot, the [Gmail pagination screenshot](https://storage.googleapis.com/support-forums-api/attachment/message-103480293-1824559811633958673.jpg), [official toolbar documentation and imagery](https://support.google.com/mail/answer/2473038), and [label management](https://support.google.com/mail/answer/118708).

Mailbox navigation is a desktop sidebar, moving into a Sheet below 768px of container width. The list header has
selection, refresh, a range/count and Newer/Older arrows. Bulk actions appear
only with a selection. Message rows have Checkbox and capability-gated star
actions. Labels have a heading, create action and per-label More menu; create
and rename use a focused Dialog. Search filters use a Popover, and unsaved
changes use a Dialog. Host-owned shadcn Checkbox/Dialog are externalized.

Intentional adaptations: visual/plain compose uses the same content area,
and optional host capabilities remain. Nested/colored labels and
select-all-across-the-entire-query are not supported by the current adapter.
No such control is displayed. Range totals are optional for cursor-only hosts.

The vertical message list uses inline-size containment so Radix ScrollArea’s
intrinsic-width content wrapper cannot expand rows beyond the content area. This keeps
dates visible and allows text ellipsis; consumer primitive source is untouched.
See [Radix upstream report](https://github.com/radix-ui/primitives/issues/2722).

## Primitive and state audit

The registry imports consumer-owned UI modules and declares each stock registry
item it uses. Package Radix fallbacks are excluded from the registry. Sender and
contact initials use Avatar/AvatarFallback, form layouts use Field/FieldLabel and
Label, and empty surfaces use Empty parts. These are the official stock registry
components; the host owns their implementations, aliases and theme tokens.
Compose input values and transient dialog/search disclosure remain Maily-owned;
folder, query and selection can be host-controlled as described below.

Label Dialogs use actual DialogTrigger composition so closing with Escape,
Cancel or successful creation restores focus. Menu-launched rename dialogs return
to that label's More button. Label inputs use instance-local ids. Fresh Radix and
Base consumer runtime checks cover these flows, Checkbox state, compose switching,
editor state, attachments and nested interactive DOM. The existing Base stock
ScrollArea unused-import exception remains separate from Maily-source diagnostics.

The expanded Base runtime check exposed another compatibility issue: menu items
accepted `onSelect` at compile time but never invoked it as a Base menu action.
Mailbox label/message actions and editor node/turn-into actions now use the
common `onClick` handler. Radix dispatches Enter/Space activation through click;
Base documents onClick for menu activation. The static audit rejects the
Radix-only handler and the consumer test opens rename by keyboard.

## Controlled navigation and selection

Each value may be controlled independently by passing its value and change
callback. Omit the value to use internal state and an optional initial default.
Do not switch a mounted value between controlled and uncontrolled modes.

| Value                | Change callback              | Uncontrolled default            |
| -------------------- | ---------------------------- | ------------------------------- |
| `folder`             | `onFolderChange`             | `initialFolder` (Inbox)         |
| `search`             | `onSearchChange`             | `defaultSearch`                 |
| `searchFilters`      | `onSearchFiltersChange`      | `defaultSearchFilters`          |
| `searchScope`        | `onSearchScopeChange`        | `defaultSearchScope` (`folder`) |
| `selectedLabelId`    | `onSelectedLabelIdChange`    | `defaultSelectedLabelId`        |
| `selectedMessageId`  | `onSelectedMessageIdChange`  | `defaultSelectedMessageId`      |
| `selectedMessageIds` | `onSelectedMessageIdsChange` | `defaultSelectedMessageIds`     |

`searchFilters` excludes text; `search` supplies text. Scope is `folder` or
`allMail`. `null` explicitly clears a controlled reader or label selection, and
`[]` clears bulk selection. Controlled values are authoritative: user actions
request changes, and declining a request leaves that value unchanged. Host
updates do not echo their change callbacks. Coordinate related controlled props
in the host (for example clear a controlled reader when accepting a folder
change); Maily only resets unmanaged subordinate state after external navigation.
Mutations revalidate a controlled reader that remains selected, and draft/send
refreshes cannot override a controlled folder. A selected message may be outside the loaded page; it is fetched through
`getMessage`. Default/controlled selected drafts open the existing draft rather
than preparing another draft.

```tsx
const [folder, setFolder] = React.useState<MailyMailboxFolder>('inbox');
const [selectedMessageId, setSelectedMessageId] = React.useState<string | null>(
  null
);

<MailboxView
  dataSource={dataSource}
  folder={folder}
  onFolderChange={(next) => {
    setFolder(next);
    setSelectedMessageId(null);
  }}
  selectedMessageId={selectedMessageId}
  onSelectedMessageIdChange={setSelectedMessageId}
/>;
```

External navigation never silently discards a live dirty composer. Compose and
mutation ownership, revision checks and pending-send recovery remain internal;
these props control navigation/query/selection, not provider persistence.

Immediate Escape also closes label/unsaved-change dialogs before the host's
passive keyboard listener has registered. The compatible `onKeyDown` call site
handles Escape for these leaf dialogs, even if a previous layer consumed the
key during registration; stock Dialog still owns modality and focus
restoration. A clean Radix trace reproduced focus at 747 ms, Escape at 750 ms and
listener registration at 756 ms. This is the upstream DismissableLayer
[registration window](https://github.com/radix-ui/primitives/issues/4143), not a
reason to replace or patch the consumer primitive. The consumer test retains its
immediate keypress without sleeps or retries.

Bulk actions share the page-selector toolbar row. Selecting messages replaces
Refresh with the supported actions and label picker; the page checkbox clears
the selection, and pagination stays on the right. There is no second action row
or duplicate clear-selection button.
The page range stays visible during selection.

## Responsive list-to-message navigation

References inspected: Google's [No split setting](https://support.google.com/mail/answer/9499937?hl=en) and the inbox and opened-message screenshots on the [official Gmail page](https://workspace.google.com/gmail/).

Opening a message replaces the list with the reader. Back returns to the same
mounted list, preserving its search, page, selection and scroll position, and
restores keyboard focus to the opened row. The reader receives focus on entry.
Controlled selectedMessageId remains authoritative, including when the host
declines Back. Drafts and new compose occupy that same area; Back retains the
existing unsaved-change confirmation and pending-send exclusion.

A ResizeObserver follows the mailbox's container, not the viewport. Below 768px,
folder navigation uses the consumer's Sheet with the same folders and label
actions. Desktop rows align sender, subject/snippet and date horizontally; narrow
rows stack their text. Toolbar actions remain beside selection; pagination can
wrap on narrow widths, and its range is never hidden. Reader headers and bodies
scroll together so long metadata cannot consume the entire mobile reader.
On narrow screens, secondary reader actions use the existing More menu while
Back, star and Reply remain directly accessible.

Intentional adaptations: this embedded component does not own the host's browser
URL/history, and compose remains a full content page rather than Gmail's desktop
floating compose window. Shadcn theme tokens and host capabilities remain the
visual and backend boundary.

Validation for this layout change: 90 unit tests, package TypeScript and tsup,
playground production build, and clean Radix/Base/Bun consumer installs passed.
Consumer browser checks cover list/reader replacement, Back focus restoration,
mobile Sheet navigation and 320px rich-compose containment. Base retains only
its documented upstream ScrollArea unused-React-import exception. Manual browser
checks covered 320, 375, 768, 1024 and 1440px, English/Polish, and light/dark;
physical iOS/Android devices were not available. The design detector flagged
only existing fonts in email content, which intentionally retain email-safe
fallbacks. No consumer-owned primitive source was modified.

Mailbox icon-only controls and selection checkboxes use stock host Tooltips
with translated accessible labels, including disabled pagination. Tooltip
triggers wrap a neutral span; trigger events and refs still reach the actual
Button when composed with Dialog, Popover, Sheet or DropdownMenu. Folder counts
are plain right-aligned tabular numbers. Label create/More controls share square
44px targets and one sidebar scroller so their centers align.
