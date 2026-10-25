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
distribution path: install only the editor, optional mailbox, and renderer source you
actually use through the shadcn registry. You own those files, theme them, and change
them like any other shadcn component.

Try the editor and mailbox components in the
[live playground](https://brokeboiflex.github.io/maily.cn/), including light,
dark, and system mode selection powered by `shadcn-theme-provider`.

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

Then install the editor:

```bash
npx shadcn@latest add @maily/maily-editor
```

Add the optional parts only when the application uses them:

```bash
npx shadcn@latest add @maily/maily-mailbox
npx shadcn@latest add @maily/maily-render
```

`maily-mailbox` depends on `maily-editor`, so adding it to a fresh project installs
both. `@maily/maily` remains available as the backward-compatible full install.
Every item declares only the npm packages and stock shadcn primitives imported by
its own emitted source. The editor item also wires the Tailwind typography plugin
used by the writing surface.

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
- **Dependency-light custom HTML** — edit and preview HTML without shipping a
  client-side syntax-language bundle.
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

| Registry item   | Target                        | Import                       | Purpose                                  |
| --------------- | ----------------------------- | ---------------------------- | ---------------------------------------- |
| `maily-editor`  | `components/maily/**`         | `@/components/maily`         | The `<Editor />` WYSIWYG email composer. |
| `maily-mailbox` | `components/maily/mailbox/**` | `@/components/maily/mailbox` | Optional inbox / sent / drafts view.     |
| `maily-render`  | `lib/maily-render/**`         | `@/lib/maily-render`         | Editor JSON to email-safe HTML.          |
| `maily`         | All targets above             | All imports above            | Backward-compatible full install.        |

The root `@/components/maily` barrel intentionally exports the editor only.
Import mailbox code from `@/components/maily/mailbox` so editor-only consumers
do not compile the optional mailbox surface.

## Requirements

- React 18 or 19
- TipTap 3.32-compatible (TipTap 3) extensions when supplying custom `extensions`
- Tailwind CSS v4 with standard shadcn theme tokens
- A project initialized with the shadcn CLI (`components.json` present)

The registry automatically declares its stock shadcn dependencies and adds
`@plugin "@tailwindcss/typography";` for the editor's `prose` content area.
It installs the TipTap 3 runtime itself; consumers only need to keep custom
extensions on the same major version.

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
`immediatelyRender`, `initialViewMode`, `renderPreview`, `wrapClassName`,
`toolbarClassName`, `bodyClassName`, `renderPreviewClassName`, and
`contentClassName`.

The toolbar includes a Design / Render toggle. Design mode keeps the editable
TipTap canvas active. Render mode shows a read-only iframe preview from
`editor.getHTML()` by default; pass `config.renderPreview` when your app wants to
mount its own preview component backed by `@/lib/maily-render` or a server-side
rendering endpoint.

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

## Mailbox view

`<MailboxView />` is an optional application-shell component for an
inbox / sent / drafts / spam / trash surface. It owns local folder, search,
selection, compose and draft UI state inside a shadcn
responsive list-to-message shell with a mobile Sheet menu. It does not assume a backend. Wire your own API
through the `dataSource` adapter.

```tsx
import { useEffect, useRef } from 'react';
import {
  MailboxView,
  defaultMailboxLabels,
  type MailyMailboxDataSource,
  type MailyMailboxHandle,
} from '@/components/maily/mailbox';

const dataSource: MailyMailboxDataSource = {
  listMessages: (params) => api.mail.messages(params),
  getMessage: (messageId) => api.mail.message(messageId),
  getCounts: () => api.mail.counts(),
  listContactSuggestions: ({ q, limit }) => api.contacts.search({ q, limit }),
  createDraft: (draft) => api.mail.createDraft(draft),
  updateDraft: (messageId, draft) => api.mail.updateDraft(messageId, draft),
  discardDraft: (messageId) => api.mail.discardDraft(messageId),
  // `revision` is the version the user saw; reject the send if it changed.
  sendDraft: (messageId, { revision }) =>
    api.mail.sendDraft(messageId, { revision }),
  runMessageAction: ({ messageId, action, value }) =>
    api.mail.runMessageAction(messageId, action, value),
};

export function Inbox({ userId }: { userId: string }) {
  const mailbox = useRef<MailyMailboxHandle>(null);

  // Refresh when your backend reports new mail (push, websocket, or a timer).
  useEffect(
    () => api.mail.onNewMail(() => void mailbox.current?.refresh()),
    []
  );

  return (
    <MailboxView
      ref={mailbox}
      account={{ id: userId, address: 'hello@example.com' }}
      dataSource={dataSource}
      messageActions={['archive', 'delete', 'markUnread']}
      labels={defaultMailboxLabels}
    />
  );
}
```

Maily holds no mail logic of its own. Delivery and send recovery, refresh
timing, autosave, reply/forward seeding, and which actions each folder offers
are yours:

- **Sending:** provide `sendMessage(draft)` to send a new composition directly,
  and/or `createDraft` + `sendDraft` for drafts. A failed send stays open for a
  retry; deduplicate by draft ID and revision, or by `draft.idempotencyKey`.
- **Refresh:** the mailbox does not poll unless you pass `pollIntervalMs`; call
  `refresh()` on its ref when your data changes.
- **Autosave:** off unless you pass `autosaveDelayMs` (for example `1000`).
- **Folder actions:** an array of `messageActions` is offered everywhere; pass
  a function of `{ surface, folder, labelId, searchScope, searching,
messageIds }` to decide per view, or use `defaultMailboxMessageActionsFor`
  for Gmail's folder rules. Return `{ removedFromView: true }` from
  `runMessageAction` when a message leaves the view, so the reader closes, and
  pass `folders` to choose which folders the navigation shows.
- **Reply and forward:** `createComposeSeed(kind, message, context)` builds the
  composition; `defaultMailboxComposeSeed` is the conventional default.

Recipient fields support autocomplete when the host provides contacts through
`dataSource.listContactSuggestions` or the `contactSuggestions` prop. Each
suggestion uses `{ address, displayName }` and is matched by both email address
and display name.

Reader actions are backend-agnostic and capability-gated. Reply and forward seed
the existing draft flow; favorite, archive, delete, mark unread, report, print,
download, show-original, and similar controls render only when the host supplies
both `dataSource.runMessageAction` and the exact supported ids through
`messageActions`.

Draft operations are capability-gated the same way. `createDraft`,
`updateDraft`, `sendDraft` and `discardDraft` are optional, so a read-only
mailbox omits them. Use `draftCapabilities` to withhold `create`, `edit`, `send`
or `discard` while mounted; Maily hides the controls that need them and never
calls them. Your application keeps its own roles and authorization:

```tsx
<MailboxView
  dataSource={dataSource}
  draftCapabilities={{ create: canWrite, edit: canWrite, send: canSend }}
/>
```

Without `edit`, saved drafts open read-only and can still be sent unchanged or
discarded when those operations are available. Change the prop rather than the
data source when access changes, so open compositions keep their content. See
[draft capabilities](docs/mailbox-workflows.md#draft-capabilities).

Advanced search filters are capability-gated too. Text search is always
available; enable each filter your backend implements (`from`, `to`,
`subject`, `after`, `before`, `hasAttachments`, `unread`), and Maily shows only
those controls and sends only their values to `listMessages`:

```tsx
<MailboxView
  dataSource={dataSource}
  searchCapabilities={{ from: true, subject: true, unread: true }}
/>
```

Without `searchCapabilities` the advanced-search button is hidden. Filtering
stays with your backend: Maily never filters loaded rows itself. See
[search capabilities](docs/mailbox-workflows.md#search-capabilities).

The reader displays every entry in `getMessage().attachments` below the body,
with its filename, optional MIME type, and size in bytes formatted for display.
Metadata-only attachments work without any additional handler. Empty attachment
arrays do not render a section; `hasAttachments` controls only the list paperclip.

To enable individual file downloads, provide
`dataSource.downloadAttachment({ messageId, attachment, attachmentIndex })`.
The host fetches and saves the file using its own API and authentication; return
a promise that resolves when that operation finishes. An optional `attachment.id`
can carry your backend identifier. `attachmentIndex` is the zero-based position
in the detail array, so duplicate filenames remain distinguishable. The button
shows progress, prevents duplicate requests, and allows retry after a failure.
Failures appear beside the file and call `onError(error, 'attachmentDownload')`.
This handler is separate from the `download` message action, which downloads the
whole message. Inline file previews and compose uploads are not part of this API.

`defaultMailboxLabels` is exhaustive, matching the editor translation contract:
copy it, translate every value, and pass the complete object back as `labels`.

## Font selection

Maily calls no font service on its own. Without a `fontProvider`, the editor
shows no font picker and saved fonts render with their fallback stacks. To offer
the complete Fontsource catalog, opt in on both sides:

```tsx
import { Editor, fontsourceFontProvider } from '@/components/maily';
import { fontsourceFontFaceUrl, render } from '@/lib/maily-render';

<Editor fontProvider={fontsourceFontProvider} />;

const html = await render(json, { fontFaceUrl: fontsourceFontFaceUrl });
```

The Fontsource picker fetches catalog metadata only when opened, virtualizes its
results, and loads preview WOFF2 files only for visible rows. The chosen package
version, subset, weights, fallback, and family are stored on TipTap's
`textStyle` mark, so the renderer emits version-pinned `@font-face`
declarations without querying Fontsource while an email is being sent.
Unsupported email clients use the family-specific email-safe fallback. With this
provider, the Fontsource API and jsDelivr font CDN must be permitted by the host
application's content security policy. Implement `MailyFontProvider` (and a
`fontFaceUrl` function) to use your own font service instead.

## Renderer usage

Install `@maily/maily-render` before using the server-side renderer.

```ts
import { render } from '@/lib/maily-render';

const html = await render(editorJson, {
  preview: 'Inbox preview text',
  // Optional rendered-email theme overrides.
  theme: { container: { backgroundColor: '#ffffff', maxWidth: '600px' } },
});
```

The renderer is independent of the editor's on-screen theme and produces the final
email-client-safe HTML from the saved JSON. It loads no web font by default
(`'Arial', sans-serif`) and leaves output policy to you through `render()`
options:

- `fontFaceUrl`: `@font-face` URLs for fonts chosen in the editor (for example
  `fontsourceFontFaceUrl`); without it, fonts use their fallback stacks.
- `linkAttributes`: attributes for every link (default `target="_blank"` and
  `rel="noopener noreferrer"`).
- `meta` and `htmlProps`: replace or add `<head>` meta tags and `<html>`
  attributes.

## Upgrading an existing full install

Breaking changes and migration notes for each release are in
[CHANGELOG.md](CHANGELOG.md).

The shadcn CLI overwrites current registry files but does not delete files removed
from a newer item. After upgrading, remove these obsolete private primitive or icon
copies if they still exist and are not locally modified:

```text
components/maily/editor/components/popover.tsx
components/maily/editor/components/ui/divider.tsx
components/maily/editor/components/ui/tooltip.tsx
components/maily/editor/components/icons/border-color.tsx
components/maily/editor/components/icons/grid-lines.tsx
components/maily/editor/components/icons/text-direction-icon.tsx
```

This release removes two files; delete them if they still exist. Nothing
imports them, and the first one's `@ts-ignore` fails the stock shadcn lint:

```text
components/maily/editor/extensions/tailing-node/tailing-node.ts
components/maily/mailbox/send-recovery.ts
```

Its installs no longer depend on `tippy.js`, `uuid`, `clsx`, `tailwind-merge` or
`react-resizable-panels`; remove them from your `package.json` if nothing else
in your application imports them.

When intentionally moving from the legacy full item to `maily-editor`, also remove
`components/maily/mailbox/**` and `lib/maily-render/**` after confirming the
application no longer imports them.

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
