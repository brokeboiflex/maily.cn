# Mailbox reply and draft threading

Replies to messages without an RFC Message-ID used the storage row ID as
In-Reply-To. Reopened reply drafts also lost their existing In-Reply-To when
saved or sent. Fix both in the canonical mailbox component; do not relax mail
transport validation or manufacture a message header from a database key.

The focused component tests reproduce both defects before the fix. They cover
missing/present Message-ID and saving/sending a reopened reply draft. All 16
mailbox tests and the core typecheck passed after the fix.

The consumer matrix additionally reproduced a duplicate Reply import: the
registry transformer mistook the header name in a comment for a live icon
reference. Ignore comments in the existing mixed-use detector. Keep actual
value references and stock host primitives intact.

Repeat from the repository root:

```sh
pnpm exec prettier --write packages/core/src/mailbox/index.tsx packages/core/src/mailbox/index.test.ts scripts/build-shadcn-registry.mjs
pnpm --filter @maily-to/core test src/mailbox/index.test.ts
pnpm --filter @maily-to/core typecheck
pnpm registry:consumer-test
```

The final command regenerates the registry and runs the existing isolated
consumer matrix. No credentials, production database or mail delivery is used.
Keep generated output from the canonical source; do not edit registry files.

Final result: Radix full, Base editor/full, Base browser interactions and Bun
isolated consumer passed. The existing exact Base scroll-area unused React
import exception remains confined to the external primitive, as documented in
AGENTS.md. Primitive audit passed; no host primitive changes were needed.
