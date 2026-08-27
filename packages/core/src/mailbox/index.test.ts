// @vitest-environment happy-dom

import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, expect, it } from 'vitest';

import {
  MailboxView,
  type MailyMailboxDataSource,
  type MailyMailboxMessageDetail,
} from './index';
import { filterMailboxContactSuggestions } from './contacts';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const messageDetail: MailyMailboxMessageDetail = {
  id: 'msg-1',
  direction: 'in',
  fromAddress: 'sender@example.com',
  toAddresses: ['studio@maily.cn'],
  subject: 'Capability check',
  snippet: 'Action buttons must be explicit.',
  status: 'sent',
  createdAt: '2026-08-27T09:00:00.000Z',
  bodyText: 'Body',
};

function createDataSource(
  overrides: Partial<MailyMailboxDataSource> = {}
): MailyMailboxDataSource {
  return {
    listMessages: () => ({ items: [messageDetail], nextCursor: null }),
    getMessage: () => messageDetail,
    createDraft: () => ({ id: 'draft-1' }),
    updateDraft: () => ({ id: 'draft-1' }),
    discardDraft: () => undefined,
    sendDraft: () => undefined,
    ...overrides,
  };
}

async function renderSelectedMailbox(
  props: Partial<React.ComponentProps<typeof MailboxView>> = {}
) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      React.createElement(MailboxView, {
        dataSource: createDataSource(),
        pollIntervalMs: 0,
        ...props,
      })
    );
  });
  await act(async () => {
    await Promise.resolve();
  });

  const messageButton = Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent?.includes('Capability check')
  );
  expect(messageButton).toBeTruthy();

  await act(async () => {
    messageButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await act(async () => {
    await Promise.resolve();
  });

  return {
    container,
    unmount: () => {
      let mountedRoot: Root | null = root;
      act(() => {
        mountedRoot?.unmount();
        mountedRoot = null;
      });
      container.remove();
    },
  };
}

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

describe('MailboxView message actions', () => {
  it('does not render backend action controls without a message action runner', async () => {
    const rendered = await renderSelectedMailbox({
      dataSource: createDataSource(),
      messageActions: ['archive', 'delete', 'markUnread'],
    });

    try {
      expect(
        rendered.container.querySelector('[aria-label="Reply"]')
      ).toBeTruthy();
      expect(
        rendered.container.querySelector('[aria-label="Forward"]')
      ).toBeTruthy();
      expect(
        rendered.container.querySelector('[aria-label="Archive"]')
      ).toBeNull();
      expect(
        rendered.container.querySelector('[aria-label="Delete"]')
      ).toBeNull();
      expect(
        rendered.container.querySelector('[aria-label="More"]')
      ).toBeNull();
    } finally {
      rendered.unmount();
    }
  });

  it('renders only explicitly enabled backend action controls', async () => {
    const rendered = await renderSelectedMailbox({
      dataSource: createDataSource({
        runMessageAction: () => undefined,
      }),
      messageActions: ['delete', 'markUnread'],
    });

    try {
      expect(
        rendered.container.querySelector('[aria-label="Delete"]')
      ).toBeTruthy();
      expect(
        rendered.container.querySelector('[aria-label="Mark as unread"]')
      ).toBeTruthy();
      expect(
        rendered.container.querySelector('[aria-label="More"]')
      ).toBeTruthy();
      expect(
        rendered.container.querySelector('[aria-label="Archive"]')
      ).toBeNull();
      expect(
        rendered.container.querySelector('[aria-label="Report spam"]')
      ).toBeNull();
    } finally {
      rendered.unmount();
    }
  });
});
