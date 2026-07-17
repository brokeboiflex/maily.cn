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

registry/                     — generated shadcn registry output (the installable block).
  default/maily/
    components/maily/  ← mirrors packages/core/src (the editor)
    lib/maily-render/  ← mirrors packages/render/src + shared

registry.json                 — shadcn registry manifest (single `maily` block).
scripts/
  build-shadcn-registry.mjs   — builds registry/** and registry.json from packages/*/src.
  icon-map.mjs                — lucide → IconPlaceholder mapping used during the build.

playground/                   — local dev harness: a Vite + shadcn app that installs the
                                editor from the local registry via `shadcn add @maily/maily`.
                                Not part of the pnpm workspace. See playground/README.md.
```

### Key relationship: packages are the source of truth

`packages/core`, `packages/render`, and `packages/shared` hold the canonical source. The `registry/` tree and `registry.json` are **generated** from those packages by `scripts/build-shadcn-registry.mjs` (`pnpm registry:build`). When editing editor/renderer behavior, change the **package source** and regenerate the registry — do not hand-edit `registry/**`.

The build step also rewrites hardcoded `lucide-react` icon JSX into a shadcn-friendly `<IconPlaceholder>` so installers can swap in their preferred icon library. See `.sisyphus/plans/` and `.sisyphus/evidence/` for the icon-conversion design notes.

The build step **externalizes modules the consumer already owns** rather than shipping a private copy. These are listed in `EXTERNALIZED_MODULES` in `scripts/build-shadcn-registry.mjs`, keyed by package-source path; for each, the source file is excluded from the emitted registry and every import of it (`@/…` or relative) is rewritten to the consumer's shadcn alias. The source file stays in `packages/core` for standalone builds — only the registry output defers to the consumer. Today this covers:

- `cn` (`editor/utils/classname` → `@/lib/utils`)
- the `Button` primitive (`editor/components/base-button` → `@/components/ui/button` — the source export was renamed `BaseButton` → `Button` so the name matches stock shadcn, since the rewrite only swaps the import path)
- `Input` (`editor/components/input` → `@/components/ui/input`)
- `Textarea` (`editor/components/textarea` → `@/components/ui/textarea`)
- `Toggle` (`editor/components/ui/toggle` → `@/components/ui/toggle`)
- `ToggleGroup` / `ToggleGroupItem` (`editor/components/ui/toggle-group` → `@/components/ui/toggle-group`)
- `Tooltip` (`editor/components/ui/tooltip` → `@/components/ui/tooltip`)
- `Separator` (`editor/components/ui/divider` → `@/components/ui/separator`)
- `NativeSelect` / `NativeSelectOption` (`editor/components/ui/native-select` → `@/components/ui/native-select`)
- `Kbd` / `KbdGroup` (`editor/components/ui/kbd` → `@/components/ui/kbd`)
- `DropdownMenu` (`editor/components/ui/dropdown-menu` → `@/components/ui/dropdown-menu`)
- `Popover` (`editor/components/popover` → `@/components/ui/popover`)
- `Tabs` (`editor/components/ui/tabs` → `@/components/ui/tabs`)
- `InputGroup` (`editor/components/ui/input-group` → `@/components/ui/input-group`)
- `Command` (`editor/components/ui/command` → `@/components/ui/command`)
- `Badge` (`editor/components/ui/badge` → `@/components/ui/badge`)

For an externalized component to resolve in the consumer's project, the registry item must declare the matching stock item in **`registryDependencies`** (`button`, `input`, `textarea`, `toggle`, `toggle-group`, `tooltip`, `separator`, `native-select`, `kbd`, `dropdown-menu`, `popover`, `tabs`, `input-group`, `command`, `badge`) so `shadcn add` installs it; the build emits these from `REGISTRY_DEPENDENCIES`. Behavior the stock primitive lacks lives at the call site instead of in the externalized component — e.g. the password-manager-off attributes (`AUTOCOMPLETE_PASSWORD_MANAGERS_OFF`) moved from the old bundled `Input` onto each `Input` in `link-card.tsx`.

**Toggle state uses real primitives, not faked `data-state`.** Standalone stateful controls use stock shadcn `Toggle`, related controls use the host's stock `ToggleGroup` / `ToggleGroupItem`, and plain actions use `Button`. `toggle-group-compat.tsx` is only a thin prop adapter for the different Radix/Base controlled-value signatures; it does not render a replacement primitive. Alignment, text-direction, and vertical-alignment selectors use Popover + ToggleGroup; the toolbar link control uses the same Maily link Popover as the bubble menu. The drag-handle node actions and “Turn into” selector use stock `DropdownMenu`; the HTML code/preview switch uses stock `Tabs`; Link Card labels use stock `Badge`.

The remaining `Select` is an editor-specific labelled/tooltip composite built on the externalized stock `NativeSelect`; it is not a replacement primitive. The registry uses the consumer's stock `Popover`; all current call sites use its standard portalled behavior. Variable suggestions compose stock `Command` and `Kbd`, while compact icon-bearing inputs compose stock `InputGroup`. `Editor` owns the stock `TooltipProvider`. When a Tooltip wraps another stateful primitive, its neutral `span` trigger keeps the Tooltip's state/slot attributes from masking the nested Popover, DropdownMenu, Tabs, Toggle, or ToggleGroup item and prevents nested interactive DOM after shadcn's Radix-to-Base transform.

Slash-command flyouts are viewport-aware: the main menu is capped to the viewport, submenus grow up to 20rem, open on the side with usable space, fall back to an overlay on narrow viewports, and truncate item copy inside `min-w-0` text columns so translated or consumer-provided labels never escape the panel. The editor toolbar wraps its primitive groups rather than widening the document, and large configuration popovers use viewport-capped widths.

Autocomplete suggestions portal to `document.body` and compute a viewport-aware fixed position so scroll containers cannot clip them. The standalone package therefore declares `react-dom` alongside `react` as a peer and keeps both external in `tsup`; registry consumers use the host application's React runtime.

`SHADCN_ALIGNMENT.md` is the maintained boundary report for host-owned primitives, intentional Maily composites, and the five custom document-diagram SVGs that remain after the final audit.

Icon inheritance is release-tested with clean shadcn apps initialized for Lucide, Tabler, Hugeicons, Phosphor, and Remix; each fixture must mount Maily and pass its TypeScript/Vite production build. Do not validate an icon library by only changing `components.json` on an existing app because the selected shadcn preset also owns the icon packages and primitive source.

## Tech stack

- **React 18/19**, **TypeScript**
- **TipTap / ProseMirror** for the editor
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
pnpm registry:build     # regenerate registry/** and registry.json from packages/*/src
pnpm playground:sync    # registry:build + serve the built JSON into playground/public/r
pnpm format:write       # prettier
pnpm lint               # eslint
```

## Local dev playground

`playground/` is a standalone Vite + React + Tailwind v4 + shadcn app (scaffolded
with `bunx --bun shadcn@latest init -t vite`) that consumes this repo's registry the
way an end user would. Its `components.json` declares a local namespace
`@maily → http://localhost:5173/r/{name}.json`, served from `playground/public/r`.

