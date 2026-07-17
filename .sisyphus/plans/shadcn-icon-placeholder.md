# shadcn IconPlaceholder Registry — Phase 2

## TL;DR

> **Quick Summary**: Make the shadcn registry build pipeline emit `<IconPlaceholder>` JSX (detectable by shadcn's icon transformer) instead of hardcoded lucide-react imports — but ONLY for icons used as JSX. Icons passed as component references (`icon: BoldIcon`) and type imports (`LucideIcon`) are intentionally preserved as lucide-react and documented, because converting them would break the `BubbleMenuItem` component-type contract.
>
> **Deliverables**:
> - `scripts/icon-map.mjs` — verified mapping table (lucide icon → 5 library equivalents)
> - `scripts/build-shadcn-registry.mjs` — fixed, extended, imports iconMap, handles 3 usage categories, emits a report
> - Regenerated `registry/default/maily/**` + `registry.json`
> - An icon-conversion report (converted / preserved / unmapped)
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 2 waves
> **Critical Path**: Task 1 (icon-map) ─┐
>                                    ├→ Task 3 (regenerate+validate) → F1–F4
>           Task 2 (build script)  ─┘

---

## Context

### Original Request
Implement Phase 2: make the shadcn registry output use IconPlaceholder-style icon placeholders instead of hardcoded lucide-react imports, via the registry build pipeline (not manual file edits). Support 5 icon libraries: lucide, tabler, hugeicons, phosphor, remixicon. Be conservative — a working shadcn install is the priority.

### Interview Summary
This was a research-driven plan (no interactive interview needed — the spec was highly prescriptive). Research was performed directly via Read/Grep/Glob because the explore subagent infrastructure was unavailable (`ProviderModelNotFoundError`).

**Key Research Findings**:
1. **Build script is 80% implemented.** `scripts/build-shadcn-registry.mjs` already contains `buildIconPlaceholder()`, `transformLucideIconsToPlaceholders()`, the IconPlaceholder import constant, and all 5 icon libraries in `iconLibraryDeps`. But it has blocking bugs.
2. **`iconMap` is referenced (lines 75, 142) but NEVER DEFINED** → the script crashes with `ReferenceError` before producing any output.
3. **Typo** on line 100: `mapped.lucene ?? mapped.lucide` — the `lucene` key doesn't exist; works only via `??` fallback.
4. **`type LucideIcon` imports break the transform** — treated as an icon name to look up, which throws.
5. **THREE categories of lucide usage** (the central architectural insight):
   - **JSX self-closing** (`<Icon className="..." />`): CONVERTIBLE. Used in block definitions like `icon: <Text className="mly:h-4 mly:w-4" />`.
   - **Value reference** (`icon: BoldIcon`): NOT convertible. 32 occurrences in 8 files. The icon is passed as a component TYPE to `BubbleMenuButton` (`icon?: LucideIcon`), which renders `<Icon />` internally. Replacing with `<IconPlaceholder/>` would be a type mismatch (element vs component).
   - **Type import** (`LucideIcon`): NOT convertible. 6 files use it as a TypeScript type.
6. **~75 unique lucide icons** across `packages/core/src`. Custom local icons (`LtrIcon`, `LogoWithTextHorizonIcon`, `BorderColor`, etc.) must NOT be touched.
7. **Renderer is safe**: `packages/render/src` and `packages/shared/src` do NOT import lucide-react. No deep imports (`lucide-react/X`) exist.
8. **registry.json**: exactly ONE item named `maily`, type `registry:block`. `lucide-react@^0.483.0` in deps. ✓

### Gap Analysis (self-performed — Metis unavailable)
**Guardrails set**:
- lucide-react is a PERMANENT dependency (value-referenced + type icons cannot be eliminated without a large source refactor of `BubbleMenuItem`). This is accepted per the user's "intentionally preserved" clause.
- Icons that cannot be confidently mapped to ALL 5 libraries stay as lucide + are documented.
- The transform is per-file (already the case) — an icon used as JSX in file A and as value in file B is converted in A, preserved in B.

**Edge cases addressed**:
- `"use client"` directive: IconPlaceholder import must be inserted AFTER any directive, not before.
- Mixed usage in same file (icon used as BOTH JSX and value): convert JSX occurrences to IconPlaceholder AND keep the import for the value reference.
- Dead imports (icon imported but unused after conversion): strip.

---

## Work Objectives

### Core Objective
Produce a working shadcn registry that, when installed via `pnpm dlx shadcn@latest add brokeboiflex/maily.cn/maily`, emits icon-library-native icons for all JSX-rendered icons, while preserving lucide-react for component-reference and type usages.

### Concrete Deliverables
- `scripts/icon-map.mjs` (new) — verified mapping data
- `scripts/build-shadcn-registry.mjs` (modified) — fixed + extended
- `registry/default/maily/**` (regenerated)
- `registry.json` (regenerated)
- An icon conversion report (printed to stdout during `registry:build` + saved as `.sisyphus/evidence/icon-conversion-report.md`)

### Definition of Done
- [ ] `pnpm registry:build` exits 0 with no `ReferenceError`
- [ ] `registry.json` contains exactly ONE item named `maily`
- [ ] Generated renderer files import from local `./shared` paths (unchanged)
- [ ] Generated core files contain `<IconPlaceholder` where JSX icons were converted
- [ ] Generated core files contain ZERO `lucide-react` imports for successfully-mapped JSX-only icons
- [ ] Generated core files RETAIN `lucide-react` imports for value-referenced + type icons (intentional)
- [ ] Build report lists: converted icons, preserved icons, unmapped icons
- [ ] `pnpm build` (turbo) succeeds if the environment supports it

### Must Have
- `iconMap` defined and imported by the build script (currently missing → crash)
- `type LucideIcon` imports preserved (not treated as convertible icons)
- Value-referenced icons (`icon: X`) preserved as lucide-react imports
- Props preserved on conversion: `className`, `size`, `strokeWidth`, `aria-hidden`, and any other props present
- IconPlaceholder import module specifier contains the substring `icon-placeholder`
- Per-file classification (JSX vs value vs type) at build time
- Aliased imports (`X as Y`) fail-closed with a clear error (no silent mis-transform) — current behavior, keep it
- A printed + saved report of what was converted / preserved / unmapped

### Must NOT Have (Guardrails)
- **DO NOT** refactor `BubbleMenuItem.icon` from `LucideIcon` to `ReactNode` — this is a large source change across many files, explicitly out of scope ("keep packages/core/src as source of truth unless clearly safer")
- **DO NOT** touch `packages/render/src` or `packages/shared/src` — they don't import lucide-react and must not be affected
- **DO NOT** change package names, workspace structure, or the registry item name/count
- **DO NOT** remove `lucide-react` from `registry.json` dependencies — it is intentionally retained
- **DO NOT** convert local custom icons (`LtrIcon`, `RtlIcon`, `LogoWithTextHorizonIcon`, `BorderColor`, `GridLines`, `MarginIcon`, `PaddingIcon`, etc.) — these are NOT lucide-react imports
- **DO NOT** guess icon mappings — every mapping in `iconMap` must be verified against the target library's official catalog; uncertain icons are omitted from `iconMap` (left as lucide)
- **DO NOT** use AST libraries unless necessary — the current regex approach works for the patterns present; switching to AST is scope creep
- **DO NOT** change the registry item `type` from `registry:block`
- **DO NOT** add the IconPlaceholder import BEFORE a `"use client"` / `"use strict"` directive
- **NO** `as any`, `@ts-ignore`, `console.log` in the final build script (logging via the report is fine)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: YES (vitest@^3.0.2) — but only for package-level tests, NOT for the build script
- **Automated tests**: NO unit tests for the build script (adding test infra for a string-transform script is scope creep). Verification is via agent-executed QA scenarios (run the build, grep the output, validate JSON).
- **Framework**: N/A for this task

### QA Policy
Every task includes agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-*.{ext}`.
- **Build script changes**: Run `node scripts/build-shadcn-registry.mjs`, check exit code, grep output files
- **Registry validation**: Parse `registry.json` as JSON, assert structure
- **Icon conversion verification**: Grep generated files for `IconPlaceholder`, `lucide-react`, count occurrences

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — 2 parallel, independent):
├── Task 1: Research + build verified icon mapping table → scripts/icon-map.mjs [deep]
└── Task 2: Refactor build-shadcn-registry.mjs (fix bugs, 3-category handling, report) [deep]

Wave 2 (After Wave 1 — regenerate + validate):
└── Task 3: Run registry:build, validate output, produce summary report [unspecified-high]

Wave 3 (After Wave 2 — optional fixture):
└── Task 4: (Best-effort) shadcn add fixture test with lucide + tabler iconLibrary [unspecified-high]

Wave FINAL (After Task 3 — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review [unspecified-high]
├── Task F3: Real manual QA (run build, grep outputs, verify JSON) [unspecified-high]
└── Task F4: Scope fidelity check [deep]
→ Present results → Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1    | —         | 3      |
| 2    | —         | 3      |
| 3    | 1, 2      | F1–F4, 4 |
| 4    | 3         | —      |
| F1–F4| 3         | —      |

### Agent Dispatch Summary

- **Wave 1**: Task 1 → `deep`, Task 2 → `deep`
- **Wave 2**: Task 3 → `unspecified-high`
- **Wave 3**: Task 4 → `unspecified-high`
- **FINAL**: F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. Research + build verified icon mapping table (`scripts/icon-map.mjs`)

  **What to do**:
  - Scan `packages/core/src` for ALL named imports from `lucide-react`. Build the complete set of unique icon names. (The full import list is documented in the References section below — use it as the authoritative inventory; verify with grep.)
  - For EACH unique icon name, classify its usage across the codebase into one of:
    - **JSX-convertible**: appears ONLY as `<IconName ... />` (self-closing JSX) in every file where it's imported. These need mapping.
    - **Value-referenced**: appears as `icon: IconName` (component reference passed to `BubbleMenuButton` etc.). These do NOT need mapping — they stay lucide.
    - **Type-only**: `type LucideIcon`. Does NOT need mapping.
    - **Mixed**: appears as JSX in some files, value in others. Needs mapping (for the JSX files); the value files keep lucide.
  - For each **JSX-convertible** icon, research and verify its equivalent name in ALL 5 target libraries using the OFFICIAL catalogs:
    - `lucide`: the original name (trivial — it IS the lucide name)
    - `tabler`: look up in [@tabler/icons-react catalog](https://tabler.io/icons) — verify the exact exported component name
    - `hugeicons`: look up in [@hugeicons/react catalog](https://hugeicons.com/icons) — verify the exact exported name
    - `phosphor`: look up in [@phosphor-icons/react catalog](https://phosphoricons.com/) — verify the exact exported name + weight variant convention
    - `remixicon`: look up in [@remixicon/react catalog](https://remixicon.com/) — verify the exact exported name
  - Create `scripts/icon-map.mjs` that exports `iconMap` — an object keyed by lucide icon name, each value `{ lucide, tabler, hugeicons, phosphor, remixicon }` (all 5 string keys required for an entry to be included). Include an entry ONLY when you are confident in ALL 5 mappings. Omit icons where any library mapping is uncertain (those stay lucide).
  - Also export `iconMapMeta` with: total lucide icons found, count JSX-convertible, count value-referenced, count type-only, count mapped, count unmapped, and a `notes` object listing any icons omitted and why.

  **Must NOT do**:
  - Do NOT guess any mapping. If unsure about even ONE library for an icon, omit the entire entry (the icon stays lucide). The user explicitly requires this.
  - Do NOT include value-referenced-only icons in `iconMap` (they won't be converted; including them is harmless but wasteful — focus on JSX icons).
  - Do NOT modify any source files under `packages/`.

  **Recommended Agent Profile**:
  - **Category**: `deep` — this requires thorough research against 4 external icon catalogs (tabler, hugeicons, phosphor, remixicon), careful verification, and judgment about mapping confidence.
  - **Skills**: `[]` — no specialized skills needed; this is research + data-file authoring.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Task 3
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `scripts/build-shadcn-registry.mjs:74-110` — `buildIconPlaceholder()` shows the EXACT shape `iconMap` entries must have: keys `lucide`, `tabler`, `hugeicons`, `phosphor`, `remixicon` (all string values). Line 88 lists the required keys. Match this contract precisely.
  - `scripts/build-shadcn-registry.mjs:4-5` — the IconPlaceholder import path, showing this integrates with shadcn's transformer convention.

  **Inventory References** (the complete lucide-react import census — AUTHORITATIVE):
  The following unique lucide icon names are imported across `packages/core/src`. Classify each by scanning its usage:
  ```
  Single-line imports (file → icons):
  list.tsx → List, ListOrdered
  image.tsx → ImageIcon
  code.tsx → CodeXmlIcon
  button.tsx → MousePointer, ArrowUpRightSquare
  variable-view.tsx → AlertTriangle, Braces, Pencil
  slash-command-item.tsx → ChevronRightIcon
  select.tsx → ChevronDownIcon, LucideIcon(type)
  default-slash-commands.tsx → FootprintsIcon, Heading1
  number-input.tsx → type LucideIcon
  link-input-popover.tsx → Link, LinkIcon, LucideIcon(type)
  input-autocomplete.tsx → CornerDownLeft
  edge-spacing-controls.tsx → ChevronUp
  dropdown-menu.tsx → Check, ChevronRight, Circle
  repeat-view.tsx → Repeat2
  image-view.tsx → Ban, BracesIcon, GrabIcon, ImageOffIcon, Loader2
  turn-into-block.tsx → ChevronDownIcon, PilcrowIcon
  text-bubble-menu.tsx → LucideIcon(type)
  show-popover.tsx → Eye, InfoIcon
  columns-width-config.tsx → Columns2, SlidersVertical, Columns3
  html-menu.tsx → CodeXmlIcon, ViewIcon
  section-bubble-menu.tsx → ChevronUp, Trash
  editor-menu-bar.tsx → AlignCenter, AlignLeft, AlignRight, BoldIcon, EraserIcon, ItalicIcon, LinkIcon, SeparatorHorizontal, StrikethroughIcon, UnderlineIcon
  columns-bubble-menu-content.tsx → Space, Trash
  content-menu.tsx → Copy, GripVertical, Plus, Trash2
  alignment-switch.tsx → AlignCenter, AlignLeft, AlignRight
  repeat-bubble-menu.tsx → InfoIcon
  inline-image-bubble-menu.tsx → ImageDownIcon
  image-bubble-menu.tsx → ImageDown, LockIcon, LockOpenIcon
  lock-aspect-ratio-button.tsx → LockIcon, LockOpenIcon

  Multi-line imports (file → icons):
  typography.tsx → Text, Heading1, Heading2, Heading3, DivideIcon, TextQuote, FootprintsIcon, EraserIcon
  layout.tsx → ColumnsIcon, Repeat2, MoveVertical, RectangleHorizontal, Minus
  footers.tsx → CopyrightIcon, LayoutTemplateIcon, RectangleHorizontalIcon
  vertical-alignment-switch.tsx → AlignVerticalDistributeCenter, AlignVerticalDistributeEnd, AlignVerticalDistributeStart
  variable-suggestions-popover.tsx → ArrowDownIcon, ArrowUpIcon, Braces, CornerDownLeftIcon
  use-turn-into-block-options.tsx → FootprintsIcon, Heading1Icon, Heading2Icon, Heading3Icon, ListIcon, ListOrderedIcon, LucideIcon(type), PilcrowIcon
  text-bubble-content.tsx → BoldIcon, CodeIcon, ItalicIcon, List, ListOrdered, LucideIcon(type), StrikethroughIcon, UnderlineIcon
  ```

  **Classification hints** (pre-researched, VERIFY before relying on):
  - **JSX-convertible (used as `<Icon .../>` in blocks/)**: Text, Heading1, Heading2, Heading3, DivideIcon, TextQuote, FootprintsIcon, EraserIcon, ColumnsIcon, Repeat2, MoveVertical, RectangleHorizontal, Minus, CopyrightIcon, LayoutTemplateIcon, RectangleHorizontalIcon, CodeXmlIcon, MousePointer, ArrowUpRightSquare, List, ListOrdered, ImageIcon, Heading1, ChevronRightIcon, LinkIcon, ArrowDownIcon, ArrowUpIcon, Braces, CornerDownLeftIcon, Ban, BracesIcon, GrabIcon, ImageOffIcon, Loader2, Check, ChevronRight, Circle, Repeat2, Eye, InfoIcon, Columns2, SlidersVertical, Columns3, ViewIcon, ChevronUp, Trash, Space, Copy, GripVertical, Plus, Trash2, ImageDownIcon, ImageDown, LockIcon, LockOpenIcon, AlertTriangle, Braces, Pencil, CornerDownLeft, ChevronDownIcon, PilcrowIcon, AlignVerticalDistributeCenter, AlignVerticalDistributeEnd, AlignVerticalDistributeStart
  - **Value-referenced (used as `icon: X`)**: BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, CodeIcon, EraserIcon, SeparatorHorizontal, LinkIcon, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, FootprintsIcon, Heading1Icon, Heading2Icon, Heading3Icon, ListIcon, ListOrderedIcon, PilcrowIcon, AlignVerticalDistributeCenter, AlignVerticalDistributeEnd, AlignVerticalDistributeStart
  - **Type-only**: LucideIcon
  - NOTE: Many icons appear in BOTH lists (e.g., FootprintsIcon is JSX in typography.tsx but value in use-turn-into-block-options.tsx). The build script handles this per-file. For `iconMap`, include any icon that has at least ONE JSX usage — the build script will decide per-file whether to convert.

  **External References** (icon catalogs for verification):
  - Tabler: https://tabler.io/icons — search each icon, note the React component export name (e.g., `IconBold`)
  - Hugeicons: https://hugeicons.com/icons — search, note the export name
  - Phosphor: https://phosphoricons.com/ — search, note name + that React exports are like `<Bold />` from `@phosphor-icons/react`
  - Remixicon: https://remixicon.com/ — search, note the export name from `@remixicon/react`
  - Lucide: https://lucide.dev/icons/ — confirm the canonical name

  **WHY Each Reference Matters**:
  - The build script contract (lines 74-110) defines the EXACT object shape `iconMap` must have — mismatch = runtime error.
  - The inventory is the complete census; missing any icon means it silently stays lucide (acceptable per spec, but should be documented).
  - The external catalogs are the ONLY acceptable source for mapping names — guessing is forbidden.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: icon-map.mjs is valid and importable
    Tool: Bash (node)
    Preconditions: scripts/icon-map.mjs exists
    Steps:
      1. Run: node -e "import('./scripts/icon-map.mjs').then(m => { console.log(Object.keys(m.iconMap).length, 'entries'); const bad = Object.entries(m.iconMap).filter(([k,v]) => !v.lucide||!v.tabler||!v.hugeicons||!v.phosphor||!v.remixicon); console.log(bad.length, 'incomplete entries'); process.exit(bad.length ? 1 : 0) })"
      2. Assert exit code 0
      3. Assert "entries" count is > 0 (at least common icons like BoldIcon-equivalents... actually BoldIcon is value-only; expect blocks icons like Text, Heading1, MousePointer, etc.)
    Expected Result: > 0 entries, 0 incomplete entries, exit 0
    Failure Indicators: ReferenceError on import, incomplete entries > 0, 0 entries
    Evidence: .sisyphus/evidence/task-1-icon-map-valid.txt

  Scenario: Every iconMap entry has all 5 library keys with non-empty string values
    Tool: Bash (node)
    Preconditions: scripts/icon-map.mjs exists
    Steps:
      1. Run: node -e "import('./scripts/icon-map.mjs').then(m => { const req=['lucide','tabler','hugeicons','phosphor','remixicon']; let ok=true; for(const [k,v] of Object.entries(m.iconMap)){ for(const r of req){ if(typeof v[r]!=='string'||!v[r]){console.log('MISSING',k,r);ok=false} } } process.exit(ok?0:1) })"
      2. Assert exit code 0
    Expected Result: exit 0, no "MISSING" lines
    Evidence: .sisyphus/evidence/task-1-icon-map-complete.txt

  Scenario: iconMapMeta classification counts are present and consistent
    Tool: Bash (node)
    Preconditions: scripts/icon-map.mjs exports iconMapMeta
    Steps:
      1. Run: node -e "import('./scripts/icon-map.mjs').then(m => { const meta=m.iconMapMeta; console.log(JSON.stringify(meta,null,2)); if(!meta||typeof meta.totalFound!=='number'){process.exit(1)} })"
      2. Assert exit 0
    Expected Result: meta object with totalFound, jsxConvertible, valueReferenced, typeOnly, mapped, unmapped counts
    Evidence: .sisyphus/evidence/task-1-icon-map-meta.txt
  ```

  **Commit**: NO (groups with Task 2+3 in a single commit after Wave 2)

---

- [ ] 2. Refactor `scripts/build-shadcn-registry.mjs` (fix bugs, 3-category handling, report)

  **What to do**:
  This file is 80% implemented. Fix the bugs and extend it. Specifically:

  1. **Import `iconMap`** from `./icon-map.mjs` (produced by Task 1). Add at top: `import { iconMap, iconMapMeta } from "./icon-map.mjs"`. This fixes the `ReferenceError: iconMap is not defined` crash.

  2. **Fix the typo** on line 100: change `mapped.lucene ?? mapped.lucide` → `mapped.lucide`.

  3. **Rewrite `transformLucideIconsToPlaceholders()`** (lines 112-163) to handle the THREE usage categories:
     - **Parse the lucide-react import** and separate specifiers into:
       - `typeSpecifiers`: names imported with `type` keyword (e.g., `type LucideIcon`). These are preserved in a type-only import.
       - `valueSpecifiers`: names imported as values (the icon components).
     - Keep the alias fail-closed behavior (line 125-129): if `as` is detected in any specifier, throw with a clear error. (No aliases exist in the codebase today, but keep the guard.)
     - For each `valueSpecifier`, scan the file content to classify usage:
       - Has `<IconName` JSX self-closing usage AND `IconName` appears ONLY inside `<IconName .../>` patterns (not as a value)? → CONVERTIBLE.
       - `IconName` appears as a value reference (e.g., `icon: IconName`, `{ icon: IconName }`, `icon={IconName}`) anywhere? → PRESERVE (keep in import, do not convert).
       - The simplest reliable heuristic: after replacing all `<IconName\b[^>]*/>` occurrences with IconPlaceholder, check if the bare identifier `IconName` still appears as a word-boundary token in the file. If it does, it has value/type usage → keep the import. If it doesn't, strip it.
     - For CONVERTIBLE icons: check `iconMap[iconName]`. If present → replace `<IconName .../>` with `<IconPlaceholder .../>` (via `buildIconPlaceholder`). If NOT present in iconMap → do NOT convert (leave `<IconName .../>` as-is), keep in import, add to "unmapped" report.
     - **Reconstruct the import line**: if any type or value specifiers remain (preserved icons + unmapped icons), emit a reduced `import { ... } from 'lucide-react'` (combining `type` and value specifiers correctly). If NO specifiers remain (all converted), emit nothing (strip the import entirely).
     - **Add the IconPlaceholder import** only if at least one conversion happened. Insert it AFTER any `"use client"` or `"use strict"` directive at the top of the file. If no directive exists, prepend as the current code does.

  4. **Fix `buildIconPlaceholder()`** (lines 74-110): fix the typo (line 100). Keep the "all 5 keys required" check (lines 88-94) since `iconMap` only contains fully-mapped entries. The props passthrough (line 96, 105) is correct — keep it.

  5. **Add report generation**: after all files are processed, print a summary to stdout AND write it to `.sisyphus/evidence/icon-conversion-report.md`. The report must contain:
     - **Converted icons** (per file): which icons became IconPlaceholder
     - **Preserved icons** (per file): which icons stayed lucide-react and WHY (value-referenced / type-only)
     - **Unmapped icons**: JSX icons not in `iconMap` (left as lucide) — these are candidates for future mapping
     - Totals: N files processed, N icons converted, N icons preserved, N unmapped

  6. **Clean up the IconPlaceholder import path** (line 4-5): change from `'import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"'` to `'import { IconPlaceholder } from "@/components/icon-placeholder"'`. This is cleaner (no parentheses that could confuse path matching), still contains the required `icon-placeholder` substring, and follows the more standard `@/components/` convention. Document this choice in the report.

  **Must NOT do**:
  - Do NOT switch from regex to AST parsing — the regex approach handles all patterns present in the codebase; AST is scope creep.
  - Do NOT modify the `rewriteRenderImports` or `rewriteCoreImports` `@/` rewrite logic (lines 165-200) — it works correctly.
  - Do NOT modify the `copySource`, `walk`, `buildRegistryJson`, or dependency-listing logic (lines 202-348) unless directly needed for icon handling.
  - Do NOT change `iconLibraryDeps` (lines 294-305) — all 5 libraries + lucide-react are correct.
  - Do NOT remove the alias fail-closed guard.
  - Do NOT convert local custom icons — the transform only runs on `lucide-react` imports, so local icons (`./icons/text-direction-icon` etc.) are inherently safe. But do NOT add any logic that could accidentally match them.

  **Recommended Agent Profile**:
  - **Category**: `deep` — this is the core logic task: careful string transformation, edge-case handling (use client, mixed usage, dead imports), report generation. Getting it wrong breaks the entire registry.
  - **Skills**: `[]` — no specialized skills needed; this is Node.js script engineering.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: None — the script imports iconMap dynamically; the CONTRACT (object shape) is specified in Task 1's references, so this task can be written without Task 1 being complete.

  **References**:

  **Pattern References** (existing code to follow):
  - `scripts/build-shadcn-registry.mjs:74-110` — `buildIconPlaceholder()`: the JSX emission logic. Fix the typo on line 100. Keep the structure.
  - `scripts/build-shadcn-registry.mjs:112-163` — `transformLucideIconsToPlaceholders()`: the function to REWRITE. Current logic: strip import → collect names → replace `<Icon/>` → prepend import. New logic must add type/value separation and per-icon classification.
  - `scripts/build-shadcn-registry.mjs:165-182` — `rewriteCoreImports()`: calls the transform. Do NOT change the `@/` rewrite (lines 172-177), only ensure `transformLucideIconsToPlaceholders` is still called (line 179).
  - `scripts/build-shadcn-registry.mjs:4-5` — the IconPlaceholder import constant to clean up.
  - `scripts/build-shadcn-registry.mjs:70-72` — `escapeRegex()`: use this when building icon-name regexes.

  **API/Type References**:
  - The `iconMap` contract from Task 1: `{ [lucideIconName: string]: { lucide: string; tabler: string; hugeicons: string; phosphor: string; remixicon: string } }`. All values are non-empty strings.

  **Usage Pattern References** (why 3-category handling is needed):
  - `packages/core/src/editor/components/text-menu/use-turn-into-block-options.tsx:43` — `icon: PilcrowIcon` (VALUE reference). If the import is stripped, this breaks.
  - `packages/core/src/blocks/typography.tsx:17` — `icon: <Text className="mly:h-4 mly:w-4" />` (JSX element). The regex `<Text\b([^>]*)/>` MATCHES this → convertible.
  - `packages/core/src/editor/components/ui/select.tsx:4,20` — `import { ChevronDownIcon, LucideIcon }` + `icon?: LucideIcon | SVGIcon`. `LucideIcon` is a TYPE; `ChevronDownIcon` is a value. The transform must preserve `LucideIcon` as a type import.

  **WHY Each Reference Matters**:
  - Lines 74-110 and 112-163 are the ONLY functions that need modification. Everything else works.
  - The usage examples prove why naive import-stripping breaks: value references and type imports would lose their symbols.
  - The `escapeRegex` helper is needed because icon names contain no special regex chars, but consistency prevents bugs if names change.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Build script runs without ReferenceError (iconMap imported)
    Tool: Bash (node)
    Preconditions: scripts/icon-map.mjs exists (Task 1 done OR a stub with at least 1 entry); scripts/build-shadcn-registry.mjs imports it
    Steps:
      1. Run: node scripts/build-shadcn-registry.mjs 2>&1
      2. Check exit code
      3. Check output contains "Generated registry/default/maily and registry.json"
    Expected Result: exit 0, no "ReferenceError", success message printed
    Failure Indicators: "ReferenceError: iconMap is not defined", non-zero exit, missing output dir
    Evidence: .sisyphus/evidence/task-2-build-runs.txt

  Scenario: type LucideIcon import is preserved in generated select.tsx
    Tool: Bash (grep)
    Preconditions: Build succeeded
    Steps:
      1. Run: grep "LucideIcon" registry/default/maily/components/maily/editor/components/ui/select.tsx
      2. Assert output contains a lucide-react import with LucideIcon (as type)
    Expected Result: line like "import { type LucideIcon } from 'lucide-react'" or "import { ChevronDownIcon, type LucideIcon } from 'lucide-react'"
    Failure Indicators: LucideIcon missing entirely (would break the `icon?: LucideIcon` type), or LucideIcon present but not imported
    Evidence: .sisyphus/evidence/task-2-type-preserved.txt

  Scenario: Value-referenced icons retain lucide-react import (editor-menu-bar.tsx)
    Tool: Bash (grep)
    Preconditions: Build succeeded
    Steps:
      1. Run: grep "from 'lucide-react'" registry/default/maily/components/maily/editor/components/editor-menu-bar.tsx
      2. Assert the import is present (BoldIcon, AlignCenter, etc. are value-referenced)
    Expected Result: non-empty — a lucide-react import line containing value-referenced icon names
    Failure Indicators: no lucide-react import (would break `icon: BoldIcon` references)
    Evidence: .sisyphus/evidence/task-2-value-preserved.txt

  Scenario: Pure-JSX block file has no lucide-react import (typography.tsx — if all its icons are mapped)
    Tool: Bash (grep)
    Preconditions: Build succeeded, Text/Heading1/Heading2/Heading3/DivideIcon/TextQuote/FootprintsIcon/EraserIcon are in iconMap
    Steps:
      1. Run: grep "from 'lucide-react'" registry/default/maily/components/maily/blocks/typography.tsx
      2. Assert NO match (all icons converted to IconPlaceholder)
      3. Run: grep "IconPlaceholder" registry/default/maily/components/maily/blocks/typography.tsx
      4. Assert match count > 0
    Expected Result: zero lucide-react imports, multiple IconPlaceholder usages
    Failure Indicators: lucide-react import still present for mapped icons
    Note: If some typography icons are NOT in iconMap (unmapped), a reduced import will remain — that's acceptable. Document in report.
    Evidence: .sisyphus/evidence/task-2-jsx-converted.txt

  Scenario: IconPlaceholder import respects "use client" directive
    Tool: Bash (grep)
    Preconditions: Build succeeded
    Steps:
      1. Find any generated file with "use client": grep -rl '"use client"' registry/default/maily/components/maily/ | head -1
      2. If found, read first 5 lines and verify IconPlaceholder import comes AFTER "use client"
      3. If no "use client" files exist, skip (pass with note)
    Expected Result: "use client" directive is line 1; IconPlaceholder import is after it
    Failure Indicators: IconPlaceholder import before "use client"
    Evidence: .sisyphus/evidence/task-2-use-client.txt

  Scenario: Report is generated with conversion summary
    Tool: Bash (cat)
    Preconditions: Build succeeded
    Steps:
      1. Check .sisyphus/evidence/icon-conversion-report.md exists
      2. Assert it contains sections: "Converted", "Preserved", "Unmapped"
      3. Assert totals are present
    Expected Result: report file with all 3 sections and numeric totals
    Failure Indicators: missing report, missing sections
    Evidence: .sisyphus/evidence/task-2-report.txt
  ```

  **Commit**: NO (groups with Task 1+3 after Wave 2)

---

- [ ] 3. Regenerate registry, validate output, produce summary

  **What to do**:
  - Ensure `scripts/icon-map.mjs` (Task 1) and the refactored `scripts/build-shadcn-registry.mjs` (Task 2) are both complete.
  - Delete the existing generated output: `rm -rf registry/default/maily` (the build script does this itself on line 341, but do it explicitly to ensure a clean state).
  - Run `pnpm registry:build` (which runs `node scripts/build-shadcn-registry.mjs`).
  - Verify the build exits 0 and prints the icon conversion report.
  - Run ALL validation checks (below) and capture evidence for each.
  - Produce a final human-readable summary covering:
    - What changed (build script fixes, iconMap added, IconPlaceholder emitted)
    - Which icons were mapped (count + list from iconMap)
    - Which icons remain Lucide-only and WHY (value-referenced / type-only / unmapped JSX)
    - Exact validation commands run and their results
  - Save the summary to `.sisyphus/evidence/task-3-summary.md`.
  - Run `pnpm build` (turbo) — if the environment supports it, capture the result. If it fails for reasons UNRELATED to the registry (e.g., missing env vars for the web app), note that and verify only the relevant packages build. The registry output is NOT built by turbo (it's generated files), so `pnpm build` tests the source packages, which should be unaffected.

  **Must NOT do**:
  - Do NOT manually edit any file under `registry/default/maily/` — all output must come from the build script.
  - Do NOT modify `registry.json` by hand — it's generated by the build script.
  - Do NOT modify `packages/core/src`, `packages/render/src`, or `packages/shared/src`.
  - Do NOT mark this task complete unless ALL validation checks pass (or have documented exceptions).

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` — this is a validation + documentation task that requires careful execution of many checks and honest reporting of results. High effort, high attention to detail.
  - **Skills**: `[]` — no specialized skills needed.

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential, alone)
  - **Blocks**: F1–F4, Task 4
  - **Blocked By**: Task 1, Task 2

  **References**:

  **Pattern References**:
  - `scripts/build-shadcn-registry.mjs:341-350` — the build entry point: wipes `registry/default/maily`, copies sources, writes `registry.json`. Understand this to know what the build produces.
  - `registry.json:1-5` — the top-level schema. After rebuild, `$schema`, `name`, `homepage` should be unchanged.

  **Validation Checklist References** (the "Definition of Done" from this plan):
  - The 8 Definition of Done checkboxes in the "Work Objectives" section — each maps to a concrete command below.

  **WHY Each Reference Matters**:
  - The build entry point confirms what gets regenerated (everything under `registry/default/maily` + `registry.json`).
  - The validation commands below are the acceptance gate — the task is NOT done until all pass.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Clean rebuild produces valid output
    Tool: Bash
    Preconditions: Tasks 1 and 2 complete
    Steps:
      1. Run: rm -rf registry/default/maily (clean state)
      2. Run: pnpm registry:build 2>&1 | tee .sisyphus/evidence/task-3-build-log.txt
      3. Assert exit code 0
      4. Assert output contains "Generated registry/default/maily and registry.json"
      5. Assert registry/default/maily/ directory exists with files
    Expected Result: exit 0, success message, populated output directory
    Failure Indicators: non-zero exit, "ReferenceError", "Error", empty output dir
    Evidence: .sisyphus/evidence/task-3-build-log.txt

  Scenario: registry.json has exactly ONE item named "maily"
    Tool: Bash (node)
    Preconditions: Build succeeded
    Steps:
      1. Run: node -e "const r=JSON.parse(require('fs').readFileSync('registry.json','utf8')); console.log('items:', r.items.length); console.log('name:', r.items[0]?.name); console.log('type:', r.items[0]?.type); if(r.items.length!==1||r.items[0].name!=='maily'){process.exit(1)}"
      2. Assert exit code 0
    Expected Result: items: 1, name: maily, type: registry:block
    Failure Indicators: items count ≠ 1, name ≠ maily, JSON parse error
    Evidence: .sisyphus/evidence/task-3-registry-json.txt

  Scenario: Generated IconPlaceholder usages exist
    Tool: Bash (grep)
    Preconditions: Build succeeded
    Steps:
      1. Run: grep -rl "IconPlaceholder" registry/default/maily/components/maily/ | wc -l
      2. Assert count > 0 (at least one file has IconPlaceholder)
      3. Run: grep -rh "<IconPlaceholder" registry/default/maily/components/maily/ | wc -l
      4. Assert count > 0 (at least one IconPlaceholder JSX element)
    Expected Result: file count > 0, element count > 0
    Failure Indicators: zero IconPlaceholder (means no icons were converted — iconMap may be empty or transform broken)
    Evidence: .sisyphus/evidence/task-3-icon-placeholder-count.txt

  Scenario: Renderer shared imports point to local ./shared paths
    Tool: Bash (grep)
    Preconditions: Build succeeded
    Steps:
      1. Run: grep -rh "shared" registry/default/maily/lib/maily-render/*.ts registry/default/maily/lib/maily-render/*.tsx | grep -E "from ['\"]\\./shared"
      2. Assert non-empty (renderer imports its shared utils relatively)
      3. Run: grep -rh "@maily-to/shared" registry/default/maily/lib/maily-render/ 
      4. Assert EMPTY (no workspace package refs should remain — all rewritten to relative ./shared)
    Expected Result: ./shared imports present, @maily-to/shared absent
    Failure Indicators: @maily-to/shared references remain (rewriteRenderImports broken)
    Evidence: .sisyphus/evidence/task-3-render-shared.txt

  Scenario: No lucide-react imports in pure-JSX block files (for mapped icons)
    Tool: Bash (grep)
    Preconditions: Build succeeded
    Steps:
      1. For each block file (typography.tsx, layout.tsx, footers.tsx, button.tsx, code.tsx, image.tsx, list.tsx), check:
         grep "from 'lucide-react'" registry/default/maily/components/maily/blocks/<file>
      2. If ALL icons in that file are in iconMap → expect NO match
      3. If SOME icons are unmapped → a reduced import is acceptable; document in report
      4. Cross-reference with the icon-conversion-report.md to confirm consistency
    Expected Result: mapped-icon-only files have zero lucide-react imports; mixed files have reduced imports listing only unmapped/preserved icons
    Failure Indicators: lucide-react import present for icons that ARE in iconMap (transform didn't convert them)
    Evidence: .sisyphus/evidence/task-3-block-imports.txt

  Scenario: lucide-react retained in dependencies
    Tool: Bash (node)
    Preconditions: Build succeeded
    Steps:
      1. Run: node -e "const r=JSON.parse(require('fs').readFileSync('registry.json','utf8')); const deps=r.items[0].dependencies; console.log('lucide-react in deps:', deps.some(d=>d.startsWith('lucide-react')))"
      2. Assert true (lucide-react MUST remain — value/type icons need it)
    Expected Result: lucide-react in deps: true
    Failure Indicators: lucide-react removed (would break value-referenced icons)
    Evidence: .sisyphus/evidence/task-3-lucide-dep.txt

  Scenario: pnpm build succeeds (or documented environment limitation)
    Tool: Bash
    Preconditions: Build succeeded
    Steps:
      1. Run: pnpm build 2>&1 | tee .sisyphus/evidence/task-3-turbo-build.txt
      2. If exit 0 → pass
      3. If exit ≠ 0 → investigate whether failure is related to registry changes (it should NOT be — packages/core, render, shared source is untouched). If unrelated (e.g., web app env vars), document and note as "environment limitation, not caused by this change"
    Expected Result: exit 0 (or documented environment limitation unrelated to registry changes)
    Failure Indicators: build failure caused by registry/icon changes (would indicate source was accidentally modified)
    Evidence: .sisyphus/evidence/task-3-turbo-build.txt

  Scenario: Icon conversion report is complete
    Tool: Bash (cat)
    Preconditions: Build succeeded
    Steps:
      1. cat .sisyphus/evidence/icon-conversion-report.md
      2. Assert sections exist: "Converted", "Preserved", "Unmapped"
      3. Assert each section has entries or explicitly states "none"
    Expected Result: complete report with all sections
    Evidence: .sisyphus/evidence/task-3-report-check.txt
  ```

  **Commit**: YES — single commit with all Wave 1 + Wave 2 deliverables.
  - Message: `feat(registry): emit IconPlaceholder for JSX icons in shadcn registry output`
  - Files: `scripts/icon-map.mjs`, `scripts/build-shadcn-registry.mjs`, `registry/default/maily/**`, `registry.json`
  - Pre-commit: `pnpm registry:build && node -e "const r=JSON.parse(require('fs').readFileSync('registry.json','utf8')); if(r.items.length!==1||r.items[0].name!=='maily'){process.exit(1)}"`

---

- [ ] 4. (Best-effort) shadcn add fixture test with lucide + tabler iconLibrary

  **What to do**:
  - This task is OPTIONAL and BEST-EFFORT. If the environment has no network access (shadcn CLI fetches from GitHub), or if `pnpm dlx shadcn` is unavailable, SKIP this task and document why. Do NOT block the plan on it.
  - If feasible:
    1. Create a temporary Next.js or Vite app in `C:\Users\dell\AppData\Local\Temp\opencode\shadcn-fixture` (the pre-approved temp dir).
    2. Initialize shadcn: `pnpm dlx shadcn@latest init` (with `iconLibrary: lucide` and `iconLibrary: tabler` in two separate runs or configs).
    3. Add the maily item from the LOCAL registry: `pnpm dlx shadcn@latest add brokeboiflex/maily.cn/maily` — NOTE: this requires the registry to be pushed to GitHub first. If not pushed, test against the local `registry.json` using `shadcn add ./registry.json` or the `--url` flag if supported.
    4. After install, verify:
       - The IconPlaceholder import was REMOVED by shadcn's transformer (shadcn replaces it with the chosen library's import)
       - The chosen library's icons are imported (e.g., `@tabler/icons-react` for tabler)
       - The installed code compiles or is at minimum syntactically valid (run `tsc --noEmit` or `next build`)
    5. For `iconLibrary: lucide`: verify the output uses `lucide-react` imports (the original library, transformed back).
    6. For `iconLibrary: tabler`: verify the output uses `@tabler/icons-react` imports.
  - Document results (pass/fail/skipped + reason) in `.sisyphus/evidence/task-4-fixture.md`.

  **Must NOT do**:
  - Do NOT commit the fixture app — it's temporary, in the temp dir.
  - Do NOT modify the registry based on fixture results without re-running the full validation (Task 3).
  - Do NOT block plan completion on this task.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` — exploratory validation requiring environment probing and adaptability.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 3 output being committed/pushed)
  - **Parallel Group**: Wave 3 (alone)
  - **Blocks**: None
  - **Blocked By**: Task 3

  **References**:
  - `registry.json` — the registry to test against
  - shadcn CLI docs: https://ui.shadcn.com/docs/cli — for `add` command flags

  **Acceptance Criteria**:

  **QA Scenarios:**
  ```
  Scenario: shadcn add with lucide iconLibrary produces valid lucide imports
    Tool: Bash
    Preconditions: Fixture app created, shadcn initialized with iconLibrary: lucide
    Steps:
      1. Run shadcn add for the maily item
      2. Grep installed files for "IconPlaceholder" → should be ABSENT (transformer removed it)
      3. Grep installed files for "from 'lucide-react'" → should be PRESENT (transformed back to lucide)
      4. Run tsc --noEmit or next build on the fixture app
    Expected Result: no IconPlaceholder, lucide-react imports present, build/tsc passes or is syntactically valid
    Evidence: .sisyphus/evidence/task-4-lucide-fixture.txt

  Scenario: shadcn add with tabler iconLibrary produces valid tabler imports
    Tool: Bash
    Preconditions: Fixture app created, shadcn initialized with iconLibrary: tabler
    Steps:
      1. Run shadcn add for the maily item
      2. Grep installed files for "IconPlaceholder" → should be ABSENT
      3. Grep installed files for "@tabler/icons-react" → should be PRESENT
      4. Run tsc --noEmit or next build
    Expected Result: no IconPlaceholder, tabler imports present, valid
    Evidence: .sisyphus/evidence/task-4-tabler-fixture.txt

  Scenario: SKIP — environment cannot run shadcn CLI
    Tool: Bash
    Preconditions: No network access or shadcn unavailable
    Steps:
      1. Attempt pnpm dlx shadcn@latest --version
      2. If fails, document "SKIPPED: <reason>" in task-4-fixture.md
    Expected Result: documented skip
    Evidence: .sisyphus/evidence/task-4-fixture.md
  ```

  **Commit**: NO (fixture is temporary, not committed)

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run `node scripts/build-shadcn-registry.mjs`, grep output). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan. Specifically verify: `iconMap` is defined and imported; `type LucideIcon` imports are preserved in output; value-referenced icons retain lucide-react imports; no local custom icons were touched.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Review `scripts/build-shadcn-registry.mjs` and `scripts/icon-map.mjs` for: the `lucene` typo fix, proper type-import separation, no `as any`/`@ts-ignore`, no empty catches, no dead code, consistent style. Verify the report generation produces structured output. Check that the IconPlaceholder import respects `"use client"` directives.
  Output: `Build script [CLEAN/N issues] | icon-map [CLEAN/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  From clean state: `rm -rf registry/default/maily && pnpm registry:build`. Then execute EVERY QA scenario from Tasks 1–3. Grep the generated output for: (a) `<IconPlaceholder` occurrences > 0, (b) `lucide-react` imports only in files with value/type icons, (c) zero `lucide-react` imports in pure-JSX-icon files like `blocks/typography.tsx`. Parse `registry.json` and assert exactly 1 item named `maily`. Verify renderer `./shared` imports intact. Save all evidence.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (`git log/diff`). Verify 1:1. Check `packages/render/src` and `packages/shared/src` were NOT modified. Check `packages/core/src` was NOT modified (source of truth preserved — only generated output changes). Check no local custom icons were converted. Confirm `registry.json` still has exactly one `maily` item.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1**: After Wave 2 (Task 3) — single commit with all deliverables.
  - Message: `feat(registry): emit IconPlaceholder for JSX icons in shadcn registry output`
  - Files: `scripts/icon-map.mjs`, `scripts/build-shadcn-registry.mjs`, `registry/default/maily/**`, `registry.json`
  - Pre-commit: `pnpm registry:build && node -e "JSON.parse(require('fs').readFileSync('registry.json','utf8'))"`

---

## Success Criteria

### Verification Commands
```bash
pnpm registry:build                                                    # Expected: exit 0, prints icon report
node -e "const r=require('./registry.json');console.log(r.items.length, r.items[0].name)"  # Expected: 1 maily
grep -r "IconPlaceholder" registry/default/maily/components/maily/ | wc -l  # Expected: > 0
grep -rl "from 'lucide-react'" registry/default/maily/components/maily/blocks/  # Expected: (empty — blocks are pure JSX)
grep -rl "from 'lucide-react'" registry/default/maily/components/maily/editor/components/text-menu/  # Expected: non-empty (value icons preserved)
pnpm build 2>&1 | tail -5                                              # Expected: success or environment note
```

### Final Checklist
- [ ] `iconMap` defined in `scripts/icon-map.mjs` and imported by build script
- [ ] `lucene` typo fixed → `lucide`
- [ ] `type LucideIcon` imports preserved in generated output
- [ ] Value-referenced icons retain `lucide-react` imports in generated output
- [ ] JSX-only icons converted to `<IconPlaceholder>` in generated output
- [ ] IconPlaceholder import specifier contains `icon-placeholder`
- [ ] registry.json has exactly ONE item named `maily`
- [ ] Renderer `./shared` imports unchanged
- [ ] No `packages/core/src`, `packages/render/src`, or `packages/shared/src` modifications
- [ ] Icon conversion report produced (converted / preserved / unmapped)
