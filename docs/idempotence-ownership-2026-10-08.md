# Mailbox and upload ownership follow-up

Canonical source review on 2026-10-08/09 found that a prepared draft could continue
into sending after its mailbox session left, and a node upload could target a
replacement image/logo with identical attributes at the same position.

`MailboxView` now owns a keyed `MailboxSession`, with an optional host-supplied
`recoveryScope` for actor/account identity. Lifetime tickets guard every async
mutation, refresh and completion. Sending retains the prepared draft's recovery
receipt before checking whether the session remains current. A departed session
cannot continue into sending. An old account-only pending-send receipt remains
retained and blocked when the host starts supplying an actor scope; it is never
silently adopted by a different actor.

Image and logo upload completion additionally requires the exact immutable
ProseMirror Node object captured at acquisition. Replacing a document with an
identical-looking node rejects completion and invokes the host's discarded-upload
compensation. Canonical logo behavior now includes the same upload exclusion and
compensation contract as image behavior.

Local validation: `packages/core` Vitest run of `src/mailbox/index.test.ts` and
`src/editor/utils/deferred-editor-action.test.ts`: 26 passing tests, including
React/happy-dom departure after draft preparation and legacy recovery retention.
Veyme actual-source handler tests additionally exercise image/logo replacement
identity. These are local source/component checks, not live mail delivery or
browser consumer-matrix certification. Canonical registry and public registry
artifacts are regenerated through `pnpm playground:sync`; Veyme consumes the three
changed implementation files through the official shadcn CLI.

References: [React effect cleanup](https://react.dev/reference/react/useEffect),
[TipTap events](https://tiptap.dev/docs/editor/api/events), and the installed
ProseMirror model's `src/node.ts` persistent-data contract. Network access to the
ProseMirror guide returned 403; the installed authoritative implementation was
inspected instead.
