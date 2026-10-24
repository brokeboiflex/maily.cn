# Editor and mailbox idempotence re-audit, 2026-10-10

> **Superseded in part (2026-10-24):** Maily no longer keeps send-recovery
> receipts in browser storage, the `recoveryScope` prop or the pending-send lock
> described here. Send recovery belongs to the host; see CHANGELOG.md and
> [mailbox workflows](mailbox-workflows.md#async-ownership-and-sending).

Audited commit: `442aa7cd11828ae68356445c5e265f27b4a9a07c`, pushed to
`origin/main` before this audit. Three fresh-context subagents independently
inspected synchronous editor actions, editor async/resource actions, and mailbox
actions. No implementation changes were made during the audit. This report was
created afterward and is not part of the audited commit.

**Result: 14 confirmed residual findings: two P1 and twelve P2.** One additional
drag-cancellation issue requires real-browser confirmation. Existing repairs and
their regressions continue to pass; they do not cover the newly reproduced cases.
Read this alongside [the previous audit and repairs](idempotence-audit-2026-10-10.md).

The bar covers duplicate dispatch, repeated desired-state requests, stale
document/selection/compose/query ownership, lifecycle recreation, resource cleanup
and uncertain host responses. Deliberate insertion, deletion, formatting toggles,
movement, undo/redo traversal and completed downloads are intentionally repeatable.
Source inspection covers every implemented action family; runtime probes cover
the cases explicitly described below.

## Confirmed findings

Source paths below are relative to `packages/core/src/`. Line numbers refer to
the audited commit. P1 means a high-impact functional failure; P2 means a
material behavior or ownership defect with narrower triggers.

### F01 — P1: Old send preparation can send the wrong compose intent

Locations: `mailbox/index.tsx:1836`, `:1853`, `:1828`.

Mounted React reproduction: compose subject “Old intent”, click Send, and delay
`createDraft`. Replace only the data-source object, keeping the same account ID
and effective recovery key. Open a new composer and type “New intent”. Resolve
the departed source's creation as `old-intent-draft`. Its send is correctly
skipped, but it writes the old ID into shared `composeDraftRef` and
`pendingSendRef` before checking its lifetime. Send from the newer form calls the
new source's `sendDraft('old-intent-draft')`, without creating or updating the new
content.

Retaining the acknowledged old draft receipt remains necessary for recovery.
The defect is that this receipt also becomes the identity of an unrelated live
composer. Recovery ownership and current compose ownership need distinct checks.

### F02 — P1: Normal editor mounting disables paste/drop upload completion

Locations: `editor/plugins/image-upload/image-upload-plugin.ts:106`, `:77`.

The plugin-view destructor sets a closure-level `destroyed` flag permanently.
ProseMirror destroys and recreates all plugin views when its plugin array changes,
including normal TipTap BubbleMenu/DragHandle registration. The recreated upload
view never restores its lifetime.

Mounted public `Editor` reproduction, with ordinary menus and configured
`ImageUploadExtension`: paste after `onCreate`, resolve a valid uploaded URL.
Discard runs instead of installing the URL, and saved JSON retains `blob:audit`,
which is revoked. Registering another plugin while an upload is pending also
revokes the live placeholder prematurely. A transparent `NodeViewWrapper`
substitute supported the HappyDOM mount; editor/menu/plugin/upload behavior was
real. This is a plugin-view recreation defect, not evidence that the host upload
handler failed.

### F03 — P2: Unchanged settings damage undo/redo history

Locations: `editor/utils/update-attribute.ts:58`, `editor/utils/columns.ts:250`,
`editor/nodes/spacer.ts:77`, `editor/components/spacer-menu/spacer-bubble-menu.tsx:33`.

Real TipTap reproduction: set spacer height `8→16`, advance the normal history
clock by 600 ms, and reapply `16`. JSON stays identical, but undo depth becomes
two: the first Undo changes nothing and the second restores `8`. More directly,
set `8→16`, Undo to `8`, then click the actual mounted **sm** spacer control.
JSON stays identical while Redo becomes unavailable.

Repeated `updateSection({ align: 'center' })` and
`updateColumnWidth(editor, 0, '50')` also create invisible history steps. The
shared setter always creates markup steps, the width setter replaces the columns
node, and spacer delegates to an unconditional TipTap attribute update. The
previous transaction-churn observation now has demonstrated user-visible damage.

### F04 — P2: Column-count requests change by one instead of reaching the target

Location: `editor/components/column-menu/columns-bubble-menu-content.tsx:46`.

The actual mounted callback receives desired count `3` but adds only one column.
On schema-valid one-column content, identical requests produce `1→2→3→3`.
The first request misses its requested result; the second changes it again.
The schema accepts `column+` at `editor/nodes/columns/columns.ts:27`.

Boundary: normal presets start with two columns and the usual picker transitions
are `2↔3`. Their equal-count guard works. This finding applies to valid
caller-supplied/imported content outside that starting range.

### F05 — P2: Plugin reconfiguration removes drag listeners permanently

Locations: `editor/plugins/drag-handle/drag-handle-plugin.ts:368`, `:461`.

Native listeners are installed outside `view()` but removed by its destructor.
Recreated views reinstall neither listener. Real TipTap/DragHandlePlugin
reproduction with controlled hit-test geometry: first native dragstart calls
`setDragImage`; register another plugin; the second dragstart does nothing.
Counters confirm one registration, one removal, and no replacement registration.

A host registering/unregistering a plugin while the handle remains mounted is a
practical trigger. Full public-editor ordering after every responsive transition
was not browser-tested. Like F02, setup and cleanup must follow the same
recreatable view lifetime.

### F06 — P2: Failed empty image/logo uploads lose the retry surface

Locations: `editor/nodes/image/image-view.tsx:235`,
`editor/nodes/logo/logo-view.tsx:90`.

Mounted image and logo reproductions: upload to an empty node and reject the
host callback. Saved `src` stays empty; visible text becomes blank; the file
input disappears. Rejection sets `error`, while the upload input requires `idle`
and error content requires an existing source. Neither direct upload surface
can retry without a remount/replacement or an external URL change.

### F07 — P2: Intrinsic image loading overwrites a newer manual size

Location: `editor/nodes/image/image-view.tsx:267`.

Begin same-source loading with width `auto`; set manual dimensions to `120×60`;
resolve the intrinsic load with wrapper width `300`. JSON becomes `300×150`.
The effect depends only on `src`, so its callback retains the old auto-width
decision. Handler cleanup on source change does not protect newer dimensions
with the same source.

### F08 — P2: Pending resize modifies a replacement node

Location: `editor/nodes/image/image-view.tsx:86`.

Mounted ImageView with a real TipTap document: start at width `120`, drag by
`+30`, replace the document with equal JSON while retaining the mounted view,
then release. The replacement node becomes width `150`. Mouseup writes through
`updateAttributes` without owning the captured document/node. TipTap's writer
resolves the current position, and its React NodeView accepts same-type
replacements. Duplicate mouseup commits once and unmount removes listeners;
those guards do not establish target ownership. Public-editor browser replacement
was not separately tested.

### F09 — P2: New drafts inherit an unrelated draft revision

Locations: `mailbox/index.tsx:1734`, `:1755`.

Hydrate an existing draft with `_revision: 'old-revision'`, then Back → Compose →
Save. Mounted reproduction confirms that `createDraft` receives
`revision: 'old-revision'`. New Compose, Reply, Forward and source-reset paths
clear draft identity without clearing `composeRevision`; send preparation also
copies it. The invalid ownership of the payload is established; rejection or
other backend consequences depend on host handling.

### F10 — P2: Refresh and pagination serialize different search filters

Locations: `mailbox/index.tsx:1252`, `:1366`.

With `defaultSearchFilters: { starred: true, labelId: 'label-a' }`, the initial
request includes structured filters but `q: undefined`; Older sends
`q: 'is:starred label:label-a'`. The initial serializer omits `starred` and
`labelId`; pagination passes the whole query. Hosts consuming structured
`search` avoid this defect. Hosts consuming the supported Gmail-style `q`
receive different criteria for the same intended query and its cursor pages.

### F11 — P2: Old refresh failures contaminate a newer query

Location: `mailbox/index.tsx:1334`.

Start manual Refresh for query A, change search to B and successfully load B,
then reject A. Mounted reproduction confirms `onError(error, 'refresh')` runs
and B displays the refresh error. Success writes use generations, but refresh
error handling checks only data-source lifetime. The same `finally` also lacks
query/operation ownership when clearing loading flags; that consequence is
source-inspected rather than a separate runtime finding.

### F12 — P2: Label deletion clears a newer controlled selection

Location: `mailbox/index.tsx:2193`.

Delete selected label L with a pending promise; parent changes
`selectedLabelId` to M; resolve deletion of L. Mounted reproduction confirms a
new `onSelectedLabelIdChange(null)` request against M. Completion compares its
captured selection L, without checking current label-selection ownership.

### F13 — P2: Old label completion closes a newer form

Location: `mailbox/index.tsx:2200`.

Submit label creation; Cancel while pending; reopen Create label and type a
second name; resolve the first creation. Mounted reproduction confirms the new
dialog closes and its typed name is cleared. Shared dispatch exclusion does not
own the form session; completion clears `labelForm` and `labelName`
unconditionally.

### F14 — P2: Updated message content remains behind a stale thread snapshot

Locations: `mailbox/index.tsx:2022`, `:1574`, `:3502`.

Load a threaded reader whose `getThread` returns the original body. Translate
returns valid detail containing “Translated body”. Mounted reproduction confirms
the header/detail updates while the visible body remains original. The reader
prefers `thread.messages`, and thread fetching does not depend on a
mutation/detail revision. The same path can hide changed content or attachments
returned by fallback `getMessage`; that broader consequence is source-inspected.

## Follow-up requiring browser confirmation

Handle drag cancellation cleans the clone, timer and listeners at
`editor/plugins/drag-handle/drag-handle-plugin.ts:324`, but does not clear
`editor.view.dragging`, assigned at line 360. Simulated handle dragstart/dragend
leaves that value set. ProseMirror's native clearing listener lives on its editor
DOM, while the handle is outside it. The text bubble menu suppresses itself
while dragging remains set. Real-browser Escape/cancelled-drag confirmation is
outstanding, so this is not counted among the 14 confirmed findings.

Queued paste work also invokes the host after synchronous editor destruction;
successful stale results have a discard path. Include that ordering when
repairing F02. Remote cleanup after a rejected/lost response still requires a
host contract.

## Complete action-family inventory

“Inspected” means current canonical implementation and shared action paths were
traced. “Tested” refers to current retained regressions or the explicit temporary
probes above; it is not certification of every browser event interleaving.

| Surface / action family                                                                                  | Assessment                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop marks, clear line, divider, alignment, links, Design/Render                                      | Command/primitive wiring inspected; one activation path. Toggles, insertion and history traversal intentionally repeatable.                                                                    |
| Text/variable formatting, direction, font size, list controls, Turn into                                 | Menus, state and commands inspected. Heading/paragraph/footer establish types; lists toggle intentionally. Same-value node attributes share F03.                                               |
| Desktop add/duplicate/delete and node-menu opening                                                       | Captured immutable target and one-shot command paths inspected; current stale-document and frozen-menu-target regressions pass.                                                                |
| Mobile disclosure/back, insertion, duplicate/delete/move, Undo/Redo                                      | Complete block tree and deferred ownership traced. Active-panel no-op, movement boundaries and document/history regressions pass.                                                              |
| Columns count/width/gap/alignment/visibility/delete/navigation                                           | All helpers, schema and controls inspected. F03–F04; fresh sibling navigation/boundary probes pass.                                                                                            |
| Section alignment/border/radius/colors/spacing/visibility/delete                                         | Shared setters and ancestor deletion inspected; F03 applies to unchanged attributes. Deferred colors covered below.                                                                            |
| Spacer height/visibility/unset                                                                           | Previous condition-preservation repair verified through actual controls; F03 remains.                                                                                                          |
| Image/logo/inline-image URL/dimensions/alignment/radius/link/visibility/aspect                           | Sync setters inspected; deliberate aspect-lock toggle distinguished. Upload/load/resize findings below. Inline image has no upload path.                                                       |
| Button label/variable/size/variant/radius/alignment/link/color/visibility                                | Node/view and shared controls inspected; unconditional attribute transactions share F03's mechanism. Every property was not separately runtime-tested.                                         |
| Link-card content/link/image/badge/subtitle/typography; repeat/variable values                           | NodeViews, menus, autocomplete and submit callbacks inspected. Typing and chosen suggestion insertion intentionally repeatable.                                                                |
| HTML code/preview/visibility/select-all/preview click                                                    | Controlled tabs and live selection/text paths inspected.                                                                                                                                       |
| Slash navigation/submenus and every default/header/footer preset                                         | Factories and event wiring inspected; deliberate insertions repeatable. Normalization terminates.                                                                                              |
| Paste/drop uploads and object URLs                                                                       | Existing immutable-target, moved-node, ambiguity, failure, synchronous-throw and destruction tests pass; F02 exposes recreation lifetime.                                                      |
| Image/logo file/drop upload                                                                              | F06. Fresh StrictMode duplicate dispatch calls host once; stale replacement/unmount discards a successful URL once.                                                                            |
| Image/logo intrinsic loading and resizing                                                                | Cleanup inspected; F07–F08. Duplicate resize release and unmount probes pass. Touch/native-browser sizing not rerun.                                                                           |
| Native drag clone/drop/timer/listeners                                                                   | F05; clone/timer cleanup inspected. Cancelled dragging state remains the explicit browser follow-up.                                                                                           |
| Font catalog/version/preview/document faces                                                              | Ten retained tests pass: pinned versions, failed-version retry and concurrent deduplication. Preview cleanup inspected; globally retained document faces and browser growth remain unmeasured. |
| Deferred font/color/mobile actions                                                                       | Current document/selection/supersession/lifecycle/channel/one-shot regressions pass; layout cleanup and independent color channels inspected.                                                  |
| Slash/variable suggestion renderers                                                                      | ReactRenderer/Tippy update/Escape/exit and installed TipTap abort/destruction traced; repeated browser popup lifecycle not rerun.                                                              |
| Editor timers/RAFs/autocomplete/outside-click/observers                                                  | Owned timeout reschedule/cleanup and portal/mobile listener cleanup inspected. Text-menu RAF checks editor destruction but survives menu-only teardown; no material damage demonstrated.       |
| Mailbox lifetime/account/actor/recovery scope                                                            | Source-owned locks and previous actor/legacy-receipt tests pass; F01 exposes shared compose receipt contamination.                                                                             |
| Folder/label navigation, mobile menu, Back, dirty confirmation                                           | Controlled host requests and mounted list preservation inspected/tested; F12 affects label completion.                                                                                         |
| New Compose and draft selection/hydration                                                                | Current placeholder/hydration and compose-owned detail tests pass; F09 affects new compose seeds.                                                                                              |
| Search/clear/advanced filters/global scope                                                               | Controlled-state regressions pass; F10 affects serialization.                                                                                                                                  |
| Refresh/counts/polling/Newer/Older/cursor rebuild                                                        | Successful read generations, page exclusion, stale pages and empty-final-page fallback tested. F10–F11; reads can overlap without a host cancellation API.                                     |
| Page/conversation/bulk selection                                                                         | Explicit host thread IDs, current-page Checkbox and newer controlled-selection preservation tested. Local IDs deduplicated; host-controlled duplicates forwarded as supplied.                  |
| Reader/detail/thread hydration                                                                           | Selection cancellation and mismatched thread rejection tested; F14 affects mutation freshness.                                                                                                 |
| Reply/Reply all/Forward                                                                                  | RFC Message-ID, self/recipient deduplication, To/Cc placement, Bcc omission and reopened header tests pass; F09 affects unrelated new revisions.                                               |
| Recipients/subject/plain/rich/Cc/Bcc/body-mode/editor updates                                            | Value capture/text-html boundary inspected; active Visual editor preserves its instance. Intentional mode changes remount it.                                                                  |
| Save/autosave/retry/revisions                                                                            | Locks, observed revision advancement, captured acknowledgment and newer edit preservation tested; F09. Host CAS remains external.                                                              |
| Send/preparation/unknown retry/recovery                                                                  | Retained actual draft ID and remount retry tests pass; F01. Host exactly-once delivery is external.                                                                                            |
| Discard/dirty-navigation discard                                                                         | Local exclusion and unknown-send guards inspected; backend deletion/reconciliation external.                                                                                                   |
| Contact suggestion loading/selection                                                                     | Name/address filtering, debounce, generations and unmount rejection inspected. Untracked selection RAF has null removed-input refs; no material failure reproduced.                            |
| Compose attachment upload/remove                                                                         | Sequential ownership, stale compensation and persisted-reference handoff tests pass; durable failed cleanup is host-owned.                                                                     |
| Attachment metadata/download/error/retry                                                                 | Optional metadata, ID/index identity, per-file exclusion and retry tests pass; completed downloads intentionally repeatable.                                                                   |
| Original source/show/retry/Back                                                                          | Lazy escaped source, sync/async failure, stale result and retry tests pass; archive/MIME truth belongs to host.                                                                                |
| Favorite/unfavorite/reaction/read/unread/auto-read                                                       | Shared runner/exclusion and repaired reader epochs tested. Auto-read remembers success for source lifetime; mark-unread/reopen semantics remain unspecified.                                   |
| Archive/Trash/Spam/restore/notSpam/permanent delete                                                      | Capability/folder gates and reader-clearing ownership inspected/tested; storage/classifier semantics are host-owned.                                                                           |
| Block sender/phishing/illegal reports/similar filter/translate/print/download/original fallback/feedback | Every declared action traced through the same captured adapter dispatch. F14 reproduces Translate display staleness; provider effects require host capability.                                 |
| Bulk archive/delete/report/read/unread/restore/notSpam/permanent delete                                  | Captured IDs, capability/folder gates, local pending exclusion and newer controlled selection/reader tested.                                                                                   |
| Label list/create/rename/delete/apply/remove                                                             | Repaired read/postack generation, rejected-mutation fallback, immutable IDs and pending apply tests pass; F12–F13 remain.                                                                      |
| Undo/receipt expiry                                                                                      | Host-issued receipt only, pending exclusion, source reset and timer cleanup tested; token consumption is host-owned.                                                                           |
| Reader iframe/resources/focus                                                                            | Sandbox, observer/load/wheel/focus ownership inspected. No fresh browser/StrictMode resource acceptance.                                                                                       |
| Folder-wide deletion                                                                                     | No implemented capability or action; no coverage claimed.                                                                                                                                      |

## Verification, references and boundaries

- Current full core suite: **120 tests in 13 files passed**; core TypeScript
  `--noEmit` passed using installed binaries.
- Shadcn primitive audit passed. Registry imports declare their host dependencies;
  **296 embedded source entries** match generated staging exactly.
- Fresh audit: **28 temporary tests** across the three agents (8 synchronous
  editor, 13 async/resource, 7 mailbox), including defect reproductions and
  counterexamples. Tests asserting broken behavior passing are reproduction
  evidence, not acceptance passes. All probe files were removed from the repo.
- Agent-specific retained suites also pass: editor action regressions, 19
  upload/font/deferred regressions, and 88 mailbox tests. These overlap the full
  suite and are not additional unique test counts.
- No source, generated registry or consumer primitive implementation was edited.
  The current audit does not establish a new conflict with host primitives; its
  defects are in Maily action/lifetime/state handling.
- No fresh browser consumer matrix, provider/backend, remote storage, SMTP,
  authorization, production, publication or deployment check was run. Prior
  consumer acceptance is recorded in the previous repair report and does not
  validate these new interleavings.

The public editor mount emitted a React `flushSync` lifecycle warning; upload
assertions completed. Controlled geometry/image loading and the transparent
NodeViewWrapper described above limit those probes to action/lifecycle evidence,
not visual or native-browser acceptance.

Reviewed [React effect cleanup and async race handling](https://react.dev/reference/react/useEffect)
and the installed authoritative TipTap 3.30.5 / ProseMirror implementations.
In `prosemirror-view@1.42.3/src/index.ts:251–271`, `updatePluginViews` destroys
existing views and recreates them when the plugin array changes. Its
`src/input.ts` installs native dragend handling on the editor DOM. Installed
TipTap command/history and React NodeView source establish transaction/history
and same-type view-update behavior. The online ProseMirror guide was unavailable;
the local implementation supplied the engine evidence.

`createDraft` still has no stable per-intent request key: if the backend creates a
draft but loses its response, retry may duplicate it unless the host deduplicates.
Send recovery by retained draft ID requires host delivery deduplication or
reconciliation. Label/report/bulk/discard operations, undo-token consumption,
transactional revision checks, actor authorization and storage compensation
likewise require durable host semantics. Local synchronous locks do not prove
exactly-once external effects. Upload response loss cannot be reconciled by the
component when the host supplies neither an acknowledged URL nor a recovery key.

## Authorized repairs after this audit

The user authorized fixing all 14 findings, testing, committing/pushing and a
fresh audit. Three builder subagents repaired canonical package source; a
separate fresh-context reviewer checked the shared setter changes. The finding
descriptions and line numbers above retain the original audited snapshot.

| Findings | Repair and retained acceptance evidence                                                                                                                                                                                                                                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F01      | Data-source/compose-intent-owned refs and independent draft receipts. `mailbox/ownership.test.tsx` covers departed prepare, simultaneous receipts, old uploaded-reference handoff and opaque scope isolation.                                                                                                                             |
| F02      | Upload lifetime survives plugin-view recreation; true removal/destruction invalidates owned work. `image-upload-plugin.test.ts` covers mounted public Editor, reconfiguration, destruction and queued invocation; clean consumer browser coverage loads a real blob image before resolving upload across a responsive transition.         |
| F03      | Schema-normalized no-op writes for Maily setters, TipTap selection commands and NodeViews; live column-width markup updates. `update-attribute.test.ts`, `attribute-commands.test.ts` and the mounted spacer control preserve undo depth and redo.                                                                                        |
| F04      | Atomic desired column count, with retained content, attributes and selection. The mounted column control and helper tests cover `1→3` and `5→2`.                                                                                                                                                                                          |
| F05      | Drag listeners install/tear down with each plugin view. `drag-handle-plugin.test.ts` covers reconfiguration, owned cancellation and preserving a handed-off drop.                                                                                                                                                                         |
| F06–F08  | Empty upload error/retry surface, immutable intrinsic-load ownership, manual-size preservation and captured resize target. `image-view.test.tsx` covers image/logo retry, replacement, unmount and duplicate release. Placeholder intrinsic measurement waits for upload acknowledgment so it cannot invalidate its own immutable target. |
| F09–F14  | New-intent revision reset, complete filter serialization, query-owned failures/flags, selection/form-owned label completion and acknowledged thread overlays. The 14 mailbox ownership regressions include the counterexample that a slow ordinary detail response must preserve a fresher thread.                                        |

Validation completed for these repairs:

- **170 core tests in 19 files** and **28 render tests in two files** pass;
  both package TypeScript checks pass.
- Workspace production builds and official registry/playground generation pass.
- Playground production build and **nine browser tests** pass with its original
  host primitives restored after the CLI reinstall. All **29 captured host
  primitive/config/utility hashes** are unchanged.
- The independent setter reviewer passed the 19 relevant regressions and over
  1,000 differential cases against installed TipTap 3.30.5, including selection,
  schema, dry-run and return behavior. Its temporary probe was removed.
- ESLint on changed canonical/script files reports the same **22 existing
  diagnostics** in MailyKit, image view and drag-handle source as the original
  commit, with no additional diagnostics. This is not a clean whole-repository
  lint claim.

The clean Radix/Base/Bun install/build matrix and all **six Radix/Base browser
tests pass**. Its new paste test uses the actual public Editor, real React
NodeViews and host primitives, without the HappyDOM wrapper substitution. The
matrix preview process now invokes installed Vite directly so package-manager
child processes cannot survive its teardown.

Consumer-owned primitive implementations and adapter signatures remain unchanged.
The existing Base ScrollArea unused-React-import exception remains narrowly
limited to that upstream file. Native physical-device drag cancellation and
provider delivery/storage/CAS/deduplication remain outside the local acceptance
evidence. The fresh post-push audit will record its own commit and findings.

The first post-push audit of `a7ce4fe` caught residual F02 and F03 cases, so those
findings were not declared closed on the initial regression results. F02 now
removes cancelled placeholders from TipTap's retained editor state across
unmount/remount and queued plugin removal; five additional real-engine cases
cover these orderings, replacement protection and new-upload independence.

F03 also covers implicit defaults and repeated node types: active Medium button
size, Left text alignment, Email default font, Default font size and unchanged
Heading/Footer/HTML type commands preserve history. Live range/stored-mark checks
keep mixed selections working, and button preset matching accounts for all four
sides. The independent review rejected a global Select suppression because
composite controls still need to apply a selected top-side value to other sides;
the button guard remains local. Retained evidence is in
`editor/components/default-settings-history.test.tsx` and the attribute-command
tests. Separate newly reproduced defects are recorded in the post-repair audit.

Final repair validation: **193 core tests in 20 files plus the 28 unchanged
render tests pass (221 total)**; core TypeScript and workspace production builds
pass. A separate reviewer passed 34 focused checks, including ten independent
counterexamples for mixed selections, stored marks, custom padding and composite
spacing. These checks establish the repaired history semantics without changing
consumer primitives. The final consumer/playground gates and post-push audit are
reported separately below and in the post-repair report.

Final clean Radix, Base and Bun consumer builds pass, as do all six consumer
browser checks and all nine playground browser checks. The playground production
build passes with the original 29 host-file hashes unchanged. The primitive
audit, changed-file Prettier and generated-source consistency checks pass;
ESLint adds no diagnostics relative to the prior source (existing diagnostics
remain). Provider and physical-device limitations stated above still apply.

The fresh audit of `6edfe05` found one further original F03 entry point: the
desktop toolbar's Left action still serialized the implicit default and cleared
Redo. Desktop and floating/mobile controls now share the same live full-range
comparison. Four mounted regressions cover paragraph/heading/footer defaults and
a genuinely mixed range; the independent synchronous auditor rechecks this
correction before the final report.

That independent review passed 48 retained synchronous tests and 52 temporary
checks, including whole-range desktop alignment, exact history restoration and
atomic column changes. After the correction, all **197 core tests and 28 render
tests pass (225 total)**. TypeScript, workspace/playground production builds,
the clean Radix/Base/Bun consumer matrix, six consumer browser checks and nine
playground browser checks pass. All 29 host-file hashes are unchanged; all 302
embedded registry entries match staging. The final delta introduces no ESLint
diagnostics: the text menu's 11 existing errors are identical to the prior
source. The fresh audit findings are reported separately; passing these gates
does not establish a defect-free editor or mailbox.
