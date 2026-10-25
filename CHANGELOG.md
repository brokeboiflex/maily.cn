# Changelog

## Unreleased

Bump `@maily-to/core`, `@maily-to/render` and `@maily-to/shared` to new minor
versions when releasing: this release contains breaking changes for 0.x
consumers.

Maily now holds no business logic of its own. Delivery, recovery, refresh
timing, mail conventions, folder rules, font services and link policy belong to
the host and are supplied through props, callbacks and the data source; Maily's
previous behaviour is exported as opt-in defaults where it is useful.

### Breaking changes

Mailbox:

- **Send recovery moved to the host.** Maily no longer keeps pending-send
  receipts in `sessionStorage`, probes storage, refuses a Send while another
  send's outcome is unknown, or holds the mailbox on a draft. The
  `recoveryScope` prop is removed, and Send no longer needs an account ID. A
  failed send keeps the composition open and editable for a retry; the host
  deduplicates by draft ID and revision, or by `idempotencyKey`.
- **Draft callbacks are optional.** `createDraft`, `updateDraft`, `sendDraft`
  and `discardDraft` may be omitted, and `draftCapabilities` withholds any of
  them at runtime. Controls that need a missing operation are hidden. See
  [draft capabilities](docs/mailbox-workflows.md#draft-capabilities).
- **`sendDraft(messageId, { revision })`** receives the revision it delivers. A
  saved draft without unsaved changes is sent without calling `updateDraft`
  first.
- **Autosave is off by default.** Pass `autosaveDelayMs` (for example `1000`)
  to save automatically.
- **Polling is off by default** (`pollIntervalMs` was 60000). Call `refresh()`
  on the mailbox ref when the host's data changes, or pass `pollIntervalMs`.
- **No automatic folder changes:** Save draft, autosave and Send no longer
  switch to Drafts or Sent, and a search stays in the folder in view unless the
  host sets an all-mail `searchScope`. A search no longer clears the selected
  label.
- **`messageActions` as an array is shown in every folder,** gated only by the
  host's action handlers. Pass a function of the folder, label, search and
  selection to choose per context; `defaultMailboxMessageActionsFor` applies
  the previous Gmail folder rules.
- **The reader closes only when the host says so:** an action closes it when
  `runMessageAction` returns `{ removedFromView: true }` (for example Archive
  in Inbox); otherwise the reader stays open and re-reads the message. Maily
  no longer closes it after archive, delete, restore, spam and report actions
  on its own.
- **`onSearchScopeChange` and `defaultSearchScope` are removed:** Maily never
  changes the search scope, so `searchScope` alone sets it (default
  `'folder'`).
- **Advanced search filters are off by default.** Enable each filter your
  backend supports with `searchCapabilities` (`from`, `to`, `subject`, `after`,
  `before`, `hasAttachments`, `unread`). Only enabled filters get a control,
  the advanced-search button is hidden when none is enabled, and disabled
  values, including ones in `searchFilters` or `defaultSearchFilters`, are
  never sent to `listMessages`. Text search is unchanged. To keep every filter:
  `searchCapabilities={{ from: true, to: true, subject: true, after: true,
before: true, hasAttachments: true, unread: true }}`. See
  [search capabilities](docs/mailbox-workflows.md#search-capabilities).
- **Smaller mailbox changes:** a host's undo token for `deleteForever` is
  offered like any other; label names have no length limit of Maily's own; the
  `react` action sends no value.
- **Read-only drafts render as text** (recipients, subject and body), not as
  disabled fields.
- **Saved drafts whose attachments have no `id` open read-only.** They were
  editable, and saving dropped those attachments. Return attachment IDs from
  `getMessage` to keep such drafts editable.
- **`createDraft` and `sendMessage` input has an `idempotencyKey`,** stable for
  retries of the same content. A host that validates draft input with a strict
  schema must accept the field.
- **`onError` action names:** label reads report `'labels'` and label changes
  `'labelMutation'` (both were `'messageAction'`), bulk actions `'bulkAction'`,
  Undo `'undo'`, optional count failures `'counts'` (was `'refresh'`, and no
  longer clears a loaded list). Contact suggestion failures
  (`'contactSuggestions'`) are new.
- **`MailyMailboxLabels` has eleven new required keys:** `compose.viewDraft`,
  `compose.saveUnavailable`, `compose.attachmentsReadOnly`,
  `compose.forwardFrom`, `compose.forwardTo`, `compose.forwardSubject` (the
  forward header, which was fixed English), `message.htmlBody` (the accessible
  name of an HTML message body, which was the fixed text `message-html`),
  `errors.bulkAction`, `errors.undo`, `errors.labels` and
  `errors.labelMutation`. Complete translations must add them.
- **`MailboxView` is a `forwardRef` component**; its ref is a
  `MailyMailboxHandle`.

Editor:

- **No font service without a provider.** The font picker and document font
  loading use the new `fontProvider` prop. Without it there is no font picker
  and no request to Fontsource or jsDelivr; saved fonts show their fallback
  stacks. Pass `fontProvider={fontsourceFontProvider}` for the previous
  behaviour. `FontFamilyPicker` requires a `provider`.
- **Images no longer write their own size.** Loading an image never writes
  `width`, `height` or `aspectRatio` into the document; the renderer handles
  `auto`.
- **New links save `rel="noopener noreferrer"`** (no `nofollow`).
- **Seeds and defaults:** `DEFAULT_PLACEHOLDER_URL` is empty (it was
  `https://maily.to/`), the inline image seed has no source, and the header
  seed's date uses the runtime locale.
- **`MailyLabels` has one new required key,** `buttonMenu.text`: the
  accessible name and hint of the button text field, which showed the link
  placeholder URL.
- **A read-only editor shows no formatting toolbar.** With `editable={false}`
  the menu bar keeps only the Design/Render switch.
- **`DragHandle`** takes `placement`, `offset` and `zIndex` instead of
  `tippyOptions`: Tippy was replaced by Floating UI.
- **Link popovers commit once** (Enter, a chosen suggestion, or closing the
  popover, including Escape and an outside click) instead of applying the URL
  on every keystroke.
- **`SlashCommandExtension`** uses its own `SlashCommandPluginKey` instead of
  TipTap's default suggestion key. Code that reads or exits the slash
  suggestion through the default key must use `SlashCommandPluginKey`.
- **`MailyKitOptions`** types each node's options (they were `Partial<{}>`),
  so unknown keys in those object literals are type errors.
- **Node option types:** `FooterOptions.HTMLAttributes` and
  `SpacerOptions.HTMLAttributes` are `Record<string, unknown>` (were
  `Record<string, any>`); narrow a value before using it.
- **`VariableListProps`** (from `@maily-to/core/extensions`) no longer
  includes `SuggestionOptions`; it is `items`, `command` and `editor`.
- **Bubble menus need an editor:** `EditorBubbleMenuProps.editor` is required
  and non-null.

Renderer and shared:

- **No third-party font by default.** `DEFAULT_FONT` is
  `'Arial', sans-serif` with no web font (it loaded Inter from rsms.me),
  `theme.font: null` emits no font rule, and a host `font` replaces the
  default instead of inheriting its web font. Granular fonts emit
  `@font-face` only with the new `fontFaceUrl` option;
  `fontsourceFontFaceUrl` restores the jsDelivr URLs.
- **Link attributes come from the renderer:** every anchor, including buttons,
  uses the `linkAttributes` option (default `target="_blank"`,
  `rel="noopener noreferrer"`); `target` and `rel` saved on link marks are
  ignored.
- **No English placeholder text in emails:** an unset `alt` renders as `""` and
  an unset `title` is omitted (they were "Logo", "Image" and "Link Card").
- **Variables in HTML blocks are HTML-escaped.** A host that relied on inserting
  raw markup through a variable must put that markup in the block itself.
- **`setMetaTags` replaces** a default tag with the same name, `httpEquiv`,
  `property`, `charSet` or title instead of adding a duplicate.
- **`getAllLinks`** also returns links nested in sections, columns and repeats,
  and image, inline image and link card links.
- **Node engines:** `@maily-to/core` requires Node 22 (for `cn`),
  `@maily-to/render` Node 22.12 (for `juice` 12).
- **`@maily-to/render`** declares `@tiptap/core`, `@tiptap/pm` and `csstype` as
  dependencies and `react-dom` as a peer; its type declarations no longer
  inline copies of them.
- **`@maily-to/render` types:** `PayloadValue` is `object | boolean` (was
  `Record<string, any> | boolean`), so narrow a payload before indexing it;
  `MarkType` is TipTap's own mark type.
- **`@maily-to/core/style.css`** is no longer exported: it pointed at a file the
  package never built.
- **Published JavaScript uses ES2022 syntax** (`@maily-to/core` emitted ES2015).
- **`@maily-to/render` and `@maily-to/shared` are ES module packages**
  (`"type": "module"`); their CommonJS builds are `dist/index.cjs` (were
  `dist/index.js`). Imports through the package name are unaffected; only a
  direct path to `dist/index.js` breaks.
- **`@maily-to/shared` types:** `getVariableValue` takes
  `string | number | null | undefined` and `--mly-*` style properties are
  `string | number` (both were `any`). `EditorThemeOptions` is a type alias
  of `BaseThemeOptions` (was an empty interface), so declaration merging can no
  longer extend it.

### Rendered email

`@maily-to/render` imports its email components and `render` from
`react-email` 6, which replaces the deprecated `@react-email/components` (was
0.5) and re-exports `@react-email/render` (was a direct dependency at 1).
`react-email` also carries its preview CLI's dependencies (esbuild,
tailwindcss, socket.io and others), so installs are larger. `juice` moved to 12
and `node-html-parser` to 9.

The same document now renders:

- with `font-family: 'Arial', sans-serif` and no Inter `@font-face`;
- without React's `<link rel="preload">` image hints and without a duplicate
  `x-apple-disable-message-reformatting` meta tag;
- with a `<title>` holding the preview text;
- with `margin: 0` and `padding: 0` on `<body>`, and `dir`/`lang` on
  `<body>` and its outer cell;
- with section padding on the inner `<td>` instead of the `<table>`, which
  Outlook honours;
- with `border-color: transparent` on `<hr>` and a `px` unit on the Outlook
  button text raise;
- with `alt=""` on images without alt text, no `nofollow`, and `target` on the
  link card title;
- with React's comment markers and the preview's filler characters changed.

Images, logos and inline images render nothing instead of `<img src="">` when
their source is unset or blank, or when a payload variable resolves to a boolean
or a plain object; strings, numbers and `URL` objects render as the source. A
snapshot of every block's output now guards later changes.

### Added

- Mailbox: `searchCapabilities`, with the `MailyMailboxSearchCapabilities` and
  `MailyMailboxSearchFilter` types and `MAILBOX_SEARCH_FILTERS`.
- Mailbox: `folders` chooses which folders the navigation shows;
  `sendMessage(draft)` sends a new composition without draft storage;
  `autosaveDelayMs`; a `MailyMailboxHandle` ref with `refresh()`;
  `createComposeSeed` with `defaultMailboxComposeSeed`; `messageActions` as a
  function with `defaultMailboxMessageActionsFor`; `getMailboxReplyAllRecipients`
  is exported.
- Editor: `fontProvider` with the opt-in `fontsourceFontProvider`, and the
  `MailyFontProvider` types.
- Renderer: `render()` accepts `meta`, `htmlProps`, `fontFaceUrl` and
  `linkAttributes`; `Maily` has `setFontFaceUrl` and `setLinkAttributes`;
  `fontsourceFontFaceUrl` and `DEFAULT_LINK_ATTRIBUTES` are exported.
- `SlashCommandList` is exported from `@maily-to/core/extensions`.
- `MailyContextType.editable` tells custom NodeViews whether the editor accepts
  edits. It is read through `useMailyContext` from `editor/maily-context.ts` in
  registry installs; the npm entries do not export the context.

### Fixed

- A renderer's theme no longer leaks into later renders in the same process.
- Variable values inserted into an HTML block can no longer inject markup.
- `MailyKitOptions` for repeat, section, columns, column, button, spacer, logo
  and image are applied (they were ignored).
- The image and logo file pickers accept only the host's `allowedMimeTypes`,
  like drops and pastes.
- Link tracking covers nested buttons and image, inline image and link card
  links.
- Rendering and the load-time migration no longer mutate the caller's JSON.
- The defects recorded in
  [the post-repair audit](docs/idempotence-postrepair-audit-2026-10-10.md)
  (N01–N14). Its recovery-policy gap no longer applies: send recovery belongs
  to the host.
- Typing a URL into a link popover no longer moves focus into the document and
  replaces the selected text.
- The CommonJS build of `@maily-to/core` loads.
- Autosave no longer disables the compose fields, which dropped focus and
  keystrokes.
- Changing the editor's `editable` prop after it is created now applies,
  including to node views (drag handles, image resizing, button and link card
  settings).
- A read-only editor no longer offers variable settings, bubble menus (including
  one that was open when the editor became read-only), or a switch from an empty
  HTML block to code. Mounting it or changing `editable` no longer appends a
  trailing paragraph or calls `onUpdate`.
- A saved draft with attachments that have no `id` stays read-only when the
  reader selection changes or Undo re-reads the message, so Save and Send keep
  those attachments. A draft that becomes read-only lists the attachments it
  was last saved with.
- Attachments handed to `sendMessage` are never discarded by Maily, even when
  the send fails with an unknown outcome. A composition handed to
  `sendMessage` never becomes a draft (no Save draft or autosave), so retrying
  it goes through `sendMessage` again, with the same `idempotencyKey` while
  its content is unchanged, and cannot become a second message.
- A `refresh()` kept after the mailbox unmounts no longer calls the host.
- The advanced-search form no longer closes when a field, checkbox or label in
  it is clicked. It was rendered inside the search bar's `InputGroupAddon`,
  whose click handler moved focus to the search input.
- A pasted or dropped image redone while the host discards its upload no longer
  comes back with a revoked `blob:` source.
- The Render preview is built only while it is shown: Design mode no longer
  renders the whole document on every change, and `config.renderPreview` runs
  only in Render mode. Node views in the preview read `editable: false` from
  `MailyContext`.
- Suggestion popups stay inside the viewport and close when the editor is
  destroyed.
- The HTML block preview runs no authored scripts and fits its content height.
- Recipient fields parse quoted display names and treat an unclosed quote,
  comment or bracket as text.
- A `null` item in a render `repeat` payload no longer crashes rendering.

### Registry installs

- Maily imports `cn` from the `cn` package, like current stock shadcn items.
- Maily's `Select` composite no longer takes `tooltip`: a Tooltip around its
  trigger can detach on floating editor surfaces. Its `label` names the
  trigger.
- `shadcn add --overwrite` replaces every file in place. Two files were
  removed: `editor/extensions/tailing-node/tailing-node.ts` (nothing imported
  it; StarterKit's trailing node runs) and `mailbox/send-recovery.ts` (send
  recovery moved to the host). `--overwrite` leaves installed copies in place;
  delete them.
- Installs no longer need `tippy.js`, `uuid`, `clsx`, `tailwind-merge` or
  `react-resizable-panels`.
- `editor/provider.tsx` still re-exports `useMailyContext`, `MailyContext`,
  `MailyContextType` and `DEFAULT_PLACEHOLDER_URL`, which moved to
  `editor/maily-context.ts`.
