# Mailbox workflows

The component follows Gmail's documented [archive workflow](https://support.google.com/mail/answer/6576), [label management](https://support.google.com/mail/answer/118708), [search filters](https://support.google.com/mail/answer/7190), [reply behavior](https://support.google.com/mail/answer/6585), and [conversation grouping](https://support.google.com/mail/answer/5900). Its shell uses Gmail no-split list-to-message navigation and shadcn ScrollArea.

## Adapter ownership

Maily owns local controls and request lifetimes. The host owns authenticated storage, mailbox membership, provider mutations, attachment persistence, classifier behavior and retention. Capabilities are optional: controls requiring them must be hidden or disabled when the adapter cannot perform them. Existing adapters keep working without providing the new capabilities.

All Mail includes archived messages and excludes Spam and Trash. Starred is a filtered view of favorite messages. Archive removes Inbox membership without deleting the message; Move to Inbox restores membership.

Pagination uses listMessages cursor/limit and returned nextCursor. Each navigation replaces the current page; Newer/Older arrows use cursor history. Refresh replays the fresh cursor chain to the current page and falls back when the last page empties. Optional `total` supplies the exact query count; without it only the known range is shown, never a fabricated total. Pages belong to the same folder/search generation. Structured search fields are passed to the host; provider-specific operator parsing remains with the adapter.

The playground uses timestamp/immutable-ID keyset boundaries scoped to the
folder and search/label filters, so insertion or deletion before a page does not
shift its continuation. Production cursor implementation remains host-owned.
README adapters forward the complete `listMessages` parameters.

Reply all excludes the account's own address and deduplicates recipient email identities, preserving sender/To recipients in To and Cc recipients in Cc. It never copies Bcc. RFC messageId remains the reply threading header; storage row IDs are not RFC IDs. Conversation grouping uses explicit host thread IDs.

Uploaded attachments are persisted host references in draft input. Acknowledged draft saves transfer ownership to the persisted draft; unsaved discarded uploads belong to the uploader cleanup capability. Save/send must not race pending uploads.

Bulk actions operate on selected message IDs. Label IDs identify labels independently of names.

Undo requires a host-issued token and an undoMessageAction callback. The host defines reversibility and expiration; the UI must never manufacture a reversal from message fields.

Autosave, when the host enables it, must preserve the revision observed with editable content, mark only acknowledged captured values clean, and retain newer changes as dirty. A failed save or send keeps the composition open and editable for a retry; the host deduplicates retries. Navigation and unload protection must not silently discard unsaved content.

## Capabilities

| Capability     | Contract                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Read state     | Enable `markRead`/`markUnread` in `messageActions`; `markReadOnOpen` opts into marking unread messages when opened.                                    |
| Conversations  | Supply `threadId` on rows/details and `getThread(threadId)` returning `{ threadId, messages }`.                                                        |
| Uploads        | `uploadAttachment(file)` returns an immutable `{ id, filename, contentType?, size? }` reference; draft writes receive `attachments`.                   |
| Upload cleanup | `discardUploadedAttachment(reference)` handles unacknowledged removed/stale uploads; hosts clean removed persisted refs after draft/message mutations. |
| Bulk           | `runBulkMessageAction({ messageIds, action, value? })` performs one selected-set mutation.                                                             |
| Labels         | `listLabels`, `createLabel`, `renameLabel`, `deleteLabel`, `applyLabel` and `removeLabel` keep immutable label IDs separate from names.                |
| Undo           | Single/bulk actions may return `{ undo: { token, expiresAt? } }`; `undoMessageAction(token)` reverses the host operation.                              |
| Drafts         | Optional `createDraft`, `updateDraft`, `sendDraft`, `discardDraft` and `sendMessage`; `draftCapabilities` withholds any of them at runtime. See below. |
| Refresh        | Maily does not poll unless `pollIntervalMs` is set; call `refresh()` on the mailbox ref (`MailyMailboxHandle`) when host data changes.                 |
| Folder actions | `messageActions` as an array is offered everywhere; a function of `{ surface, folder, labelId, searchScope, searching, messageIds }` decides per view. |
| Search         | Text search is always offered; `searchCapabilities` enables each advanced filter the backend supports. See below.                                      |
| Reply/forward  | `createComposeSeed(kind, message, context)` builds the composition; `defaultMailboxComposeSeed` is the conventional default.                           |

