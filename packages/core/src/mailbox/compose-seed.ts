import type { MailyMailboxLabels } from './labels';
import { getMailboxReplyAllRecipients } from './reply-all';
import type {
  MailyMailboxAccount,
  MailyMailboxComposeValues,
  MailyMailboxMessageDetail,
} from './types';

export type MailyMailboxComposeSeedKind = 'reply' | 'replyAll' | 'forward';

/** Initial values for a reply or forward, and its In-Reply-To header. */
export type MailyMailboxComposeSeed = MailyMailboxComposeValues & {
  /** RFC Message-ID this composition answers; never a storage row ID. */
  inReplyTo?: string | null;
};

export type MailyMailboxComposeSeedContext = {
  account?: MailyMailboxAccount;
  labels: MailyMailboxLabels;
  formatDate: (date: string | Date, mode: 'short' | 'long') => string;
};

function interpolate(label: string, vars: Record<string, string>) {
  return label.replace(
    /\{(\w+)\}/g,
    (match, key: string) => vars[key] ?? match
  );
}

function subjectWithPrefix(prefix: 'Re:' | 'Fwd:', subject: string | null) {
  const clean = subject?.trim() || '';
  if (!clean) return prefix;
  return clean.toLowerCase().startsWith(prefix.toLowerCase())
    ? clean
    : `${prefix} ${clean}`;
}

function quotedBody(text: string | null | undefined) {
  return (text ?? '')
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

/**
 * Maily's default reply and forward values: `Re:`/`Fwd:` subjects, a quoted
 * plain-text body, Reply all without the account's own address, and the
 * original's Message-ID as In-Reply-To. Hosts with other conventions pass
 * `createComposeSeed`, and can call this for the parts they keep.
 */
export function defaultMailboxComposeSeed(
  kind: MailyMailboxComposeSeedKind,
  message: MailyMailboxMessageDetail,
  context: MailyMailboxComposeSeedContext
): MailyMailboxComposeSeed {
  const { labels } = context;
  if (kind === 'forward') {
    const header = [
      `---------- ${labels['compose.forwardedHeader']} ----------`,
      `${labels['compose.forwardFrom']}: ${message.fromAddress}`,
      `${labels['compose.forwardTo']}: ${(message.toAddresses ?? []).join(', ')}`,
      `${labels['compose.forwardSubject']}: ${message.subject ?? ''}`,
    ].join('\n');
    return {
      to: '',
      cc: '',
      bcc: '',
      subject: subjectWithPrefix('Fwd:', message.subject),
      text: `\n\n${header}\n\n${message.bodyText ?? ''}`,
      html: null,
      inReplyTo: null,
    };
  }
  const intro = interpolate(labels['compose.wrote'], {
    date: context.formatDate(message.createdAt, 'long'),
    sender: message.fromAddress,
  });
  const recipients =
    kind === 'replyAll'
      ? getMailboxReplyAllRecipients(message, [context.account?.address])
      : { to: [message.fromAddress], cc: [] };
  return {
    to: recipients.to.join(', '),
    cc: recipients.cc.join(', '),
    bcc: '',
    subject: subjectWithPrefix('Re:', message.subject),
    text: `\n\n${intro}\n${quotedBody(message.bodyText)}`,
    html: null,
    // A storage row ID is not an RFC Message-ID. Mail without that header
    // remains replyable, but cannot supply an In-Reply-To header.
    inReplyTo: message.messageId || null,
  };
}
