# Spam and Trash

The reference is Gmail's [delete workflow](https://support.google.com/mail/answer/7401),
[spam workflow](https://support.google.com/mail/answer/1366858), and
[system label contract](https://developers.google.com/workspace/gmail/api/guides/labels).

The existing expandable folder rail now includes Spam and Trash with counts,
search, polling, loading and translated empty states through the same data source.
The reader uses existing shadcn Button and DropdownMenu primitives.

## Host contract

`listMessages({ folder })` accepts `spam` and `trash`; `getCounts` may return
both counts. Add supported actions to `messageActions` and implement
`runMessageAction`:

- `delete`: move to Trash; do not permanently remove a message.
- `reportSpam`: classify as spam and move to Spam.
- `restore`: remove Trash/Spam classification and move to Inbox.
- `notSpam`: remove spam classification and move to Inbox.
- `deleteForever`: permanently remove the selected message.

Which folders offer which action is the host's choice: pass `messageActions` as
a function of the folder, label, search and selection. The opt-in
`defaultMailboxMessageActionsFor` applies Gmail's rules: Archive only in Inbox;
Move to Inbox in Trash, All Mail and Starred (and in an all-mail search); Not
spam only in Spam; Delete forever in Spam and Trash; Delete and Report spam
everywhere except Spam and Trash. After an acknowledged action
folder rows and counts refresh; the reader closes when the host's result says
`removedFromView: true`. Failed requests retain the message and use the
existing error path. Existing
mounted-lifetime and mutation exclusion apply to the new actions.

## Intentional adaptations

Maily uses its no-split list-to-message shell; the legacy `bounced` folder id
stays type-compatible but is not in the default navigation. Gmail's backend
classification, sender learning, 30-day retention and arbitrary Move to folders
are host responsibilities; Maily does not promise automatic expiration. Bulk selection uses the optional runBulkMessageAction capability. See
[mailbox workflows](mailbox-workflows.md). Discarded drafts still use the separate discardDraft API.
The playground is an in-memory consumer and loses changes on reload.

## Validation

Core: 40 tests passed and TypeScript passed. Clean registry consumers: Radix
full build, Base editor strict build, Base full build/runtime checks and Bun
isolated full build passed (the documented external Base ScrollArea diagnostic
exception remains). Installed playground production build passed. Chromium
verified Delete to Trash, Move to Inbox, Report spam, Not spam and Delete forever.
Primitive audit and changed-file Prettier checks passed. No provider delivery
or deployment was tested.
