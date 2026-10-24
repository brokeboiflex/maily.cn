// @vitest-environment happy-dom

import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  MailboxView,
  type MailyMailboxDataSource,
  type MailyMailboxDraftCapabilities,
  type MailyMailboxMessageDetail,
  type MailyMailboxViewProps,
} from './index';
import {
  getMailboxComposeOperations,
  resolveMailboxDraftCapabilities,
  type MailboxComposeState,
} from './draft-capabilities';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const inboxMessage: MailyMailboxMessageDetail = {
  id: 'message-1',
  direction: 'in',
  fromAddress: 'sender@example.com',
  toAddresses: ['me@example.com'],
  subject: 'Quarterly update',
  status: 'sent',
  createdAt: '2026-10-22T09:00:00.000Z',
  messageId: '<quarterly@example.com>',
  bodyText: 'Numbers are attached.',
};

const savedDraft: MailyMailboxMessageDetail = {
  id: 'draft-1',
  direction: 'out',
  fromAddress: 'me@example.com',
  toAddresses: ['client@example.com'],
  subject: 'Prepared draft',
  status: 'draft',
  createdAt: '2026-10-22T10:00:00.000Z',
  bodyText: 'Prepared body',
  _revision: 'v1',
};

/** A genuinely read-only adapter: no draft callbacks and no casts. */
function readOnlySource(
  overrides: Partial<MailyMailboxDataSource> = {}
): MailyMailboxDataSource {
  return {
    listMessages: ({ folder }) => ({
      items: folder === 'drafts' ? [savedDraft] : [inboxMessage],
      nextCursor: null,
    }),
    getMessage: (id) => {
      if (id === savedDraft.id) return savedDraft;
      if (id === inboxMessage.id) return inboxMessage;
      return { ...savedDraft, id, subject: null, bodyText: null };
    },
    ...overrides,
  };
}

function draftCallbacks() {
  return {
    createDraft: vi.fn<NonNullable<MailyMailboxDataSource['createDraft']>>(
      () => ({ id: 'created-draft', _revision: 'c1' })
    ),
    updateDraft: vi.fn<NonNullable<MailyMailboxDataSource['updateDraft']>>(
      (id) => ({ id, _revision: 'u1' })
    ),
    sendDraft: vi.fn<NonNullable<MailyMailboxDataSource['sendDraft']>>(),
    discardDraft: vi.fn<NonNullable<MailyMailboxDataSource['discardDraft']>>(),
  };
}

function expectNoCalls(callbacks: ReturnType<typeof draftCallbacks>) {
  expect(callbacks.createDraft).not.toHaveBeenCalled();
  expect(callbacks.updateDraft).not.toHaveBeenCalled();
  expect(callbacks.sendDraft).not.toHaveBeenCalled();
  expect(callbacks.discardDraft).not.toHaveBeenCalled();
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((accept) => {
    resolve = accept;
  });
  return { promise, resolve };
}

