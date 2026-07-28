# maily.cn playground

A throwaway **Vite + React + Tailwind v4 + shadcn** app used to dev-test the
`maily.cn` editor the way a real consumer would: by installing it from the local
shadcn registry with `shadcn add`, instead of importing the workspace packages.

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

The served JSON lives in `playground/public/r/` (`maily.json` + a `registry.json`
index). Vite serves `public/` at the web root, so the registry is reachable at
`http://localhost:5173/r/...` while the dev server is running. The port is
pinned (`strictPort`) in `vite.config.ts` so that URL stays valid.

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
bunx --bun shadcn@latest view @maily/maily               # inspect the maily block
bunx --bun shadcn@latest add  @maily/maily --overwrite   # (re)install the editor source
```

`add` writes the editor into `src/components/maily/**` and the renderer into
`src/lib/maily-render/**` (the targets declared in `registry.json`), and installs
the editor's npm dependencies. `src/App.tsx` renders `<Editor />` from
`@/components/maily` as a smoke test.

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

The registry is also fixture-tested with shadcn's Base UI style. Its externalized
`Button`, `Input`, `Textarea`, `Toggle`, `ToggleGroup`, `Tooltip`, `Separator`,
`Select`, `Kbd`, `DropdownMenu`, `Popover`, `Tabs`, `InputGroup`, and
`Command` and `Badge` resolve to the consumer's stock implementations; icon placeholders
resolve to the icon library selected in that consumer's `components.json`.

Run `bun run test:e2e` for the committed Chromium regression suite. It covers
host-theme hover tokens, narrow-viewport overflow, real Tabs state, ToggleGroup
roving focus, toolbar link composition, and invalid nested interactive DOM.
