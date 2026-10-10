// @vitest-environment happy-dom
import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import {
  MailboxView,
  type MailyMailboxDataSource,
  type MailyMailboxViewProps,
} from './index';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function fixture() {
  const row = {
    id: 'first',
    direction: 'in' as const,
    fromAddress: 'sender@example.com',
    toAddresses: ['me@example.com'],
    subject: 'First subject',
    status: 'sent' as const,
    createdAt: '2026-10-09',
    bodyText: 'First body',
  };
  const listMessages = vi.fn(
    (_params: Parameters<MailyMailboxDataSource['listMessages']>[0]) => ({
      items: [row],
      nextCursor: 'page-two',
      total: 2,
    })
  );
  const getMessage = vi.fn((id: string) => ({
    ...row,
    id,
    bodyText: `${id} body`,
  }));
  const dataSource: MailyMailboxDataSource = {
    listMessages,
    getMessage,
    createDraft: () => ({ id: 'draft' }),
    updateDraft: () => ({ id: 'draft' }),
    discardDraft: () => undefined,
    sendDraft: () => undefined,
  };
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const render = async (props: Partial<MailyMailboxViewProps>) => {
    await act(async () => {
      root.render(
        <MailboxView dataSource={dataSource} pollIntervalMs={0} {...props} />
      );
    });
  };
  const close = async () => {
    await act(async () => root.unmount());
    container.remove();
  };
  const click = async (text: string) => {
    await act(async () => {
      const button = Array.from(container.querySelectorAll('button')).find(
        (node) =>
          node.textContent?.includes(text) ||
          node.getAttribute('aria-label') === text
      );
      expect(button).toBeTruthy();
      button!.click();
    });
  };
  return {
    row,
    dataSource,
    listMessages,
    getMessage,
    container,
    render,
    close,
    click,
  };
}

it('requests controlled navigation and reader selection without accepting a rejected request', async () => {
  const f = fixture();
  const onFolderChange = vi.fn();
  const onSelectedMessageIdChange = vi.fn();
  try {
    await f.render({
      folder: 'inbox',
      selectedMessageId: null,
      onFolderChange,
      onSelectedMessageIdChange,
    });
    expect(onFolderChange).not.toHaveBeenCalled();
    expect(onSelectedMessageIdChange).not.toHaveBeenCalled();
    await f.click('Sent');
    expect(onFolderChange).toHaveBeenCalledWith('sent');
    expect(f.listMessages).toHaveBeenLastCalledWith(
      expect.objectContaining({ folder: 'inbox' })
    );
    await f.click('First subject');
    expect(onSelectedMessageIdChange).toHaveBeenCalledWith('first');
    expect(f.getMessage).not.toHaveBeenCalled();
    await f.render({
      folder: 'sent',
      selectedMessageId: 'off-page',
      onFolderChange,
      onSelectedMessageIdChange,
    });
    expect(f.listMessages).toHaveBeenLastCalledWith(
      expect.objectContaining({ folder: 'sent' })
    );
    expect(f.getMessage).toHaveBeenCalledWith('off-page');
    expect(f.container.textContent).toContain('off-page body');
    expect(onSelectedMessageIdChange).toHaveBeenCalledTimes(1);
  } finally {
    await f.close();
  }
});

it('honors default state and does not clear an off-page controlled selection during equivalent query rerenders', async () => {
  const f = fixture();
  const onSearchFiltersChange = vi.fn();
  const onSelectedMessageIdsChange = vi.fn();
  try {
    await f.render({
      initialFolder: 'sent',
      defaultSearch: 'invoice',
      defaultSearchScope: 'allMail',
      searchFilters: { from: 'sender@example.com' },
      selectedMessageId: 'off-page',
      selectedMessageIds: ['off-page'],
      onSearchFiltersChange,
      onSelectedMessageIdsChange,
    });
    expect(f.listMessages).toHaveBeenLastCalledWith(
      expect.objectContaining({
        folder: 'allMail',
        search: expect.objectContaining({
          text: 'invoice',
          from: 'sender@example.com',
        }),
      })
    );
    const calls = f.listMessages.mock.calls.length;
    await f.render({
      initialFolder: 'sent',
      defaultSearch: 'invoice',
      defaultSearchScope: 'allMail',
      searchFilters: { from: 'sender@example.com' },
      selectedMessageId: 'off-page',
      selectedMessageIds: ['off-page'],
      onSearchFiltersChange: vi.fn(),
      onSelectedMessageIdsChange,
    });
    expect(f.listMessages).toHaveBeenCalledTimes(calls);
    expect(f.container.textContent).toContain('off-page body');
    expect(onSelectedMessageIdsChange).not.toHaveBeenCalled();
    expect(onSearchFiltersChange).not.toHaveBeenCalled();
  } finally {
    await f.close();
  }
});

