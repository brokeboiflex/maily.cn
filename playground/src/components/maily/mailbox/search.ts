export type MailyMailboxSearchQuery = {
  text?: string;
  from?: string;
  to?: string;
  subject?: string;
  after?: string;
  before?: string;
  unread?: boolean;
  starred?: boolean;
  hasAttachments?: boolean;
  labelId?: string | null;
};

/** Advanced filters, in the order the search form shows them. */
export const MAILBOX_SEARCH_FILTERS = [
  'from',
  'to',
  'subject',
  'after',
  'before',
  'hasAttachments',
  'unread',
] as const;

export type MailyMailboxSearchFilter = (typeof MAILBOX_SEARCH_FILTERS)[number];

/**
 * Advanced filters the host's backend supports. Each is off unless set to
 * `true`. Text search does not depend on these.
 */
export type MailyMailboxSearchCapabilities = {
  /** Sender address or name: `search.from`. */
  from?: boolean;
  /** Recipient address or name: `search.to`. */
  to?: boolean;
  /** Subject text: `search.subject`. */
  subject?: boolean;
  /** Messages on or after a date, as typed: `search.after`. */
  after?: boolean;
  /** Messages before a date, as typed: `search.before`. */
  before?: boolean;
  /** Only messages with attachments: `search.hasAttachments`. */
  hasAttachments?: boolean;
  /** Only unread messages: `search.unread`. */
  unread?: boolean;
};

/** The enabled advanced filters, in form order. */
export function resolveMailboxSearchFilters(
  capabilities: MailyMailboxSearchCapabilities = {}
): MailyMailboxSearchFilter[] {
  return MAILBOX_SEARCH_FILTERS.filter((key) => capabilities[key] === true);
}

/**
 * Drops values of advanced filters that are not enabled. Text, `starred` and
 * `labelId` are not advanced form filters and pass through. Returns the input
 * object when nothing is dropped.
 */
export function withEnabledSearchFilters<T extends MailyMailboxSearchQuery>(
  query: T,
  enabled: readonly MailyMailboxSearchFilter[]
): T {
  const disabled = MAILBOX_SEARCH_FILTERS.filter(
    (key) => !enabled.includes(key) && key in query
  );
  if (!disabled.length) return query;
  const next = { ...query };
  for (const key of disabled) delete next[key];
  return next;
}

/**
 * Serializes supported filters into Gmail-style query syntax for adapters whose
 * backend accepts this format. Other adapters can consume the structured type
 * directly and ignore this serializer.
 */
export function buildMailboxSearchQuery(
  query: MailyMailboxSearchQuery
): string {
  const terms: string[] = [];
  const add = (operator: string, value: string | undefined) => {
    const normalized = value?.trim();
    if (normalized) terms.push(`${operator}${quoteSearchValue(normalized)}`);
  };

  // Free text is an advanced query expression; preserve operators such as from:.
  if (query.text?.trim()) terms.push(query.text.trim());
  add('from:', query.from);
  add('to:', query.to);
  add('subject:', query.subject);
  add('after:', query.after);
  add('before:', query.before);
  if (query.unread) terms.push('is:unread');
  if (query.starred) terms.push('is:starred');
  if (query.hasAttachments) terms.push('has:attachment');
  add('label:', query.labelId ?? undefined);
  return terms.join(' ');
}

function quoteSearchValue(value: string): string {
  if (!/[\s"\\]/.test(value)) return value;
  return `"${value.replace(/["\\]/g, '\\$&')}"`;
}
