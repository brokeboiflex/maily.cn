<p align="center">
  <img src="./assets/branding/maily-cn-avatar.png" width="160" alt="maily.cn avatar: a suited character wearing colorful glasses" />
</p>

<h1 align="center">maily.cn</h1>

<p align="center">
  <strong>A production-ready Maily email editor, installed as source through shadcn.</strong>
</p>

<p align="center">
  <em>Bring your content, use the pre-designed blocks, and own every line that lands in your app.</em>
</p>

<p align="center">
  <a href="./license"><img src="https://img.shields.io/badge/License-MIT-222222.svg" alt="MIT license" /></a>
  <a href="https://github.com/arikchakma/maily.to"><img src="https://img.shields.io/badge/Upstream-maily.to-222222.svg" alt="Upstream maily.to repository" /></a>
  <a href="https://github.com/sponsors/brokeboiflex"><img src="https://img.shields.io/badge/Sponsor-brokeboiflex-EA4AAA.svg?logo=githubsponsors&logoColor=white" alt="Sponsor brokeboiflex on GitHub" /></a>
</p>

<p align="center">
  <img src="./assets/branding/maily-cn-hero.png" width="760" alt="Colorful maily.cn illustration featuring the maintainer character" />
</p>

`maily.cn` is a fork of [maily.to](https://github.com/arikchakma/maily.to), the
TipTap-based WYSIWYG editor for composing beautiful, mobile-ready emails from
pre-designed blocks.

The upstream project publishes Maily as npm packages. This fork takes a different
distribution path: run one `shadcn add` command and the editor plus renderer arrive as
plain source files inside your project. You own them, theme them, and change them like
any other shadcn component.

> Maily itself was created by [Arik Chakma](https://github.com/arikchakma) and its
> contributors. `maily.cn` maintains a source-owned shadcn distribution and the
> production hardening documented below.

## Start using

Add the registry namespace to your existing shadcn project's `components.json`:

```jsonc
{
  "registries": {
    "@maily": "https://raw.githubusercontent.com/brokeboiflex/maily.cn/main/playground/public/r/{name}.json",
  },
}
```

Then install the block:

```bash
npx shadcn@latest add @maily/maily
```

This writes the editor to `components/maily/**`, the renderer to
`lib/maily-render/**`, installs the required shadcn primitives, and wires the Tailwind
typography plugin used by the writing surface.

## Why use maily.cn?

Designing email that behaves consistently across clients is hard. Maily gives you an
opinionated editor with reusable blocks, while `maily.cn` makes that editor fit the
way modern shadcn applications are built.

- **Source-owned installation** — no opaque editor UI dependency after installation.
- **Real shadcn primitives** — works with both current Radix and Base UI component styles.
- **Host-controlled theming** — plain Tailwind v4 utilities and the consumer's shadcn tokens.
- **Generic i18n** — replace every user-facing label without coupling to an i18n framework.
- **Caller-driven image upload** — provide your own upload handler and storage backend.
- **Email-safe rendering** — turn the editor JSON into HTML independently of editor theming.
- **Consumer icon choice** — icon placeholders resolve to the library selected in
  `components.json`.

The maintained [shadcn alignment boundary](./SHADCN_ALIGNMENT.md) lists every
host-owned primitive and explains the remaining editor-specific composites.

## Included blocks

- Logo and cover layouts
- Buttons and variants
- Variables
- Text formatting and headings
- Images and inline images
- Alignment and spacing controls
- Dividers and spacers
- Footers
- Inline code and HTML
- Link cards
- Sections and columns
- Repeat blocks
- Conditional content

## What gets installed

| Part         | Target                | Import               | Purpose                                  |
| ------------ | --------------------- | -------------------- | ---------------------------------------- |
| **Editor**   | `components/maily/**` | `@/components/maily` | The `<Editor />` WYSIWYG email composer. |
| **Renderer** | `lib/maily-render/**` | `@/lib/maily-render` | Editor JSON to email-safe HTML.          |

## Requirements

- React 18 or 19
- Tailwind CSS v4 with standard shadcn theme tokens
- A project initialized with the shadcn CLI (`components.json` present)

The registry automatically declares its stock shadcn dependencies and adds
`@plugin "@tailwindcss/typography";` for the editor's `prose` content area.

## Editor usage

```tsx
import { Editor } from '@/components/maily';

export function ComposeEmail() {
  return (
    <Editor
      contentJson={{ type: 'doc', content: [] }}
      onUpdate={(editor) => {
        console.log(editor.getJSON());
      }}
    />
  );
}
```

`<Editor />` includes the toolbar, slash-command menu, bubble menus, and writing
surface. Its chrome and canvas inherit the host application's light or dark theme.
Interactive chrome also inherits the host's installed shadcn primitives: buttons,
toggles, toggle groups, menus, popovers, tabs, command lists, inputs, tooltips, separators, and
keyboard hints come from the consumer's selected shadcn style.

### Key props

All props are optional. The editor accepts initial JSON or HTML and reports changes
through callbacks.

| Prop          | Type               | Description                                                |
| ------------- | ------------------ | ---------------------------------------------------------- |
| `contentJson` | `JSONContent`      | Initial TipTap JSON: a document node or an array of nodes. |
| `contentHtml` | `string`           | Initial HTML, used when `contentJson` is absent.           |
| `onCreate`    | `(editor) => void` | Called when the editor instance is ready.                  |
| `onUpdate`    | `(editor) => void` | Called on changes; read `editor.getJSON()` here.           |
| `editable`    | `boolean`          | Read-only toggle. Defaults to `true`.                      |
| `extensions`  | `AnyExtension[]`   | Additional TipTap extensions merged with the defaults.     |
| `blocks`      | `BlockGroupItem[]` | Replacement slash-command block list.                      |
| `config`      | `object`           | Chrome toggles and class hooks.                            |

`config` supports `hasMenuBar`, `hideContextMenu`, `spellCheck`, `autofocus`,
`immediatelyRender`, `wrapClassName`, `toolbarClassName`, `bodyClassName`, and
`contentClassName`.

## Translation

Every user-facing string is read through the framework-agnostic `labels` contract.
Omit it for the English defaults or provide a complete `MailyLabels` object.

```tsx
import { Editor, defaultLabels, type MailyLabels } from '@/components/maily';

const labels: MailyLabels = {
  ...defaultLabels,
  'toolbar.bold': 'Pogrubienie',
  'toolbar.italic': 'Kursywa',
};

<Editor labels={labels} />;
```

`MailyLabels` is intentionally exhaustive. When the editor adds new UI copy, a
complete language file fails TypeScript until that key is translated.

## Image upload

Storage stays under the consumer's control. Configure the image upload extension with
a handler that accepts a file and returns its public URL:

```tsx
import { ImageUploadExtension } from '@/components/maily/editor/extensions';

<Editor
  extensions={[
    ImageUploadExtension.configure({
      onImageUpload: async (file) => uploadImage(file),
    }),
  ]}
/>;
```

Users can still paste a URL when an upload handler is not appropriate.

## Font selection

Select text in the editor to choose from the complete Fontsource catalog. The
picker fetches catalog metadata only when opened, virtualizes its results, and
loads preview WOFF2 files only for visible rows, so the font library is not
bundled into the installed component.

The chosen Fontsource package version, subset, weights, fallback, and family are
stored on TipTap's `textStyle` mark. Saved editor JSON is therefore enough for
the server-side renderer to emit version-pinned `@font-face` declarations without
querying Fontsource while an email is being sent. Unsupported email clients use
the family-specific email-safe fallback.

The Fontsource API and jsDelivr font CDN must be permitted by the host
application's content security policy for catalog previews. Sent emails still
render readable fallback fonts when a client blocks remote web fonts.

## Renderer usage

```ts
import { render } from '@/lib/maily-render';

const html = await render(editorJson, {
  preview: 'Inbox preview text',
  theme: {
    /* optional rendered-email theme overrides */
  },
});
```

The renderer is independent of the editor's on-screen theme and produces the final
email-client-safe HTML from the saved JSON.

## Theming and customization

- Change the host's shadcn theme tokens to restyle the editor globally.
- Pass layout utilities through the editor's `config` class hooks.
- Edit the installed source for deeper changes; that is the point of this distribution.
- The actual sent email is styled by the renderer, not by the editor chrome.

## Sponsoring

If `maily.cn` saves you time, helps you ship, or makes you money, sponsorships are
very welcome. I will happily accept them xD.

<a href="https://github.com/sponsors/brokeboiflex">
  <img src="https://img.shields.io/badge/Sponsor%20maily.cn-brokeboiflex-EA4AAA.svg?logo=githubsponsors&logoColor=white" alt="Sponsor maily.cn through GitHub Sponsors" />
</a>

You can also support the original project through
[Arik Chakma's GitHub Sponsors](https://github.com/sponsors/arikchakma).

## Contributing and local development

This is a pnpm and Turborepo monorepo. `packages/core`, `packages/render`, and
`packages/shared` are the source of truth. `registry/**`, `registry.json`, and the
served playground registry are generated.

```bash
pnpm install
pnpm dev
pnpm test
pnpm registry:build
pnpm playground:sync
```

Read [AGENTS.md](./AGENTS.md) for the architecture and repository conventions. The
real consumer harness is documented in [playground/README.md](./playground/README.md).

## Credits

`maily.cn` is built on [maily.to](https://github.com/arikchakma/maily.to) by
[Arik Chakma](https://github.com/arikchakma) and contributors. The fork is maintained
by [brokeboiflex](https://github.com/brokeboiflex).

## License

MIT. See [license](./license).
