import { describe, expect, it } from 'vitest';

import {
  formatMailboxAddress,
  mailboxAddressOf,
  splitAddressList,
} from './addresses';
import { getMailboxReplyAllRecipients } from './reply-all';

describe('RFC 5322 address lists', () => {
  it('splits only on separators outside quotes, angle brackets and comments', () => {
    expect(
      splitAddressList(
        '"Doe, Jane" <jane@example.com>; ops@example.com,\n' +
          'Team (sales, EMEA) <team@example.com>, <odd,local@example.com>'
      )
    ).toEqual([
      '"Doe, Jane" <jane@example.com>',
      'ops@example.com',
      'Team (sales, EMEA) <team@example.com>',
      '<odd,local@example.com>',
    ]);
  });

  it('keeps escaped quotes inside a display name', () => {
    expect(
      splitAddressList('"Ann \\"A, B\\" Lee" <ann@example.com>, b@example.com')
    ).toEqual(['"Ann \\"A, B\\" Lee" <ann@example.com>', 'b@example.com']);
  });

  it('reads an unclosed quote, comment or bracket as text', () => {
    expect(
      splitAddressList('"Doe, Jane <jane@example.com>, bob@example.com')
    ).toEqual(['"Doe', 'Jane <jane@example.com>', 'bob@example.com']);
    expect(splitAddressList('a@example.com, (note, b@example.com')).toEqual([
      'a@example.com',
      '(note',
      'b@example.com',
    ]);
    expect(
      splitAddressList('a@example.com, <b@example.com, c@example.com')
    ).toEqual(['a@example.com', '<b@example.com', 'c@example.com']);
    expect(mailboxAddressOf('"Jane <jane@example.com>')).toBe(
      'jane@example.com'
    );
  });

  it('reads thousands of unclosed openers in one pass', () => {
    for (const opener of ['(', '<', '"\\']) {
      const typed = opener.repeat(20_000);
      expect(splitAddressList(`${typed}, b@example.com`)).toEqual([
        typed,
        'b@example.com',
      ]);
      expect(mailboxAddressOf(`${typed}<b@example.com>`)).toBe('b@example.com');
    }
  });

  it('drops empty entries', () => {
    expect(splitAddressList(' , ;\n a@example.com,, ')).toEqual([
      'a@example.com',
    ]);
  });

  it('quotes display names that contain specials and round-trips them', () => {
    const formatted = formatMailboxAddress('jane@example.com', 'Doe, Jane');
    expect(formatted).toBe('"Doe, Jane" <jane@example.com>');
    expect(splitAddressList(`${formatted}, b@example.com`)).toEqual([
      formatted,
      'b@example.com',
    ]);
    expect(formatMailboxAddress('j@example.com', 'J. "Jo" Doe')).toBe(
      '"J. \\"Jo\\" Doe" <j@example.com>'
    );
    expect(formatMailboxAddress('mia@example.com', 'Mia Nowak')).toBe(
      'Mia Nowak <mia@example.com>'
    );
    expect(formatMailboxAddress('mia@example.com', '  ')).toBe(
      'mia@example.com'
    );
  });

  it('reads the addr-spec outside quoted text and comments', () => {
    expect(mailboxAddressOf('"a <b@evil>" <real@example.com>')).toBe(
      'real@example.com'
    );
    expect(mailboxAddressOf(' plain@example.com ')).toBe('plain@example.com');
    expect(
      mailboxAddressOf('Jane <jane@example.com> (was <old@example.com>)')
    ).toBe('jane@example.com');
  });

  it('deduplicates reply-all recipients by quoted-name addr-spec', () => {
    expect(
      getMailboxReplyAllRecipients(
        {
          fromAddress: '"Doe, Jane" <JANE@example.com>',
          toAddresses: ['jane@example.com', 'me@example.com'],
        },
        ['me@example.com']
      )
    ).toEqual({ to: ['"Doe, Jane" <JANE@example.com>'], cc: [] });
  });
});
