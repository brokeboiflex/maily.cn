// @vitest-environment happy-dom

import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  MailboxView,
  type MailyMailboxDataSource,
  type MailyMailboxDraftInput,
  type MailyMailboxMessageDetail,
  type MailyMailboxUploadedAttachment,
  type MailyMailboxViewProps,
} from './index';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const message: MailyMailboxMessageDetail = {
  id: 'message-1',
  direction: 'in',
  fromAddress: 'sender@example.com',
  toAddresses: ['me@example.com'],
  subject: 'Original subject',
  status: 'sent',
  createdAt: '2026-10-22T09:00:00.000Z',
  bodyText: 'Original body',
};

function source(
  overrides: Partial<MailyMailboxDataSource> = {}
): MailyMailboxDataSource {
  return {
    listMessages: () => ({ items: [message], nextCursor: null }),
    getMessage: () => message,
    createDraft: () => ({ id: 'draft-1', _revision: 'r1' }),
    updateDraft: (id) => ({ id, _revision: 'r2' }),
    sendDraft: () => undefined,
    discardDraft: () => undefined,
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, resolve, reject };
}

async function flush() {
  for (let round = 0; round < 5; round += 1)
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
}

async function mount(
  dataSource: MailyMailboxDataSource,
  initial: Partial<MailyMailboxViewProps> = {}
) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const account = { id: crypto.randomUUID(), address: 'me@example.com' };
  let props: MailyMailboxViewProps = {
    dataSource,
    pollIntervalMs: 0,
    account,
    ...initial,
  };
  const render = async (next: Partial<MailyMailboxViewProps> = {}) => {
    props = { ...props, ...next };
    await act(async () => {
      root.render(<MailboxView {...props} />);
    });
    await flush();
  };
  const find = (selector: string) =>
    container.querySelector<HTMLElement>(selector);
  const click = async (target: HTMLElement | null, name: string) => {
    expect(target, name).toBeTruthy();
    await act(async () => target!.click());
    await flush();
  };
  await render();
  return {
    container,
    account,
    render,
    find,
    click: (selector: string) => click(find(selector), selector),
    clickText: (text: string) =>
      click(
        Array.from(container.querySelectorAll<HTMLElement>('button')).find(
          (button) => button.textContent?.trim() === text
        ) ?? null,
        text
      ),
    openRow: (subject: string) =>
      click(
        Array.from(container.querySelectorAll<HTMLElement>('button')).find(
          (button) => button.textContent?.includes(subject)
        ) ?? null,
        subject
      ),
    edit: async (selector: string, value: string) => {
      const input = find(selector) as HTMLInputElement | null;
      expect(input, selector).toBeTruthy();
      await act(async () => {
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value'
        )!.set!.call(input, value);
        input!.dispatchEvent(new Event('input', { bubbles: true }));
      });
    },
    upload: async (file: File) => {
      await act(async () => {
        const input = find('input[type="file"]') as HTMLInputElement;
        Object.defineProperty(input, 'files', {
          configurable: true,
          value: [file],
        });
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await flush();
    },
    close: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
  window.sessionStorage.clear();
  document.body.innerHTML = '';
});

