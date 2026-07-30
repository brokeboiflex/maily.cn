# shadcn alignment boundary

This document records the final component boundary for the shadcn registry build.
It distinguishes stock host primitives from Maily-specific editor composites so a
future change does not accidentally reintroduce a private shadcn clone.

## Distribution boundary

The generated registry exposes four items:

| Item            | Contents                                              |
| --------------- | ----------------------------------------------------- |
| `maily-editor`  | Editor source and editor-only dependencies            |
| `maily-mailbox` | Optional mailbox source; depends on `maily-editor`    |
| `maily-render`  | Server renderer and renderer-only dependencies        |
| `maily`         | Backward-compatible full install containing all three |

The build derives npm dependencies and `registryDependencies` from each item's
emitted imports. The recommended editor install therefore does not carry mailbox
layout primitives or server-rendering packages.

## Host-owned primitives

The registry excludes the package fallbacks for these modules, rewrites their
imports to the consumer aliases, and declares the corresponding stock items in
`registryDependencies`:

| Maily use                                                    | Host shadcn item         |
| ------------------------------------------------------------ | ------------------------ |
| Actions and icon triggers                                    | `button`                 |
| Text, URL, number, and multiline fields                      | `input`, `textarea`      |
| Link Card labels                                             | `badge`                  |
| Independent and grouped formatting state                     | `toggle`, `toggle-group` |
| Help and control descriptions                                | `tooltip`                |
| Menu and form dividers                                       | `separator`              |
| Compact option controls                                      | `select`                 |
| Keyboard hints                                               | `kbd`                    |
| Node actions and “Turn into”                                 | `dropdown-menu`          |
| Alignment, direction, color, link, and configuration flyouts | `popover`                |
| HTML code/preview state                                      | `tabs`                   |
| Icon-bearing compact fields                                  | `input-group`            |
| Variable suggestions                                         | `command`                |

The package copies are Radix-based standalone fallbacks only. A registry install
always uses the consumer's actual shadcn files, including their selected Radix or
Base UI implementation, radius, variants, focus treatment, motion, and theme
tokens.

The optional `MailboxView` uses the same host-owned `button`, `input`,
`textarea`, `badge`, `separator`, `dropdown-menu`, `popover`, `command`,
`resizable`, and `scroll-area` primitives. It is a data-adapter component:
mailbox state and layout live in Maily source, while accounts, messages, drafts,
delivery, polling data, recipient contact suggestions, and optional message
actions come from the consumer's backend adapter.

## Intentional Maily composites

These are not replacement primitives:

- `Select` adds an editor label, optional icon, and options mapping around stock
  shadcn `Select`. It deliberately does not render Tooltip around its trigger in
  floating editor surfaces. It uses only props shared by current Radix and Base
  items; controlled open-state callbacks restore editor focus without passing
  Radix-only autofocus props through the host primitive.
- `FontSizePicker` uses the same bubble-menu pattern as alignment and direction:
  stock Button + Popover + ToggleGroup. It avoids Radix Select inside the text
  bubble because that primitive traps focus and intercepts outside pointer events
  while open.
- `ColorPicker` combines `react-colorful` with stock Button, Popover, Separator,
  and Tooltip.
- `LinkInputPopover` combines stock Toggle, Popover, and InputGroup with Maily
  variable completion.
- `InputAutocomplete` positions Maily variable suggestions in a viewport-aware
  portal; the suggestions themselves use stock Command.
- `MailboxView` combines a CRM/Veyme-style resizable folder rail, searchable
  message list, Gmail-like reader actions, reply/forward compose seeding,
  compose form, and recipient autocomplete around caller-provided
  mailbox/contact/action data. It is application chrome, not an email-rendering
  primitive. Recipient autocomplete uses the shared `PopoverTrigger` contract
  and restores input focus from Maily-owned state rather than depending on the
  Radix-only `PopoverAnchor` or autofocus event props.
- Bubble menus and the hierarchical slash menu are TipTap/ProseMirror integration
  surfaces. Their controls are stock shadcn primitives, while positioning and
  editor command routing remain Maily-specific.
- Node views, drag/resize affordances, and email-content previews represent the
  document being authored rather than application-chrome primitive substitutes.

## Icon boundary

All generic Lucide JSX in registry output passes through `IconPlaceholder` and is
resolved by shadcn to the icon library selected in `components.json`. The build
fails when a generic icon has no complete Lucide, Tabler, Hugeicons, Phosphor, and
Remix mapping.

Five custom SVGs intentionally remain: three miniature header-layout diagrams and
the margin/padding box-model diagrams. They convey Maily document structures for
which a generic action icon would be less accurate. They use `currentColor` and
therefore still inherit the host text color.

## Interaction rules

- A stateful control uses Toggle, ToggleGroup, Tabs, Popover, or DropdownMenu;
  state is never simulated with a manually assigned `data-state`.
- Application chrome uses host-owned shadcn primitives before raw HTML. Run
  `pnpm shadcn:audit` after UI changes; the audit fails on raw interactive
  controls, handmade `border-input` input chrome, simulated `data-state`, and
  missing `registryDependencies` for generated `@/components/ui/*` imports.
- Tooltip composition uses a neutral non-interactive wrapper when necessary so
  Tooltip state cannot overwrite another primitive's trigger state.
- Icon-only buttons have translated accessible names.
- Popovers and menus are portalled and viewport-capped; the editor toolbar wraps.
- User-facing strings come from the exhaustive `MailyLabels` dictionary.

## Release verification

Run `pnpm registry:consumer-test` to regenerate the registry and test clean,
current shadcn consumers. The automated matrix:

- installs editor, mailbox, and renderer as granular items in a fresh Radix app
  and production-builds the mounted editor;
- installs and strictly production-builds the editor in a fresh Base UI app;
- adds the optional Base mailbox and renderer and rejects every diagnostic except
  the current upstream `scroll-area.tsx` unused React import, then rebuilds the
  complete fixture with unused-import checking relaxed;
- launches that complete Base fixture and verifies ToggleGroup roving focus and
  pressed state, Popover focus/Escape behavior, mailbox rich-compose switching,
  nested-interactive safety, and zero console/page errors in Chromium.

No diagnostic in Maily source is accepted. Run `pnpm shadcn:audit`, the package
checks, and the playground Chromium suite as the remaining release gates. The
Chromium suite covers host theme hover tokens, narrow viewport overflow, Tabs
state, ToggleGroup roving focus, toolbar link composition, and
nested-interactive-DOM regressions.

The custom HTML node intentionally uses TipTap's plain `CodeBlock` extension.
Its Maily code/preview tabs, variables, commands, and renderer do not require
Lowlight or Highlight.js, so registry consumers do not receive syntax-language
bundles for that block.

The icon release gate uses genuinely initialized shadcn consumers—not a changed
`iconLibrary` value on an existing Lucide app—and mounts and production-builds the
editor with Lucide, Tabler, Hugeicons, Phosphor, and Remix. This catches invalid
icon names, library-specific JSX transforms, and missing selected-library packages.
