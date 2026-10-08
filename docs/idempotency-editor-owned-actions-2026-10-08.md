# Editor deferred ownership, 2026-10-08

The provider owns one deferred-action controller per editor. Captured work owns
its source document, selection, editor lifecycle, named latest-request channel
and one commit. Stale, superseded, destroyed or consumed work cannot retarget a
later selection. Provider invalidation runs in layout cleanup, before removal;
picker teardown also cancels its channel in layout cleanup.

Font requests share the font-choice channel. Each mounted ColorPicker has a stable
React `useId` channel so unmounting one picker does not cancel another picker's
queued work. Independent channels do not supersede each other; every channel
still rejects a changed source document or selection. This does not rebase queued
work across another command's document mutation.

`deferred-editor-action.test.ts` exercises a real TipTap Editor, selection and
document changes, request replacement, one-shot consumption, lifecycle teardown
and independent color channels/cancellation. The mailbox hydration regression
blocks editing/save/send until saved draft detail is available. Render metadata
is copied and deduplicated per instance.

References inspected: [React layout cleanup](https://react.dev/reference/react/useLayoutEffect)
and [stable instance IDs](https://react.dev/reference/react/useId). No browser or
provider acceptance is claimed. Registry/playground generation starts from
canonical packages, and selective official shadcn consumption preserves host
primitives and unrelated local work.