Autosave is off unless the host sets `autosaveDelayMs`; it then waits that long after edits, and failures remain visible and require an explicit retry. New compose sessions show saved status only after an acknowledged write. Maily keeps no send receipts: a failed send stays open, and the host deduplicates by draft ID and revision, or by `idempotencyKey`. Attachments handed to `sendMessage` belong to the host from then on, even if the send fails. A composition handed to `sendMessage` never becomes a draft (no Save draft or autosave), so its retries go through `sendMessage` and the host can deduplicate them by key.

## Draft capabilities

The draft callbacks are optional. An operation is available when its
callback exists and `draftCapabilities` does not set it to `false`; `true`
cannot enable a missing callback. Maily has no roles or permission names: the
host maps its own authorization to these booleans and still enforces it on its
backend.

| Operation | Callback                     | Required by                                                                                                |
| --------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `create`  | `createDraft`                | Saving a new composition, and sending one without `sendMessage`                                            |
| `edit`    | `updateDraft`                | Saving a saved draft; every autosave after the first save of a new composition                             |
| `send`    | `sendMessage` or `sendDraft` | Send: `sendMessage` for a new composition, otherwise `create` + `sendDraft`; `sendDraft` for a saved draft |
| `discard` | `discardDraft`               | Discard on a saved draft. Discard on an unsaved composition only closes it and calls no callback           |

Compose, Reply, Reply all and Forward appear when a new composition can be
saved (`create`) or sent (`sendMessage`). A saved draft is written before
`sendDraft` only when it has unsaved changes.

Without `edit`, a saved draft opens read-only (heading “Draft”, with its
recipients, subject and body shown as text) and Send delivers it unchanged, without
`updateDraft`. With `create` but no `edit`, autosave never runs; Save draft
creates once and the saved draft becomes read-only. Back always closes a
composition: unsaved content still asks before it is dropped, and closing never
calls `discardDraft`.

```tsx
// A read-only mailbox needs no draft callbacks.
const readOnly: MailyMailboxDataSource = { listMessages, getMessage };

// Host policy, mapped to Maily operations while mounted.
<MailboxView
  dataSource={dataSource}
  draftCapabilities={{
    create: canWrite,
    edit: canWrite,
    send: canSend,
    discard: canWrite,
  }}
/>;
```

Change `draftCapabilities`, not `dataSource`, when access changes: a new data
source starts a new mailbox lifetime and closes the composer. When an operation
is withdrawn while a composition is open:

- its controls disappear, and its callback is not dispatched afterwards,
  including by a scheduled autosave, form submission or an unsaved-change
  dialog that was already open; an operation already in flight completes;
- unsaved content stays in the mounted form and remains editable, with “Changes
  cannot be saved. Your edits are still here.”; navigation and unload stay
  guarded, and the content is saved once the operation returns;
- a clean composition that can no longer be saved shows its saved values as
  read-only text, and the form returns when the operation does; the visual
  editor that reappears neither moves focus nor writes normalized content;
- if `send` is withdrawn while Send writes its draft, the written draft stays
  open as a draft, `sendDraft` is not called, and the error banner reports that
  the message was not sent.

`sendDraft(messageId, { revision })` receives the revision it delivers: the last
acknowledged write, or the revision observed when the draft was opened. A host
that allows send without edit should reject the send on its backend when the
stored draft no longer matches that revision.

A saved draft whose attachments have no host `id` opens read-only, with “This
draft has attachments that cannot be edited here.”: saving re-sends attachment
references, so editing it would drop them. Read-only drafts render as text
(recipients, subject and body), not as disabled fields.

The header select-all Checkbox covers the current page, and each conversation Checkbox covers its visible members. Structured search accepts text, sender, recipient, subject, date boundaries, unread, starred, attachment and label filters; the search-bar filter Popover stages the enabled advanced filters until Search is submitted. A search stays in the folder in view unless the host sets an all-mail `searchScope`, and it keeps the selected label.

## Search capabilities

Text search is always available. Advanced filters are off until the host
enables the ones its backend supports:

```tsx
<MailboxView
  dataSource={dataSource}
  searchCapabilities={{ from: true, subject: true, unread: true }}
/>
```

