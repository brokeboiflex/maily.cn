# Editor and mailbox idempotency repairs, 2026-10-08

Local canonical source repair. Executing model gpt-6.1-sol. No commit, push, npm publication or deployment.

## Canonical changes

Changes belong in packages/core/src and are generated into registry/default/maily and playground/public/r. Host shadcn primitives remain external registry dependencies.

- Column selector compares the live document count, making repeated delivery of the same desired column count a no-op.
- Image resize owns its native listeners; reentry/unmount cancels without writing attributes from a stale node.
- Drag plugin owns dragstart/dragend/drop listeners, drag clone and timer; teardown and canceled drag release all owned resources.
- Image upload extension/plugin carry the existing optional upload release capability; stale node/editor uploads compensate owned results and placeholder URLs are disposed.
- Variable suggestions destroy their renderer even if no popup was created.
- use-owned-timeout owns deferred focus work for show-popover, repeat menu, link input, button label input and slash command.
- Recipient suggestions advance request generation on close/empty query/unmount and handle rejected host lookups.
- Mailbox Save/Send/Discard and optional message actions share synchronous exclusion with navigation. Unknown send persists the draft ID under its mailbox account before dispatch. Retry/remount sends the original draft without another create/update. Account-less hosts fail before send; provide the immutable account ID.
- Mailbox editable drafts carry the observed revision in DraftInput.revision. Detail/create/update results may expose \_revision. Hosts forward the captured revision as their optimistic concurrency token, returning the next revision after a successful write.

## Validation

- Canonical core TypeScript --noEmit passed.
- Core Vitest: 30 tests passed across fonts, translations and mailbox. New real React/HappyDOM cases cover observed revision advancement and unknown send after remount without another draft/create/update. Fixtures exercise actual rendered source; they do not establish external SMTP/provider behavior.
- Direct node scripts/build-shadcn-registry.mjs passed: zero unmapped/preserved fallback icons. Local shadcn CLI built all four public registry JSON items.
- All four public registry JSON items embed 274 staged source entries with exact byte equality. Generated staging was locally formatted before CLI build; final changed-file Prettier checks passed.
- node scripts/audit-shadcn-primitives.mjs passed.
- Fresh official shadcn CLI consumer installs/type/builds passed for Radix editor, Radix full granular, Base editor, Base full granular and Bun isolated full granular. The existing consumer script's browser runtime call was omitted in a temporary copy under the Veyme task's explicit no-browser boundary. No repository acceptance condition was relaxed. Its existing known Base scroll-area unused-import exception remains as documented in that script.

## Boundary

Unknown external send must be reconciled by the host rather than retried under a new identity. Mailbox account recovery storage retains only its draft ID. Host API authorization, durable receipts and CAS remain host responsibilities. Browser focus/media/provider and live delivery acceptance were not run. Registry generation is local evidence, not publication evidence.
