# Editor and mailbox idempotence audit, 2026-10-10

> **Superseded in part (2026-10-24):** Maily no longer keeps send-recovery
> receipts in browser storage, the `recoveryScope` prop or the pending-send lock
> described here. Send recovery belongs to the host; see CHANGELOG.md and
> [mailbox workflows](mailbox-workflows.md#async-ownership-and-sending).

Audited commit: `9af19d56e5776568142695292e9993cf150b7bb7`, pushed to `origin/main` before the audit. Three independent subagents inspected canonical document actions, editor async/resource actions, and mailbox actions. The original findings below describe that commit. The subsequently authorized repairs are recorded separately below.

The bar distinguishes desired-state operations from intentionally repeated insertion, deletion, formatting toggles, history traversal and downloads. A pending UI state is not proof of durable host idempotency. The audit examines duplicate dispatch, stale document/selection/data-source ownership, response loss, lifecycle teardown and resource compensation.

## Findings

Paths below are relative to `packages/core/src/`; line numbers refer to the audited commit.

| Priority | Location                                                  | Finding and evidence                                                                                                                                                                                                                                                                                                                                                                          |
| -------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | `editor/plugins/image-upload/image-upload-plugin.ts:63`   | Paste/drop upload completion matches only the placeholder URL. Real TipTap/HappyDOM reproduction: paste, replace the document with `setContent(getJSON())`, resolve upload. A fresh replacement node is mutated and the discard handler is never called. Copied placeholders also share this URL-based target.                                                                                |
| P1       | `mailbox/index.tsx:1967`                                  | A late message-action result overwrites another controlled reader. Mounted React reproduction: favorite A is pending, host changes selected ID to B, A resolves; reader shows A while controlled ID remains B. Result and fallback detail fetch check lifetime but not selection generation.                                                                                                  |
| P1       | `mailbox/index.tsx:930`                                   | Replacing the data source within the same account retains old exclusion locks and pending flags. Mounted React reproduction: start an unresolved favorite, replace data source, click Compose; Compose remains blocked until the old promise settles. The old completion can leave pending UI behind because its lifetime is invalid. Page/compose mutation locks require lifetime ownership. |
| P2       | `editor/components/spacer-menu/spacer-bubble-menu.tsx:33` | Height selection calls insertion command `setSpacer`, rather than `setSpacerSize`. Real TipTap reproduction: reapply height 8 to a selected spacer carrying `showIfKey: customer.vip`; its condition becomes null. Choosing a different height loses the condition too.                                                                                                                       |
| P2       | `editor/components/content-menu.tsx:48`                   | Desktop add/duplicate/delete retain unmapped positions while the menu locks hover tracking. Real TipTap reproduction of the command chain: capture target at 0, host inserts a new paragraph at 0, Delete removes the new paragraph. Duplicate also combines a live occupant with the old node size.                                                                                          |
| P2       | `editor/plugins/image-upload/image-upload-plugin.ts:79`   | Rejected paste/drop uploads only log and revoke the object URL. Real TipTap reproduction retains `src: blob:audit-owned` in saved JSON after revocation, with no retry path.                                                                                                                                                                                                                  |
| P2       | `editor/fonts/fontsource.ts:215`                          | A transient version-fetch failure resolves to `latest` and stays cached. Controlled-fetch reproduction: fail once, restore a valid pinned response, select again; both selections return latest and fetch runs once. Saved fonts remain unpinned.                                                                                                                                             |
| P2       | `mailbox/index.tsx:1398`                                  | Initial label read can overwrite the newer list obtained after create/rename/delete. Static high-confidence race: delay initial snapshot, complete mutation and its refresh, then resolve initial snapshot. The two paths have no shared generation.                                                                                                                                          |
| P2       | `mailbox/index.tsx:4327`                                  | Clicking the already active Visual editor item increments `editorRevision`; `Editor` is keyed by that revision at line 4624. Static definite path recreates the editor and resets history, selection and deferred ownership for the same desired mode.                                                                                                                                        |

## Repairs

All nine findings have canonical source fixes:

- Spacer controls call the existing height setter, preserving the condition.
- Desktop node actions own their immutable source document/node and commit once;
  stale actions are rejected. An open menu freezes that target across drag-handle
  callbacks. Duplicate/delete use the captured node size and
  exact range. Plus inserts inside an empty paragraph correctly.
- Paste/drop completion locates one unique immutable owned node even if its
  position moved. Replacements and ambiguous copies reject completion and invoke
  discard. Async failures and synchronous handler throws remove the owned
  placeholder before revoking its URL. Unowned replacement nodes remain untouched.
- Font resolution accepts pinned versions only, evicts failed promises for retry
  and preserves successful concurrent-request deduplication. The existing picker
  catches a rejected selection without mutating the document.
- Mailbox mutation/page locks belong to their data-source lifetime, and pending
  flags reset before paint on source changes. Old finally blocks cannot release a
  new action's lock. Recovery receipts and revisions retain their existing contract.
- Message-action detail writes, fallback reads and reader clearing require the
  captured reader-selection epoch; switching away and back also invalidates it.
- Initial label reads and mutation refreshes share a generation; postack refresh
  advances it so an overlapping earlier snapshot cannot win. A rejected mutation
  leaves its earlier valid initial read eligible.
- Active body-mode requests return without changing the editor revision or instance.

Cross-review additionally identified old-query refresh and bulk-selection ownership
in the same async action paths. Mutation completion now refreshes the latest
committed mailbox query. Bulk completion preserves a newer externally supplied
selection and reader. New regressions cover these interleavings.

Regressions exercise real TipTap/plugin state and mounted React components. The
spacer regression clicks actual controls and was verified to fail against the
original call site. Mailbox tests cover both returned-detail and fallback-fetch
paths, an old operation settling while a new lock is held, label snapshot ordering
and rich-editor instance preservation. Upload tests cover position movement,
replacement, ambiguity, rejection, synchronous throw and destruction. Font tests
cover failure retry, invalid/unpinned versions and concurrent deduplication.

## Complete action-family inventory

The inventory covers implemented action families, including shared commands and helpers. Source inspection is broader than runtime reproduction; rows without a finding are not blanket certification of every event interleaving.

| Surface / family                                       | Inspected implementation                                             | Assessment                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------ | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Editor formatting, clear, rule, history                | Toolbar, text bubble content, bubble buttons, mobile toolbar         | Toggles/insertion/history are intentionally repeatable; no duplicate handler wiring established.                                                                                                                                                                                                                            |
| Text alignment/direction/size, links, turn into        | Alignment/direction switches, text menus, text-style/link extensions | Desired values converge in JSON; list conversion uses intentional toggles. Deferred fonts/colors covered separately.                                                                                                                                                                                                        |
| Desktop node add/duplicate/delete                      | ContentMenu and drag-handle integration                              | Stale-position finding.                                                                                                                                                                                                                                                                                                     |
| Mobile disclosure, insert, move/duplicate/delete       | MobileEditor, mobile-block-actions and deferred controller           | Active-panel request is a no-op; one-shot insertion/block snapshots own document and selection. Existing action tests pass.                                                                                                                                                                                                 |
| Columns count/width/gap/vertical alignment             | Column menus, nodes and columns utility                              | Count compares live document; equal width requests can still rebuild it. No independent damage established from that churn.                                                                                                                                                                                                 |
| Section attributes and deletion                        | Section menu/node, delete-node                                       | Desired setters; live ancestor deletion.                                                                                                                                                                                                                                                                                    |
| Spacer attributes                                      | Spacer menu/node                                                     | Height condition-loss finding; visibility setter updates attributes.                                                                                                                                                                                                                                                        |
| Image/logo/inline-image attributes                     | Image menus and node commands                                        | Desired URL/alt/dimension/alignment/aspect/visibility settings; inline image has no upload path.                                                                                                                                                                                                                            |
| Button label/link/typography/style                     | Button node/view/label input, shared setters                         | Desired attribute updates; deferred picker and focus work covered below.                                                                                                                                                                                                                                                    |
| Repeat and variable edits                              | Repeat menus/node, variable menus/view                               | Desired iterable/visibility/variable attributes; formatting intentionally repeatable.                                                                                                                                                                                                                                       |
| HTML code/preview/visibility/selection                 | HTML menu/node/view                                                  | Desired tabs/visibility; text editing repeatable; selection uses live document.                                                                                                                                                                                                                                             |
| Slash insertion and preset blocks                      | Slash extension/view, all default block groups                       | Insertion repeatable per distinct activation; mobile delivery owns a one-shot snapshot.                                                                                                                                                                                                                                     |
| Normalization and shared setters                       | Trailing-node, update-attribute, delete-node                         | Trailing paragraph normalization terminates. Equal attribute setter reproduction emits docChanged transactions with identical JSON; low-priority churn, no proven user-visible damage.                                                                                                                                      |
| Paste/drop image upload                                | ImageUpload extension/plugin                                         | Replacement-target and failed-placeholder findings; destruction/missing target compensate successful uploads. Synchronous handler throws remain untested.                                                                                                                                                                   |
| Image/logo file/drop upload                            | ImageView, LogoView                                                  | Sync lock, generation, editor destruction and immutable node identity guards; stale results discarded. Dedicated mounted upload regression absent.                                                                                                                                                                          |
| Image load/resize                                      | ImageView                                                            | Listener cleanup/reentry protection exists. Same-src intrinsic load may overwrite a manual width; static suspicion only. Browser and immutable resize-target behavior unverified.                                                                                                                                           |
| Drag clone/drop/timer/listeners                        | DragHandle plugin/component                                          | Start/end/drop/destroy cleanup inspected; no dedicated StrictMode/resource regression.                                                                                                                                                                                                                                      |
| Deferred font/color/mobile actions                     | Provider, deferred controller, pickers                               | Document/selection/lifecycle/channel/one-shot guards; independent color channels; real TipTap regressions pass.                                                                                                                                                                                                             |
| Font catalog/version/preview faces                     | Fontsource utilities and font picker                                 | Failed catalog retries; version failure cache finding. Preview faces cleaned; document faces globally retained intentionally, growth bounds untested.                                                                                                                                                                       |
| Slash/variable suggestion lifecycle                    | Suggestion renderers and installed TipTap Suggestion                 | Exit/destruction cleanup inspected; repeated renderer teardown and real browser behavior unverified.                                                                                                                                                                                                                        |
| Focus timers and RAF                                   | Owned-timeout call sites, text bubble, Select                        | Owned timers cancel on unmount/reschedule. Text bubble RAF is not cancelled on menu-only teardown but checks editor destruction. Select close-focus RAF has no current caller supplying callback.                                                                                                                           |
| Mobile observers/listeners, autocomplete/outside click | Mobile context/chrome and input helpers                              | Cleanup inspected; real mobile/StrictMode browser acceptance unverified.                                                                                                                                                                                                                                                    |
| Mailbox navigation/Back/Compose                        | MailboxSession, controlled state                                     | Dirty/exclusion gates, mounted list preservation and controlled-state regressions; old-lifetime lock finding.                                                                                                                                                                                                               |
| Search/clear/filters/scope                             | Query state, search helpers, filter popover                          | Query generations reject stale successes; external controlled state authoritative. Stale refresh errors remain less protected than successes.                                                                                                                                                                               |
| Refresh/counts/polling/pagination                      | Refresh helpers, interval/page effects                               | Generations, synchronous page exclusion, cursor rebuild and stale page tests; old-source page lock/pending state remains exposed. Reads can overlap and are not abortable.                                                                                                                                                  |
| Row/page/conversation selection                        | Selection handlers, conversation helpers                             | Unmanaged set deduplication, explicit thread IDs, tests; host-controlled duplicate IDs are not normalized before dispatch.                                                                                                                                                                                                  |
| Reader/thread/detail hydration                         | Detail/thread effects                                                | Effect cancellation and thread matching tested; mutation results bypass selection ownership.                                                                                                                                                                                                                                |
| Reply/reply-all/forward                                | Compose seeding, reply helpers                                       | RFC Message-ID, recipient deduplication/Bcc exclusion, dirty gates; provider threading unverified.                                                                                                                                                                                                                          |
| Compose text/rich/Cc/Bcc/editor updates                | MailboxCompose                                                       | Captured values and text/html boundary; active rich-mode remount finding. Intentional mode switches recreate editor.                                                                                                                                                                                                        |
| Save/autosave/revisions                                | Save callback, debounce, compose acknowledgment                      | Child/shared locks, captured acknowledgment, observed revisions and newer edits tested; host must enforce revisions. Create response-loss boundary below.                                                                                                                                                                   |
| Send/retry/recovery/discard                            | Send/discard callbacks, session storage receipts                     | Actual draft ID retained before dispatch, actor scope, legacy receipt blocking, stale prepared-send protection tested; host delivery deduplication required.                                                                                                                                                                |
| Contacts/recipient selection                           | Suggestions effect and input helpers                                 | Debounce/generations/unmount rejection; selection RAF untracked but refs protect removed inputs.                                                                                                                                                                                                                            |
| Attachment upload/remove                               | Compose ownership map and upload owner                               | Sequential upload, stale compensation, pending ownership handoff inspected; optional cleanup failures lack durable retry. Duplicate-submit ownership suspicion was disproved on inspection.                                                                                                                                 |
| Attachment download                                    | Per-file attachment component                                        | Sync pending lock, metadata/index identity, local error/retry regression; completed downloads intentionally repeatable.                                                                                                                                                                                                     |
| Original source/retry/Back                             | Reader source effect                                                 | Lazy escaped content, cancellation/stale response/retry tests; no provider MIME verification.                                                                                                                                                                                                                               |
| All message actions and auto-read                      | runMessageAction, reader controls, auto-read effect                  | Capability/folder gates and shared exclusion cover favorite/unfavorite, reaction, read/unread, archive, Trash/Spam/recovery/permanent delete/reports and download/print/source fallback. Findings affect reader/lifetime. Auto-read remembers success for source lifetime; mark-unread/reopen semantics need specification. |
| Bulk actions                                           | runBulkAction                                                        | Captured IDs, capability/folder gates, synchronous exclusion and pending duplicate tests; durable retry deduplication belongs to host.                                                                                                                                                                                      |
| Label create/rename/delete/apply/remove                | Label callbacks and dialogs                                          | Shared exclusion, immutable IDs and validation; initial read race. Host set semantics/deduplication required.                                                                                                                                                                                                               |
| Undo                                                   | runUndo, expiry effect                                               | Host receipt only, expiry/pending regression; host token consumption/reconciliation required.                                                                                                                                                                                                                               |
| Folder-wide deletion                                   | Current adapter API/source                                           | No implemented folder-wide capability or action. No audit coverage claimed; current explicit instruction removes folder-wide buttons.                                                                                                                                                                                       |

## Host response-loss boundary

`createDraft` has no stable per-intent key. If a host commits creation but loses its response, the frontend does not know the draft ID and retry can create another draft unless the host deduplicates through its own mechanism. Existing send recovery begins after preparation acknowledgment.

`sendDraft(id)` retries the actual retained draft ID; exactly-once external delivery requires host deduplication or reconciliation. Label creation, bulk/report/discard operations and undo also require durable host semantics after uncertain responses. Synchronous component locks only exclude concurrent local dispatch. Authorization, transactional revisions, storage cleanup, classifier behavior and provider delivery were not exercised.

## Original audit validation and references

- Core suite: 9 files, 92 tests passed with the installed Vitest binary.
- Core TypeScript `--noEmit` passed; shadcn primitive audit passed.
- Three external real TipTap command reproductions covered spacer metadata, stale desktop node deletion and equal-setter transaction churn.
- External real TipTap upload probes covered replacement ownership and rejection cleanup; controlled fetch covered cached font version failure.
- Two temporary mounted React mailbox probes covered stale controlled reader and retained source-lifetime exclusion. Temporary probes were removed; no behavior changes remain.
- The pnpm wrapper attempted dependency verification/installation and stopped on ignored esbuild build scripts. Direct installed test/typecheck binaries succeeded. Git was clean afterward.

Reviewed [React effect cleanup and race handling](https://react.dev/reference/react/useEffect) and installed TipTap/ProseMirror implementations. The online ProseMirror guide could not be loaded; local authoritative implementations supplied transaction/lifecycle evidence.

No browser consumer matrix, remote backend, delivery, production, publication or deployment acceptance was run. Passing existing tests does not cover the reproduced defects. Prior repair documentation supplied context only; all findings above come from current source or current probes.

## Repair validation

The final core suite passes 120 tests across 13 files, including 28 additional
regressions. Core TypeScript and the primitive audit pass. Canonical source,
registry staging/public JSON and the playground consumer are regenerated through
the normal builder and official shadcn CLI; host-owned primitive implementations
retain their original source.

All nine playground Chromium tests pass, and its strict TypeScript/Vite build
passes. The clean consumer matrix passes Radix full granular build/browser, Base
editor strict build, Base full granular build/browser and Bun isolated full
granular build. The Base full fixture uses only its documented upstream
scroll-area unused-import exception. Public registry JSON embeds exactly match
296 staged file entries. Changed-file Prettier and Git whitespace checks pass.

The clean consumer browser fixture now enters replacement text through native
keyboard actions and asserts its exact value before block conversion. The former
contenteditable fill setup appended to existing text in this environment. The
heading, undo, responsive-content and primitive acceptance assertions remain
unchanged.

The narrow playground test now opens the implemented mobile block picker instead
of expecting desktop slash suggestions, which compact mode intentionally disables.
Its exact document-width and panel-boundary assertions are retained.

Host response-loss and delivery requirements above remain external contracts;
these repairs do not establish exactly-once provider delivery.