| Filter           | Control             | `search` member  | `q` operator     |
| ---------------- | ------------------- | ---------------- | ---------------- |
| `from`           | From                | `from`           | `from:`          |
| `to`             | To                  | `to`             | `to:`            |
| `subject`        | Subject             | `subject`        | `subject:`       |
| `after`          | After (YYYY/MM/DD)  | `after`          | `after:`         |
| `before`         | Before (YYYY/MM/DD) | `before`         | `before:`        |
| `hasAttachments` | Has attachments     | `hasAttachments` | `has:attachment` |
| `unread`         | Unread              | `unread`         | `is:unread`      |

- Only enabled filters get a control, in this order. With none enabled, the
  advanced-search button is hidden and the search bar offers text only.
- A disabled filter is never sent to `listMessages`, in `search` or `q`, even
  when `searchFilters` or `defaultSearchFilters` carries a value for it. Such a
  value does not count as an active search, so it does not apply an all-mail
  `searchScope`.
- When the capabilities change, the next read drops newly disabled filters.
  Uncontrolled filter values are cleared (reported through
  `onSearchFiltersChange` when given), so enabling a filter again starts it
  empty. A controlled `searchFilters` value is the host's to update, like other
  related controlled props; Maily ignores its disabled members until they are
  enabled again. Submitting the form requests the value without them. When the
  last filter is disabled, an open form closes.
- Filtering stays with the backend. Maily sends the query and renders the
  returned page; it never filters loaded rows itself. Text is forwarded as
  typed, so a backend decides whether operators such as `from:` in text mean
  anything.
- `starred` and `labelId` are not form filters: label navigation sets
  `labelId`, and a host may pass `starred` in `searchFilters`. Both pass through
  unchanged.

`MAILBOX_SEARCH_FILTERS` lists the filter names in form order.

### Updating an existing install

1. Update the mailbox source (or update `@maily-to/core`):

   ```bash
   npx shadcn@latest add @maily/maily-mailbox --overwrite
   ```

   The item's `registryDependencies` are unchanged and the search bar still
   uses stock `button`, `input-group`, `input`, `popover`, `checkbox` and
   `field`, so no new shadcn component is needed. `--overwrite` also rewrites
   the stock items the mailbox depends on; review that diff and keep your own
   versions of customized primitives.

2. Pass `searchCapabilities` for the filters your backend supports. Without it,
   the advanced-search button no longer appears.
3. If you control `searchFilters`, remove disabled members when you change
   `searchCapabilities`.

## Intentional adaptations

The component remains backend-agnostic and uses a shared list/message content area and uses the visual editor for compose. Provider retention, spam training and delivery remain outside Maily. Snooze, scheduled send and keyboard shortcuts are explicitly outside this change.

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
global search and confirmed folder-wide spam deletion (a control since removed:
deletion now applies only to selected messages). All delivery/storage
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

Intentional adaptations: visual compose uses the same content area,
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
Base consumer runtime checks cover these flows, Checkbox state, visual composing,
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

| Value                | Change callback              | Uncontrolled default        |
| -------------------- | ---------------------------- | --------------------------- |
| `folder`             | `onFolderChange`             | `initialFolder` (Inbox)     |
| `search`             | `onSearchChange`             | `defaultSearch`             |
| `searchFilters`      | `onSearchFiltersChange`      | `defaultSearchFilters`      |
| `searchScope`        | none: Maily never changes it | `folder`                    |
| `searchCapabilities` | none: Maily never changes it | no advanced filters         |
| `selectedLabelId`    | `onSelectedLabelIdChange`    | `defaultSelectedLabelId`    |
| `selectedMessageId`  | `onSelectedMessageIdChange`  | `defaultSelectedMessageId`  |
| `selectedMessageIds` | `onSelectedMessageIdsChange` | `defaultSelectedMessageIds` |

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
mutation ownership and revision pass-through remain internal; these props
control navigation/query/selection, not provider persistence.

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
existing unsaved-change confirmation.

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

## Adapter contract details

- Adapter methods may return a value or a Promise, and may throw synchronously.
  Every call is converted to a Promise, so a synchronous throw reaches
  `onError(error, action)` instead of an error boundary. Methods are called on
  the data source, so class-based adapters keep `this`.
- `createDraft(draft)` and `sendMessage(draft)` receive `draft.idempotencyKey`,
  which identifies that exact request. A retry with the same content reuses the
  key, so a host can deduplicate a request whose response was lost; edited
  content or a new composition gets a new key, so a host must never answer it
  with an earlier result. The two operations use separate keys. Other methods do
  not receive it.
- An inline `onError` (a new function every render) never restarts reads or
  polling.
