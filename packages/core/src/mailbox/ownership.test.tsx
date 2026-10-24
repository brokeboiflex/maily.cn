// @vitest-environment happy-dom

import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import {
  MailboxView,
  type MailyMailboxDataSource,
  type MailyMailboxMessageDetail,
  type MailyMailboxViewProps,
} from './index';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const message: MailyMailboxMessageDetail = {
  id: 'message',
  direction: 'in',
  fromAddress: 'sender@example.com',
  toAddresses: ['me@example.com'],
  subject: 'Original subject',
  status: 'sent',
  createdAt: '2026-10-10',
  bodyText: 'Original body',
};

function source(
  overrides: Partial<MailyMailboxDataSource> = {}
): MailyMailboxDataSource {
  return {
    listMessages: () => ({ items: [message], nextCursor: 'older' }),
    getMessage: () => message,
    createDraft: () => ({ id: 'new-draft' }),
    updateDraft: () => ({ id: 'new-draft' }),
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
  let props = { dataSource, account, ...initial };
  const render = async (next: Partial<MailyMailboxViewProps> = {}) => {
    props = { ...props, ...next };
    await act(async () => {
      root.render(<MailboxView {...props} />);
    });
    await flush();
  };
  const click = async (selector: string, context: ParentNode = container) => {
    await act(async () => {
      const target = context.querySelector<HTMLElement>(selector);
      expect(target, selector).toBeTruthy();
      target!.click();
    });
    await flush();
  };
  const text = async (name: string, context: ParentNode = container) => {
    await act(async () => {
      const target = Array.from(
        context.querySelectorAll<HTMLElement>('button,[role="menuitem"]')
      ).find(
        (el) =>
          el.textContent?.trim() === name ||
          (name === 'Original subject' && el.textContent?.includes(name))
      );
      expect(target, name).toBeTruthy();
      target!.click();
    });
    await flush();
  };
  const edit = async (
    selector: string,
    value: string,
    context: ParentNode = container
  ) => {
    await act(async () => {
      const input = context.querySelector<HTMLInputElement>(selector)!;
      expect(input, selector).toBeTruthy();
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };
  const form = async () => {
    await act(async () => {
      document
        .querySelector('[role="dialog"] form')!
        .dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true })
        );
    });
    await flush();
  };
  const menu = async (selector: string) => {
    await act(async () => {
      container
        .querySelector<HTMLElement>(selector)!
        .dispatchEvent(
          new MouseEvent('pointerdown', { bubbles: true, button: 0 })
        );
    });
    await flush();
  };
  await render();
  return {
    container,
    render,
    click,
    text,
    edit,
    form,
    menu,
    account,
    close: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

it('isolates a late old-source preparation from the new source', async () => {
  const oldPreparation = deferred<{ id: string; _revision: string }>();
  const oldSend = vi.fn();
  const discardUploadedAttachment = vi.fn();
  const attachment = { id: 'old-upload', filename: 'old.txt', size: 4 };
  const createDraft = vi.fn(() => ({
    id: 'current-draft',
    _revision: 'current-v1',
  }));
  const sendDraft = vi.fn();
  const view = await mount(
    source({
      createDraft: () => oldPreparation.promise,
      sendDraft: oldSend,
      uploadAttachment: () => attachment,
      discardUploadedAttachment,
    })
  );
  try {
    await view.click('[aria-label="Compose"]');
    await view.edit('input[name="subject"]', 'Old intent');
    await act(async () => {
      const input =
        view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
      Object.defineProperty(input, 'files', {
        configurable: true,
        value: [new File(['old'], 'old.txt')],
      });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await view.text('Send');
    await view.render({ dataSource: source({ createDraft, sendDraft }) });
    await view.click('[aria-label="Compose"]');
    await view.edit('input[name="subject"]', 'New intent');
    oldPreparation.resolve({ id: 'old-draft', _revision: 'old-v1' });
    await flush();
    await view.text('Send');
    // The departed source's preparation never sends, and the host it was
    // handed to owns its upload.
    expect(oldSend).not.toHaveBeenCalled();
    expect(discardUploadedAttachment).not.toHaveBeenCalled();
    expect(createDraft).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'New intent', revision: undefined })
    );
    expect(sendDraft).toHaveBeenCalledWith('current-draft', {
      revision: 'current-v1',
    });
  } finally {
    await view.close();
  }
});

it('lets a newer same-query read own progress after superseding a manual refresh', async () => {
  const oldRead =
    deferred<ReturnType<MailyMailboxDataSource['listMessages']>>();
  const newRead =
    deferred<ReturnType<MailyMailboxDataSource['listMessages']>>();
  const listMessages = vi
    .fn()
    .mockReturnValueOnce({ items: [message], nextCursor: 'older' })
    .mockReturnValueOnce(oldRead.promise)
    .mockReturnValueOnce(newRead.promise);
  const onError = vi.fn();
  const newerOnError = vi.fn();
  const view = await mount(source({ listMessages }), { onError });
  try {
    await view.click('button[aria-label="Refresh"]');
    // A page-size change re-reads the same query while the refresh is pending.
    await view.render({ onError: newerOnError, pageSize: 25 });
    oldRead.reject(Error('Superseded refresh failed'));
    await flush();
    expect(onError).not.toHaveBeenCalled();
    expect(
      view.container.querySelector<HTMLButtonElement>('[aria-label="Older"]')!
        .disabled
    ).toBe(true);
    newRead.resolve({ items: [message], nextCursor: 'older' });
    await flush();
    expect(
      view.container.querySelector<HTMLButtonElement>('[aria-label="Older"]')!
        .disabled
    ).toBe(false);
    expect(
      view.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Refresh"]'
      )!.disabled
    ).toBe(false);
    expect(newerOnError).not.toHaveBeenCalled();
  } finally {
    await view.close();
  }
});

