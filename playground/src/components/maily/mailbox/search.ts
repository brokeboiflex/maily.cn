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
