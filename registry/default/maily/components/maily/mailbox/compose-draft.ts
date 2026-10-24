import { splitAddressList } from './addresses';
import type {
  MailyMailboxComposeValues,
  MailyMailboxDraftInput,
} from './types';

/** Converts composer values into the draft payload the data source receives. */
export function composeValuesToMailboxDraft(
  values: MailyMailboxComposeValues,
  inReplyTo?: string | null
): MailyMailboxDraftInput {
  return {
    to: splitAddressList(values.to),
    cc: splitAddressList(values.cc),
    bcc: splitAddressList(values.bcc),
    subject: values.subject.trim() || null,
    text: values.text.length > 0 ? values.text : null,
    html: values.html?.trim() ? values.html : null,
    inReplyTo: inReplyTo ?? null,
    attachments: values.attachments?.map((attachment) => ({ ...attachment })),
  };
}