it('keeps uncontrolled folder and reader interactions working', async () => {
  const f = fixture();
  try {
    await f.render({});
    await f.click('Sent');
    expect(f.listMessages).toHaveBeenLastCalledWith(
      expect.objectContaining({ folder: 'sent' })
    );
    await f.click('First subject');
    expect(f.container.textContent).toContain('first body');
  } finally {
    await f.close();
  }
});

it('rejects controlled search without changing its scope, and accepts external filter and scope updates', async () => {
  const f = fixture();
  const onSearchChange = vi.fn();
  try {
    await f.render({ search: '', onSearchChange });
    const input = f.container.querySelector<HTMLInputElement>(
      'input[aria-label="Search mail"]'
    )!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, 'invoice');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(onSearchChange).toHaveBeenCalledWith('invoice');
    expect(input.value).toBe('');
    expect(f.listMessages).toHaveBeenLastCalledWith(
      expect.objectContaining({ folder: 'inbox' })
    );
    await f.render({
      search: 'invoice',
      searchScope: 'allMail',
      searchFilters: { unread: true },
      selectedLabelId: 'receipts',
      onSearchChange,
    });
    expect(f.listMessages).toHaveBeenLastCalledWith(
      expect.objectContaining({
        folder: 'allMail',
        labelId: 'receipts',
        search: expect.objectContaining({
          text: 'invoice',
          unread: true,
          labelId: 'receipts',
        }),
      })
    );
    expect(onSearchChange).toHaveBeenCalledTimes(1);
  } finally {
    await f.close();
  }
});

it('preserves default selections on mount and requests controlled checkbox changes', async () => {
  const f = fixture();
  f.dataSource.runBulkMessageAction = vi.fn();
  const onSelectedMessageIdsChange = vi.fn();
  try {
    await f.render({
      defaultSelectedMessageId: 'first',
      defaultSelectedMessageIds: ['first'],
    });
    expect(f.container.textContent).toContain('first body');
    expect(
      f.container
        .querySelector('[aria-label="Select all on this page"]')
        ?.getAttribute('aria-checked')
    ).toBe('true');
    await f.render({ selectedMessageIds: [], onSelectedMessageIdsChange });
    await f.click('Select all on this page');
    expect(onSelectedMessageIdsChange).toHaveBeenCalledWith(['first']);
    expect(
      f.container
        .querySelector('[aria-label="Select all on this page"]')
        ?.getAttribute('aria-checked')
    ).toBe('false');
    await f.render({
      selectedMessageIds: ['first'],
      onSelectedMessageIdsChange,
    });
    expect(
      f.container
        .querySelector('[aria-label="Select all on this page"]')
        ?.getAttribute('aria-checked')
    ).toBe('true');
    expect(onSelectedMessageIdsChange).toHaveBeenCalledTimes(1);
  } finally {
    await f.close();
  }
});

it('completes label navigation after the parent accepts a controlled folder request', async () => {
  const f = fixture();
  f.dataSource.listLabels = () => [{ id: 'projects', name: 'Projects' }];
  const onFolderChange = vi.fn();
  try {
    await f.render({
      folder: 'inbox',
      defaultSearch: 'invoice',
      defaultSearchScope: 'allMail',
      onFolderChange,
    });
    await f.click('Projects');
    expect(onFolderChange).toHaveBeenCalledWith('allMail');
    expect(f.listMessages).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: 'invoice', labelId: undefined })
    );
    await f.render({ folder: 'allMail', onFolderChange });
    expect(f.listMessages).toHaveBeenLastCalledWith(
      expect.objectContaining({
        folder: 'allMail',
        q: undefined,
        labelId: 'projects',
      })
    );
    expect(onFolderChange).toHaveBeenCalledTimes(1);
  } finally {
    await f.close();
  }
});