/** Lets a mutation finish its follow-up refresh and release the compose lock. */
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
    account,
    // Most capability tests exercise autosave; it is off unless enabled.
    autosaveDelayMs: 1000,
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
  const button = (text: string, context: ParentNode = container) =>
    Array.from(
      context.querySelectorAll<HTMLElement>('button,[role="menuitem"]')
    ).find((element) => element.textContent?.trim() === text) ?? null;
  const click = async (target: HTMLElement | null, name: string) => {
    expect(target, name).toBeTruthy();
    await act(async () => {
      target!.click();
    });
    await flush();
  };
  await render();
  return {
    container,
    account,
    render,
    find,
    button,
    click: (selector: string) => click(find(selector), selector),
    clickText: (text: string, context?: ParentNode) =>
      click(button(text, context), text),
    openRow: (subject: string) =>
      click(
        Array.from(container.querySelectorAll<HTMLElement>('button')).find(
          (element) => element.textContent?.includes(subject)
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
    /** Implicit form submission, as when Enter is pressed in a field. */
    submit: async () => {
      await act(async () => {
        find('form')!.dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true })
        );
      });
      await flush();
    },
    heading: () => find('form h2')?.textContent,
    fields: () => find('fieldset') as HTMLFieldSetElement | null,
    /** A locked draft renders readable text instead of form controls. */
    readOnly: () => !!find('form dl') && !find('form fieldset'),
    readOnlyText: () => find('form')?.textContent ?? '',
    subject: () => (find('input[name="subject"]') as HTMLInputElement).value,
    close: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('draft capability rules', () => {
  const callbacks = {
    createDraft() {},
    updateDraft() {},
    sendDraft() {},
    sendMessage() {},
    discardDraft() {},
  };

  it('requires both the callback and the absence of a host withdrawal', () => {
    expect(resolveMailboxDraftCapabilities({})).toEqual({
      create: false,
      edit: false,
      send: false,
      sendMessage: false,
      discard: false,
    });
    expect(resolveMailboxDraftCapabilities(callbacks)).toEqual({
      create: true,
      edit: true,
      send: true,
      sendMessage: true,
      discard: true,
    });
    // send: false withholds both sendDraft and sendMessage.
    expect(
      resolveMailboxDraftCapabilities(callbacks, { edit: false, send: false })
    ).toEqual({
      create: true,
      edit: false,
      send: false,
      sendMessage: false,
      discard: true,
    });
    expect(
      resolveMailboxDraftCapabilities(
        { sendDraft() {} },
        { create: true, edit: true, send: true, discard: true }
      )
    ).toEqual({
      create: false,
      edit: false,
      send: true,
      sendMessage: false,
      discard: false,
    });
  });

  it('exposes each compose action only with the operations it requires', () => {
    const operations = (
      allowed: string,
      state: Partial<MailboxComposeState> = {}
    ) =>
      getMailboxComposeOperations(
        {
          create: allowed.includes('create'),
          edit: allowed.includes('edit'),
          send: allowed.includes('send'),
          sendMessage: allowed.includes('message'),
          discard: allowed.includes('discard'),
        },
        { persisted: false, dirty: false, ...state }
      );

    // A new composition is persisted by create and sent by create + send.
    expect(operations('create edit send discard')).toEqual({
      editable: true,
      save: true,
      attach: true,
      autosave: true,
      send: true,
      discard: true,
    });
    // sendMessage sends a new composition without any draft storage.
    expect(operations('message')).toEqual({
      editable: true,
      save: false,
      attach: true,
      autosave: false,
      send: true,
      discard: true,
    });
    expect(operations('create send')).toMatchObject({
      save: true,
      autosave: false,
      send: true,
    });
    expect(operations('edit send discard')).toMatchObject({
      editable: false,
      save: false,
      send: false,
      // Closing an unsaved composition never deletes a persisted draft.
      discard: true,
    });
    // An existing draft without edit is read-only and is sent unchanged.
    expect(operations('send', { persisted: true })).toEqual({
      editable: false,
      save: false,
      attach: false,
      autosave: false,
      send: true,
      discard: false,
    });
    // A saved draft is never sent through sendMessage.
    expect(operations('message', { persisted: true })).toMatchObject({
      send: false,
    });
    expect(
      operations('send discard', { persisted: true, dirty: true })
    ).toEqual({
      editable: true,
      save: false,
      attach: false,
      autosave: false,
      send: false,
      discard: true,
    });
    expect(operations('edit', { persisted: true })).toMatchObject({
      editable: true,
      save: true,
      autosave: true,
      send: false,
      discard: false,
    });
    // Unsaved local work stays editable when nothing can persist it.
    expect(operations('', { dirty: true })).toMatchObject({
      editable: true,
      save: false,
      send: false,
      discard: true,
    });
  });
});

