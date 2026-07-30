# maily.cn playground

A throwaway **Vite + React + Tailwind v4 + shadcn** app used to dev-test the
`maily.cn` editor the way a real consumer would: by installing it from the local
shadcn registry with `shadcn add`, instead of importing the workspace packages.

**Live playground:** https://brokeboiflex.github.io/maily.cn/

The published page uses the same centered demo hierarchy as the
[`shadcn-theme-provider`](https://github.com/brokeboiflex/shadcn-theme-provider)
[showcase](https://brokeboiflex.github.io/shadcn-theme-provider-demo/): product
introduction and resource links, visible Light/Dark/System and palette controls,
an English/Polish component language switch, then framed editor and mailbox
examples. The editor is seeded with editable content; on narrow screens, the
desktop split-pane mailbox scrolls inside its own frame instead of widening the
page.

It was scaffolded with the shadcn CLI:

```bash
bunx --bun shadcn@latest init -t vite
```

## How it's wired

The repo root is a shadcn **registry** (`registry.json`, generated from
`packages/*` — see the top-level `AGENTS.md`). This playground consumes it
through a local namespace declared in `components.json`:

```jsonc
// playground/components.json
"registries": {
  "@maily": "http://localhost:5173/r/{name}.json"
}
```

The served JSON lives in `playground/public/r/` (`maily-editor.json`,
`maily-mailbox.json`, `maily-render.json`, the backward-compatible `maily.json`,
and a `registry.json` index). Vite serves `public/` at the web root, so the
registry is reachable at `http://localhost:5173/r/...` while the dev server is
running. The port is pinned (`strictPort`) in `vite.config.ts` so that URL stays
valid.

## Usage

From the repo root, regenerate the registry and refresh what the playground
serves (run after any change under `packages/*`):

```bash
pnpm playground:sync
```

Then, in this directory:

```bash
bun install          # first time only
bun run dev          # start the dev server (http://localhost:5173)
```

With the dev server running, list / inspect / install the registry from the
local namespace:

```bash
bunx --bun shadcn@latest list @maily                     # list registry items
bunx --bun shadcn@latest view @maily/maily-editor        # inspect the editor
bunx --bun shadcn@latest add @maily/maily-editor @maily/maily-mailbox --overwrite
```

`add` writes the editor into `src/components/maily/**` and the optional mailbox
into `src/components/maily/mailbox/**`, with only their imported npm and stock
shadcn dependencies. `src/App.tsx` renders `<Editor />` from
`@/components/maily` and `<MailboxView />` from `@/components/maily/mailbox` as
smoke tests. Install `@maily/maily-render` separately when testing
`src/lib/maily-render/**`.

The installed editor ships an `i18n/` directory (`default-labels.ts`,
`translate.ts`); `pnpm playground:sync` carries those files into the served block.
To smoke-test translation, pass a `labels` prop to `<Editor>` in `src/App.tsx` —
copy `defaultLabels`, change a few values, and confirm the chrome and default-block
menu update. Omitting a key is a TypeScript error naming the missing key. See the
[Translating the editor](../packages/core/readme.md#translating-the-editor) section
for the full API.

## Consumer compatibility check

The playground intentionally keeps the modern shadcn/Vite defaults, including
`verbatimModuleSyntax: true`. A successful `bun run build` therefore verifies that
the installed registry source uses portable type-only imports and needs no consumer
TypeScript workaround.

Run `pnpm registry:consumer-test` from the repository root for clean-current
consumer fixtures. It initializes fresh Radix and Base UI Vite applications,
installs the granular registry items, mounts the editor, and runs TypeScript plus
production builds. The complete Base fixture is also launched in Chromium to
verify ToggleGroup focus/state, Popover focus and Escape handling, mailbox rich
compose, nested-interactive safety, and runtime errors. Externalized `Button`,
`Input`, `Textarea`, `Toggle`,
`ToggleGroup`, `Tooltip`, `Separator`, `Select`, `Kbd`, `DropdownMenu`,
`Popover`, `Tabs`, `InputGroup`, `Command`, and `Badge` resolve to each
consumer's stock implementations; icon placeholders resolve to the selected icon
library.

The current Base UI `scroll-area` item contains one upstream unused React import
under strict TypeScript. The matrix accepts only that exact diagnostic for the
optional mailbox fixture, then reruns the whole fixture with unused-import
checking relaxed. Any diagnostic in Maily source still fails the gate; the
editor-only Base fixture remains fully strict.

The custom HTML block uses the plain TipTap `CodeBlock` extension. Editing,
variables, and code/preview tabs remain supported without shipping Lowlight,
Highlight.js, or bundled syntax languages.

Run `bun run test:e2e` for the committed Chromium regression suite. It covers
host-theme hover tokens, narrow-viewport overflow, real Tabs state, ToggleGroup
roving focus, toolbar link composition, and invalid nested interactive DOM.

## GitHub Pages

`.github/workflows/deploy-playground.yml` builds this app with
`bun run build:pages` and deploys `dist/` through GitHub's Pages artifact
workflow after playground changes land on `main`. The Pages build uses
`/maily.cn/` as Vite's base path; local development and `bun run build` keep `/`
so the local shadcn registry URL remains unchanged.