it('hydrates a default draft selection into compose', async () => {
  const f = fixture();
  f.dataSource.getMessage = () => ({
    ...f.row,
    status: 'draft' as const,
    inReplyTo: '<reply@example.com>',
    _revision: 'r1',
  });
  try {
    await f.render({ defaultSelectedMessageId: 'first' });
    expect(
      f.container.querySelector<HTMLInputElement>('input[name="subject"]')
        ?.value
    ).toBe('First subject');
  } finally {
    await f.close();
  }
});

it('opens a draft only after the parent accepts the reader selection', async () => {
  const f = fixture();
  const draft = {
    ...f.row,
    status: 'draft' as const,
    inReplyTo: '<reply@example.com>',
    _revision: 'r1',
  };
  f.dataSource.listMessages = () => ({ items: [draft] });
  f.dataSource.getMessage = () => draft;
  const onSelectedMessageIdChange = vi.fn();
  try {
    await f.render({ selectedMessageId: null, onSelectedMessageIdChange });
    await f.click('First subject');
    expect(onSelectedMessageIdChange).toHaveBeenCalledWith('first');
    expect(f.container.querySelector('input[name="subject"]')).toBeNull();
    await f.render({ selectedMessageId: 'first', onSelectedMessageIdChange });
    expect(
      f.container.querySelector<HTMLInputElement>('input[name="subject"]')
        ?.value
    ).toBe('First subject');
    expect(onSelectedMessageIdChange).toHaveBeenCalledTimes(1);
  } finally {
    await f.close();
  }
});

it('keeps a controlled folder authoritative after saving a new draft', async () => {
  const f = fixture();
  const onFolderChange = vi.fn();
  try {
    await f.render({ folder: 'inbox', onFolderChange });
    await f.click('Compose');
    await f.click('Save draft');
    expect(onFolderChange).toHaveBeenCalledWith('drafts');
    expect(f.listMessages).toHaveBeenLastCalledWith(
      expect.objectContaining({ folder: 'inbox' })
    );
  } finally {
    await f.close();
  }
});

it('revalidates a controlled reader when its parent keeps selection after archive', async () => {
  const f = fixture();
  const onSelectedMessageIdChange = vi.fn();
  f.dataSource.runMessageAction = vi.fn(async () => undefined);
  try {
    await f.render({
      selectedMessageId: 'first',
      onSelectedMessageIdChange,
      messageActions: ['archive'],
    });
    const reads = f.getMessage.mock.calls.length;
    await f.click('Archive');
    expect(onSelectedMessageIdChange).toHaveBeenCalledWith(null);
    expect(f.getMessage.mock.calls.length).toBeGreaterThan(reads);
    expect(f.container.textContent).toContain('first body');
  } finally {
    await f.close();
  }
});

it('dismisses a leaf label dialog even when an older layer consumed Escape', async () => {
  const f = fixture();
  f.dataSource.listLabels = () => [];
  f.dataSource.createLabel = (name) => ({ id: name, name });
  try {
    await f.render({});
    await f.click('Create label');
    const input = document.querySelector<HTMLInputElement>(
      '[role="dialog"] input'
    )!;
    expect(input).toBeTruthy();
    await act(async () => {
      const escape = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      escape.preventDefault();
      input.dispatchEvent(escape);
    });
    expect(
      document.querySelector('[role="dialog"]')?.getAttribute('data-state')
    ).not.toBe('open');
  } finally {
    await f.close();
  }
});