describe('read-only and fully enabled mailboxes', () => {
  it('renders a read-only mailbox from an adapter without draft callbacks', async () => {
    const view = await mount(readOnlySource());
    try {
      expect(view.find('[aria-label="Compose"]')).toBeNull();
      await view.openRow('Quarterly update');
      expect(view.container.textContent).toContain('Numbers are attached.');
      for (const label of ['Reply', 'Reply all', 'Forward'])
        expect(view.find(`[aria-label="${label}"]`), label).toBeNull();
      await view.click('[aria-label="Back to list"]');

      await view.click('[aria-label="Drafts"]');
      await view.openRow('Prepared draft');
      expect(view.heading()).toBe('Draft');
      expect(view.readOnly()).toBe(true);
      expect(view.find('input[name="subject"]')).toBeNull();
      expect(view.readOnlyText()).toContain('Prepared draft');
      expect(view.readOnlyText()).toContain('client@example.com');
      expect(view.readOnlyText()).toContain('Prepared body');
      for (const text of ['Discard', 'Save draft', 'Send'])
        expect(view.button(text), text).toBeNull();
      expect(view.container.textContent).not.toContain('Saved automatically');
      await view.click('[aria-label="Back to list"]');
      expect(view.find('form')).toBeNull();
    } finally {
      await view.close();
    }
  });

  it('never dispatches withheld callbacks, including implicit submission and autosave timers', async () => {
    vi.useFakeTimers();
    const callbacks = draftCallbacks();
    const runMessageAction = vi.fn();
    const view = await mount(
      readOnlySource({ ...callbacks, runMessageAction }),
      {
        messageActions: ['archive'],
        draftCapabilities: {
          create: false,
          edit: false,
          send: false,
          discard: false,
        },
      }
    );
    try {
      expect(view.find('[aria-label="Compose"]')).toBeNull();
      await view.openRow('Quarterly update');
      expect(view.find('[aria-label="Archive"]')).toBeTruthy();
      expect(view.find('[aria-label="Reply"]')).toBeNull();
      await act(async () => {
        view
          .find('[aria-label="More"]')!
          .dispatchEvent(
            new MouseEvent('pointerdown', { bubbles: true, button: 0 })
          );
      });
      await flush();
      const menu = document.querySelector('[role="menu"]');
      expect(menu?.textContent).toContain('Archive');
      expect(menu?.textContent).not.toContain('Reply all');
      expect(menu?.textContent).not.toContain('Forward');
      await act(async () => {
        document.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
        );
      });
      await view.click('[aria-label="Back to list"]');

      await view.click('[aria-label="Drafts"]');
      await view.openRow('Prepared draft');
      expect(view.heading()).toBe('Draft');
      await view.submit();
      await advance(5000);
      expectNoCalls(callbacks);
      expect(runMessageAction).not.toHaveBeenCalled();
    } finally {
      await view.close();
    }
  });

  it('keeps every draft control and callback for a fully enabled host', async () => {
    const callbacks = draftCallbacks();
    const view = await mount(readOnlySource(callbacks));
    try {
      expect(view.find('[aria-label="Compose"]')).toBeTruthy();
      await view.openRow('Quarterly update');
      for (const label of ['Reply', 'Reply all', 'Forward'])
        expect(view.find(`[aria-label="${label}"]`), label).toBeTruthy();
      await view.click('[aria-label="Reply"]');
      expect(view.heading()).toBe('Compose');
      for (const text of ['Discard', 'Save draft', 'Send'])
        expect(view.button(text), text).toBeTruthy();
      await view.clickText('Send');
      await flush();
      expect(callbacks.createDraft).toHaveBeenCalledTimes(1);
      expect(callbacks.createDraft.mock.calls[0][0]).toMatchObject({
        to: ['sender@example.com'],
        subject: 'Re: Quarterly update',
        inReplyTo: '<quarterly@example.com>',
      });
      expect(callbacks.sendDraft).toHaveBeenCalledWith('created-draft', {
        revision: 'c1',
      });

      await view.click('[aria-label="Drafts"]');
      await view.openRow('Prepared draft');
      expect(view.heading()).toBe('Edit draft');
      expect(view.fields()?.disabled).toBe(false);
      await view.clickText('Discard');
      expect(callbacks.discardDraft).toHaveBeenCalledWith('draft-1');
    } finally {
      await view.close();
    }
  });
});

