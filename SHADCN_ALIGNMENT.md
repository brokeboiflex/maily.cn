# shadcn alignment boundary

This document records the final component boundary for the shadcn registry build.
It distinguishes stock host primitives from Maily-specific editor composites so a
future change does not accidentally reintroduce a private shadcn clone.

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
| Compact native option controls                               | `native-select`          |
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

## Intentional Maily composites

These are not replacement primitives:

- `Select` adds an editor label, optional icon, and Tooltip around stock
  `NativeSelect`.
- `ColorPicker` combines `react-colorful` with stock Button, Popover, Separator,
  and Tooltip.
- `LinkInputPopover` combines stock Toggle, Popover, and InputGroup with Maily
  variable completion.
- `InputAutocomplete` positions Maily variable suggestions in a viewport-aware
  portal; the suggestions themselves use stock Command.
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
- Tooltip composition uses a neutral non-interactive wrapper when necessary so
  Tooltip state cannot overwrite another primitive's trigger state.
- Icon-only buttons have translated accessible names.
- Popovers and menus are portalled and viewport-capped; the editor toolbar wraps.
- User-facing strings come from the exhaustive `MailyLabels` dictionary.

## Release verification

Run the package checks, regenerate the registry, install it into fresh Radix and
Base UI consumers, then run the playground Chromium suite. The suite covers host
theme hover tokens, narrow viewport overflow, Tabs state, ToggleGroup roving focus,
toolbar link composition, and nested-interactive-DOM regressions.

The icon release gate uses genuinely initialized shadcn consumers—not a changed
`iconLibrary` value on an existing Lucide app—and mounts and production-builds the
editor with Lucide, Tabler, Hugeicons, Phosphor, and Remix. This catches invalid
icon names, library-specific JSX transforms, and missing selected-library packages.