describe('post-repair audit regressions', () => {
  it('N01: keeps an acknowledged attachment when the save refresh outlives its owner', async () => {
    const attachment = { id: 'upload-1', filename: 'notes.txt', size: 5 };
    const heldRefresh = deferred<{ items: MailyMailboxMessageDetail[] }>();
    let reads = 0;
    const discardUploadedAttachment = vi.fn();
    const view = await mount(
      source({
        listMessages: () =>
          reads++ === 0 ? { items: [message] } : heldRefresh.promise,
        uploadAttachment: () => attachment,
        discardUploadedAttachment,
      })
    );
    try {
      await view.click('[aria-label="Compose"]');
      await view.upload(new File(['notes'], 'notes.txt'));
      await view.clickText('Save draft');
      await view.render({ dataSource: source() });
      heldRefresh.resolve({ items: [message] });
      await flush();
      expect(discardUploadedAttachment).not.toHaveBeenCalled();
    } finally {
      await view.close();
    }
  });

  it('N07: reads the reader again after Undo restores host state', async () => {
    let favorite = false;
    const current = () => ({ ...message, isFavorite: favorite });
    const getMessage = vi.fn(current);
    const view = await mount(
      source({
        getMessage,
        runMessageAction: () => {
          favorite = true;
          return { ...current(), undo: { token: 'undo-1' } };
        },
        undoMessageAction: () => {
          favorite = false;
        },
      }),
      { messageActions: ['favorite'] }
    );
    try {
      await view.openRow('Original subject');
      await view.click('[aria-label="Add star"]');
      expect(view.find('[aria-label="Remove star"]')).toBeTruthy();
      const reads = getMessage.mock.calls.length;
      await view.clickText('Undo');
      expect(getMessage.mock.calls.length).toBeGreaterThan(reads);
      expect(view.find('[aria-label="Add star"]')).toBeTruthy();
      expect(view.find('[aria-label="Remove star"]')).toBeNull();
    } finally {
      await view.close();
    }
  });

  it('N08: never touches another scope receipt while probing storage', async () => {
    const scope = crypto.randomUUID();
    const otherScopeKey = `maily:pending-send:${scope}:probe`;
    window.sessionStorage.setItem(otherScopeKey, 'other-scope-draft');
    const sendDraft = vi.fn();
    const view = await mount(source({ sendDraft }), {
      account: { id: scope, address: 'me@example.com' },
    });
    try {
      await view.click('[aria-label="Compose"]');
      await view.edit('input[name="subject"]', 'Probe check');
      await view.clickText('Send');
      expect(sendDraft).toHaveBeenCalledTimes(1);
      expect(window.sessionStorage.getItem(otherScopeKey)).toBe(
        'other-scope-draft'
      );
    } finally {
      await view.close();
    }
  });

  it('N09: reports synchronous adapter throws instead of crashing the mailbox', async () => {
    const onError = vi.fn();
    const view = await mount(
      source({
        listMessages: () => ({
          items: [{ ...message, threadId: 'thread-1' }],
        }),
        getMessage: () => ({ ...message, threadId: 'thread-1' }),
        listLabels: () => {
          throw new Error('labels failed');
        },
        getThread: () => {
          throw new Error('thread failed');
        },
        uploadAttachment: (file) => ({ id: 'upload-1', filename: file.name }),
        discardUploadedAttachment: () => {
          throw new Error('discard failed');
        },
      }),
      { onError }
    );
    try {
      expect(onError).toHaveBeenCalledWith(expect.any(Error), 'labels');
      await view.openRow('Original subject');
      expect(onError).toHaveBeenCalledWith(expect.any(Error), 'detail');
      expect(view.container.textContent).toContain('Original body');
      await view.click('[aria-label="Back to list"]');
      await view.click('[aria-label="Compose"]');
      await view.upload(new File(['x'], 'x.txt'));
      await view.clickText('Discard');
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        'attachmentDiscard'
      );
      expect(view.find('[aria-label="Inbox"]')).toBeTruthy();
    } finally {
      await view.close();
    }
  });

  it('N10: keeps an acknowledged action result when the host passes a new onError', async () => {
    const translated = deferred<MailyMailboxMessageDetail>();
    const getMessage = vi.fn(() => message);
    const view = await mount(
      source({ getMessage, runMessageAction: () => translated.promise }),
      { messageActions: ['translate'], onError: () => undefined }
    );
    try {
      await view.openRow('Original subject');
      await act(async () => {
        view
          .find('[aria-label="More"]')!
          .dispatchEvent(
            new MouseEvent('pointerdown', { bubbles: true, button: 0 })
          );
      });
      await flush();
      const translate = Array.from(
        document.querySelectorAll<HTMLElement>('[role="menuitem"]')
      ).find((item) => item.textContent?.includes('Translate'));
      await act(async () => translate!.click());
      const reads = getMessage.mock.calls.length;
      await view.render({ onError: () => undefined });
      expect(getMessage.mock.calls.length).toBe(reads);
      translated.resolve({
        ...message,
        subject: 'Translated subject',
        bodyText: 'Translated body',
      });
      await flush();
      expect(view.container.textContent).toContain('Translated subject');
      expect(view.container.textContent).toContain('Translated body');
    } finally {
      await view.close();
    }
  });

  it.each([
    [
      'throws',
      () => {
        throw new Error('counts failed');
      },
    ],
    ['rejects', () => Promise.reject(new Error('counts failed'))],
  ])(
    'N12: keeps a loaded list when optional counts %s',
    async (_, getCounts) => {
      const onError = vi.fn();
      const view = await mount(source({ getCounts }), { onError });
      try {
        expect(view.container.textContent).toContain('Original subject');
        expect(view.container.textContent).not.toContain(
          'No messages in the inbox.'
        );
        expect(onError).toHaveBeenCalledWith(expect.any(Error), 'counts');
      } finally {
        await view.close();
      }
    }
  );
});

