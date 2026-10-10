// @vitest-environment happy-dom

import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';

import {
  MailboxView,
  type MailyMailboxDataSource,
  type MailyMailboxMessageDetail,
  type MailyMailboxMessageRow,
} from './index';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const row = (
  id: string,
  subject: string,
  overrides: Partial<MailyMailboxMessageRow> = {}
): MailyMailboxMessageRow => ({
  id,
  direction: 'in',
  fromAddress: 'sender@example.com',
  toAddresses: ['me@example.com'],
  subject,
  status: 'sent',
  createdAt: `2026-10-09T00:00:00.000Z`,
  ...overrides,
});

const detail = (
  message: MailyMailboxMessageRow,
  overrides: Partial<MailyMailboxMessageDetail> = {}
): MailyMailboxMessageDetail => ({
  ...message,
  bodyText: 'Message body',
  ...overrides,
});

function createDataSource(
  overrides: Partial<MailyMailboxDataSource> = {}
): MailyMailboxDataSource {
  const first = detail(row('message-1', 'Feature subject'));
  return {
    listMessages: () => ({ items: [first], nextCursor: null }),
    getMessage: () => first,
    createDraft: () => ({ id: 'draft-1' }),
    updateDraft: () => ({ id: 'draft-1' }),
    discardDraft: () => undefined,
    sendDraft: () => undefined,
    ...overrides,
  };
}