it.each(['Compose', 'Reply', 'Forward'] as const)(
  'resets an observed draft revision before a new %s intent',
  async (intent) => {
    const old = {
      ...message,
      id: 'old-draft',
      status: 'draft' as const,
      direction: 'out' as const,
      _revision: 'old-v1',
    };
    const createDraft = vi.fn(() => ({ id: 'new-draft' }));
    const view = await mount(
      source({
        listMessages: () => ({ items: [old, message] }),
        getMessage: (id) => (id === old.id ? old : message),
        createDraft,
      })
    );
    try {
      await view.text('Original subject');
      await view.click('[aria-label="Back to list"]');
      if (intent === 'Compose') await view.click('[aria-label="Compose"]');
      else {
        await view.render({ selectedMessageId: message.id });
        await view.click(`button[aria-label="${intent}"]`);
      }
      await view.text('Save draft');
      expect(createDraft).toHaveBeenCalledWith(
        expect.objectContaining({ revision: undefined })
      );
    } finally {
      await view.close();
    }
  }
);

it('serializes all filters identically for initial reads, refresh and cursor pages', async () => {
  const listMessages = vi.fn(({ cursor }) => ({
    items: [message],
    nextCursor: cursor ? null : 'older',
  }));
  const view = await mount(source({ listMessages }), {
    defaultSearchFilters: { starred: true, labelId: 'label-a' },
  });
  try {
    await view.click('button[aria-label="Refresh"]');
    await view.click('[aria-label="Older"]');
    expect(listMessages).toHaveBeenCalledTimes(3);
    for (const [params] of listMessages.mock.calls)
      expect(params).toEqual(
        expect.objectContaining({
          q: 'is:starred label:label-a',
          search: expect.objectContaining({
            starred: true,
            labelId: 'label-a',
          }),
        })
      );
  } finally {
    await view.close();
  }
});

it.each([true, false])(
  'ignores an old refresh failure and finally while the newer query is loaded=%s',
  async (loaded) => {
    const oldRead =
      deferred<ReturnType<MailyMailboxDataSource['listMessages']>>();
    const newRead =
      deferred<ReturnType<MailyMailboxDataSource['listMessages']>>();
    const listMessages = vi
      .fn()
      .mockReturnValueOnce({ items: [message], nextCursor: 'older' })
      .mockReturnValueOnce(oldRead.promise)
      .mockReturnValueOnce(newRead.promise);
    const onError = vi.fn();
    const view = await mount(source({ listMessages }), {
      search: 'A',
      searchScope: 'folder',
      onError,
    });
    try {
      await view.click('button[aria-label="Refresh"]');
      await view.render({ search: 'B' });
      if (loaded) {
        newRead.resolve({ items: [message], nextCursor: 'older' });
        await flush();
      }
      oldRead.reject(Error('A failed'));
      await flush();
      expect(onError).not.toHaveBeenCalled();
      expect(view.container.textContent).not.toContain(
        'Could not refresh the mailbox.'
      );
      expect(
        view.container.querySelector<HTMLButtonElement>('[aria-label="Older"]')!
          .disabled
      ).toBe(!loaded);
      if (!loaded) {
        newRead.resolve({ items: [message], nextCursor: 'older' });
        await flush();
      }
    } finally {
      await view.close();
    }
  }
);