it('keeps controlled draft compose open until the host accepts Back', async () => {
  const f = fixture();
  const onSelectedMessageIdChange = vi.fn();
  f.dataSource.getMessage = (id: string) => ({
    ...f.row,
    id,
    status: 'draft',
    bodyText: 'Saved draft body',
  });
  try {
    await f.render({ selectedMessageId: 'first', onSelectedMessageIdChange });
    expect(f.container.querySelector('input[name="subject"]')).toBeTruthy();
    await f.click('Back to list');
    expect(onSelectedMessageIdChange).toHaveBeenCalledWith(null);
    expect(f.container.querySelector('input[name="subject"]')).toBeTruthy();
    await f.render({ selectedMessageId: null, onSelectedMessageIdChange });
    expect(f.container.querySelector('input[name="subject"]')).toBeNull();
    expect(
      f.container.querySelector('[tabindex="-1"]')?.hasAttribute('hidden')
    ).toBe(false);
  } finally {
    await f.close();
  }
});

for (const returnsDetail of [true, false]) {
  it(`rejects old reader action completion after controlled selection changes (${returnsDetail ? 'detail result' : 'detail refetch'})`, async () => {
    const f = fixture();
    let resolve!: (
      value: Awaited<ReturnType<typeof f.dataSource.getMessage>> | undefined
    ) => void;
    const pending = new Promise<
      Awaited<ReturnType<typeof f.dataSource.getMessage>> | undefined
    >((done) => {
      resolve = done;
    });
    f.dataSource.runMessageAction = () => pending;
    const props = { messageActions: ['favorite'] as const };
    try {
      await f.render({ ...props, selectedMessageId: 'first' });
      await f.click('Add star');
      await f.render({ ...props, selectedMessageId: 'second' });
      expect(f.container.textContent).toContain('second body');
      await act(async () => {
        resolve(returnsDetail ? { ...f.row, isFavorite: true } : undefined);
      });
      expect(f.container.textContent).toContain('second body');
      expect(f.container.querySelector('h2')?.textContent).toBe(
        'First subject'
      );
      expect(
        f.container.querySelector('[aria-label="Remove star"]')
      ).toBeNull();
    } finally {
      await f.close();
    }
  });
}

it('refreshes the current controlled query after an older message action completes', async () => {
  const f = fixture();
  let resolve!: () => void;
  const pending = new Promise<void>((done) => {
    resolve = done;
  });
  f.dataSource.runMessageAction = () => pending;
  const props = {
    messageActions: ['favorite'] as const,
    searchScope: 'folder' as const,
  };
  try {
    await f.render({
      ...props,
      selectedMessageId: 'first',
      folder: 'inbox',
      search: 'old search',
    });
    await f.click('Add star');
    await f.render({
      ...props,
      selectedMessageId: 'second',
      folder: 'sent',
      search: 'current search',
      selectedLabelId: 'current-label',
    });
    await act(async () => resolve());
    const lastQuery = f.listMessages.mock.calls.at(-1)?.[0] as {
      folder: string;
      search: { text: string };
      labelId: string;
    };
    expect(lastQuery).toMatchObject({
      folder: 'sent',
      search: { text: 'current search' },
      labelId: 'current-label',
    });
    expect(f.container.textContent).toContain('second body');
  } finally {
    await f.close();
  }
});

it('keeps newer controlled bulk selection and reader while refreshing the current query', async () => {
  const f = fixture();
  let resolve!: () => void;
  const pending = new Promise<void>((done) => {
    resolve = done;
  });
  f.dataSource.runBulkMessageAction = () => pending;
  const onSelectedMessageIdsChange = vi.fn();
  const onSelectedMessageIdChange = vi.fn();
  const props = {
    messageActions: ['archive'] as const,
    onSelectedMessageIdsChange,
    onSelectedMessageIdChange,
  };
  try {
    await f.render({
      ...props,
      selectedMessageIds: ['first'],
      selectedMessageId: null,
      folder: 'inbox',
    });
    await f.click('Archive');
    await f.render({
      ...props,
      selectedMessageIds: ['second'],
      selectedMessageId: 'second',
      folder: 'sent',
    });
    onSelectedMessageIdsChange.mockClear();
    onSelectedMessageIdChange.mockClear();
    await act(async () => resolve());
    expect(onSelectedMessageIdsChange).not.toHaveBeenCalled();
    expect(onSelectedMessageIdChange).not.toHaveBeenCalled();
    expect(f.container.textContent).toContain('second body');
    expect(f.listMessages.mock.calls.at(-1)?.[0]).toMatchObject({
      folder: 'sent',
    });
  } finally {
    await f.close();
  }
});