async function renderMailbox(
  dataSource: MailyMailboxDataSource,
  props: Partial<React.ComponentProps<typeof MailboxView>> = {}
) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      React.createElement(MailboxView, {
        dataSource,
        pollIntervalMs: 0,
        account: { id: 'account-1', address: 'me@example.com' },
        ...props,
      })
    );
    await Promise.resolve();
  });
  await flush();

  return {
    container,
    replaceDataSource: async (next: MailyMailboxDataSource) => {
      await act(async () => {
        root.render(
          React.createElement(MailboxView, {
            dataSource: next,
            pollIntervalMs: 0,
            account: { id: 'account-1', address: 'me@example.com' },
            ...props,
          })
        );
      });
      await flush();
    },
    click: async (selector: string) => {
      await act(async () => {
        const target = container.querySelector<HTMLElement>(selector);
        expect(target, `Expected ${selector} to exist`).toBeTruthy();
        target!.click();
        await Promise.resolve();
      });
    },
    clickButtonText: async (text: string) => {
      await act(async () => {
        const target = Array.from(container.querySelectorAll('button')).find(
          (button) => button.textContent?.trim() === text
        );
        expect(target, `Expected button with text ${text}`).toBeTruthy();
        target!.click();
        await Promise.resolve();
      });
    },
    clickButtonContaining: async (text: string) => {
      await act(async () => {
        const target = Array.from(container.querySelectorAll('button')).find(
          (button) => button.textContent?.includes(text)
        );
        expect(target, `Expected a button containing ${text}`).toBeTruthy();
        target!.click();
        await Promise.resolve();
      });
    },
    edit: async (selector: string, value: string) => {
      await act(async () => {
        const input = container.querySelector<HTMLInputElement>(selector)!;
        expect(input).toBeTruthy();
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value'
        )!.set!.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    },
    upload: async (file: File) => {
      await act(async () => {
        const input =
          container.querySelector<HTMLInputElement>('input[type="file"]')!;
        expect(input).toBeTruthy();
        Object.defineProperty(input, 'files', {
          configurable: true,
          value: [file],
        });
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    },
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('MailboxView feature contracts', () => {
  it('replaces the list with a message and restores its page, selection, scroll and focus on Back', async () => {
    const first = detail(row('message-1', 'First page'));
    const second = detail(row('message-2', 'Second page'));
    const listMessages = vi.fn(({ cursor }) =>
      cursor
        ? { items: [second], nextCursor: null, total: 2 }
        : { items: [first], nextCursor: 'second', total: 2 }
    );
    const rendered = await renderMailbox(
      createDataSource({
        listMessages,
        getMessage: (id) => (id === second.id ? second : first),
        runBulkMessageAction: () => undefined,
      }),
      { pageSize: 1, messageActions: ['delete'] }
    );
    try {
      await rendered.click('[aria-label="Older"]');
      await rendered.click('[aria-label="Select all on this page"]');
      const trigger = Array.from(
        rendered.container.querySelectorAll('button')
      ).find((el) => el.textContent?.includes('Second page'))!;
      const listPage = trigger.closest('[tabindex="-1"]') as HTMLElement;
      const viewport = listPage.querySelector(
        '[data-slot="scroll-area-viewport"]'
      )!;
      viewport.scrollTop = 80;
      trigger.focus();
      await rendered.clickButtonContaining('Second page');
      expect(listPage.hidden).toBe(true);
      expect(rendered.container.querySelector('article')).toBeTruthy();
      await rendered.click('[aria-label="Back to list"]');
      expect(listPage.hidden).toBe(false);
      expect(viewport.scrollTop).toBe(80);
      expect(document.activeElement).toBe(trigger);
      expect(rendered.container.querySelector('article')).toBeNull();
      expect(listPage.textContent).toContain('2–2 of 2');
      expect(
        listPage
          .querySelector('[aria-label="Select all on this page"]')
          ?.getAttribute('aria-checked')
      ).toBe('true');
      expect(listMessages).toHaveBeenCalledTimes(2);
    } finally {
      rendered.unmount();
    }
  });

  it('requests controlled Back without hiding a reader the host has kept selected', async () => {
    const onSelectedMessageIdChange = vi.fn();
    const rendered = await renderMailbox(createDataSource(), {
      selectedMessageId: 'message-1',
      onSelectedMessageIdChange,
    });
    try {
      await rendered.click('[aria-label="Back to list"]');
      expect(onSelectedMessageIdChange).toHaveBeenCalledWith(null);
      expect(rendered.container.querySelector('article')).toBeTruthy();
      expect(rendered.container.querySelector('[hidden]')).toBeTruthy();
    } finally {
      rendered.unmount();
    }
  });

  it('keeps Back available while a message request is pending and ignores its stale result', async () => {
    const pending = deferred<MailyMailboxMessageDetail>();
    const rendered = await renderMailbox(
      createDataSource({ getMessage: () => pending.promise })
    );
    try {
      await rendered.clickButtonContaining('Feature subject');
      await rendered.click('[aria-label="Back to list"]');
      await act(async () => {
        pending.resolve(detail(row('message-1', 'Feature subject')));
      });
      expect(rendered.container.querySelector('article')).toBeNull();
      expect(
        rendered.container.querySelector('[aria-label="Back to list"]')
      ).toBeNull();
      expect(
        rendered.container
          .querySelector('[tabindex="-1"]')
          ?.hasAttribute('hidden')
      ).toBe(false);
    } finally {
      rendered.unmount();
    }
  });

  it('protects dirty compose when Back is requested', async () => {
    const rendered = await renderMailbox(createDataSource());
    try {
      await rendered.click('[aria-label="Compose"]');
      await rendered.edit('input[name="subject"]', 'Unsaved draft');
      await rendered.click('[aria-label="Back to list"]');
      expect(
        document.querySelector('[data-slot="dialog-content"]')
      ).toBeTruthy();
      expect(
        rendered.container.querySelector('input[name="subject"]')
      ).toBeTruthy();
      const stay = Array.from(document.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Keep editing'
      );
      expect(stay).toBeTruthy();
      await act(async () => stay!.click());
      expect(
        (
          rendered.container.querySelector(
            'input[name="subject"]'
          ) as HTMLInputElement
        ).value
      ).toBe('Unsaved draft');
    } finally {
      rendered.unmount();
    }
  });

  it('supports remove-only label hosts without showing an inert apply action', async () => {
    const removeLabel = vi.fn();
    const rendered = await renderMailbox(
      createDataSource({
        listMessages: () => ({
          items: [
            row('message-1', 'Feature subject', {
              labels: ['remove-label-id'],
            }),
          ],
        }),
        listLabels: () => [
          { id: 'remove-label-id', name: 'Projects' },
          { id: 'absent-label', name: 'Other' },
        ],
        removeLabel,
      })
    );
    try {
      await rendered.click('[aria-label="Select all on this page"]');
      const trigger = Array.from(
        rendered.container.querySelectorAll('button')
      ).find(
        (button) => button.getAttribute('aria-label') === 'Remove label'
      ) as HTMLButtonElement;
      expect(trigger).toBeTruthy();
      await act(async () => {
        trigger.click();
      });
      const panel = document.querySelector('[data-slot="popover-content"]')!;
      expect(panel.textContent).toContain('Projects');
      expect(
        Array.from(panel.querySelectorAll('button')).some(
          (button) => button.textContent?.trim() === 'Projects'
        )
      ).toBe(false);
      const remove = panel.querySelector<HTMLButtonElement>(
        '[role="checkbox"][aria-checked="true"]'
      );
      expect(remove).toBeTruthy();
      expect(
        panel.querySelector<HTMLButtonElement>(
          '[role="checkbox"][aria-checked="false"]'
        )?.disabled
      ).toBe(true);
      await act(async () => {
        remove!.click();
      });
      expect(removeLabel).toHaveBeenCalledWith(
        ['message-1'],
        'remove-label-id'
      );
    } finally {
      rendered.unmount();
    }
  });

  it('resets global search before showing a specific destructive-action folder', async () => {
    const listMessages = vi.fn(() => ({ items: [], nextCursor: null }));
    const rendered = await renderMailbox(createDataSource({ listMessages }));
    try {
      await rendered.edit('[aria-label="Search mail"]', 'invoice');
      await flush();
      expect(listMessages).toHaveBeenLastCalledWith(
        expect.objectContaining({ folder: 'allMail' })
      );
      await rendered.click('[aria-label="Spam"]');
      await flush();
      expect(listMessages).toHaveBeenLastCalledWith(
        expect.objectContaining({ folder: 'spam', q: undefined })
      );
      await rendered.click('[aria-label="Trash"]');
      await flush();
      expect(listMessages).toHaveBeenLastCalledWith(
        expect.objectContaining({ folder: 'trash', q: undefined })
      );
    } finally {
      rendered.unmount();
    }
  });

  it('selects all loaded page ids while row selection stays within its conversation', async () => {
    const runBulkMessageAction = vi.fn();
    const messages = [
      row('thread-one-a', 'Thread one', { threadId: 'thread-one' }),
      row('thread-one-b', 'Thread one latest', { threadId: 'thread-one' }),
      row('thread-two', 'Thread two', { threadId: 'thread-two' }),
    ];
    const rendered = await renderMailbox(
      createDataSource({
        listMessages: () => ({ items: messages }),
        runBulkMessageAction,
      }),
      { messageActions: ['archive'] }
    );
    try {
      await rendered.click(
        '[aria-label="Select conversation: Thread one latest"]'
      );
      await rendered.click('[aria-label="Archive"]');
      expect(runBulkMessageAction).toHaveBeenNthCalledWith(1, {
        messageIds: ['thread-one-a', 'thread-one-b'],
        action: 'archive',
        value: undefined,
      });
      await flush();
      await rendered.click('[aria-label="Select all on this page"]');
      await rendered.click('[aria-label="Archive"]');
      expect(runBulkMessageAction).toHaveBeenNthCalledWith(2, {
        messageIds: ['thread-one-a', 'thread-one-b', 'thread-two'],
        action: 'archive',
        value: undefined,
      });
    } finally {
      rendered.unmount();
    }
  });

  it('uses host label ids and excludes repeated apply mutations', async () => {
    const pending = deferred<void>();
    const applyLabel = vi.fn(() => pending.promise);
    const rendered = await renderMailbox(
      createDataSource({
        listLabels: () => [{ id: 'host-label', name: 'Projects' }],
        applyLabel,
      })
    );
    try {
      await rendered.click('[aria-label="Select all on this page"]');
      await rendered.click('[aria-label="Apply label"]');
      const target = document.querySelector<HTMLButtonElement>(
        '[data-slot="popover-content"] [role="checkbox"]'
      )!;
      expect(target).toBeTruthy();
      await act(async () => {
        target.click();
        target.click();
      });
      expect(applyLabel).toHaveBeenCalledTimes(1);
      expect(applyLabel).toHaveBeenCalledWith(['message-1'], 'host-label');
      pending.resolve();
      await flush();
    } finally {
      rendered.unmount();
    }
  });

  it('discards a stale upload after host replacement even when callbacks are reused', async () => {
    const pending = deferred<{ id: string; filename: string }>();
    const uploadAttachment = vi.fn(() => pending.promise);
    const discardUploadedAttachment = vi.fn();
    const source = createDataSource({
      uploadAttachment,
      discardUploadedAttachment,
    });
    const rendered = await renderMailbox(source, {
      defaultComposeBodyMode: 'plainText',
    });
    try {
      await rendered.click('[aria-label="Compose"]');
      await rendered.upload(new File(['file'], 'stale.txt'));
      await rendered.replaceDataSource(
        createDataSource({ uploadAttachment, discardUploadedAttachment })
      );
      const attachment = { id: 'previous-host-upload', filename: 'stale.txt' };
      pending.resolve(attachment);
      await flush();
      expect(discardUploadedAttachment).toHaveBeenCalledWith(attachment);
      expect(rendered.container.textContent).not.toContain('stale.txt');
    } finally {
      rendered.unmount();
    }
  });

  it('does not carry an undo receipt into another host lifetime', async () => {
    const oldUndo = vi.fn();
    const newUndo = vi.fn();
    const rendered = await renderMailbox(
      createDataSource({
        runMessageAction: () => ({ undo: { token: 'old-host-token' } }),
        undoMessageAction: oldUndo,
      }),
      { messageActions: ['archive'] }
    );
    try {
      await rendered.clickButtonContaining('Feature subject');
      await rendered.click('[aria-label="Archive"]');
      await flush();
      expect(rendered.container.textContent).toContain('Undo');
      await rendered.replaceDataSource(
        createDataSource({
          runMessageAction: vi.fn(),
          undoMessageAction: newUndo,
        })
      );
      expect(
        Array.from(rendered.container.querySelectorAll('button')).some(
          (button) => button.textContent?.trim() === 'Undo'
        )
      ).toBe(false);
      expect(oldUndo).not.toHaveBeenCalled();
      expect(newUndo).not.toHaveBeenCalled();
    } finally {
      rendered.unmount();
    }
  });

  it('does not discard a persisted attachment when removing its draft reference', async () => {
    const message = detail(
      row('draft-1', 'Existing draft', { status: 'draft' }),
      {
        attachments: [{ id: 'persisted-object', filename: 'persisted.txt' }],
        _revision: 'original-v1',
      }
    );
    const discardUploadedAttachment = vi.fn();
    const updateDraft = vi.fn(() => ({ id: 'draft-1', _revision: 'v2' }));
    const rendered = await renderMailbox(
      createDataSource({
        listMessages: () => ({ items: [message] }),
        getMessage: () => message,
        discardUploadedAttachment,
        updateDraft,
      }),
      { initialFolder: 'drafts', defaultComposeBodyMode: 'plainText' }
    );
    try {
      await rendered.clickButtonContaining('Existing draft');
      await flush();
      await rendered.click('[aria-label="Remove persisted.txt"]');
      await rendered.clickButtonText('Save draft');
      expect(updateDraft).toHaveBeenCalledWith(
        'draft-1',
        expect.objectContaining({ attachments: [], revision: 'original-v1' })
      );
      expect(discardUploadedAttachment).not.toHaveBeenCalled();
    } finally {
      rendered.unmount();
    }
    expect(discardUploadedAttachment).not.toHaveBeenCalled();
  });

  it('retains editable content after autosave failure without retrying indefinitely', async () => {
    vi.useFakeTimers();
    const createDraft = vi.fn().mockRejectedValue(new Error('Host rejected'));
    const rendered = await renderMailbox(createDataSource({ createDraft }), {
      defaultComposeBodyMode: 'plainText',
    });
    try {
      await rendered.click('[aria-label="Compose"]');
      await rendered.edit('input[name="subject"]', 'Keep my edits');
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(createDraft).toHaveBeenCalledTimes(1);
      expect(
        (
          rendered.container.querySelector(
            'input[name="subject"]'
          ) as HTMLInputElement
        ).value
      ).toBe('Keep my edits');
      expect(rendered.container.textContent).toContain(
        'Could not save the draft'
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });
      expect(createDraft).toHaveBeenCalledTimes(1);
    } finally {
      rendered.unmount();
      vi.useRealTimers();
    }
  });

  it('protects dirty compose navigation until the user confirms', async () => {
    const rendered = await renderMailbox(createDataSource(), {
      defaultComposeBodyMode: 'plainText',
    });
    const portalButton = async (text: string) => {
      await act(async () => {
        const target = Array.from(
          document.querySelectorAll('[data-slot="dialog-content"] button')
        ).find(
          (button) => button.textContent?.trim() === text
        ) as HTMLButtonElement;
        expect(target).toBeTruthy();
        target.click();
      });
    };
    try {
      await rendered.click('[aria-label="Compose"]');
      await rendered.edit('input[name="subject"]', 'Unsaved content');
      await rendered.click('[aria-label="Sent"]');
      expect(document.body.textContent).toContain('Discard unsaved changes?');
      await portalButton('Keep editing');
      expect(
        (
          rendered.container.querySelector(
            'input[name="subject"]'
          ) as HTMLInputElement
        ).value
      ).toBe('Unsaved content');
      await rendered.click('[aria-label="Sent"]');
      await portalButton('Discard');
      expect(
        rendered.container.querySelector('input[name="subject"]')
      ).toBeNull();
    } finally {
      rendered.unmount();
    }
  });

  it('expires undo receipts without dispatching host mutations', async () => {
    vi.useFakeTimers();
    const undoMessageAction = vi.fn();
    const rendered = await renderMailbox(
      createDataSource({
        runMessageAction: () => ({
          undo: { token: 'expires', expiresAt: Date.now() + 100 },
        }),
        undoMessageAction,
      }),
      { messageActions: ['archive'] }
    );
    try {
      await rendered.clickButtonContaining('Feature subject');
      await rendered.click('[aria-label="Archive"]');
      await flush();
      expect(rendered.container.textContent).toContain('Undo');
      await act(async () => {
        await vi.advanceTimersByTimeAsync(101);
      });
      expect(
        Array.from(rendered.container.querySelectorAll('button')).some(
          (button) => button.textContent?.trim() === 'Undo'
        )
      ).toBe(false);
      expect(undoMessageAction).not.toHaveBeenCalled();
    } finally {
      rendered.unmount();
      vi.useRealTimers();
    }
  });

  it('keeps newer edits after an acknowledged save and forwards its revision', async () => {
    const pending = deferred<{ id: string; _revision: string }>();
    const createDraft = vi.fn(() => pending.promise);
    const updateDraft = vi.fn(() => ({
      id: 'draft-1',
      _revision: 'revision-2',
    }));
    const rendered = await renderMailbox(
      createDataSource({ createDraft, updateDraft }),
      { defaultComposeBodyMode: 'plainText' }
    );
    try {
      await rendered.click('[aria-label="Compose"]');
      await rendered.edit('input[name="subject"]', 'First version');
      await rendered.clickButtonText('Save draft');
      await rendered.edit('input[name="subject"]', 'Newer version');
      pending.resolve({ id: 'draft-1', _revision: 'revision-1' });
      await flush();
      await rendered.clickButtonText('Save draft');
      expect(updateDraft).toHaveBeenCalledWith(
        'draft-1',
        expect.objectContaining({
          subject: 'Newer version',
          revision: 'revision-1',
        })
      );
      expect(createDraft).toHaveBeenCalledTimes(1);
    } finally {
      rendered.unmount();
    }
  });

  it('cleans up a completed upload after its compose session unmounts', async () => {
    const pending = deferred<{ id: string; filename: string }>();
    const discardUploadedAttachment = vi.fn();
    const rendered = await renderMailbox(
      createDataSource({
        uploadAttachment: () => pending.promise,
        discardUploadedAttachment,
      }),
      { defaultComposeBodyMode: 'plainText' }
    );
    await rendered.click('[aria-label="Compose"]');
    await rendered.upload(new File(['file'], 'stale.txt'));
    rendered.unmount();
    const attachment = { id: 'uploaded-stale', filename: 'stale.txt' };
    pending.resolve(attachment);
    await flush();
    expect(discardUploadedAttachment).toHaveBeenCalledWith(attachment);
  });

  it('persists upload references with draft content', async () => {
    const attachment = { id: 'host-object-1', filename: 'file.txt', size: 4 };
    const createDraft = vi.fn(() => ({ id: 'draft-1', _revision: 'v1' }));
    const rendered = await renderMailbox(
      createDataSource({ uploadAttachment: () => attachment, createDraft }),
      { defaultComposeBodyMode: 'plainText' }
    );
    try {
      await rendered.click('[aria-label="Compose"]');
      await rendered.upload(new File(['file'], 'file.txt'));
      await flush();
      await rendered.clickButtonText('Save draft');
      expect(createDraft).toHaveBeenCalledWith(
        expect.objectContaining({ attachments: [attachment] })
      );
    } finally {
      rendered.unmount();
    }
  });

  it('replaces pages and navigates back through host cursors', async () => {
    const listMessages = vi.fn(({ cursor }: { cursor?: string }) =>
      cursor
        ? {
            items: [
              row('same', 'Updated subject'),
              row('second', 'Second row'),
            ],
            nextCursor: null,
          }
        : { items: [row('same', 'Original subject')], nextCursor: 'page-two' }
    );
    const rendered = await renderMailbox(createDataSource({ listMessages }));
    try {
      await rendered.click('[aria-label="Older"]');
      await flush();
      expect(listMessages).toHaveBeenLastCalledWith(
        expect.objectContaining({ cursor: 'page-two' })
      );
      expect(rendered.container.textContent).not.toContain('Original subject');
      expect(rendered.container.textContent).toContain('Updated subject');
      expect(rendered.container.textContent).toContain('Second row');
      expect(
        Array.from(rendered.container.querySelectorAll('button')).filter(
          (button) => button.textContent?.includes('Updated subject')
        )
      ).toHaveLength(1);
      await rendered.click('[aria-label="Newer"]');
      await flush();
      expect(listMessages).toHaveBeenLastCalledWith(
        expect.objectContaining({ cursor: undefined })
      );
      expect(rendered.container.textContent).toContain('Original subject');
      expect(rendered.container.textContent).not.toContain('Second row');
    } finally {
      rendered.unmount();
    }
  });

  it('excludes duplicate paging and ignores its result after folder navigation', async () => {
    const pending = deferred<{
      items: MailyMailboxMessageRow[];
      nextCursor: null;
    }>();
    const listMessages = vi.fn(
      ({ folder, cursor }: { folder: string; cursor?: string }) => {
        if (folder === 'sent')
          return { items: [row('sent-page', 'Sent page')], nextCursor: null };
        if (cursor) return pending.promise;
        return {
          items: [row('inbox-page', 'Inbox page')],
          nextCursor: 'older-page',
        };
      }
    );
    const rendered = await renderMailbox(createDataSource({ listMessages }));
    try {
      await rendered.click('[aria-label="Older"]');
      await rendered.click('[aria-label="Older"]');
      expect(
        listMessages.mock.calls.filter(
          ([input]) => input.cursor === 'older-page'
        )
      ).toHaveLength(1);
      await rendered.click('[aria-label="Sent"]');
      await flush();
      pending.resolve({
        items: [row('stale-page', 'Stale older page')],
        nextCursor: null,
      });
      await flush();
      expect(rendered.container.textContent).toContain('Sent page');
      expect(rendered.container.textContent).not.toContain('Stale older page');
      expect(
        rendered.container.querySelector<HTMLButtonElement>(
          '[aria-label="Newer"]'
        )?.disabled
      ).toBe(true);
    } finally {
      rendered.unmount();
    }
  });

  it('returns to the preceding page when mutation removes the final page', async () => {
    let removed = false;
    const first = row('first-page', 'First page row');
    const last = row('last-page', 'Last page row');
    const listMessages = vi.fn(({ cursor }: { cursor?: string }) =>
      cursor
        ? { items: removed ? [] : [last], nextCursor: null }
        : {
            items: [first],
            nextCursor: removed ? null : 'last-cursor',
            total: removed ? 1 : 2,
          }
    );
    const rendered = await renderMailbox(
      createDataSource({
        listMessages,
        getMessage: () => detail(last),
        runMessageAction: () => {
          removed = true;
        },
      }),
      { messageActions: ['archive'] }
    );
    try {
      await rendered.click('[aria-label="Older"]');
      await flush();
      expect(rendered.container.textContent).not.toContain('First page row');
      await rendered.clickButtonContaining('Last page row');
      await flush();
      await rendered.click('[aria-label="Archive"]');
      await flush();
      expect(rendered.container.textContent).toContain('First page row');
      expect(rendered.container.textContent).not.toContain('Last page row');
      expect(
        rendered.container.querySelector<HTMLButtonElement>(
          '[aria-label="Newer"]'
        )?.disabled
      ).toBe(true);
    } finally {
      rendered.unmount();
    }
  });

  it('excludes duplicate bulk dispatch while the host action is pending', async () => {
    const pending = deferred<void>();
    const runBulkMessageAction = vi.fn(() => pending.promise);
    const rendered = await renderMailbox(
      createDataSource({ runMessageAction: vi.fn(), runBulkMessageAction }),
      { messageActions: ['archive'] }
    );
    try {
      await rendered.click('[aria-label="Select all on this page"]');
      await rendered.click('[aria-label="Archive"]');
      await rendered.click('[aria-label="Archive"]');
      expect(runBulkMessageAction).toHaveBeenCalledTimes(1);
      expect(runBulkMessageAction).toHaveBeenCalledWith({
        messageIds: ['message-1'],
        action: 'archive',
        value: undefined,
      });
      pending.resolve();
      await flush();
    } finally {
      rendered.unmount();
    }
  });

  it('enables bulk mutations for hosts with only the bulk capability', async () => {
    const runBulkMessageAction = vi.fn();
    const rendered = await renderMailbox(
      createDataSource({ runBulkMessageAction }),
      { messageActions: ['archive'] }
    );
    try {
      await rendered.click('[aria-label="Select all on this page"]');
      await rendered.click('[aria-label="Archive"]');
      expect(runBulkMessageAction).toHaveBeenCalledWith({
        messageIds: ['message-1'],
        action: 'archive',
        value: undefined,
      });
    } finally {
      rendered.unmount();
    }
  });

  it('uses only backend issued undo receipts and excludes concurrent undo calls', async () => {
    const undo = deferred<void>();
    const undoMessageAction = vi.fn(() => undo.promise);
    const rendered = await renderMailbox(
      createDataSource({
        runMessageAction: () => ({ undo: { token: 'host-receipt' } }),
        undoMessageAction,
      }),
      { messageActions: ['archive'] }
    );
    try {
      await rendered.clickButtonContaining('Feature subject');
      await rendered.click('[aria-label="Archive"]');
      await flush();
      await rendered.clickButtonText('Undo');
      await rendered.clickButtonText('Undo');
      expect(undoMessageAction).toHaveBeenCalledTimes(1);
      expect(undoMessageAction).toHaveBeenCalledWith('host-receipt');
      undo.resolve();
      await flush();
      expect(
        Array.from(rendered.container.querySelectorAll('button')).some(
          (button) => button.textContent?.trim() === 'Undo'
        )
      ).toBe(false);
    } finally {
      rendered.unmount();
    }
  });

  it('ignores an older page request after folder navigation and deduplicates page rows', async () => {
    const oldPage = deferred<{
      items: MailyMailboxMessageRow[];
      nextCursor: string | null;
    }>();
    const newPage = deferred<{
      items: MailyMailboxMessageRow[];
      nextCursor: string | null;
    }>();
    const listMessages = vi.fn(({ folder }: { folder: string }) =>
      folder === 'inbox' ? oldPage.promise : newPage.promise
    );
    const rendered = await renderMailbox(
      createDataSource({
        listMessages: listMessages as MailyMailboxDataSource['listMessages'],
      })
    );
    try {
      await rendered.click('[aria-label="Sent"]');
      newPage.resolve({
        items: [row('new', 'Newest folder')],
        nextCursor: null,
      });
      await flush();
      oldPage.resolve({
        items: [row('old', 'Stale folder')],
        nextCursor: null,
      });
      await flush();
      expect(rendered.container.textContent).toContain('Newest folder');
      expect(rendered.container.textContent).not.toContain('Stale folder');
    } finally {
      rendered.unmount();
    }
  });

  it('removes a message moved out of the folder after the host refreshes its first page', async () => {
    const original = detail(row('moved-1', 'Moved out of Inbox'));
    const listMessages = vi
      .fn()
      .mockReturnValueOnce({ items: [original], nextCursor: 'cursor-1' })
      .mockReturnValue({ items: [], nextCursor: null });
    const runMessageAction = vi.fn();
    const rendered = await renderMailbox(
      createDataSource({
        listMessages,
        getMessage: () => original,
        runMessageAction,
      }),
      { messageActions: ['archive'] }
    );
    try {
      await rendered.clickButtonContaining('Moved out of Inbox');
      await flush();
      await rendered.click('button[aria-label="Archive"]');
      await flush();
      expect(runMessageAction).toHaveBeenCalledWith({
        messageId: original.id,
        action: 'archive',
        value: undefined,
      });
      expect(rendered.container.textContent).not.toContain(
        'Moved out of Inbox'
      );
    } finally {
      rendered.unmount();
    }
  });

  it('requests markRead on open only when the host opts in', async () => {
    const message = detail(
      row('unread-1', 'Unread message', { isUnread: true })
    );
    const runMessageAction = vi.fn();
    const rendered = await renderMailbox(
      createDataSource({
        listMessages: () => ({ items: [message], nextCursor: null }),
        getMessage: () => message,
        runMessageAction,
      }),
      { markReadOnOpen: true, messageActions: ['markRead'] }
    );
    try {
      await rendered.clickButtonContaining('Unread message');
      await flush();
      expect(runMessageAction).toHaveBeenCalledWith({
        messageId: message.id,
        action: 'markRead',
        value: true,
      });
    } finally {
      rendered.unmount();
    }
  });

  it('keeps reply-all recipient placement and never carries Bcc into the draft', async () => {
    const message = detail(row('reply-1', 'Reply all contract'), {
      fromAddress: 'Sender <sender@example.com>',
      toAddresses: ['me@example.com', 'To person <to@example.com>'],
      ccAddresses: ['Cc person <cc@example.com>'],
      bccAddresses: ['Hidden <hidden@example.com>'],
    });
    const createDraft = vi.fn(() => ({ id: 'draft-1' }));
    const rendered = await renderMailbox(
      createDataSource({
        listMessages: () => ({ items: [message], nextCursor: null }),
        getMessage: () => message,
        createDraft,
      })
    );
    try {
      await rendered.clickButtonContaining('Reply all contract');
      await flush();
      await rendered.click('button[aria-label="Reply all"]');
      await rendered.clickButtonText('Save draft');
      expect(createDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['Sender <sender@example.com>', 'To person <to@example.com>'],
          cc: ['Cc person <cc@example.com>'],
          bcc: [],
        })
      );
      expect(JSON.stringify(createDraft.mock.calls)).not.toContain(
        'hidden@example.com'
      );
    } finally {
      rendered.unmount();
    }
  });

  it('gates markRead and bulk actions on explicit host capabilities', async () => {
    const message = detail(row('gate-1', 'Gated actions'));
    const rendered = await renderMailbox(
      createDataSource({
        listMessages: () => ({ items: [message], nextCursor: null }),
      }),
      { messageActions: ['markRead'] }
    );
    try {
      await rendered.clickButtonContaining('Gated actions');
      await flush();
      expect(
        rendered.container.querySelector('[aria-label="Mark as read"]')
      ).toBeNull();
      expect(
        rendered.container.querySelector(
          '[aria-label="Select all on this page"]'
        )
      ).toBeNull();
    } finally {
      rendered.unmount();
    }
  });
});

it('releases replaced-source pending UI and keeps new operations locked after old completion', async () => {
  const oldPending = deferred<MailyMailboxMessageDetail>();
  const newPending = deferred<MailyMailboxMessageDetail>();
  const newAction = vi.fn(() => newPending.promise);
  const rendered = await renderMailbox(
    createDataSource({ runMessageAction: () => oldPending.promise }),
    { messageActions: ['favorite'] }
  );
  try {
    await rendered.clickButtonContaining('Feature subject');
    await rendered.click('[aria-label="Add star"]');
    await rendered.replaceDataSource(
      createDataSource({ runMessageAction: newAction })
    );
    await rendered.click('[aria-label="Compose"]');
    expect(
      rendered.container.querySelector('input[name="subject"]')
    ).toBeTruthy();
    await rendered.click('[aria-label="Back to list"]');
    await rendered.clickButtonContaining('Feature subject');
    await rendered.click('[aria-label="Add star"]');
    oldPending.resolve(detail(row('message-1', 'Feature subject')));
    await flush();
    await rendered.click('[aria-label="Add star"]');
    expect(newAction).toHaveBeenCalledTimes(1);
    newPending.resolve(
      detail(row('message-1', 'Feature subject'), { isFavorite: true })
    );
    await flush();
    expect(
      rendered.container.querySelector('[aria-label="Remove star"]')
    ).toBeTruthy();
  } finally {
    rendered.unmount();
  }
});

it('rejects an initial label snapshot after a newer acknowledged label mutation', async () => {
  const initial = deferred<{ id: string; name: string }[]>();
  const created = { id: 'new-label', name: 'Created label' };
  const listLabels = vi
    .fn()
    .mockImplementationOnce(() => initial.promise)
    .mockResolvedValue([created]);
  const rendered = await renderMailbox(
    createDataSource({ listLabels, createLabel: () => created })
  );
  try {
    await rendered.click('[aria-label="Create label"]');
    await act(async () => {
      const dialog = document.querySelector('[role="dialog"]')!;
      const input = dialog.querySelector('input')!;
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, 'Created label');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () =>
      document
        .querySelector('[role="dialog"] form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    );
    await flush();
    expect(rendered.container.textContent).toContain('Created label');
    initial.resolve([{ id: 'stale-label', name: 'Stale label' }]);
    await flush();
    expect(rendered.container.textContent).toContain('Created label');
    expect(rendered.container.textContent).not.toContain('Stale label');
  } finally {
    rendered.unmount();
  }
});

it('keeps the mounted editor when the active Visual editor mode is selected again', async () => {
  const rendered = await renderMailbox(createDataSource(), {
    defaultComposeBodyMode: 'mailyEditor',
  });
  try {
    await rendered.click('[aria-label="Compose"]');
    await flush();
    const editor = rendered.container.querySelector<HTMLElement>('.tiptap');
    expect(editor).toBeTruthy();
    editor!.focus();
    await rendered.clickButtonText('Visual editor');
    expect(rendered.container.querySelector('.tiptap')).toBe(editor);
  } finally {
    rendered.unmount();
  }
});

it('keeps a pending initial label read valid when label creation rejects', async () => {
  const initial = deferred<{ id: string; name: string }[]>();
  const listLabels = vi.fn(() => initial.promise);
  const rendered = await renderMailbox(
    createDataSource({
      listLabels,
      createLabel: () => Promise.reject(Error('write rejected')),
    })
  );
  try {
    await rendered.click('[aria-label="Create label"]');
    await act(async () => {
      const dialog = document.querySelector('[role="dialog"]')!;
      const input = dialog.querySelector('input')!;
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, 'Rejected label');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () =>
      document
        .querySelector('[role="dialog"] form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    );
    await flush();
    initial.resolve([{ id: 'existing-label', name: 'Existing label' }]);
    await flush();
    expect(rendered.container.textContent).toContain('Existing label');
    expect(listLabels).toHaveBeenCalledTimes(1);
  } finally {
    rendered.unmount();
  }
});

it('returns a newly prepared draft to the Sent list after its pending send succeeds', async () => {
  const pending = deferred<void>();
  const sendDraft = vi.fn(() => pending.promise);
  const draft = detail(
    row('draft-1', 'Prepared draft', { direction: 'out', status: 'draft' })
  );
  const rendered = await renderMailbox(
    createDataSource({ sendDraft, getMessage: () => draft }),
    { account: { id: crypto.randomUUID(), address: 'me@example.com' } }
  );
  try {
    await rendered.click('[aria-label="Compose"]');
    await rendered.clickButtonText('Send');
    await flush();
    expect(sendDraft).toHaveBeenCalledWith('draft-1');
    pending.resolve();
    await flush();
    expect(
      rendered.container.querySelector('[aria-label="Back to list"]')
    ).toBeNull();
    expect(
      rendered.container.querySelector('input[name="subject"]')
    ).toBeNull();
    expect(
      rendered.container
        .querySelector('[aria-label="Sent"]')
        ?.getAttribute('aria-current')
    ).toBe('page');
  } finally {
    rendered.unmount();
  }
});
