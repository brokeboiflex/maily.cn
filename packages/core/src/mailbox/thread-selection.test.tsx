// @vitest-environment happy-dom

import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import {
  MailboxView,
  type MailyMailboxDataSource,
  type MailyMailboxMessageDetail,
  type MailyMailboxThread,
} from './index';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((accept) => {
    resolve = accept;
  });
  return { promise, resolve };
}

it('retains an already loaded conversation when message detail arrives later and rejects a stale conversation after selection', async () => {
  const first: MailyMailboxMessageDetail = {
    id: 'first',
    threadId: 'first-thread',
    direction: 'in',
    fromAddress: 'sender@example.com',
    toAddresses: ['me@example.com'],
    subject: 'First subject',
    status: 'sent',
    createdAt: '2026-10-09',
    bodyText: 'First body',
  };
  const second = {
    ...first,
    id: 'second',
    threadId: 'second-thread',
    subject: 'Second subject',
    bodyText: 'Second body',
  };
  const firstDetail = deferred<MailyMailboxMessageDetail>();
  const secondThread = deferred<MailyMailboxThread>();
  const dataSource: MailyMailboxDataSource = {
    listMessages: () => ({ items: [first, second] }),
    getMessage: (id) => (id === first.id ? firstDetail.promise : second),
    getThread: (id) =>
      id === first.threadId
        ? {
            threadId: id,
            messages: [
              first,
              { ...first, id: 'older', bodyText: 'Earlier conversation body' },
            ],
          }
        : secondThread.promise,
    createDraft: () => ({ id: 'draft' }),
    updateDraft: () => ({ id: 'draft' }),
    discardDraft: () => undefined,
    sendDraft: () => undefined,
  };
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const clickSubject = async (subject: string) => {
    await act(async () => {
      const button = Array.from(container.querySelectorAll('button')).find(
        (node) => node.textContent?.includes(subject)
      );
      expect(button).toBeTruthy();
      button!.click();
    });
  };
  try {
    await act(async () => {
      root.render(<MailboxView dataSource={dataSource} pollIntervalMs={0} />);
    });
    await clickSubject('First subject');
    await act(async () => {
      firstDetail.resolve(first);
    });
    expect(container.textContent).toContain('Earlier conversation body');
    await clickSubject('Second subject');
    expect(container.textContent).not.toContain('Earlier conversation body');
    await clickSubject('First subject');
    await act(async () => {
      secondThread.resolve({
        threadId: second.threadId,
        messages: [{ ...second, bodyText: 'Stale second conversation' }],
      });
    });
    expect(container.textContent).toContain('Earlier conversation body');
    expect(container.textContent).not.toContain('Stale second conversation');
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  }
});

it('preserves the observed reply header and revision when paging while editing a reopened draft', async () => {
  const draft: MailyMailboxMessageDetail = {
    id: 'reply-draft',
    direction: 'out',
    fromAddress: 'me@example.com',
    toAddresses: ['sender@example.com'],
    subject: 'Reply draft',
    status: 'draft',
    createdAt: '2026-10-09',
    bodyText: 'Reply',
    inReplyTo: '<original@example.com>',
    _revision: 'observed-revision',
  };
  let saved: Parameters<MailyMailboxDataSource['updateDraft']>[1] | undefined;
  const dataSource: MailyMailboxDataSource = {
    listMessages: ({ cursor }) => ({
      items: cursor
        ? [{ ...draft, id: 'older', subject: 'Older draft' }]
        : [draft],
      nextCursor: cursor ? null : 'older-page',
    }),
    getMessage: () => draft,
    createDraft: () => ({ id: 'new' }),
    updateDraft: (_id, values) => {
      saved = values;
      return { id: draft.id, _revision: 'next-revision' };
    },
    discardDraft: () => undefined,
    sendDraft: () => undefined,
  };
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const click = async (match: (button: HTMLButtonElement) => boolean) => {
    await act(async () => {
      const button = Array.from(container.querySelectorAll('button')).find(
        match
      );
      expect(button).toBeTruthy();
      button!.click();
    });
  };
  try {
    await act(async () => {
      root.render(
        <MailboxView
          dataSource={dataSource}
          initialFolder="drafts"
          pollIntervalMs={0}
        />
      );
    });
    await click((button) => !!button.textContent?.includes('Reply draft'));
    await click((button) => button.getAttribute('aria-label') === 'Older');
    await click((button) => button.textContent?.trim() === 'Save draft');
    expect(saved?.inReplyTo).toBe('<original@example.com>');
    expect(saved?.revision).toBe('observed-revision');
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  }
});
