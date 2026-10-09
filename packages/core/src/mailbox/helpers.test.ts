import { describe, expect, it } from 'vitest';

import {
  getMailboxConversationMetadata,
  groupMailboxMessagesByThread,
} from './conversations';
import { getMailboxReplyAllRecipients } from './reply-all';
import { buildMailboxSearchQuery } from './search';

describe('getMailboxReplyAllRecipients', () => {
  it('keeps original To and Cc placement and omits own aliases', () => {
    expect(
      getMailboxReplyAllRecipients(
        {
          fromAddress: 'Sender@example.com',
          toAddresses: ['me@example.com', 'team@example.com'],
          ccAddresses: ['TEAM@example.com', 'copy@example.com'],
        },
        ['ME@example.com', 'alias@example.com']
      )
    ).toEqual({
      to: ['Sender@example.com', 'team@example.com'],
      cc: ['copy@example.com'],
    });
  });

  it('deduplicates display names by parsed mailbox and accepts nullable own aliases', () => {
    expect(
      getMailboxReplyAllRecipients(
        {
          fromAddress: 'Sender Name <Sender@example.com>',
          toAddresses: [
            'sender@example.COM',
            'Me <me@example.com>',
            'Team <team@example.com>',
          ],
          ccAddresses: ['Team Duplicate <TEAM@example.COM>'],
        },
        [null, undefined, 'Alias <me@example.com>']
      )
    ).toEqual({
      to: ['Sender Name <Sender@example.com>', 'Team <team@example.com>'],
      cc: [],
    });
  });

  it('omits a self sender but keeps the other original To recipient in To', () => {
    expect(
      getMailboxReplyAllRecipients(
        {
          fromAddress: 'Me <me@example.com>',
          toAddresses: ['Other <other@example.com>'],
        },
        ['me@example.com']
      )
    ).toEqual({ to: ['Other <other@example.com>'], cc: [] });
  });
});

describe('buildMailboxSearchQuery', () => {
  it('preserves raw query operators and serializes structured filters', () => {
    expect(
      buildMailboxSearchQuery({
        text: 'launch OR has:drive from:query@example.com',
        from: 'ana@example.com',
        subject: 'Q4 review',
        after: '2026/01/01',
        unread: true,
        starred: true,
        hasAttachments: true,
        labelId: 'label with spaces',
        to: '  ',
      })
    ).toBe(
      'launch OR has:drive from:query@example.com from:ana@example.com subject:"Q4 review" after:2026/01/01 is:unread is:starred has:attachment label:"label with spaces"'
    );
  });

  it('preserves free-text query syntax literally', () => {
    expect(
      buildMailboxSearchQuery({
        text: 'from:ana@example.com {to:lee OR cc:lee}',
      })
    ).toBe('from:ana@example.com {to:lee OR cc:lee}');
  });
});

describe('mailbox conversations', () => {
  const messages = [
    {
      id: 'm1',
      threadId: 'provider-thread-1',
      fromAddress: 'a@example.com',
      toAddresses: ['b@example.com'],
      subject: 'First subject',
      createdAt: '2026-01-01T00:00:00Z',
      isUnread: true,
    },
    {
      id: 'm2',
      threadId: 'provider-thread-1',
      fromAddress: 'b@example.com',
      toAddresses: ['A@example.com'],
      subject: 'Updated subject',
      createdAt: '2026-01-02T00:00:00Z',
    },
    {
      id: 'm3',
      fromAddress: 'a@example.com',
      toAddresses: [],
      subject: 'Same subject',
      createdAt: '2026-01-03T00:00:00Z',
    },
    {
      id: 'm4',
      fromAddress: 'c@example.com',
      toAddresses: [],
      subject: 'Same subject',
      createdAt: '2026-01-04T00:00:00Z',
    },
  ];

  it('groups by explicit host thread IDs and keeps unthreaded messages separate', () => {
    const conversations = groupMailboxMessagesByThread(messages);
    expect(conversations).toHaveLength(3);
    expect(conversations[0]).toMatchObject({
      threadId: 'provider-thread-1',
      messages: [{ id: 'm1' }, { id: 'm2' }],
      subject: 'Updated subject',
      participants: ['a@example.com', 'b@example.com'],
      unreadCount: 1,
    });
    expect(conversations.slice(1).map((item) => item.messages[0].id)).toEqual([
      'm3',
      'm4',
    ]);
  });

  it('returns empty metadata safely', () => {
    expect(getMailboxConversationMetadata(null, [])).toMatchObject({
      threadId: null,
      messages: [],
      subject: null,
      participants: [],
      unreadCount: 0,
    });
  });

  it('keeps thread IDs distinct from unthreaded messages with the same value', () => {
    const groups = groupMailboxMessagesByThread([
      { ...messages[0], id: 'same', threadId: 'same' },
      { ...messages[1], id: 'same', threadId: null },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.threadId)).toEqual(['same', null]);
  });
});
