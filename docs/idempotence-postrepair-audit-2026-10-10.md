# Editor and mailbox post-repair audit, 2026-10-10

**The original 14 reported findings are closed for their reported cases. The
fresh audit is not clean: 14 additional defect groups remain, two P1 and twelve
P2, plus one separate recovery-policy gap.** Some new findings concern ordinary
correctness rather than strict idempotence; they are included because the audit
covers every editor and mailbox action family.

Three fresh-context subagents independently audited synchronous editor actions,
editor asynchronous work/resources and mailbox actions after the corrective
commit `6edfe054dd0cd592ba42a3f80e4f1bdb63291ba4` was pushed. The synchronous audit
caught one further original F03 desktop alignment entry point. That was repaired,
independently verified and pushed as
`fff816f0207ce13f959d967e2d260914125d175d`. All three auditors then verified the
pushed snapshot and reran their relevant retained suites. Mailbox and async
finding source is unchanged between these snapshots. This report's locations
refer to canonical source in the final code commit.

See [the original 14 findings and repairs](idempotence-reaudit-2026-10-10.md)
for their descriptions, acceptance cases and the earlier corrective passes.
The new findings below were audited and documented, not repaired in this pass.

## Original findings

| Finding | Final assessment                                                                                                                                                                                                             |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F01     | Departed preparation cannot replace a newer composer's identity; acknowledged draft receipts are retained independently.                                                                                                     |
| F02     | Paste/drop work survives ordinary plugin recreation; true removal/unmount cleans owned placeholders from current retained state. The new history issue N03 is separate.                                                      |
| F03     | Identical schema-normalized settings, displayed defaults and repeated text-block types preserve history. Desktop and floating/mobile alignment share the complete selected-range guard. Mixed ranges still change correctly. |
| F04     | Desired column counts are atomic and retain surviving content/attributes. Repeating the requested count creates no history.                                                                                                  |
| F05     | Native drag listeners follow recreated plugin views; cleanup cancels only owned dragging state and preserves ProseMirror drop handoff. Physical native cancellation remains outside acceptance.                              |
| F06     | Failed empty image/logo uploads retain translated retry controls.                                                                                                                                                            |
| F07     | Intrinsic image completion cannot overwrite newer manual dimensions or a replacement node. Temporary placeholders defer intrinsic writes until upload acknowledgment.                                                        |
| F08     | Resize commits own the captured document/node; stale and duplicate releases are rejected.                                                                                                                                    |
| F09     | New compose intent does not inherit a previous draft's revision.                                                                                                                                                             |
| F10     | Initial reads, refresh and pagination use the same complete filter serialization.                                                                                                                                            |
| F11     | Stale refresh success, failure and pending cleanup cannot affect a newer query.                                                                                                                                              |
| F12     | Label deletion cannot clear a newer controlled label selection.                                                                                                                                                              |
| F13     | A departed label mutation cannot close a newly reopened form.                                                                                                                                                                |
| F14     | Acknowledged reader changes overlay the matching thread message and refresh its thread. Ordinary read freshness remains a separate defect, N10.                                                                              |

## Additional confirmed defects

### N01 — P1: Saved attachment can be discarded after acknowledgment

Locations: `packages/core/src/mailbox/index.tsx:1896` and `:4403`.

Upload a compose attachment, Save, and acknowledge `createDraft` with its
persisted attachment reference. Hold the follow-up list refresh, replace the
data source, then resolve the old refresh. `saveDraft` returns `false` because
its owner departed. The old Compose treats that as an unaccepted save and calls
`discardUploadedAttachment` once for the already-persisted attachment.

The mounted probe confirms the callback and stored draft reference. Actual
storage deletion depends on the host. Save acknowledgment and refresh ownership
are incorrectly treated as one outcome.

### N02 — P1: Undo fails after empty list or blockquote conversion

Location: `packages/core/src/editor/extensions/placeholder.ts:42`.