describe('adapter contract hardening', () => {
  it('does not re-read messages, details or labels when onError changes identity', async () => {
    const listMessages = vi.fn(() => ({ items: [message] }));
    const getMessage = vi.fn(() => message);
    const listLabels = vi.fn(() => []);
    const view = await mount(source({ listMessages, getMessage, listLabels }), {
      onError: () => undefined,
    });
    try {
      await view.openRow('Original subject');
      const calls = [
        listMessages.mock.calls.length,
        getMessage.mock.calls.length,
        listLabels.mock.calls.length,
      ];
      for (let render = 0; render < 3; render += 1)
        await view.render({ onError: () => undefined });
      expect([
        listMessages.mock.calls.length,
        getMessage.mock.calls.length,
        listLabels.mock.calls.length,
      ]).toEqual(calls);
    } finally {
      await view.close();
    }
  });

  it('calls class-based adapter methods with their instance', async () => {
    class Adapter {
      uploads: string[] = [];
      labels = [{ id: 'label-1', name: 'Projects' }];
      applied: string[][] = [];
      listMessages() {
        return { items: [message] };
      }
      getMessage() {
        return message;
      }
      listLabels() {
        return this.labels;
      }
      applyLabel(messageIds: string[]) {
        this.applied.push(messageIds);
      }
      createDraft() {
        return { id: 'draft-1' };
      }
      uploadAttachment(file: File): MailyMailboxUploadedAttachment {
        this.uploads.push(file.name);
        return { id: `upload-${this.uploads.length}`, filename: file.name };
      }
    }
    const adapter = new Adapter();
    const view = await mount(adapter);
    try {
      await view.click('[aria-label="Select all on this page"]');
      await view.click('[aria-label="Apply label"]');
      const projects = document.querySelector<HTMLElement>(
        '[role="checkbox"][id$="-apply-0"], button[id$="-apply-0"]'
      );
      await act(async () => projects!.click());
      await flush();
      expect(adapter.applied).toEqual([['message-1']]);
      await view.click('[aria-label="Compose"]');
      await view.upload(new File(['a'], 'a.txt'));
      expect(adapter.uploads).toEqual(['a.txt']);
      expect(view.container.textContent).toContain('a.txt');
    } finally {
      await view.close();
    }
  });

  it('reuses one idempotency key for retried creates of a composition only', async () => {
    const createDraft = vi
      .fn<(draft: MailyMailboxDraftInput) => { id: string }>()
      .mockImplementationOnce(() => {
        throw new Error('response lost');
      })
      .mockImplementation(() => ({ id: 'draft-1' }));
    const view = await mount(source({ createDraft }));
    try {
      await view.click('[aria-label="Compose"]');
      await view.edit('input[name="subject"]', 'Retry me');
      await view.clickText('Save draft');
      await view.clickText('Save draft');
      const [first, second] = createDraft.mock.calls.map(
        ([draft]) => draft.idempotencyKey
      );
      expect(first).toMatch(/^[0-9a-f-]{36}$/);
      expect(second).toBe(first);
      await view.click('[aria-label="Back to list"]');
      await view.click('[aria-label="Compose"]');
      await view.edit('input[name="subject"]', 'Another message');
      await view.clickText('Save draft');
      expect(createDraft.mock.calls[2][0].idempotencyKey).not.toBe(first);
    } finally {
      await view.close();
    }
  });

  it('uses a new idempotency key when a retried create carries edited content', async () => {
    const createDraft = vi
      .fn<(draft: MailyMailboxDraftInput) => { id: string }>()
      .mockImplementationOnce(() => {
        throw new Error('response lost');
      })
      .mockImplementation(() => ({ id: 'draft-1' }));
    const view = await mount(source({ createDraft }));
    try {
      await view.click('[aria-label="Compose"]');
      await view.edit('input[name="subject"]', 'First version');
      await view.clickText('Save draft');
      await view.edit('input[name="subject"]', 'Edited version');
      await view.clickText('Save draft');
      const [first, second] = createDraft.mock.calls.map(([draft]) => draft);
      expect(second.subject).toBe('Edited version');
      // A host deduplicating by key must never answer edited content with the
      // draft that holds the first version.
      expect(second.idempotencyKey).not.toBe(first.idempotencyKey);
    } finally {
      await view.close();
    }
  });

  it('keeps fields enabled and focused while an autosave is in flight', async () => {
    vi.useFakeTimers();
    const pending = deferred<{ id: string }>();
    const view = await mount(source({ createDraft: () => pending.promise }), {
      autosaveDelayMs: 1000,
    });
    try {
      await view.click('[aria-label="Compose"]');
      const subject = view.find('input[name="subject"]') as HTMLInputElement;
      subject.focus();
      await view.edit('input[name="subject"]', 'Typing on');
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(view.container.textContent).toContain('Saving…');
      expect((view.find('fieldset') as HTMLFieldSetElement).disabled).toBe(
        false
      );
      expect(document.activeElement).toBe(subject);
      await view.edit('input[name="subject"]', 'Typing on and on');
      pending.resolve({ id: 'draft-1' });
      await flush();
      expect(subject.value).toBe('Typing on and on');
    } finally {
      await view.close();
    }
  });

  it('lists each attachment of a read-only draft once', async () => {
    const draft: MailyMailboxMessageDetail = {
      ...message,
      id: 'draft-1',
      direction: 'out',
      status: 'draft',
      subject: 'Host draft',
      attachments: [{ id: 'att-1', filename: 'report.pdf' }],
      _revision: 'v1',
    };
    const view = await mount(
      source({
        listMessages: ({ folder }) => ({
          items: folder === 'drafts' ? [draft] : [message],
        }),
        getMessage: (id) => (id === draft.id ? draft : message),
        updateDraft: undefined,
      })
    );
    try {
      await view.click('[aria-label="Drafts"]');
      await view.openRow('Host draft');
      expect(view.find('input[name="subject"]')).toBeNull();
      const form = view.find('form')!;
      expect(form.querySelectorAll('[data-slot="attachment"]')).toHaveLength(1);
      expect(form.textContent).toContain('report.pdf');
    } finally {
      await view.close();
    }
  });

  it('opens a saved draft with ID-less attachments read-only instead of dropping them', async () => {
    const draft: MailyMailboxMessageDetail = {
      ...message,
      id: 'draft-1',
      direction: 'out',
      status: 'draft',
      subject: 'Host draft',
      attachments: [{ filename: 'legacy.pdf' }],
      _revision: 'v1',
    };
    const updateDraft = vi.fn((id: string) => ({ id }));
    const sendDraft = vi.fn();
    const view = await mount(
      source({
        listMessages: ({ folder }) => ({
          items: folder === 'drafts' ? [draft] : [message],
        }),
        getMessage: (id) => (id === draft.id ? draft : message),
        updateDraft,
        sendDraft,
      })
    );
    try {
      await view.click('[aria-label="Drafts"]');
      await view.openRow('Host draft');
      expect(view.find('input[name="subject"]')).toBeNull();
      expect(view.container.textContent).toContain(
        'This draft has attachments that cannot be edited here.'
      );
      // The read-only draft still lists the attachments it keeps.
      expect(view.container.textContent).toContain('legacy.pdf');
      expect(
        Array.from(view.container.querySelectorAll('button')).some(
          (button) => button.textContent?.trim() === 'Save draft'
        )
      ).toBe(false);
      await view.clickText('Send');
      expect(updateDraft).not.toHaveBeenCalled();
      expect(sendDraft).toHaveBeenCalledWith('draft-1', { revision: 'v1' });
    } finally {
      await view.close();
    }
  });

  it('lists the attachments of the last saved draft once it becomes read-only', async () => {
    const draft: MailyMailboxMessageDetail = {
      ...message,
      id: 'draft-1',
      direction: 'out',
      status: 'draft',
      subject: 'Host draft',
      attachments: [
        { id: 'a', filename: 'a.pdf' },
        { id: 'b', filename: 'b.pdf' },
      ],
      _revision: 'v1',
    };
    const updateDraft = vi.fn<
      NonNullable<MailyMailboxDataSource['updateDraft']>
    >((id) => ({ id, _revision: 'v2' }));
    const view = await mount(
      source({
        listMessages: ({ folder }) => ({
          items: folder === 'drafts' ? [draft] : [message],
        }),
        getMessage: (id) => (id === draft.id ? draft : message),
        updateDraft,
      }),
      { initialFolder: 'drafts' }
    );
    try {
      await view.openRow('Host draft');
      await view.click('[aria-label="Remove b.pdf"]');
      await view.clickText('Save draft');
      expect(updateDraft.mock.calls.at(-1)?.[1]?.attachments).toEqual([
        { id: 'a', filename: 'a.pdf' },
      ]);
      // The host withdraws edit; the read-only draft shows what was saved.
      await view.render({ draftCapabilities: { edit: false } });
      expect(view.find('input[name="subject"]')).toBeNull();
      expect(view.container.textContent).toContain('a.pdf');
      expect(view.container.textContent).not.toContain('b.pdf');
    } finally {
      await view.close();
    }
  });

  it('keeps an ID-less attachment draft read-only when the reader selection moves', async () => {
    const draft: MailyMailboxMessageDetail = {
      ...message,
      id: 'draft-1',
      direction: 'out',
      status: 'draft',
      subject: 'Host draft',
      attachments: [{ filename: 'legacy.pdf' }],
      _revision: 'v1',
    };
    const updateDraft = vi.fn((id: string) => ({ id, _revision: 'v2' }));
    const sendDraft = vi.fn();
    let requested: string | null = null;
    const view = await mount(
      source({
        listMessages: ({ folder }) => ({
          items: folder === 'drafts' ? [draft] : [message],
        }),
        getMessage: (id) => (id === draft.id ? draft : message),
        updateDraft,
        sendDraft,
      }),
      {
        initialFolder: 'drafts',
        selectedMessageId: null,
        onSelectedMessageIdChange: (id) => {
          requested = id;
        },
      }
    );
    try {
      await view.openRow('Host draft');
      // The host accepts the requested selection.
      await view.render({ selectedMessageId: requested });
      expect(view.find('input[name="subject"]')).toBeNull();
      // The host moves the controlled reader selection; the composer stays.
      await view.render({ selectedMessageId: message.id });
      expect(view.find('input[name="subject"]')).toBeNull();
      expect(view.container.textContent).toContain('legacy.pdf');
      await view.clickText('Send');
      expect(updateDraft).not.toHaveBeenCalled();
      expect(sendDraft).toHaveBeenCalledWith('draft-1', { revision: 'v1' });
    } finally {
      await view.close();
    }
  });
});
