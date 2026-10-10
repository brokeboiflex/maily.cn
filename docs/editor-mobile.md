# Responsive editor

The mobile interaction follows the supplied Notion app screenshots: a bottom
toolbar, a **+** block picker with grouped two-column buttons, and an **Aa**
formatting panel. The block list remains Maily's caller-configurable email block
list, including nested presets and custom renderers. Notion-only features are
not added.

Toolbar controls use library icons, including the Aa formatting glyph, with
consistent 24px icons inside 44px touch targets. Button and Toggle corner
shapes come from the host primitives without Maily radius overrides. The toolbar
container uses the host radius token (`rounded-lg`) with an 8px inset, so zero-radius
themes remain square. The dock and panel share the same horizontal gutter. Icon sizes live on the
icons themselves so consumer Button defaults do not shrink individual actions.
The registry maps these icons to the consumer's selected icon library.

The editor adapts to its own container below 640px, or below 1024px with a coarse
primary pointer. Resizing does not recreate the TipTap editor or change saved
content. Desktop keeps its existing toolbar, slash suggestions and drag handle.
Compact editing removes the drag gutter and replaces slash suggestions with the
block picker. Email columns stack in the editing surface; their saved widths and
the Render view are unchanged.

The mobile toolbar appears for the active editor. Its bottom offset
follows `VisualViewport` resize/scroll events and the safe-area inset. Opening a
picker blurs the writing surface to release the software keyboard; the selected
position is retained. A host `Collapsible` expands beneath one persistent toolbar. The fixed accessory
translates as one surface over 200ms and honors reduced motion; it never replaces
the toolbar or autofocuses a new trigger. Repeated active-panel requests are no-ops,
including nested navigation and the captured editor action. Focus/blur use the
mounted ProseMirror view and DOM synchronously, so a delayed TipTap blur cannot
clear a selection made after a quick reopen. Close collapses the
panel first; closing the collapsed dock dismisses the accessory. Its controls use host `Button`, `Toggle`, `Tooltip` and
existing formatting primitives. Node-specific settings reuse the same controls
as desktop, including button/link-card settings. Block actions derive their
target from the current selection, replacing hover-only duplicate/delete and
dragging with duplicate/delete/move-up/move-down actions.

Deferred insertion and block actions use the provider's document/selection
ownership guard and an instance-local channel. An intervening document or
selection change invalidates the old insertion target. Opening a toolbar panel
starts a separate undo event from prior typing. Nested groups navigate within
the panel without inserting slash text. All new labels are in `defaultLabels`;
complete consumer translations must include the `mobile.*` and
`placeholder.mobile` keys.

References inspected:

- User-supplied Notion iPhone editor screenshots (insertion panel open).
- [Notion mobile editing](https://www.notion.com/en-us/help/workspaces-on-mobile).
- [VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport).
- [shadcn Collapsible](https://ui.shadcn.com/docs/components/collapsible).

Validation includes real TipTap block mutation tests and clean Radix/Base
consumer browser checks for mobile insertion, undo, nested navigation, touch
targets, slash suppression, overflow and breakpoint continuity. Browser viewport
checks do not establish real iOS/Android software-keyboard behavior; that remains
a physical-device validation requirement.

The drag handle renders through a React portal into its plugin-owned element.
The plugin reparents that element, so it must not be a React-managed child in the
editor tree. This allows breakpoint teardown without a React `removeChild` crash.

The panel uses native scrolling with a thin scrollbar. Adding the current Base
ScrollArea would break the strict editor-only consumer gate on its upstream
unused React import; the host primitive is not patched and the gate stays strict.
