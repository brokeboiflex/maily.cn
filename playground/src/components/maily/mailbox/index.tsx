export { InboxOutboxView, MailboxView } from './mailbox-view';
// Public entry for `@/components/maily/mailbox`. It keeps the index.tsx name of
// earlier releases, so `shadcn add --overwrite` replaces it in place instead of
// leaving a stale module beside a renamed one. (shadcn add strips a file's
// leading comments, so this note follows the first export.)
export { composeValuesToMailboxDraft } from './compose-draft';
export {
  defaultMailboxComposeSeed,
  type MailyMailboxComposeSeed,
  type MailyMailboxComposeSeedContext,
  type MailyMailboxComposeSeedKind,
} from './compose-seed';
export {
  filterMailboxContactSuggestions,
  type MailyMailboxContactSuggestion,
} from './contacts';
export type {
  MailyMailboxDraftCapabilities,
  MailyMailboxDraftCapability,
} from './draft-capabilities';
export {
  defaultMailboxLabels,
  type MailyMailboxLabelKey,
  type MailyMailboxLabels,
} from './labels';
export {
  defaultMailboxMessageActionsFor,
  type MailyMailboxMessageActionContext,
} from './message-actions';
export {
  getMailboxReplyAllRecipients,
  type MailyMailboxReplyAllInput,
  type MailyMailboxReplyAllRecipients,
} from './reply-all';
export type { MailyMailboxSearchQuery } from './search';
export type {
  MailyMailboxFolder,
  MailyMailboxLabel,
  MailyMailboxMessageStatus,
  MailyMailboxAccount,
  MailyMailboxMessageRow,
  MailyMailboxAttachment,
  MailyMailboxAttachmentDownloadInput,
  MailyMailboxEvent,
  MailyMailboxMessageDetail,
  MailyMailboxMessageList,
  MailyMailboxCounts,
  MailyMailboxSendDraftOptions,
  MailyMailboxDraftInput,
  MailyMailboxUploadedAttachment,
  MailyMailboxThread,
  MailyMailboxComposeValues,
  MailyMailboxComposeBodyMode,
  MailyMailboxMessageAction,
  MailyMailboxMessageActionInput,
  MailyMailboxMessageActionResult,
  MailyMailboxMessageActionEvent,
  MailyMailboxDataSource,
  MailyMailboxHandle,
  MailyMailboxViewProps,
} from './types';