- Each error notice belongs to the action that failed. It clears only when that
  action later succeeds, so an unrelated successful read does not hide it. A
  failed `getCounts` reports `'counts'` and keeps a successfully loaded list.
  A failed contact lookup reports `'contactSuggestions'`.
- Recipient fields parse RFC 5322 address lists: commas inside quoted display
  names, angle brackets or comments do not split recipients. A suggestion's
  display name is quoted when it contains specials, for example
  `"Doe, Jane" <jane@example.com>`.

## Async ownership and sending

Compose identity, observed revision and uploaded-reference ownership belong to
the mounted data-source lifetime and the current compose intent. New Compose,
Reply and Forward start without an unrelated draft revision. A departed
preparation may still acknowledge a persisted draft and transfer its uploaded
references to that draft, but cannot assign its ID to a newer composer or
dispatch from the newer data source.

Maily keeps no record of sends in progress and uses no browser storage. Send
recovery and deduplication belong to the host: `sendDraft` receives the draft ID
and the revision it delivers, and `createDraft` and `sendMessage` receive an
`idempotencyKey` that stays the same for retries of the same content. A failed
send keeps the composition open for a retry, so the host must make a repeated
`sendDraft` (same ID and revision) or `sendMessage` (same key) safe.

Initial reads, refresh and cursor pages serialize the same complete filters into
`q`. Their success, error and pending-state cleanup all own the current source,
query and read generation. Label mutation completion may update acknowledged
label data, but clears selection or closes a form only when the captured
selection/form session still owns that state.

Acknowledged reader mutation results, including a fallback `getMessage`, overlay
the matching selected thread message and trigger a thread refresh. Ordinary
initial detail requests do not replace a newer thread snapshot. These repairs
leave adapter signatures and consumer-owned shadcn primitives unchanged; see
[regressions and validation](idempotence-reaudit-2026-10-10.md).

## Mailbox layout, 2026-10-25

Desktop navigation has an expanded folder list and a collapsed icon rail. The
Toggle keeps local view state; changing it preserves the mounted list and any
open composition. Below 768px of container width, the same navigation opens in
the stock Sheet. Returning to desktop preserves the previous sidebar state.

Search uses InputGroup with compact InputGroupButton actions. The advanced form
uses Field/Input/Checkbox and Popover + Calendar date pickers. Selected dates
still reach the host as `YYYY/MM/DD`. The host can localize the calendar through
`searchCalendarProps` (`locale`, `labels`, `formatters`, `weekStartsOn`, `dir`).
Mailbox copy remains in `defaultMailboxLabels`, including `compose.new`, whose
English default is now “New message”.

The Gmail screenshot supplied for this change is the layout reference: compact
header, recipient and subject rows, a large writing area, and
Send/attachment/draft actions at the bottom. The embedded editor retains its
original formatting toolbar and left gutter placement. Maily retains its embedded
page and Back navigation, host theme and editor controls; it does not add Gmail's
floating-window, minimize or maximize controls. The host still owns persistence
and autosave, so Save draft remains available when supported.

New-message headings remain stable when the host acknowledges a draft write;
opening a saved draft from the list uses “Edit draft”. Folder and label highlights
are suspended while composing and restored on Back. The playground saves only
when requested; hosts can still opt into `autosaveDelayMs`. Save feedback sits
beside the secondary draft actions in the footer, not above the recipient fields.
Recipient focus uses the row divider, the editor toolbar keeps a 16px gap below
Subject, and Send/Attach stay separate from Save/Discard.

Compose now always uses the visual editor. The plain-text control, mode labels,
`defaultComposeBodyMode`, `allowComposeBodyModeSwitch` and
`MailyMailboxComposeBodyMode` were removed. Consumers should remove those props
and label keys. Existing text-only drafts still open without changing their
saved values; editing the body produces both `html` and `text`.

Validation: 312 core tests and the five playground browser scenarios pass. The
browser checks cover full-row hover, editor gutter containment, original toolbar
placement and footer button bounds at 320, 768 and 1440px. Clean
Radix, Base and Bun consumers install and build; the Base runtime checks cover
collapse with an open draft and selected calendar dates reaching the adapter.
The existing Base ScrollArea unused-import exception remains the only relaxed
check. Package loading checks, TypeScript, lint, formatting and the primitive
audit pass. Visual checks cover light/dark, English/Polish and 320–1440px widths.
Registry and playground copies were regenerated and installed through the CLI;
existing host primitive files are unchanged. This is local verification only.
