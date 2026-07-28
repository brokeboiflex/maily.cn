export type MailyMailboxContactSuggestion = {
  id?: string;
  address: string;
  displayName?: string | null;
};

function contactSuggestionSearchText(
  suggestion: MailyMailboxContactSuggestion
): string {
  return [suggestion.displayName ?? '', suggestion.address]
    .join(' ')
    .toLowerCase();
}

export function filterMailboxContactSuggestions(
  contacts: MailyMailboxContactSuggestion[],
  q?: string,
  limit = 8
): MailyMailboxContactSuggestion[] {
  const query = (q ?? '').trim().toLowerCase();
  if (!query) return contacts.slice(0, limit);

  const seen = new Set<string>();
  const matches: MailyMailboxContactSuggestion[] = [];

  for (const contact of contacts) {
    const key = contact.address.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    if (!contactSuggestionSearchText(contact).includes(query)) continue;

    seen.add(key);
    matches.push(contact);
    if (matches.length >= limit) break;
  }

  return matches;
}