describe('sending', () => {
  it('sends without an account identity', async () => {
    const callbacks = draftCallbacks();
    const view = await mount(readOnlySource(callbacks), { account: undefined });
    try {
      await view.click('[aria-label="Compose"]');
      await view.edit('input[name="subject"]', 'No account');
      await view.clickText('Send');
      expect(callbacks.sendDraft).toHaveBeenCalledWith('created-draft', {
        revision: 'c1',
      });
    } finally {
      await view.close();
    }
  });

  it('sends a new composition with sendMessage, without a draft', async () => {
    const sendMessage =
      vi.fn<NonNullable<MailyMailboxDataSource['sendMessage']>>();
    const onSent = vi.fn();
    const view = await mount(readOnlySource({ sendMessage }), { onSent });
    try {
      // Compose and Reply need only a way to send the result.
      await view.openRow('Quarterly update');
      await view.click('[aria-label="Reply"]');
      expect(view.button('Save draft')).toBeNull();
      expect(view.container.textContent).not.toContain(
        'Changes cannot be saved'
      );
      await view.edit('input[name="subject"]', 'Direct reply');
      await view.clickText('Send');
      expect(sendMessage).toHaveBeenCalledTimes(1);
      expect(sendMessage.mock.calls[0][0]).toMatchObject({
        to: ['sender@example.com'],
        subject: 'Direct reply',
        inReplyTo: '<quarterly@example.com>',
        idempotencyKey: expect.any(String),
      });
      expect(onSent).toHaveBeenCalledTimes(1);
      expect(view.find('form')).toBeNull();
    } finally {
      await view.close();
    }
  });

  it('sends a clean saved draft as it is and writes only unsaved changes first', async () => {
    const callbacks = draftCallbacks();
    const view = await mount(readOnlySource(callbacks), {
      autosaveDelayMs: false,
    });
    try {
      await view.click('[aria-label="Drafts"]');
      await view.openRow('Prepared draft');
      await view.clickText('Send');
      expect(callbacks.updateDraft).not.toHaveBeenCalled();
      expect(callbacks.sendDraft).toHaveBeenLastCalledWith('draft-1', {
        revision: 'v1',
      });

      await view.openRow('Prepared draft');
      await view.edit('input[name="subject"]', 'Changed before sending');
      await view.clickText('Send');
      expect(callbacks.updateDraft).toHaveBeenCalledWith(
        'draft-1',
        expect.objectContaining({ subject: 'Changed before sending' })
      );
      expect(callbacks.sendDraft).toHaveBeenLastCalledWith('draft-1', {
        revision: 'u1',
      });
    } finally {
      await view.close();
    }
  });

  it('keeps a failed send open and editable, and retries it', async () => {
    const sendMessage = vi
      .fn<NonNullable<MailyMailboxDataSource['sendMessage']>>()
      .mockRejectedValueOnce(new Error('offline'));
    const onError = vi.fn();
    const view = await mount(readOnlySource({ sendMessage }), { onError });
    try {
      await view.click('[aria-label="Compose"]');
      await view.edit('input[name="subject"]', 'Try again');
      await view.clickText('Send');
      expect(onError).toHaveBeenCalledWith(expect.any(Error), 'sendDraft');
      expect(view.container.textContent).toContain(
        'Could not send the message.'
      );
      expect(view.fields()?.disabled).toBe(false);
      expect(view.subject()).toBe('Try again');
      // Navigation stays free: no send is held.
      await view.click('[aria-label="Back to list"]');
      expect(document.body.textContent).toContain('Discard unsaved changes?');
      await view.clickText('Keep editing', document.body);
      await view.clickText('Send');
      expect(sendMessage).toHaveBeenCalledTimes(2);
      // The same content is the same request.
      expect(sendMessage.mock.calls[1][0].idempotencyKey).toBe(
        sendMessage.mock.calls[0][0].idempotencyKey
      );
      expect(view.find('form')).toBeNull();
    } finally {
      await view.close();
    }
  });
});

describe('autosave', () => {
  it('is off unless the host sets autosaveDelayMs', async () => {
    vi.useFakeTimers();
    const callbacks = draftCallbacks();
    const view = await mount(readOnlySource(callbacks), {
      autosaveDelayMs: undefined,
    });
    try {
      await view.click('[aria-label="Compose"]');
      await view.edit('input[name="subject"]', 'Not saved yet');
      await advance(60_000);
      expect(callbacks.createDraft).not.toHaveBeenCalled();
      await view.clickText('Save draft');
      expect(callbacks.createDraft).toHaveBeenCalledTimes(1);
      expect(view.container.textContent).toContain('Draft saved.');
      expect(view.container.textContent).not.toContain('Saved automatically');

      await view.render({ autosaveDelayMs: 300 });
      await view.edit('input[name="subject"]', 'Saved later');
      await advance(300);
      expect(callbacks.updateDraft).toHaveBeenCalledWith(
        'created-draft',
        expect.objectContaining({ subject: 'Saved later' })
      );
    } finally {
      await view.close();
    }
  });

  it('keeps the folder in view when a draft is saved or sent', async () => {
    const callbacks = draftCallbacks();
    const listMessages = vi.fn<MailyMailboxDataSource['listMessages']>(() => ({
      items: [inboxMessage],
      nextCursor: null,
    }));
    const view = await mount(readOnlySource({ ...callbacks, listMessages }), {
      autosaveDelayMs: false,
    });
    try {
      await view.click('[aria-label="Compose"]');
      await view.edit('input[name="subject"]', 'Stay here');
      await view.clickText('Save draft');
      await view.clickText('Send');
      expect(callbacks.sendDraft).toHaveBeenCalledTimes(1);
      expect(
        listMessages.mock.calls.every(([query]) => query.folder === 'inbox')
      ).toBe(true);
      expect(
        view.find('[aria-label="Inbox"]')?.getAttribute('aria-current')
      ).toBe('page');
    } finally {
      await view.close();
    }
  });
});