Loop: edit `packages/*` → `pnpm playground:sync` (rebuild + reserve) → in `playground/`,
run `bun run dev` and `shadcn add @maily/maily --overwrite`. Full details and commands
are in `playground/README.md`. Keep the playground's modern
`verbatimModuleSyntax: true` setting enabled; the package and generated registry source
must compile without consumer-side TypeScript workarounds.

## Working conventions

- **Read before you edit.** The editor is large and the block/extension/node wiring is intricate; trace how a block is registered and rendered before changing it.
- **Keep the fork branding honest and local.** User-facing repository docs use `maily.cn` and the artwork in `assets/branding/`; do not hotlink the old `maily.to` logo or present upstream sponsors as sponsors of this fork. Preserve clear credit and links to the original `arikchakma/maily.to` project. The technical npm workspace names remain `@maily-to/*` unless a separate package-renaming task explicitly changes them.
- **Edit packages, regenerate the registry.** Never hand-edit `registry/**` — it is build output.
- **Keep i18n generic.** Any new user-facing string must be overridable via the label-replacement mechanism, with an English default. Don't couple to a specific i18n framework. The mechanism lives in `packages/core/src/editor/i18n/`: `defaultLabels` (the exhaustive English dictionary in `default-labels.ts`) is both the runtime default and the authoring template; `LabelKey` is its key union; `MailyLabels = Record<LabelKey, string>` is the **complete-language** contract (not `Partial` — a missing key is a compile error, no merging). `createTranslator(labels)` returns `t(key, vars?)`, which does minimal `{token}` interpolation. **Adding any user-facing string means adding a key to `defaultLabels` and reading it via `t('…')`** — components get `t` from `useMailyContext()`; non-React consumers (the Placeholder extension, the default-block builder `getDefaultBlocks(t)`, the slash-command popup) receive `t` threaded from `Editor`. `searchTerms` and inserted seed content stay English (out of the dictionary). Note the deliberate break: block exports (`text`, `button`, …) and the placeholder are now `(t) => …` factories, not ready-made values.
- **Keep image upload caller-driven.** The component should not assume a storage backend; it calls a handler the consumer provides and uses the returned URL.
- **Fontsource typography stays runtime-only and self-contained in saved JSON.** The text font picker reads the complete Fontsource catalog from `https://api.fontsource.org/v1/fonts` only after it opens, normalizes and deduplicates family names by the strongest static email coverage, virtualizes the result with `@tanstack/react-virtual`, and loads preview faces only for rendered rows. Never bundle the catalog or font binaries, and do not expose implementation metadata such as variable-font capability badges in the picker. A selected text-style mark stores the Fontsource id, pinned package version, subset, regular/bold weights, italic availability, family, and email-safe fallback; the renderer constructs version-pinned jsDelivr WOFF2 URLs from those attributes and must not call Fontsource while sending an email. The global `theme.font` remains the default for unmarked text. Remote web fonts are progressive enhancement, so every granular font must retain its inline fallback stack.
- **Plain Tailwind, no prefix, no shipped CSS.** Maily is an idiomatic shadcn component: the editor source uses bare Tailwind utility classes (`bg-popover`, `text-foreground`, …) generated by the **consumer's** Tailwind, and ships **no stylesheet of its own**. There is no `mly:` prefix, no private Tailwind build, and no `@theme inline` bridge — those were removed. The component only _uses_ the consumer's shadcn theme tokens; it never defines or remaps them. When adding chrome, reach for tokens, never hardcoded colors (`bg-white`, `text-gray-*`, `soft-gray`, `midnight-gray` are gone — use `bg-background`/`bg-popover`, `text-foreground`/`text-muted-foreground`, `border-border`/`border-input`, `ring-ring`, `bg-primary`/`text-primary-foreground`, `bg-destructive`/`text-destructive`).
- **Everything themes via the host's tokens — including the canvas.** Chrome _and_ the writing surface follow the consumer's light/dark theme. The paper uses `bg-background`/`text-foreground`; the content area is `prose` with its `--tw-prose-*` colors pinned to `var(--foreground)`/`var(--muted-foreground)`/`var(--border)` so it stays readable in every palette and mode. (The real, sent email is produced independently by `packages/render` and is unaffected by editor theming.)
- **Styling lives on elements and extensions, not in CSS.** Element classes go in the `.tsx`; DOM that TipTap/ProseMirror generate at runtime is styled by passing Tailwind class strings into extension config (e.g. the Placeholder extension's `emptyNodeClass`/`emptyEditorClass`, node `renderHTML`/NodeView `className`) or via Tailwind v4 arbitrary variants (`[&_.ProseMirror-gapcursor]:…`, `[&_.hljs-keyword]:…`) on the nearest controllable element — see `editor/index.tsx` (`EDITOR_CONTENT_CLASS`) and `nodes/html/html-view.tsx` (`HLJS_CLASS`).
- **A few colors stay literal on purpose** because they are email _content_ values (serialized into the email the recipient sees), not chrome: the default button colors (`#000000`/`#ffffff`) and section background/border (`#f7f7f7`/`#e2e2e2`) in the node definitions, code-syntax-highlight colors, the rose brand accent for variables, and the selection/selected-node highlight blue. Don't tokenize these.
- **Consumer requirement: the typography plugin.** The content area depends on `prose`, so consumers need `@plugin "@tailwindcss/typography";`. The registry item wires this automatically via its `css` key on `shadcn add`; the build script (`scripts/build-shadcn-registry.mjs`) emits that key.
- **Default block media uses the fork's public branding.** Logo presets use `assets/branding/maily-cn-avatar.png` and the cover preset uses `assets/branding/maily-cn-hero.png`, referenced through this repository's public `raw.githubusercontent.com` URLs so rendered emails and shadcn-installed source can load them without bundler-specific asset handling.