Convert an empty paragraph to Bullet List, Numbered List or Blockquote, then
Undo. TipTap's nested-placeholder decoration mapping throws
`RangeError: Position -1 outside of fragment (<>)`; the converted block remains.
All three were confirmed in Chromium, and an actual slash-menu Bullet List
followed by Cmd+Z also fails. Empty mobile-style conversion reproduces the same
problem.

A minimal installed TipTap 3.30.5 `StarterKit + Placeholder` setup reproduces
with `includeChildren: true` and passes with `false`, independently of Maily's
command overrides. Maily enables the affected upstream path. Disabling it would
remove nested-placeholder behavior, so that counterexample is not a complete
repair.

### N03 — P2: Undo revives a revoked paste-upload URL

Locations: `packages/core/src/editor/plugins/image-upload/image-upload-plugin.ts:104`
and `:129`.

Paste an image and allow a real 600 ms delay before upload completion. Completion
creates a separate history group, revokes the temporary URL and removes its
placeholder tracking. Undo restores an image with that revoked `blob:` source.
Failure and plugin cancellation across a history boundary also reproduce it.
Immediate completion is the counterexample: one group, with Undo removing the
image completely.

The lifecycle repair F02 passes, but releasing a URL is not safe while history
can restore it. [URL revocation reference](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static).

### N04 — P2: Replacement image/logo inherits departed upload UI

Locations: `packages/core/src/editor/nodes/image/image-view.tsx:31`, `:265`;
`packages/core/src/editor/nodes/logo/logo-view.tsx:16`, `:95`.

Start an empty node upload, then replace the document using
`setContent(editor.getJSON())`. Real React NodeViews reuse the same component for
the replacement immutable node. It inherits the old loading state and exclusion
lock; an old rejection then displays its error on the replacement. The new node
cannot start its own upload until the old promise settles.

The node-target check correctly rejects stale successful results and discards
their URLs once, including under StrictMode. Upload UI generations invalidate
only on component teardown, which is insufficient for reused NodeViews.

### N05 — P2: Active suggestion popup disappears after plugin recreation

Locations: `packages/core/src/editor/extensions/slash-command/slash-command-view.tsx:534`,
`:558`; `packages/core/src/editor/nodes/variable/variable-suggestions.tsx:120`,
`:141`.

Open the slash or variable popup, register an unrelated plugin, then continue
typing the matching query. Real ReactRenderer/Tippy resources are destroyed
while suggestion state remains active. Subsequent updates do not rebuild the
popup. Ordinary typing, Escape, reopening and editor destruction are working
counterexamples.

Installed ProseMirror recreates plugin views when the plugin array changes;
installed TipTap does not restart already-active suggestion state at that
boundary. Renderer ownership currently assumes only an actual suggestion exit.

### N06 — P2: Idle font picker cancels another picker's selection

Locations: `packages/core/src/editor/components/text-menu/font-family-picker.tsx:232`,
`:247`, `:256`.

Mount two real pickers under the same provider. Choose a font in one and hold its
version request. Remove the idle sibling, then resolve the version. The active
picker never invokes `onFontChange`, despite unchanged document and selection.
Both use the literal `font` action channel, including cleanup cancellation.
Color pickers already have independent `useId` channels.

### N07 — P2: Mailbox Undo leaves the reader stale

Location: `packages/core/src/mailbox/index.tsx:2278`.

Favorite a selected message; the host returns updated detail and an undo
receipt. Undo restores the host favorite state and refreshes list/counts, but
does not invalidate detail/thread state. The reader still shows Remove star.
Clicking it sends `favorite: false` against the already-restored false state.

### N08 — P2: Storage probe deletes another scope's historic receipt

Location: `packages/core/src/mailbox/index.tsx:1937`.

Seed a supported historic scalar receipt for an opaque recovery scope ending in
`:probe`, then send under the otherwise identical scope without that suffix.
The send's availability probe overwrites and removes the other scope's receipt.
Modern journal receipts survive; the failure specifically concerns retained
scalar compatibility. An opaque caller scope was used, without manufacturing a
journal entry or an invalid ID.

### N09 — P2: Synchronous adapter failures bypass error handling

Locations: `packages/core/src/mailbox/index.tsx:1506`, `:1666`, `:4369`.