it('leaves no unsaved-change guard after Discard or a synchronous Send closes the composition', async () => {
  const callbacks = draftCallbacks();
  const view = await mount(readOnlySource(callbacks));
  try {
    await view.click('[aria-label="Compose"]');
    await view.edit('input[name="subject"]', 'Throwaway');
    await view.clickText('Discard');
    expect(callbacks.discardDraft).not.toHaveBeenCalled();
    await view.click('[aria-label="Sent"]');
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    await view.click('[aria-label="Compose"]');
    await view.edit('input[name="subject"]', 'Sent at once');
    await view.clickText('Send');
    expect(callbacks.sendDraft).toHaveBeenCalledWith('created-draft', {
      revision: 'c1',
    });
    await view.click('[aria-label="Compose"]');
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(view.subject()).toBe('');
  } finally {
    await view.close();
  }
});

describe('mixed draft capabilities', () => {
  it('prepares drafts without send or persisted-draft deletion', async () => {
    vi.useFakeTimers();
    const callbacks = draftCallbacks();
    const view = await mount(readOnlySource(callbacks), {
      draftCapabilities: { send: false, discard: false },
    });
    try {
      await view.click('[aria-label="Compose"]');
      expect(view.button('Send')).toBeNull();
      expect(view.button('Save draft')).toBeTruthy();
      // An unsaved composition closes locally without discardDraft.
      await view.edit('input[name="subject"]', 'Throwaway');
      await view.clickText('Discard');
      expect(view.find('form')).toBeNull();

      await view.click('[aria-label="Compose"]');
      await view.edit('input[name="subject"]', 'For approval');
      await advance(1000);
      expect(callbacks.createDraft).toHaveBeenCalledTimes(1);
      expect(callbacks.createDraft.mock.calls[0][0].subject).toBe(
        'For approval'
      );
      // Once persisted, deletion would need discardDraft, so only Back closes.
      expect(view.button('Discard')).toBeNull();
      expect(view.button('Send')).toBeNull();
      await view.edit('input[name="subject"]', 'For approval v2');
      await advance(1000);
      expect(callbacks.updateDraft).toHaveBeenCalledWith(
        'created-draft',
        expect.objectContaining({ subject: 'For approval v2', revision: 'c1' })
      );
      await view.submit();
      await view.click('[aria-label="Back to list"]');
      expect(view.find('form')).toBeNull();
      expect(callbacks.sendDraft).not.toHaveBeenCalled();
      expect(callbacks.discardDraft).not.toHaveBeenCalled();
    } finally {
      await view.close();
    }
  });

  it('lets a send-only host send an unchanged saved draft as it is', async () => {
    const callbacks = draftCallbacks();
    const view = await mount(readOnlySource(callbacks), {
      draftCapabilities: { create: false, edit: false, discard: false },
    });
    try {
      expect(view.find('[aria-label="Compose"]')).toBeNull();
      await view.openRow('Quarterly update');
      expect(view.find('[aria-label="Reply"]')).toBeNull();
      await view.click('[aria-label="Back to list"]');
      await view.click('[aria-label="Drafts"]');
      await view.openRow('Prepared draft');
      expect(view.heading()).toBe('Draft');
      expect(view.readOnly()).toBe(true);
      expect(view.button('Save draft')).toBeNull();
      expect(view.button('Discard')).toBeNull();
      await view.clickText('Send');
      await flush();
      expect(callbacks.sendDraft).toHaveBeenCalledWith('draft-1', {
        revision: 'v1',
      });
      expect(callbacks.updateDraft).not.toHaveBeenCalled();
      expect(callbacks.createDraft).not.toHaveBeenCalled();
      expect(view.find('form')).toBeNull();
    } finally {
      await view.close();
    }
  });

  it('lets a discard-only host delete a saved draft and nothing else', async () => {
    const callbacks = draftCallbacks();
    const view = await mount(readOnlySource(callbacks), {
      draftCapabilities: { create: false, edit: false, send: false },
    });
    try {
      await view.click('[aria-label="Drafts"]');
      await view.openRow('Prepared draft');
      expect(view.button('Send')).toBeNull();
      expect(view.button('Save draft')).toBeNull();
      await view.clickText('Discard');
      expect(callbacks.discardDraft).toHaveBeenCalledWith('draft-1');
      expect(view.find('form')).toBeNull();
      expect(callbacks.createDraft).not.toHaveBeenCalled();
      expect(callbacks.updateDraft).not.toHaveBeenCalled();
      expect(callbacks.sendDraft).not.toHaveBeenCalled();
    } finally {
      await view.close();
    }
  });

  it('creates once without edit and never autosaves partial content', async () => {
    vi.useFakeTimers();
    const callbacks = draftCallbacks();
    const view = await mount(readOnlySource(callbacks), {
      draftCapabilities: { edit: false },
    });
    try {
      await view.click('[aria-label="Compose"]');
      await view.edit('input[name="subject"]', 'Send now');
      await advance(5000);
      expect(callbacks.createDraft).not.toHaveBeenCalled();
      await view.clickText('Send');
      await flush();
      expect(callbacks.createDraft).toHaveBeenCalledTimes(1);
      expect(callbacks.createDraft.mock.calls[0][0].subject).toBe('Send now');
      expect(callbacks.sendDraft).toHaveBeenCalledWith('created-draft', {
        revision: 'c1',
      });

      await view.click('[aria-label="Compose"]');
      await view.edit('input[name="subject"]', 'Saved once');
      await view.clickText('Save draft');
      await flush();
      expect(callbacks.createDraft).toHaveBeenCalledTimes(2);
      // The saved draft cannot be edited further, so it becomes read-only.
      expect(view.heading()).toBe('Draft');
      expect(view.readOnly()).toBe(true);
      expect(view.readOnlyText()).toContain('Saved once');
      expect(view.button('Save draft')).toBeNull();
      await view.clickText('Send');
      await flush();
      expect(callbacks.sendDraft).toHaveBeenLastCalledWith('created-draft', {
        revision: 'c1',
      });
      expect(callbacks.updateDraft).not.toHaveBeenCalled();
    } finally {
      await view.close();
    }
  });

  it('lets an edit-only host revise saved drafts without starting or sending mail', async () => {
    vi.useFakeTimers();
    const callbacks = draftCallbacks();
    const view = await mount(readOnlySource(callbacks), {
      draftCapabilities: { create: false, send: false, discard: false },
    });
    try {
      expect(view.find('[aria-label="Compose"]')).toBeNull();
      await view.click('[aria-label="Drafts"]');
      await view.openRow('Prepared draft');
      expect(view.heading()).toBe('Edit draft');
      expect(view.button('Send')).toBeNull();
      expect(view.button('Discard')).toBeNull();
      await view.edit('input[name="subject"]', 'Revised draft');
      await advance(1000);
      expect(callbacks.updateDraft).toHaveBeenCalledWith(
        'draft-1',
        expect.objectContaining({ subject: 'Revised draft', revision: 'v1' })
      );
      expect(callbacks.createDraft).not.toHaveBeenCalled();
      expect(callbacks.sendDraft).not.toHaveBeenCalled();
    } finally {
      await view.close();
    }
  });
});