it('retains a newer controlled label selection after old label deletion', async () => {
  const pending = deferred<void>();
  const labels = [
    { id: 'L', name: 'First label' },
    { id: 'M', name: 'Second label' },
  ];
  const onSelectedLabelIdChange = vi.fn();
  const view = await mount(
    source({ listLabels: () => labels, deleteLabel: () => pending.promise }),
    { selectedLabelId: 'L', onSelectedLabelIdChange }
  );
  try {
    await view.menu('[aria-label="More: First label"]');
    await view.text('Delete label', document);
    await view.text('Delete label', document.querySelector('[role="dialog"]')!);
    await view.render({ selectedLabelId: 'M' });
    pending.resolve();
    await flush();
    expect(onSelectedLabelIdChange).not.toHaveBeenCalled();
    expect(
      view.container
        .querySelector('[aria-label="Second label"]')
        ?.getAttribute('aria-current')
    ).toBe('page');
  } finally {
    await view.close();
  }
});

it('keeps a reopened label form and its name after the previous form completes', async () => {
  const pending = deferred<{ id: string; name: string }>();
  const view = await mount(
    source({ listLabels: () => [], createLabel: () => pending.promise })
  );
  try {
    await view.click('[aria-label="Create label"]');
    await view.edit(
      'input',
      'First name',
      document.querySelector('[role="dialog"]')!
    );
    await view.form();
    await view.text('Cancel', document.querySelector('[role="dialog"]')!);
    await view.click('[aria-label="Create label"]');
    await view.edit(
      'input',
      'Second name',
      document.querySelector('[role="dialog"]')!
    );
    pending.resolve({ id: 'first', name: 'First name' });
    await flush();
    expect(
      document.querySelector<HTMLInputElement>('[role="dialog"] input')?.value
    ).toBe('Second name');
  } finally {
    await view.close();
  }
});

it.each([true, false])(
  'replaces threaded content and attachments from action detail returned=%s',
  async (returned) => {
    const first = { ...message, threadId: 'thread' };
    const changed = {
      ...first,
      bodyText: 'Translated body',
      attachments: [{ id: 'fresh', filename: 'fresh.txt', size: 10 }],
    };
    const getMessage = vi
      .fn()
      .mockReturnValueOnce(first)
      .mockReturnValue(changed);
    const getThread = vi.fn(() => ({
      threadId: 'thread',
      messages: [first, { ...first, id: 'earlier', bodyText: 'Earlier body' }],
    }));
    const view = await mount(
      source({
        listMessages: () => ({ items: [first] }),
        getMessage,
        getThread,
        runMessageAction: () => (returned ? changed : undefined),
      }),
      { messageActions: ['translate'] }
    );
    try {
      await view.text('Original subject');
      await view.menu('button[aria-label="More"]');
      await view.text('Translate', document);
      expect(view.container.textContent).toContain('Translated body');
      expect(view.container.textContent).toContain('fresh.txt');
      expect(view.container.textContent).toContain('Earlier body');
      expect(getThread).toHaveBeenCalledTimes(2);
    } finally {
      await view.close();
    }
  }
);

it('preserves a fresher initially loaded thread when delayed detail contains an older selected body', async () => {
  const first = { ...message, threadId: 'thread' };
  const delayedDetail = deferred<MailyMailboxMessageDetail>();
  const view = await mount(
    source({
      listMessages: () => ({ items: [first] }),
      getMessage: () => delayedDetail.promise,
      getThread: () => ({
        threadId: 'thread',
        messages: [{ ...first, bodyText: 'Fresher thread body' }],
      }),
    })
  );
  try {
    await view.text('Original subject');
    delayedDetail.resolve(first);
    await flush();
    expect(view.container.textContent).toContain('Fresher thread body');
    expect(view.container.textContent).not.toContain('Original body');
  } finally {
    await view.close();
  }
});
