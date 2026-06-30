# maily.to-prod-ready

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

For an externalized component to resolve in the consumer's project, the registry item must declare the matching stock item in **`registryDependencies`** (`button`, `input`, `textarea`, `toggle`, `toggle-group`) so `shadcn add` installs it; the build emits these from `REGISTRY_DEPENDENCIES`. Behavior the stock primitive lacks lives at the call site instead of in the externalized component — e.g. the password-manager-off attributes (`AUTOCOMPLETE_PASSWORD_MANAGERS_OFF`) moved from the old bundled `Input` onto each `Input` in `link-card.tsx`.

**Toggle state uses real primitives, not faked `data-state`.** The old toolbar buttons simulated active/pressed state with a `data-[state=true]` class on a bundled button; that hack is gone. Toggle-style controls now use stock shadcn `Toggle` / `ToggleGroup`: the text-marks bar (bold/italic/underline/strike/code) is a `ToggleGroup type="multiple"`, the alignment and text-direction popovers are `ToggleGroup type="single"`, and lock-aspect-ratio is a standalone `Toggle`. Plain actions (lists, duplicate, delete, the cycle/vertical-align switch, and all popover triggers) stay `Button`.

Note: the rest of `editor/components/ui/` is **not** externalizable — `select` is a custom native `<select>`, `popover` is a fork with editor-specific inline (`portal`) rendering, and `divider` is a trivial token `<div>` with no stock equivalent — so those stay bundled. `tooltip` is API-compatible with stock shadcn but kept bundled deliberately to preserve the editor's tuned styling.

## Tech stack

- **React 18/19**, **TypeScript**
- **TipTap / ProseMirror** for the editor
- **Tailwind CSS v4** (plain, unprefixed utilities using the consumer's shadcn theme tokens — the component ships no Tailwind build or stylesheet of its own)
- **Radix UI** primitives, **lucide-react** icons
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
run `bun run dev` and `shadcn add @maily/maily --overwrite`. Full details, commands,
and the `verbatimModuleSyntax` caveat are in `playground/README.md`.

> **Known portability bug surfaced by the playground:** the editor source
> value-imports type-only symbols (e.g. `import { Command } from '@tiptap/core'`).
> Consumers with `verbatimModuleSyntax: true` (the modern shadcn/Vite default) get a
> runtime "does not provide an export named 'Command'" error. Fix in `packages/core`
> by switching these to `import type`.

## Working conventions

- **Read before you edit.** The editor is large and the block/extension/node wiring is intricate; trace how a block is registered and rendered before changing it.
- **Edit packages, regenerate the registry.** Never hand-edit `registry/**` — it is build output.
- **Keep i18n generic.** Any new user-facing string must be overridable via the label-replacement mechanism, with an English default. Don't couple to a specific i18n framework. The mechanism lives in `packages/core/src/editor/i18n/`: `defaultLabels` (the exhaustive English dictionary in `default-labels.ts`) is both the runtime default and the authoring template; `LabelKey` is its key union; `MailyLabels = Record<LabelKey, string>` is the **complete-language** contract (not `Partial` — a missing key is a compile error, no merging). `createTranslator(labels)` returns `t(key, vars?)`, which does minimal `{token}` interpolation. **Adding any user-facing string means adding a key to `defaultLabels` and reading it via `t('…')`** — components get `t` from `useMailyContext()`; non-React consumers (the Placeholder extension, the default-block builder `getDefaultBlocks(t)`, the slash-command popup) receive `t` threaded from `Editor`. `searchTerms` and inserted seed content stay English (out of the dictionary). Note the deliberate break: block exports (`text`, `button`, …) and the placeholder are now `(t) => …` factories, not ready-made values.
- **Keep image upload caller-driven.** The component should not assume a storage backend; it calls a handler the consumer provides and uses the returned URL.
- **Plain Tailwind, no prefix, no shipped CSS.** Maily is an idiomatic shadcn component: the editor source uses bare Tailwind utility classes (`bg-popover`, `text-foreground`, …) generated by the **consumer's** Tailwind, and ships **no stylesheet of its own**. There is no `mly:` prefix, no private Tailwind build, and no `@theme inline` bridge — those were removed. The component only _uses_ the consumer's shadcn theme tokens; it never defines or remaps them. When adding chrome, reach for tokens, never hardcoded colors (`bg-white`, `text-gray-*`, `soft-gray`, `midnight-gray` are gone — use `bg-background`/`bg-popover`, `text-foreground`/`text-muted-foreground`, `border-border`/`border-input`, `ring-ring`, `bg-primary`/`text-primary-foreground`, `bg-destructive`/`text-destructive`).
- **Everything themes via the host's tokens — including the canvas.** Chrome _and_ the writing surface follow the consumer's light/dark theme. The paper uses `bg-background`/`text-foreground`; the content area is `prose` with its `--tw-prose-*` colors pinned to `var(--foreground)`/`var(--muted-foreground)`/`var(--border)` so it stays readable in every palette and mode. (The real, sent email is produced independently by `packages/render` and is unaffected by editor theming.)
- **Styling lives on elements and extensions, not in CSS.** Element classes go in the `.tsx`; DOM that TipTap/ProseMirror generate at runtime is styled by passing Tailwind class strings into extension config (e.g. the Placeholder extension's `emptyNodeClass`/`emptyEditorClass`, node `renderHTML`/NodeView `className`) or via Tailwind v4 arbitrary variants (`[&_.ProseMirror-gapcursor]:…`, `[&_.hljs-keyword]:…`) on the nearest controllable element — see `editor/index.tsx` (`EDITOR_CONTENT_CLASS`) and `nodes/html/html-view.tsx` (`HLJS_CLASS`).
- **A few colors stay literal on purpose** because they are email _content_ values (serialized into the email the recipient sees), not chrome: the default button colors (`#000000`/`#ffffff`) and section background/border (`#f7f7f7`/`#e2e2e2`) in the node definitions, code-syntax-highlight colors, the rose brand accent for variables, and the selection/selected-node highlight blue. Don't tokenize these.
- **Consumer requirement: the typography plugin.** The content area depends on `prose`, so consumers need `@plugin "@tailwindcss/typography";`. The registry item wires this automatically via its `css` key on `shadcn add`; the build script (`scripts/build-shadcn-registry.mjs`) emits that key.
