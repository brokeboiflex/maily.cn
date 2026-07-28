import { describe, expect, it } from 'vitest';

import { filterMailboxContactSuggestions } from './contacts';

describe('filterMailboxContactSuggestions', () => {
  const contacts = [
    { address: 'mia@northstar.example', displayName: 'Mia Nowak' },
    { address: 'team@veyme.example', displayName: 'Veyme Team' },
    { address: 'ops@maily.cn', displayName: 'Maily Operations' },
  ];

  it('matches contacts by display name', () => {
    expect(filterMailboxContactSuggestions(contacts, 'veyme')).toEqual([
      contacts[1],
    ]);
  });

  it('matches contacts by email address', () => {
    expect(filterMailboxContactSuggestions(contacts, 'maily.cn')).toEqual([
      contacts[2],
    ]);
  });

  it('deduplicates by address and respects the limit', () => {
    expect(
      filterMailboxContactSuggestions(
        [
          contacts[0],
          { address: 'MIA@northstar.example', displayName: 'Duplicate' },
          contacts[1],
        ],
        'example',
        1
      )
    ).toEqual([contacts[0]]);
  });
});