describe('capability changes while a composition is open', () => {
  it('keeps unsaved new content when create is withdrawn and saves it once restored', async () => {
    vi.useFakeTimers();
    const callbacks = draftCallbacks();
    const view = await mount(readOnlySource(callbacks));
    try {
      await view.click('[aria-label="Compose"]');
      await view.edit('input[name="subject"]', 'Keep this text');
      await view.render({ draftCapabilities: { create: false } });
      await advance(5000);
      expect(callbacks.createDraft).not.toHaveBeenCalled();
      expect(view.subject()).toBe('Keep this text');
      expect(view.fields()?.disabled).toBe(false);
      expect(view.container.textContent).toContain(
        'Changes cannot be saved. Your edits are still here.'
      );
      expect(view.button('Save draft')).toBeNull();
      expect(view.button('Send')).toBeNull();
      expect(view.button('Discard')).toBeTruthy();
      expect(view.find('[aria-label="Compose"]')).toBeNull();

      await view.click('[aria-label="Back to list"]');
      expect(document.body.textContent).toContain('Discard unsaved changes?');
      await view.clickText('Keep editing', document.body);
      expect(view.subject()).toBe('Keep this text');

      await view.render({ draftCapabilities: {} });
      await advance(1000);
      expect(callbacks.createDraft).toHaveBeenCalledTimes(1);
      expect(callbacks.createDraft.mock.calls[0][0].subject).toBe(
        'Keep this text'
      );
      expect(callbacks.sendDraft).not.toHaveBeenCalled();
    } finally {
      await view.close();
    }
  });

  it('cancels a scheduled autosave the moment edit is withdrawn', async () => {
    vi.useFakeTimers();
    const callbacks = draftCallbacks();
    const view = await mount(readOnlySource(callbacks));
    try {
      await view.click('[aria-label="Drafts"]');
      await view.openRow('Prepared draft');
      await view.edit('input[name="subject"]', 'Unsaved revision');
      await advance(500);
      await view.render({ draftCapabilities: { edit: false } });
      await advance(5000);
      expect(callbacks.updateDraft).not.toHaveBeenCalled();
      // Sending would deliver the stale saved version, so it is withheld.
      expect(view.button('Send')).toBeNull();
      expect(view.button('Discard')).toBeTruthy();
      expect(view.subject()).toBe('Unsaved revision');
      await view.submit();
      expect(callbacks.sendDraft).not.toHaveBeenCalled();

      await view.render({ draftCapabilities: {} });
      await advance(1000);
      expect(callbacks.updateDraft).toHaveBeenCalledWith(
        'draft-1',
        expect.objectContaining({ subject: 'Unsaved revision' })
      );
      expect(view.button('Send')).toBeTruthy();
    } finally {
      await view.close();
    }
  });

  it('locks a clean draft when edit is withdrawn and unlocks it when restored', async () => {
    vi.useFakeTimers();
    const callbacks = draftCallbacks();
    const view = await mount(readOnlySource(callbacks));
    try {
      await view.click('[aria-label="Drafts"]');
      await view.openRow('Prepared draft');
      expect(view.heading()).toBe('Edit draft');
      await view.render({ draftCapabilities: { edit: false } });
      expect(view.heading()).toBe('Draft');
      expect(view.readOnly()).toBe(true);
      expect(view.button('Send')).toBeTruthy();

      await view.render({ draftCapabilities: {} });
      expect(view.heading()).toBe('Edit draft');
      expect(view.fields()?.disabled).toBe(false);
      await view.edit('input[name="subject"]', 'Unlocked revision');
      await advance(1000);
      expect(callbacks.updateDraft).toHaveBeenCalledWith(
        'draft-1',
        expect.objectContaining({ subject: 'Unlocked revision' })
      );
    } finally {
      await view.close();
    }
  });

  it('shows a visual draft as read-only text and unlocks it without focus or writes', async () => {
    vi.useFakeTimers();
    const callbacks = draftCallbacks();
    const view = await mount(readOnlySource(callbacks), {
      defaultComposeBodyMode: 'mailyEditor',
      draftCapabilities: { edit: false },
    });
    // The hidden Render view has its own read-only ProseMirror.
    const surface = () => view.find('[aria-hidden="false"] .tiptap');
    const toolbar = () => view.find('[aria-label="Editor view mode"]');
    try {
      await view.click('[aria-label="Drafts"]');
      await view.openRow('Prepared draft');
      await advance(50);
      expect(view.readOnly()).toBe(true);
      expect(view.readOnlyText()).toContain('Prepared body');
      expect(surface()).toBeNull();
      expect(toolbar()).toBeNull();

      await view.render({ draftCapabilities: {} });
      await advance(50);
      const unlocked = surface();
      expect(unlocked?.getAttribute('contenteditable')).toBe('true');
      expect(unlocked?.textContent).toContain('Prepared body');
      expect(toolbar()).toBeTruthy();
      expect(unlocked?.contains(document.activeElement)).toBe(false);
      await advance(5000);
      expect(callbacks.updateDraft).not.toHaveBeenCalled();
    } finally {
      await view.close();
    }
  });

  it('switches an opened visual editor to read-only text and back when edit changes', async () => {
    vi.useFakeTimers();
    const callbacks = draftCallbacks();
    const view = await mount(readOnlySource(callbacks), {
      defaultComposeBodyMode: 'mailyEditor',
    });
    const surface = () => view.find('[aria-hidden="false"] .tiptap');
    try {
      await view.click('[aria-label="Drafts"]');
      await view.openRow('Prepared draft');
      await advance(50);
      // Control: an editor the user opens is editable and takes focus.
      const opened = surface();
      expect(opened?.getAttribute('contenteditable')).toBe('true');
      expect(opened?.contains(document.activeElement)).toBe(true);
      await advance(5000);
      const writes = callbacks.updateDraft.mock.calls.length;

      await view.render({ draftCapabilities: { edit: false } });
      await advance(50);
      expect(view.readOnly()).toBe(true);
      expect(surface()).toBeNull();
      // The editor stored HTML, which renders in the sandboxed message frame.
      expect(view.find('form iframe')?.getAttribute('srcdoc')).toContain(
        'Prepared body'
      );

      await view.render({ draftCapabilities: {} });
      await advance(50);
      const unlocked = surface();
      expect(unlocked).not.toBe(opened);
      expect(unlocked?.getAttribute('contenteditable')).toBe('true');
      expect(unlocked?.contains(document.activeElement)).toBe(false);
      await advance(5000);
      expect(callbacks.updateDraft).toHaveBeenCalledTimes(writes);
    } finally {
      await view.close();
    }
  });

  it('hides and restores Reply and Forward in an open reader', async () => {
    const callbacks = draftCallbacks();
    const view = await mount(readOnlySource(callbacks));
    try {
      await view.openRow('Quarterly update');
      expect(view.find('[aria-label="Reply"]')).toBeTruthy();
      await view.render({ draftCapabilities: { create: false } });
      for (const label of ['Reply', 'Reply all', 'Forward'])
        expect(view.find(`[aria-label="${label}"]`), label).toBeNull();
      await view.render({ draftCapabilities: { create: true } });
      await view.click('[aria-label="Forward"]');
      expect(view.subject()).toBe('Fwd: Quarterly update');
      expect(callbacks.createDraft).not.toHaveBeenCalled();
    } finally {
      await view.close();
    }
  });

  it('keeps a written draft instead of sending when send is withdrawn mid-send', async () => {
    const created = deferred<{ id: string; _revision: string }>();
    const callbacks = draftCallbacks();
    callbacks.createDraft.mockImplementation(() => created.promise as never);
    const view = await mount(readOnlySource(callbacks));
    try {
      await view.click('[aria-label="Compose"]');
      await view.edit('input[name="subject"]', 'Not yet');
      const subjectInput = view.find('input[name="subject"]');
      await view.clickText('Send');
      expect(callbacks.createDraft).toHaveBeenCalledTimes(1);
      await view.render({ draftCapabilities: { send: false } });
      created.resolve({ id: 'created-draft', _revision: 'c1' });
      await flush();
      expect(callbacks.sendDraft).not.toHaveBeenCalled();
      // The form that wrote the draft stays mounted; this host's detail read
      // for the new ID is empty and must not replace the written content.
      expect(view.find('input[name="subject"]')).toBe(subjectInput);
      expect(view.subject()).toBe('Not yet');
      expect(view.heading()).toBe('Edit draft');
      expect(view.button('Send')).toBeNull();
      expect(view.container.textContent).toContain(
        'Could not send the message.'
      );
    } finally {
      await view.close();
    }
  });

  it('keeps dirty work protected when create is withdrawn behind the unsaved-change dialog', async () => {
    const callbacks = draftCallbacks();
    const view = await mount(readOnlySource(callbacks));
    try {
      await view.click('[aria-label="Compose"]');
      await view.edit('input[name="subject"]', 'Still mine');
      await view.click('[aria-label="Compose"]');
      expect(document.body.textContent).toContain('Discard unsaved changes?');
      await view.render({ draftCapabilities: { create: false } });
      await view.clickText(
        'Discard',
        document.querySelector('[role="dialog"]')!
      );
      expect(view.subject()).toBe('Still mine');
      await view.click('[aria-label="Back to list"]');
      expect(document.body.textContent).toContain('Discard unsaved changes?');
      await view.clickText('Keep editing', document.body);
      expect(view.subject()).toBe('Still mine');
      expect(callbacks.createDraft).not.toHaveBeenCalled();
    } finally {
      await view.close();
    }
  });

  it('keeps the mailbox lifetime when only capabilities change', async () => {
    const callbacks = draftCallbacks();
    const listMessages = vi.fn<MailyMailboxDataSource['listMessages']>(
      ({ folder }) => ({
        items: folder === 'drafts' ? [savedDraft] : [inboxMessage],
        nextCursor: null,
      })
    );
    const view = await mount(readOnlySource({ ...callbacks, listMessages }));
    try {
      await view.click('[aria-label="Compose"]');
      await view.edit('input[name="subject"]', 'Same session');
      const reads = listMessages.mock.calls.length;
      const capabilities: MailyMailboxDraftCapabilities[] = [
        { send: false },
        { create: false, edit: false, send: false, discard: false },
        {},
      ];
      for (const draftCapabilities of capabilities)
        await view.render({ draftCapabilities });
      expect(view.subject()).toBe('Same session');
      expect(listMessages.mock.calls.length).toBe(reads);
    } finally {
      await view.close();
    }
  });
});
