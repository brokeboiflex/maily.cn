# Original message reader

The existing showOriginal action now has a built-in optional source reader.
Hosts opt in with getMessageSource(messageId) and messageActions: ['showOriginal'].
Return archived RFC822 as text; authentication, storage and byte downloads stay
host-owned. Only an explicit click fetches the source. Raw content is escaped
text, never an HTML preview. Back unmounts the pending reader; late responses
cannot replace the normal message. Failures expose retry and report onError
with action messageSource. New labels: source.back, source.retry, source.error.
The old generic runMessageAction callback is preserved when no source adapter
is supplied. Existing host shadcn Button and ScrollArea are reused.

Canonical files: packages/core/src/mailbox/index.tsx and index.test.ts.
Format them with local Prettier, run core mailbox tests and typecheck, then
pnpm registry:consumer-test to regenerate and exercise Radix/Base/Bun consumers.
Consumers install the generated maily-mailbox registry item using shadcn.
No host-specific network, auth, timer or backend dependency is added.