Mounted probes make `listLabels`, `getThread` or departed attachment cleanup
throw synchronously. A real ErrorBoundary catches each failure, the mailbox
tree disappears, and the advertised `onError` path never runs. The adapter's
MaybePromise contract allows these calls to execute synchronously.

Each path uses `Promise.resolve(callback())`: the callback is evaluated before
the rejection handler exists. [Promise.resolve reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve#description).

### N10 — P2: Ordinary detail read overwrites acknowledged mutation detail

Locations: `packages/core/src/mailbox/index.tsx:1636`, `:1653`, `:2140`.

Start Translate, change only `onError` identity and hold the resulting ordinary
detail read. Resolve Translate with a new subject/body, then resolve the older
read. The non-threaded reader returns to its original subject/body. Source and
selection ownership do not establish freshness relative to an acknowledged
mutation. This is distinct from F14's repaired thread-overlay case.

### N11 — P2: Contact name comma creates extra recipients

Locations: `packages/core/src/mailbox/index.tsx:738` and `:4898`.

Select the actual host suggestion `{ displayName: 'Doe, Jane', address:
'jane@example.com' }` through Command, then Save. The adapter receives
`to: ['Doe', 'Jane <jane@example.com>']`. The formatter emits an unquoted display
name and the parser splits every comma. Formatting alone would not resolve
quoted address-list parsing. This is ordinary compose correctness.
[RFC 5322 address syntax](https://www.rfc-editor.org/rfc/rfc5322#section-3.4).

### N12 — P2: Optional counts failure clears a successful message list

Locations: `packages/core/src/mailbox/index.tsx:1527` and `:1534`.

Have `listMessages` successfully return a message while optional `getCounts`
throws synchronously or rejects. Both mounted variants show No messages in the
inbox because the shared initial `Promise.all` catch clears the valid list.
This is an availability defect rather than a duplicate mutation.

### N13 — P2: Default Spacer stores an invalid dimension

Locations: `packages/core/src/blocks/layout.tsx:58` and
`packages/render/src/maily.tsx:1132`.

Execute the actual Spacer preset. TipTap JSON stores `height: 'sm'`; the editor
and email renderer construct `height: smpx`. The invalid value is not rejected
by schema attribute validation. This is ordinary preset correctness; the
repaired selected-spacer setter and visibility preservation still pass.

### N14 — P2: Empty HTML preview's click-to-Code path is unreachable

Locations: `packages/core/src/editor/nodes/html/html-view.tsx:41`, `:44`, `:90`.

The preview always includes at least `<style></style>`, so `isEmpty` is false
even with no authored content. The mounted empty preview remains in Preview
when clicked. The explicit Code/Preview tabs still work; no editor crash was
demonstrated. This is ordinary NodeView interaction correctness.

## Separate recovery-policy gap

Locations: `packages/core/src/mailbox/index.tsx:1173` and `:1942`.

An old source's pending preparation can append a second receipt after the new
source's initial recovery scan. A live unknown send can still retry the known
current draft ID while both receipts remain. The probe observed
`[['live-current'], ['live-current']]`; both journal IDs remain retained. Mounting
with both receipts correctly blocks.

This contradicts the [documented reconciliation policy](mailbox-workflows.md),
but establishes neither wrong-ID sending nor duplicate provider delivery. It is
recorded separately from the 14 confirmed defect groups.

## Complete action-family inventory

The audit traced every current family below through canonical handlers,
commands, adapter boundaries and ownership/cleanup. Runtime probes concentrate
on meaningful boundaries and all declared reader/bulk dispatch controls; this
table does not claim every possible property/interleaving was executed.

| Synchronous editor family                                                                | Evidence                                                                                    |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Desktop marks, clear line, divider, link and alignment; Design/Render                    | Source and command/history probes; final implicit/mixed alignment regression passes.        |
| Text/variable marks, font family/size, direction and alignment                           | Live ranges/stored marks, displayed defaults, mixed selections and chained commands.        |
| Turn into paragraph/headings/footer/lists                                                | Same-type no-ops and deliberate wrapper conversion; N02 affects empty list conversion Undo. |
| Desktop add/duplicate/delete/menu targets                                                | Captured document/node ownership and frozen-target regressions.                             |
| Mobile panel/back/close/navigation                                                       | Persistent toolbar, active-panel guard and owned selection.                                 |
| Mobile insert/move/duplicate/delete/Undo/Redo                                            | Helpers, captured boundaries and preset paths; N02 affects empty list/blockquote Undo.      |
| Columns count/width/gap/alignment/visibility/delete/Tab navigation                       | Helpers, schema, controls and atomic `1→5→2` with surviving attributes/content.             |
| Section alignment/border/radius/colors/spacing/visibility/delete                         | Call sites and normalized setters; composite callbacks remain intact.                       |
| Spacer height/visibility/unset                                                           | Actual control history/visibility checks; N13 preset failure.                               |
| Image/logo/inline-image URL/dimensions/alignment/radius/link/visibility/aspect           | Setters and intentional toggles; inline image has no upload path.                           |
| Button label/variable/padding/variant/radius/alignment/link/colors/typography/visibility | NodeView setters and default-history checks, including all four padding sides.              |
| Link-card fields/typography; repeat and variable values                                  | NodeViews, autocomplete, submit and command wiring.                                         |
| HTML code/preview/visibility/selection/preview click                                     | Commands, stock Tabs and N14.                                                               |
| Slash navigation/submenus/default/header/footer presets                                  | All 27 leaf presets executed; 24 restore exact Undo/Redo, three reproduce N02.              |

| Asynchronous editor/resource family                                                   | Evidence                                                                                                                  |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Paste/drop targets, rejection/throw, URLs, plugin removal/destruction/unmount/remount | Seventeen retained cases pass; N03 remains.                                                                               |
| Direct image/logo upload/retry/replacement/StrictMode                                 | Retained retry passes; real reused NodeViews reproduce N04; stale successful URLs discard once.                           |
| Intrinsic loading/manual dimensions                                                   | Captured-node and newer-size checks pass; loaders controlled.                                                             |
| Resize capture/release/listeners                                                      | Retained stale/duplicate-release checks pass; teardown inspected.                                                         |
| Drag clone/pointer timers/listeners/cancel/drop handoff                               | Three retained cases pass; recreation/cancel ownership checked. Physical native cancellation remains unverified.          |
| Font catalog/version/cache/document faces/virtualized previews                        | Ten retained cases pass; catalog dedup/retry and pending face dedup/failure retry checked; preview cleanup inspected.     |
| Deferred color/font/mobile actions                                                    | Four retained ownership/supersession cases pass; independent color channels inspected; N06 remains.                       |
| Slash/variable renderers/submenus/Escape/destruction                                  | Real ReactRenderer/Tippy reproduces N05; Escape/destruction counterexamples pass.                                         |
| Focus timers/RAFs/observers/autocomplete/outside click                                | StrictMode timer reschedule/teardown and portal/outside-click teardown checked; mobile listeners and observers inspected. |

| Mailbox methods or family                                                                      | Evidence                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listMessages`, `getCounts`; initial/Refresh/Newer/Older/search/filter/scope                   | Generation, cursor/backtracking, changed-query and stale-response cases; polling uses same source-inspected owner. N12 remains.                                                  |
| `getMessage`, `getThread`, `getMessageSource`; reader/source/retry/Back                        | Selection/source ownership, delayed read order, thread overlays and escaped source cases. N09/N10 remain.                                                                        |
| `createDraft`, `updateDraft`, `discardDraft`, `sendDraft`; save/autosave/send/discard/recovery | Intent, observed revision, reply headers, unknown retry, departed work and synchronous exclusion; discard dispatch source-inspected. N01/N08 and the separate policy gap remain. |
| `listContactSuggestions`; recipient fields/Cc/Bcc                                              | Actual debounce/Command selection/saved payload; helper filtering/dedup/limits. N11 remains.                                                                                     |
| `uploadAttachment`, `discardUploadedAttachment`, `downloadAttachment`                          | Stale compensation, unmount, persisted-reference handoff, identity/index and per-file retry/exclusion. N01/N09 remain.                                                           |
| `runMessageAction`                                                                             | All 19 actual reader controls exercised for captured ID/value, pending exclusion and acknowledged refresh.                                                                       |
| `runBulkMessageAction`                                                                         | All eight actual bulk controls exercised, including bulk-only hosts, captured IDs and pending exclusion.                                                                         |
| `listLabels`, `createLabel`, `renameLabel`, `deleteLabel`, `applyLabel`, `removeLabel`         | Forms/menus/capability gates, read generations, mutation exclusion, selection/form ownership; rename dispatch source-inspected. N09 remains.                                     |
| `undoMessageAction`                                                                            | Host-issued tokens, expiry, duplicate exclusion and source reset; N07 selected-reader defect.                                                                                    |
| Folder/label/reader/bulk selection, mobile navigation, Back, dirty confirmation                | Controlled-state authority and mounted-list preservation; navigation/discard UI covered by retained cases.                                                                       |
| Compose/new/reopen/reply/reply-all/forward/plain/rich/body mode                                | Intent/header/revision ownership, recipient placement, preserved active editor, autosave failure and newer edits.                                                                |
| Reader iframe/resources/focus                                                                  | Sandbox and observer/load/wheel/focus ownership source-inspected; no fresh provider/MIME acceptance.                                                                             |
| Folder-wide deletion                                                                           | No current implemented capability/action; no coverage claimed.                                                                                                                   |

All **22 adapter methods** appear above. The 19 reader actions are archive,
delete, restore, notSpam, deleteForever, favorite, markUnread, markRead,
blockSender, reportSpam, reportPhishing, reportIllegal, filterSimilar, translate,
print, download, showOriginal fallback, feedback and react. The eight bulk
actions are archive, delete, reportSpam, markRead, markUnread, restore, notSpam
and deleteForever.

## Verification and consumer boundary

- **225 retained unit tests pass:** 197 core tests in 20 files and 28 render
  tests in two files. Package TypeScript and workspace production builds pass.
- **15 browser tests pass:** nine playground checks and six clean Radix/Base
  consumer checks. Clean Radix, Base and Bun isolated installs/builds pass.
  Base editor-only TypeScript is strict. Full Base retains only the documented
  upstream ScrollArea unused-React-import exception; no Maily diagnostic is
  accepted through that exception.
- Playground production build, primitive audit, changed-file Prettier and
  whitespace checks pass. **302 embedded entries** match generated staging.
- **All 29 captured host primitive/config/utility hashes are unchanged.**
  Registry source was generated from packages and the playground installed
  through the official CLI. Consumer primitives and adapter signatures were
  not patched. No conflict was observed in the tested Radix/Base/Bun fixtures.
- ESLint has no new diagnostics relative to the prior source; existing errors
  remain. This is not a clean repository-wide lint result.
- The three fresh auditors executed **109 temporary cases**: 52 synchronous
  editor, 18 asynchronous/resource and 39 mailbox. Some deliberately assert
  broken behavior to establish findings; they are not acceptance passes. Their
  respective retained suites pass 48, 44 and 102 cases and overlap the full
  suite above. All temporary repository probes were removed.

The new mounted async/recipient/mailbox cases use React/HappyDOM. Popup and
NodeView probes use real ReactRenderer, Tippy and canonical React NodeViews.
The Placeholder failure was additionally confirmed with native Chromium Undo.
Controlled image/FontFace results do not establish visual loading or browser
memory behavior. Physical touch interactions and native drag cancellation were
not accepted; an exploratory native drag attempt was inconclusive. Successful
document FontFaces are globally cached by design, and growth was not measured.
An uncancelled text-menu selection RAF on menu-only teardown was inspected, but
no material failure was demonstrated.

No new provider, remote storage, SMTP, authorization, publication or deployment
acceptance is claimed. Hosts still own transactional revision checks, delivery
deduplication, uncertain create responses, undo-token consumption, classifier
semantics and durable compensation. Local exclusion does not prove exactly-once
external effects, and the confirmed discard callback does not prove a real file
was deleted.
