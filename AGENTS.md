# maily.cn

## What this project is

This is a **fork of [maily.to](https://github.com/arikchakma/maily.to)** that we are turning into a **production-ready, shadcn-installable component**.

Maily is a TipTap-based WYSIWYG editor for composing beautiful, mobile-ready emails from pre-designed blocks (buttons, logos, images, columns, sections, variables, footers, repeat/conditional blocks, etc.) plus a renderer that turns the editor's JSON content into email-safe HTML.

The upstream project ships Maily as published npm packages. **Our goal is different:** instead of (or in addition to) installing from npm, a consumer should be able to run a shadcn `add` command and have the editor's source dropped directly into their own codebase — owned, themeable, and modifiable like any other shadcn component.

## North-star goals

1. **shadcn-installable** — distribute the editor as a shadcn registry block so users `shadcn add` the source into their project rather than depending on an opaque npm package.
2. **i18n via generic label replacement** — the component must be translatable by letting consumers pass their own translated labels/strings in. This is **framework-agnostic**: no built-in dependency on `next-intl`, `react-i18next`, etc. — just a generic mechanism to override every user-facing string with a caller-provided value (with sensible English defaults).
3. **Image upload, not just URL** — the image block currently accepts a URL. We are extending it so users can **upload** image files (via a caller-provided upload handler), in addition to pasting a URL.
4. **Production-ready** — clean, documented, type-safe, and reliable enough to ship.

## Repository layout

This is a **pnpm + Turborepo monorepo**.

```
packages/
  core/      @maily-to/core   — the TipTap editor: blocks, extensions, nodes, UI. Main package.
  render/    @maily-to/render — renders editor JSON content to email-safe HTML.
  shared/    @maily-to/shared — shared types/utilities used by core and render.
  tsconfig/                   — shared TS config.

assets/branding/              — canonical maily.cn README/brand artwork.

registry/                     — generated source staging for the shadcn items.
  default/maily/
    components/maily/  ← mirrors packages/core/src (the editor)
    lib/maily-render/  ← mirrors packages/render/src + shared
    variants/          ← generated item-specific entrypoints

registry.json                 — shadcn registry manifest:
                                `maily-editor`, `maily-mailbox`, `maily-render`,
                                plus backward-compatible full `maily`.
scripts/
  build-shadcn-registry.mjs   — builds registry/** and registry.json from packages/*/src.
  icon-map.mjs                — lucide → IconPlaceholder mapping used during the build.

playground/                   — local dev harness: a Vite + shadcn app that installs the
                                editor and mailbox as separate local registry items.
                                Not part of the pnpm workspace. See playground/README.md.
```

### Key relationship: packages are the source of truth

`packages/core`, `packages/render`, and `packages/shared` hold the canonical source. The `registry/` tree and `registry.json` are **generated** from those packages by `scripts/build-shadcn-registry.mjs` (`pnpm registry:build`). When editing editor/renderer behavior, change the **package source** and regenerate the registry — do not hand-edit `registry/**`.

The recommended consumer install is granular: `maily-editor` contains only the editor, `maily-mailbox` adds the optional mailbox and depends on the editor item, and `maily-render` contains only server rendering. The `maily` item remains the backward-compatible full install. Registry npm dependencies and stock shadcn dependencies are derived from the emitted files for each item; do not merge whole package manifests back into every item. The root `@/components/maily` and `@maily-to/core` barrels intentionally export the editor only; mailbox imports must use `@/components/maily/mailbox` or `@maily-to/core/mailbox`.

The build step also rewrites hardcoded `lucide-react` icon JSX into a shadcn-friendly `<IconPlaceholder>` so installers can swap in their preferred icon library. See `.sisyphus/plans/` and `.sisyphus/evidence/` for the icon-conversion design notes.

The build step **externalizes modules the consumer already owns** rather than shipping a private copy. These are listed in `EXTERNALIZED_MODULES` in `scripts/build-shadcn-registry.mjs`, keyed by package-source path; for each, the source file is excluded from the emitted registry and every import of it (`@/…` or relative) is rewritten to the consumer's shadcn alias. The source file stays in `packages/core` for standalone builds — only the registry output defers to the consumer. Today this covers:

- `cn` (`editor/utils/classname` → the npm `cn` package, which current stock shadcn items import directly; it replaces the old `clsx` + `tailwind-merge` helper)
- the `Button` primitive (`editor/components/base-button` → `@/components/ui/button` — the source export was renamed `BaseButton` → `Button` so the name matches stock shadcn, since the rewrite only swaps the import path)
- `Input` (`editor/components/input` → `@/components/ui/input`)
- `Textarea` (`editor/components/textarea` → `@/components/ui/textarea`)
- `Toggle` (`editor/components/ui/toggle` → `@/components/ui/toggle`)
- `ToggleGroup` / `ToggleGroupItem` (`editor/components/ui/toggle-group` → `@/components/ui/toggle-group`)
- `Tooltip` (`editor/components/ui/tooltip` → `@/components/ui/tooltip`)
- `Separator` (`editor/components/ui/divider` → `@/components/ui/separator`)
- `Kbd` / `KbdGroup` (`editor/components/ui/kbd` → `@/components/ui/kbd`)
- `DropdownMenu` (`editor/components/ui/dropdown-menu` → `@/components/ui/dropdown-menu`)
- `Popover` / `PopoverTrigger` / `PopoverContent` (`editor/components/popover` → `@/components/ui/popover`)
- `Tabs` (`editor/components/ui/tabs` → `@/components/ui/tabs`)
- `InputGroup` (`editor/components/ui/input-group` → `@/components/ui/input-group`)
- `Command` (`editor/components/ui/command` → `@/components/ui/command`)
- `Badge` (`editor/components/ui/badge` → `@/components/ui/badge`)
- `ScrollArea` / `ScrollBar` (`editor/components/ui/scroll-area` → `@/components/ui/scroll-area`)
- `Attachment` and its parts (`editor/components/ui/attachment` → `@/components/ui/attachment`)
- `Checkbox`, `Dialog`, `Sheet`, `Collapsible`, `Avatar`, `Field`, `Label` and `Empty` (`editor/components/ui/<name>` → `@/components/ui/<name>`)

For an externalized component to resolve in the consumer's project, each registry item must declare the stock items its emitted files actually import in **`registryDependencies`** (`button`, `input`, `textarea`, `toggle`, `toggle-group`, `tooltip`, `separator`, `kbd`, `dropdown-menu`, `popover`, `tabs`, `input-group`, `command`, `badge`, `scroll-area`, `attachment`, `checkbox`, `dialog`, `sheet`, `collapsible`, `avatar`, `field`, `label`, `empty`). The build derives that per-item list from generated imports. Behavior the stock primitive lacks lives at the call site instead of in the externalized component — e.g. the password-manager-off attributes (`AUTOCOMPLETE_PASSWORD_MANAGERS_OFF`) moved from the old bundled `Input` onto each `Input` in `link-card.tsx`.

**Toggle state uses real primitives, not faked `data-state`.** Standalone stateful controls use stock shadcn `Toggle`, related controls use the host's stock `ToggleGroup` / `ToggleGroupItem`, and plain actions use `Button`. `toggle-group-compat.tsx` is only a thin prop adapter for the different Radix/Base controlled-value signatures; it does not render a replacement primitive. Alignment, text-direction, vertical-alignment, and the editor Design / Render topbar mode selector use Popover and/or ToggleGroup; the toolbar link control uses the same Maily link Popover as the bubble menu. The drag-handle node actions and “Turn into” selector use stock `DropdownMenu`; the HTML code/preview switch uses stock `Tabs`; Link Card labels use stock `Badge`.

The remaining `Select` is an editor-specific labelled/options composite that uses the same stock Button + Popover + ToggleGroup pattern as alignment, direction, and font-size controls so compact bubble-menu pickers share one visual treatment and preserve TipTap focus. It must not render Tooltip around its trigger because floating editor surfaces can detach Tooltip content from the trigger. Do not put Radix Select inside bubble menus for compact formatting controls. Floating editor chrome must yield to native text-selection gestures: do not run drag-handle hover tracking or open/reposition text bubble menus while the primary pointer button is down inside the editor. Refresh the text menu after pointer selection with a ProseMirror transaction; never force-remount `BubbleMenu` with a changing React `key`. TipTap 3 bubble menus use Floating UI, and their `shouldShow`, `appendTo`, reference-element, and `options` props must pass through `useStableBubbleMenuProps`; changing those identities on every transaction creates an update-options transaction loop. The registry uses the consumer's stock `Popover`; all current call sites use its standard portalled behavior. Variable suggestions compose stock `Command` and `Kbd`, while compact icon-bearing inputs compose stock `InputGroup`. `Editor` owns the stock `TooltipProvider`. When a Tooltip wraps another stateful primitive, its neutral `span` trigger keeps the Tooltip's state/slot attributes from masking the nested Popover, DropdownMenu, Tabs, Toggle, or ToggleGroup item and prevents nested interactive DOM after shadcn's Radix-to-Base transform.

Registry call sites must stay inside the prop/export intersection of current stock Radix and Base shadcn primitives. Do not pass Radix-only `position`, `onOpenAutoFocus`, or `onCloseAutoFocus` props through externalized `SelectContent`/`PopoverContent`, and do not depend on `PopoverAnchor`, which the Base item does not export. Preserve editor focus through Maily's controlled open-state callbacks and use `PopoverTrigger` for shared trigger composition.

`MailboxView` / `InboxOutboxView` is a separate optional component under `packages/core/src/mailbox`. It provides the inbox/sent/drafts surface as a backend-agnostic data-adapter component: local UI state, message selection, the reader and the composer live in the component, while accounts, messages, delivery, refresh timing, reply/forward seeding, folder action rules, contact suggestions and message actions are supplied through `MailyMailboxDataSource` or explicit props. Its shell follows Gmail no-split navigation: opening a message or draft replaces the list in a shared content area; Back returns to the mounted list with its query, pagination, bulk selection and scroll position preserved. Use a desktop folder sidebar and a stock shadcn `Sheet` navigation menu below 768px of mailbox container width, plus `ScrollArea` around content overflow. Do not restore simultaneous list/reader panes or a forced desktop minimum width. The reader action chrome must use real shadcn `Button` and `DropdownMenu` primitives around backend-wired actions such as favorite, archive, delete, mark unread, report, download, print, and show original, but these controls must render only when the host provides both `dataSource.runMessageAction` and an explicit `messageActions` list containing the supported action ids; do not fake mailbox mutations when no consumer action handler exists. Recipient autocomplete must stay caller-owned and match contacts by email address and display name through real shadcn `Popover` + `Command` primitives; do not hardwire app-specific customer/contact APIs. Keep it free of app-specific API clients, auth, routes, and database assumptions. Add any mailbox-facing copy to `defaultMailboxLabels` and keep that exported label object exhaustive.

Mailbox compose uses the embedded Maily `Editor` only. Keep recipients and subject
compact, preserve the editor's original toolbar and gutter placement, and keep
send/attachment/draft actions in a persistent footer. Persist rich editor output through
`MailyMailboxDraftInput.html` and continue sending `text` for plain-text adapters.
Opening a saved text-only draft must not normalize it into an unsolicited write.
Desktop navigation collapses to an icon rail through stock Toggle while the
container-aware mobile Sheet remains independent. Search actions use
`InputGroupButton`; date filters compose stock Popover + Calendar, with calendar
localization supplied by `searchCalendarProps`.

Reply threading uses RFC `messageId`, never the storage row `id`. Messages
without that header remain replyable without `inReplyTo`. Preserve an existing
draft's `inReplyTo` after reopening, both on save and on send. Regression and
registry validation: [docs/mailbox-reply-2026-09-17.md](docs/mailbox-reply-2026-09-17.md).

Slash-command flyouts are viewport-aware: the main menu is capped to the viewport, submenus grow up to 20rem, open on the side with usable space, fall back to an overlay on narrow viewports, and truncate item copy inside `min-w-0` text columns so translated or consumer-provided labels never escape the panel. The editor toolbar wraps its primitive groups rather than widening the document, and large configuration popovers use viewport-capped widths.

Autocomplete suggestions portal to `document.body` and compute a viewport-aware fixed position so scroll containers cannot clip them. The standalone package therefore declares `react-dom` alongside `react` as a peer and keeps both external in `tsup`; registry consumers use the host application's React runtime.

Mailbox attachments render below the message body through stock `Attachment` parts. Always display supplied metadata even without a download handler. Individual downloads use optional `dataSource.downloadAttachment({ messageId, attachment, attachmentIndex })`; the host owns storage/auth and saving the file. Preserve the optional backend `attachment.id` and array index because filenames can repeat. Keep pending/error/retry state local to the file, report failures through `onError(error, 'attachmentDownload')`, and do not confuse this capability with downloading the whole message. New attachment copy belongs in the exhaustive mailbox labels. The standalone Attachment fallback comes from the official shadcn CLI with only package import adaptations; the registry externalizes it to the host's `attachment` item.

`SHADCN_ALIGNMENT.md` is the maintained boundary report for host-owned primitives, intentional Maily composites, and the five custom document-diagram SVGs that remain after the final audit.

Icon inheritance is release-tested with clean shadcn apps initialized for Lucide, Tabler, Hugeicons, Phosphor, and Remix; each fixture must mount Maily and pass its TypeScript/Vite production build. Do not validate an icon library by only changing `components.json` on an existing app because the selected shadcn preset also owns the icon packages and primitive source.

## Tech stack

- **React 18/19**, **TypeScript 6** (TypeScript 7 lacks the classic compiler API that typescript-eslint and the package declaration builds need)
- **TipTap 3.32 / ProseMirror** for the editor; **Floating UI** positions suggestion popups and the drag handle
- **`cn`** (the npm package current stock shadcn items import) instead of `clsx` + `tailwind-merge`
- **Node ≥ 22.12** for development; published floors follow runtime dependencies (`@maily-to/core` ≥ 22 for `cn`, `@maily-to/render` ≥ 22.12 for `juice` 12)
- **Tailwind CSS v4** (plain, unprefixed utilities using the consumer's shadcn theme tokens — the component ships no Tailwind build or stylesheet of its own)
- The consumer's **shadcn primitives** (Radix or Base UI style) and selected shadcn icon library
- **Radix UI fallbacks** for standalone npm-package builds; registry installs inherit the consumer's selected shadcn primitive style
- **tsup / tsdown** for package builds, **Turborepo** for orchestration, **Vitest** for tests
- **shadcn registry** schema for distribution

## Common commands

```bash
pnpm install            # install workspace deps
pnpm dev                # turbo dev across packages
pnpm build              # build all packages
pnpm test               # run vitest across packages
pnpm shadcn:audit       # fail on handmade shadcn primitive replacements
pnpm registry:build     # regenerate registry/** and registry.json from packages/*/src
pnpm playground:sync    # registry:build + serve the built JSON into playground/public/r
pnpm registry:consumer-test # clean Radix/Base/Bun isolated shadcn install and build matrix
pnpm format:write       # prettier
pnpm format:check       # prettier, as CI runs it
pnpm lint               # primitive audit + eslint (stock shadcn template rules)
pnpm typecheck          # tsc across packages
pnpm lint:package       # publint, attw and loading every published entry
```

`.github/workflows/ci.yml` runs these gates, checks that generated registry
output is current, and runs the playground lint/build/browser tests.
`registry-consumers.yml` runs the clean consumer matrix.

## Local dev playground

`playground/` is a standalone Vite + React + Tailwind v4 + shadcn app (scaffolded
with `bunx --bun shadcn@latest init -t vite`) that consumes this repo's registry the
way an end user would. Its `components.json` declares a local namespace
`@maily → http://localhost:5173/r/{name}.json`, served from `playground/public/r`.
The same app is published at `https://brokeboiflex.github.io/maily.cn/` by
`.github/workflows/deploy-playground.yml`; its Pages build uses the `/maily.cn/`
Vite base while local development keeps `/`.
Its presentation follows the sibling `shadcn-theme-provider-demo`: centered
product hero and resource links, visible mode/palette and component-language
controls, then framed editor and mailbox showcases. Keep the editor as the
primary example; the mailbox adapts to its own container and must fit narrow
screens without a forced minimum width or outer horizontal scroller.

`pnpm registry:consumer-test` owns the clean-current compatibility gate. Radix
installs all granular items; Base UI must pass a strict editor-only build before
the optional mailbox is added. The complete Base fixture must then run its
Playwright primitive checks for ToggleGroup roving focus/state, Popover focus and
Escape behavior, attachment metadata and downloaded file contents, mailbox visual composing, nested interactive DOM, and
console/page errors. The Bun fixture installs the editor and mailbox through the
shadcn CLI, runs `bun install --linker isolated`, and must pass the strict
TypeScript/Vite production build. Current upstream Base `scroll-area.tsx` contains
one unused React import under strict TypeScript, so the full Base fixture accepts
only that exact external diagnostic and then rebuilds with unused-import checking
relaxed. Never allow a Maily-source diagnostic through that exception and never
patch the consumer-owned primitive.

Loop: edit `packages/*` → `pnpm playground:sync` (rebuild + reserve) → in `playground/`,
run `bun run dev` and install `@maily/maily-editor` plus `@maily/maily-mailbox`
with `--overwrite`. Use `@maily/maily-render` only when testing server rendering.
Full details and commands
are in `playground/README.md`. Keep the playground's modern
`verbatimModuleSyntax: true` setting enabled; the package and generated registry source
must compile without consumer-side TypeScript workarounds.

## Working conventions

- **No business logic in Maily.** Maily provides UI and contracts (props, callbacks, the data-source adapter, extension points) so an app can build a fully featured inbox and editor; every decision about data, delivery and send recovery, persistence or browser storage, backend timing (polling, autosave), mail conventions, folder rules, external services (fonts, CDNs) and link policy belongs to the consuming app. Where a convention is useful, export it as an opt-in default (`defaultMailboxMessageActionsFor`, `fontsourceFontProvider`, `fontsourceFontFaceUrl`) instead of applying it implicitly. In the mailbox, the one applied default is the reply/forward seed, `defaultMailboxComposeSeed`, which `createComposeSeed` replaces; it only prefills the composer and never calls the host. The renderer applies `DEFAULT_LINK_ATTRIBUTES` and `DEFAULT_META_TAGS` unless the host passes `linkAttributes` and `meta`. Built-in defaults must not call the network, write storage, or change saved JSON or sent email on their own.
- **Read before you edit.** The editor is large and the block/extension/node wiring is intricate; trace how a block is registered and rendered before changing it.
- **Mandatory reference-port gate.** When the user names a repo, app, screen, component, screenshot, or existing implementation as a reference, treat it as an implementation contract before writing code. First identify the exact referenced files, components, or routes; read them deeply enough to list layout primitives, state/data flow, component boundaries, user-visible behavior, dependencies, terminology, labels, and edge states; then state that contract in a working update before editing. Copy the reference structure as closely as the target stack allows. If any part cannot be copied, explicitly name why before substituting. Before the final response, compare the target against the reference and list intentional differences. Do not call the task done if a referenced primitive or pattern was replaced by an invented one.
- **Concrete UI primitives are part of the contract.** If a referenced UI uses a concrete layout primitive or library, such as `ResizablePanelGroup`, tabs, dialogs, command menus, data tables, calendar grids, kanban boards, tree views, split panes, or virtual lists, preserve that primitive or pattern in the port unless the user explicitly asks for simplification.
- **Use real shadcn primitives before styling raw elements.** For application chrome, first map every control to an existing host-owned shadcn primitive (`Button`, `Input`, `Textarea`, `InputGroup`, `DropdownMenu`, `Popover`, `Command`, `Tabs`, `Toggle`, `ToggleGroup`, `Resizable`, `ScrollArea`, etc.). Do not hand-roll input/button/select/menu/listbox chrome with Tailwind classes when a stock primitive or documented composition exists. Run `pnpm shadcn:audit` after UI changes; if a raw native control is intentional document content or an invisible native file input, add a narrow `shadcn-audit-ignore-next-line <reason>` comment.
- **Do not modify host-owned shadcn primitive implementations.** Files externalized to `@/components/ui/*` are owned by the consumer or installed by the shadcn CLI. Do not patch generated/installed primitive source to fix Maily behavior. Fix Maily call sites, adapters, wrappers, or package fallback source instead. Missing primitives may be added through the shadcn CLI/registry only; after that, leave the primitive implementation intact.
- **Do not touch shared primitive-like Maily UI for local visual complaints.** Components under `packages/core/src/editor/components/ui/*` are shared editor building blocks, not local styling scratchpads. If a screenshot shows one node/menu/popover looking wrong, fix that feature's call site or local layout first. Change a shared wrapper/composite such as Maily `Select` only when the desired behavior is explicitly global or the user asks for a primitive-level change.
- **Keep the fork branding honest and local.** User-facing repository docs use `maily.cn` and the artwork in `assets/branding/`; do not hotlink the old `maily.to` logo or present upstream sponsors as sponsors of this fork. Preserve clear credit and links to the original `arikchakma/maily.to` project. The technical npm workspace names remain `@maily-to/*` unless a separate package-renaming task explicitly changes them.
- **Edit packages, regenerate the registry.** Never hand-edit `registry/**` — it is build output.
- **Keep TipTap on v3.** Canonical packages and registry consumers use the TipTap `3.32` line. Import React `BubbleMenu` from `@tiptap/react/menus`, configure it through Floating UI `options`, and keep its reactive props identity-stable through `useStableBubbleMenuProps`. TipTap 3 does not rerender the full React editor tree on every transaction, so chrome that displays active editor state must subscribe to that state with `useEditorState`; do not rely on a primitive's internal pressed state to hide a stale Maily prop. Tippy is gone: suggestion popups mount through TipTap Suggestion's Floating UI `props.mount` (`editor/utils/suggestion-popup.ts`, which survives plugin-view recreation), and the drag handle positions itself with Floating UI `computePosition`/`autoUpdate`. Preserve the existing saved JSON schema during TipTap upgrades, including Maily's `textDirection` attribute and Fontsource text-style attributes.
- **Keep i18n generic.** Any new user-facing string must be overridable via the label-replacement mechanism, with an English default. Don't couple to a specific i18n framework. The mechanism lives in `packages/core/src/editor/i18n/`: `defaultLabels` (the exhaustive English dictionary in `default-labels.ts`) is both the runtime default and the authoring template; `LabelKey` is its key union; `MailyLabels = Record<LabelKey, string>` is the **complete-language** contract (not `Partial` — a missing key is a compile error, no merging). `createTranslator(labels)` returns `t(key, vars?)`, which does minimal `{token}` interpolation. **Adding any user-facing string means adding a key to `defaultLabels` and reading it via `t('…')`** — components get `t` from `useMailyContext()`; non-React consumers (the Placeholder extension, the default-block builder `getDefaultBlocks(t)`, the slash-command popup) receive `t` threaded from `Editor`. `searchTerms` and inserted seed content stay English (out of the dictionary). Note the deliberate break: block exports (`text`, `button`, …) and the placeholder are now `(t) => …` factories, not ready-made values.
- **Keep image upload caller-driven.** The component should not assume a storage backend; it calls a handler the consumer provides and uses the returned URL.
- **Fonts come from a host-supplied provider and stay self-contained in saved JSON.** Without the Editor's `fontProvider` there is no font picker and no font request; the renderer emits `@font-face` only through its `fontFaceUrl` option. The opt-in `fontsourceFontProvider` reads the complete Fontsource catalog from `https://api.fontsource.org/v1/fonts` only after the picker opens, normalizes and deduplicates family names by the strongest static email coverage, virtualizes the result with `@tanstack/react-virtual`, and loads preview faces only for rendered rows. Never bundle the catalog or font binaries, and do not expose implementation metadata such as variable-font capability badges in the picker. A selected text-style mark stores the Fontsource id, pinned package version, subset, regular/bold weights, italic availability, family, and email-safe fallback; the opt-in `fontsourceFontFaceUrl` constructs version-pinned jsDelivr WOFF2 URLs from those attributes, and the renderer must not call Fontsource while sending an email. The font-size picker stores `fontSize` on the same TipTap `textStyle` mark and the renderer emits it inline for selected text. The global `theme.font` and `theme.fontSize` remain the defaults for unmarked text. Remote web fonts are progressive enhancement, so every granular font must retain its inline fallback stack.
- **Plain Tailwind, no prefix, no shipped CSS.** Maily is an idiomatic shadcn component: the editor source uses bare Tailwind utility classes (`bg-popover`, `text-foreground`, …) generated by the **consumer's** Tailwind, and ships **no stylesheet of its own**. There is no `mly:` prefix, no private Tailwind build, and no `@theme inline` bridge — those were removed. The component only _uses_ the consumer's shadcn theme tokens; it never defines or remaps them. When adding chrome, reach for tokens, never hardcoded colors (`bg-white`, `text-gray-*`, `soft-gray`, `midnight-gray` are gone — use `bg-background`/`bg-popover`, `text-foreground`/`text-muted-foreground`, `border-border`/`border-input`, `ring-ring`, `bg-primary`/`text-primary-foreground`, `bg-destructive`/`text-destructive`).
- **Everything themes via the host's tokens — including the canvas.** Chrome _and_ the writing surface follow the consumer's light/dark theme. The paper uses `bg-background`/`text-foreground`; the content area is `prose` with its `--tw-prose-*` colors pinned to `var(--foreground)`/`var(--muted-foreground)`/`var(--border)` so it stays readable in every palette and mode. (The real, sent email is produced independently by `packages/render` and is unaffected by editor theming.)
- **Styling lives on elements and extensions, not in CSS.** Element classes go in the `.tsx`; DOM that TipTap/ProseMirror generate at runtime is styled by passing Tailwind class strings into extension config (e.g. the Placeholder extension's `emptyNodeClass`/`emptyEditorClass`, node `renderHTML`/NodeView `className`) or via Tailwind v4 arbitrary variants (`[&_.ProseMirror-gapcursor]:…`) on the nearest controllable element — see `editor/editor.tsx` (`EDITOR_CONTENT_CLASS`) and the NodeViews.
- **Custom HTML stays dependency-light.** The HTML block uses TipTap's plain `CodeBlock` plus Maily's code/preview NodeView. Do not reintroduce Lowlight, Highlight.js language bundles, or another client-side syntax highlighter unless syntax highlighting becomes an explicit product requirement with measured consumer cost.
- **A few colors stay literal on purpose** because they are email _content_ values (serialized into the email the recipient sees), not chrome: the default button colors (`#000000`/`#ffffff`) and section background/border (`#f7f7f7`/`#e2e2e2`) in the node definitions, the rose brand accent for variables, and the selection/selected-node highlight blue. Don't tokenize these. The HTML block preview is a sandboxed iframe, which cannot inherit the canvas theme, so it mirrors the host's text color and color scheme on a transparent document and uses the renderer's default system font stack.
- **Consumer requirement: the typography plugin.** The content area depends on `prose`, so consumers need `@plugin "@tailwindcss/typography";`. The registry item wires this automatically via its `css` key on `shadcn add`; the build script (`scripts/build-shadcn-registry.mjs`) emits that key.
- **Default block media uses the fork's public branding.** Logo presets use `assets/branding/maily-cn-avatar.png` and the cover preset uses `assets/branding/maily-cn-hero.png`, referenced through this repository's public `raw.githubusercontent.com` URLs so rendered emails and shadcn-installed source can load them without bundler-specific asset handling.

## Mailbox original source

`getMessageSource(messageId)` is an optional host data-source capability, enabled
with `messageActions: ['showOriginal']`. Maily fetches lazily and displays escaped
RFC822 text in the reader, with loading/error/retry/back controls. Do not put host
API/auth/storage code here or manufacture source from parsed message fields.
Without the capability, the existing runMessageAction callback remains supported.
See [source view](docs/mailbox-source-2026-09-17.md).

## Idempotency and resource ownership, 2026-10-08

Canonical editor/menu mailbox repair evidence is in docs/idempotency-repairs-2026-10-08.md. Repeated desired column count must compare the live document before mutation. Native drag/resize listeners, clone URLs/DOM, suggestion renderers and delayed focus timers require ownership and teardown. Mailbox mutations/navigation share synchronous exclusion. DraftInput.revision is the revision observed with editable content; hosts forward it unchanged and return \_revision after acknowledged writes. Send recovery belongs to the host (draft ID and revision, or `idempotencyKey`); Maily keeps no receipts. Generate registry/default/maily, registry.json and playground/public/r from packages/core source; do not patch generated output independently. Local consumer type/build evidence excludes browser/provider delivery, publication and deployment.

Deferred editor actions now use provider-owned document/selection/lifecycle
snapshots. Use stable per-picker `useId` color channels: unrelated pickers must
not supersede/cancel each other. Provider and picker teardown invalidate in
layout cleanup; retain one-shot stale-target rejection. See
`docs/idempotency-editor-owned-actions-2026-10-08.md` and the real TipTap
`deferred-editor-action.test.ts` channel regression.

## Async mailbox and node ownership (2026-10-08)

Mailbox async work belongs to its mounted data-source lifetime; a departed
composition or data source never sends what it prepared. Image/logo uploads must match the captured immutable ProseMirror
Node identity, not only equal type/attributes at the old position; stale results
invoke the host's discard handler. See
[ownership validation](docs/idempotence-ownership-2026-10-08.md).

## Spam and Trash, 2026-10-09

Mailbox folders include `spam` and `trash`. Hosts query/count these folders and
implement `delete` as move to Trash, `reportSpam` as move to Spam, `restore` as
move to Inbox, `notSpam` as remove spam classification and move to Inbox, and
`deleteForever` as irreversible deletion. Recovery/permanent deletion actions
remain explicitly capability-gated; which folders offer them is the host's
choice (a `messageActions` function, or the opt-in
`defaultMailboxMessageActionsFor`). Retention and classifier training belong to
the host. See docs/mailbox-spam-trash.md.

## Complete mailbox workflows, 2026-10-09

The expanded mailbox must keep pagination/search generations, explicit host
thread IDs, caller-owned upload references, observed draft revisions and
backend-issued undo receipts. Archive preserves mail for All Mail; Starred is
a filtered view. Bulk and folder-wide deletion are separate host capabilities.
Never infer threads from matching subjects or fake undo/provider mutations.
See [mailbox workflows](docs/mailbox-workflows.md) for the adapter boundary.

Label create/rename/delete Dialogs contain only their form or confirmation;
existing labels and their More menus remain in the folder rail. Default navigation follows the implemented Gmail folder subset and has no
Bounced/Failed delivery folder. Failed outgoing messages remain in Sent with
delivery status/details. The legacy `bounced` adapter id remains type-compatible.

## Repository context isolation, 2026-10-09

Keep mailbox documentation, playground examples, and test fixtures generic. Do not
include private project names, integration histories, or cross-project validation
claims in this public repository. Use neutral example identities and addresses.

## Established mailbox controls

Follow the inspected Gmail patterns: current-page Checkbox selection, a compact
action toolbar with bulk actions inline beside the page selector (replacing Refresh
while selected), always-visible query range and Newer/Older page arrows, search-filter Popover,
and a Labels heading with create action and per-label More menu. Never append
pages behind a Load more button. Never hide the page range during selection. `listMessages.total` is optional query-specific
metadata; never invent totals from loaded rows. Use stock host Checkbox/Dialog
primitives, externalized through the registry like the other controls.

Thread reads are owned by the selected thread and must not be cleared by a
slower detail request. Reopened compose sessions capture their reply header and
observed revision independently of reader selection or paging.

Label dialogs register their actual create/menu button with the host's
`DialogTrigger`; controlled `open` alone does not restore keyboard focus in
Radix. Keep each label menu in its own Dialog context, and open its dialog only
from a chosen menu action. Use instance-local ids for form label associations.
The clean consumer gate exercises these flows and Checkbox state in both Radix
and Base UI, without modifying either host's primitives.

DropdownMenuItem actions must use `onClick`, the common Radix/Base activation
handler. Radix-specific `onSelect` passes TypeScript as a native selection event
in Base consumers but does not invoke the action. The primitive audit rejects
that prop on DropdownMenuItem; CommandItem keeps its own `onSelect` contract.

## Host primitives and controlled mailbox state, 2026-10-09

Mailbox sender/contact initials use stock Avatar; form layouts use Field,
FieldLabel, FieldSet and Label; empty surfaces compose Empty parts. Their package
fallbacks are adapted from official shadcn radix-nova source and are externalized
to the host's `avatar`, `field`, `label` and `empty` registry items. Never restore
generated HSL avatar chrome or handwritten label/fieldset replacements.

Mailbox folder, search/filter/scope, label, reader and bulk selections support
controlled props/change callbacks with independent uncontrolled defaults.
Controlled props are authoritative; declined requests cannot mutate shadow state,
external updates must not echo callbacks, and off-page reader IDs remain valid.
Hosts coordinate related controlled values; external navigation resets only
unmanaged subordinate state and must not silently discard a live composer.
See docs/mailbox-workflows.md for the API and ownership contract. The consumer
matrix covers Radix/Base runtime behavior and a custom UI alias in Bun.

Stock Radix Dialog can autofocus before its passive Escape listener registers.
Label and unsaved-change dialogs handle Escape in their leaf content through the common
`DialogContent.onKeyDown` prop so immediate dismissal is reliable; leave host
modality/focus restoration intact. Do not hide this race with sleeps or retrying
Escape in the consumer test.

## Responsive mailbox navigation, 2026-10-09

The Gmail no-split reference supersedes the old resizable three-panel layout.
The selected message remains caller-controllable; Back requests a null selection
and respects host acceptance. Compose Back follows the existing dirty-draft
guard. Sheet is externalized to the consumer just like Dialog.
See [mailbox workflows](docs/mailbox-workflows.md).

Mailbox icon controls must use host Tooltip primitives with the same translated
label as their accessible name. Keep trigger state on its own primitive via a
neutral tooltip span and forward menu/dialog trigger props to the actual Button.
Folder counts remain unbadged numbers; label create and More controls use equal
square targets, aligned within the same scrolling sidebar.

## Responsive editor, 2026-10-10

### Icon rules

- Use established icon libraries for interface icons. Do not author SVG paths,
  CSS-drawn icons, or text stand-ins such as a literal `Aa` formatting icon.
- Do not impose blanket restrictions against icons. Use appropriate library
  icons wherever the reference or interaction calls for them.
- Keep each toolbar's icon family, rendered size, weight, alignment, and touch
  targets coherent. Size the icon itself so host primitive defaults cannot
  silently shrink it. Registry installs must inherit the consumer's chosen icon
  library through verified mappings.

Follow the supplied Notion mobile editor reference: bottom toolbar, plus-driven
two-column block picker, and touch formatting panel. Compact editing is based on
the editor container (below 640px, or below 1024px with a coarse pointer), not a
new editor instance. Disable mobile slash suggestions and hover drag controls;
keep the complete caller-supplied block tree and real node settings accessible.
Reuse node controls through adaptive bubble/popover surfaces in the host Collapsible.
Preserve document/selection ownership for deferred insertion and make toolbar
actions separate undo events. Keep responsive column stacking confined to the
editing surface; never rewrite saved email widths to fit the editor. See
[responsive editor](docs/editor-mobile.md) for the reference and validation boundary.

Mobile editor chrome must inherit host primitive corner shapes. Do not override
Button, Toggle or Sheet radii to copy a reference silhouette. Custom containers
use host radius tokens, never `rounded-full` or fixed pixel radii; verify both
zero-radius and rounded themes while retaining touch targets and padding.

## Mailbox folder-wide deletion (2026-10-10)

Do not render Empty Trash or Delete all spam buttons. Deletion stays scoped to selected messages through the host action capability.

Mobile editor dock and expanded picker share one persistent toolbar and portal.
Use host Collapsible for this nonmodal disclosure; do not remount the toolbar in
Sheet or autofocus a replacement trigger. Only the outer accessory translates,
with reduced-motion support. Repeated requests for the active panel must not
reset its navigation, selection snapshot, history boundary, focus or scroll.

## Idempotence follow-up, 2026-10-10

Spacer height changes update the selected spacer and preserve its conditional
visibility. Desktop node actions must validate their captured document/node before
mutating; stale positions must never select a replacement block. Paste/drop uploads
own the inserted immutable node, compensate stale results and remove failed owned
placeholders before revoking temporary URLs. Font selection requires a pinned
version; transient version failures must remain retryable.

Mailbox exclusion and pending UI belong to the current data-source lifetime; old
completions cannot release a newer operation's lock. Reader mutation results must
also own the selected-reader generation. Label reads share a generation with label
mutations. Selecting the active compose body mode must preserve the editor instance.
Open desktop menus freeze their captured target across drag callbacks. Async
mailbox mutations refresh the latest committed query and preserve newer external
reader/bulk selections. Rejected label mutations must not suppress an initial
valid label response.
See [audit and repairs](docs/idempotence-audit-2026-10-10.md).

## Re-audit repairs, 2026-10-10

Desired attribute writes compare schema-normalized live markup before adding
steps, including TipTap selection commands and NodeView writes. Repeating a
setting must preserve Undo/Redo. Column-count requests reach the requested count
in one transaction while retaining surviving content and attributes.

Plugin-view setup and cleanup follow ProseMirror's recreatable view lifetime;
ordinary menu registration must not terminate retained upload work or drag
listeners. Uploads and resize commits own their captured node/document; loading
an image never writes its dimensions. Failed empty image/logo uploads retain
translated error and retry controls.

Compose refs and revisions belong to a data-source lifetime and compose intent.
Read success, failure and loading cleanup share query generations;
label deletion and form completion own their selection/form sessions. Only
acknowledged reader mutations overlay thread messages; a slower ordinary detail
read must preserve a fresher thread. See
[the 14 repairs and validation](docs/idempotence-reaudit-2026-10-10.md) and
[mailbox ownership](docs/mailbox-workflows.md).

Displayed defaults also require history no-ops: implicit button padding, default
text alignment and unset font family/size must preserve Redo. Inspect the complete
selected range and stored marks before skipping a reset; mixed selections must
still receive the requested setting. Do not globally suppress active Maily Select
callbacks because composite controls may project one attribute while updating
several. Repeated text-block type commands must avoid TipTap's clear/rebuild
fallback without suppressing deliberate wrapper conversion.

Desktop and floating/mobile text alignment controls share `setTextAlignment`.
Keep its full selected-range default comparison so selecting Left on implicit
default text preserves Redo, while mixed alignments still change every target.

TipTap unmount retains editor state. Cancelled paste placeholders must be removed
from that current retained state before URL revocation, including queued plugin
removal followed by unmount/remount; an obsolete view cannot own that cleanup.

The post-repair action audit closed the original 14 reported cases and recorded
14 additional defects and a separate live-receipt reconciliation policy gap. The
defects were repaired on 2026-10-23; the policy gap no longer applies because
send recovery moved to the host on 2026-10-24. See
[the final audit](docs/idempotence-postrepair-audit-2026-10-10.md) for each
repair and its regression test.

## Playground message cursors, 2026-10-10

The playground message adapter uses a timestamp/immutable-ID keyset boundary,
scoped to folder/search/label filters. Do not substitute numeric offsets for
cursors. README adapters must forward all `listMessages` parameters unchanged.
Thread, label and autocomplete contracts remain unchanged.

## Draft capabilities, 2026-10-22

Draft callbacks are optional. `create`, `edit`, `send` and `discard` are each
available only when their callback exists and `draftCapabilities` does not set
them to `false`. A new composition sends through `sendMessage` when the host
provides it, otherwise through `createDraft` and `sendDraft`; a saved draft
sends through `sendDraft`, writing first only when it has unsaved changes.
Autosave (`autosaveDelayMs`) and polling (`pollIntervalMs`) are off unless the
host enables them; `refresh()` on the mailbox ref re-reads the current view. Hide every control that needs a missing operation and recheck
the committed capabilities when timers, dialogs and pipelines run. Never map
roles or permission names in Maily. Unsaved compositions close without
`discardDraft`; saved drafts without `edit` are read-only and send unchanged.
Withdrawing an operation must keep the composer mounted and its unsaved content
editable and guarded. Hosts change the prop, not `dataSource`. See
[draft capabilities](docs/mailbox-workflows.md#draft-capabilities).

## Search capabilities, 2026-10-25

Text search is always available. Advanced filters (`from`, `to`, `subject`,
`after`, `before`, `hasAttachments`, `unread`) are off unless
`searchCapabilities` enables them. Render only enabled controls, hide the
advanced-search trigger when none is enabled, and strip disabled members from
both `search` and `q`, including controlled and default filter values. A
capability change clears uncontrolled values; a controlled `searchFilters`
value is the host's to coordinate, so a capability change does not call
`onSearchFiltersChange` for it. Never filter
loaded rows client-side. The form's `PopoverContent` stays outside
`InputGroupAddon`: React bubbles portalled clicks through the component tree,
and the addon's click handler focuses the search input and dismisses the form.
See [search capabilities](docs/mailbox-workflows.md#search-capabilities).

## Production standards, 2026-10-23

Package source passes the stock shadcn Vite template's ESLint config with zero
warnings, including the React Compiler rules in react-hooks' recommended preset
(`react-refresh/only-export-components` is off there, as in the template). The
consumer matrix lints the installed copies with a freshly generated template.
Add an `eslint-disable` only for a demonstrated external constraint, with a
`-- reason`: TanStack Virtual's `incompatible-library` warning, and writes to external mutable objects (TipTap
storage, the drag handle's plugin-owned DOM node). Never move such a write into
a helper just to hide it from the rule.

React state follows `editor/utils/state-hooks.ts`:

- `useOwnedRef` holds lifetime-scoped mutable boxes. Never mutate a `useMemo`
  result: the compiler treats it as frozen, and React may discard the cache.
- `useResettableState` holds state that resets when a request key changes.
  Do not call setState at the top of an effect for that.
- `useLatestRef` and `useEvent` give effects the latest value or handler.
  Never assign a ref during render.
- Callbacks that consult controlled props depend on "is controlled" flags, not
  on the controlled values, so a selection change does not restart reads.

`shadcn add --overwrite` never deletes files and strips a file's leading
comments. Keep public entry names stable: `editor/index.tsx` and
`mailbox/index.tsx` are re-export barrels in front of `editor.tsx` and
`mailbox-view.tsx`. Never put a required comment or directive before a file's
first statement.

Import dual CommonJS/ESM packages by named export, for example
`import { Image } from '@tiptap/extension-image'`. Under `"type": "module"`,
esbuild's CommonJS output uses Node interop, where a default import is the whole
module. `pnpm lint:package` loads every published entry through both `import`
and `require`. Types that appear in published declarations must come from
dependencies: render depends on `@tiptap/core`, `@tiptap/pm` and `csstype`,
because tsdown inlines devDependency types.

Text inputs never run editor commands with `.focus()` from a change handler.
Link popovers edit a local draft and commit once, on Enter, a chosen suggestion
or close. A saved draft the host cannot edit renders as read-only text, not as
disabled fields.

Dependencies stay on their latest releases with three exceptions. TypeScript
stays on 6.x, `@types/node` follows the Node 24 LTS line, and `@types/react`
and `@types/react-dom` stay at 18 in core and the workspace root to keep the
React 18 peer honest (`@types/react-dom` 19 requires `@types/react` 19).
Never use deprecated packages: render imports its email components and
`render` from `react-email`, which replaced `@react-email/components`.

The playground is client-only, so `vite.config.ts` inlines
shadcn-theme-provider's `getThemeScript()` into `index.html` (0.3.0+, which
also stops rendering that script on the client). The options come from the
React-free `src/theme.ts`, shared with `main.tsx`, so the stored mode and
palette apply before the first paint. The script's palette link lands before
the app's CSS, so `src/index.css` keeps its fallback tokens in `@layer base`,
where an unlayered palette stylesheet always wins.
