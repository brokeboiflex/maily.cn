// @vitest-environment happy-dom
import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import {
  MAILBOX_SEARCH_FILTERS,
  MailboxView,
  type MailyMailboxDataSource,
  type MailyMailboxSearchCapabilities,
  type MailyMailboxViewProps,
} from './index';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const ALL: MailyMailboxSearchCapabilities = {
  from: true,
  to: true,
  subject: true,
  after: true,
  before: true,
  hasAttachments: true,
  unread: true,
};

// Visible label of each control, from defaultMailboxLabels.
const CONTROL_LABELS = {
  from: 'From',
  to: 'To',
  subject: 'Subject',
  after: 'After (YYYY/MM/DD)',
  before: 'Before (YYYY/MM/DD)',
  hasAttachments: 'Has attachments',
  unread: 'Unread',
} as const;

function fixture() {
  const listMessages = vi.fn<MailyMailboxDataSource['listMessages']>(() => ({
    items: [
      {
        id: 'first',
        direction: 'in',
        fromAddress: 'sender@example.com',
        toAddresses: ['me@example.com'],
        subject: 'First subject',
        status: 'sent',
        createdAt: '2026-10-09',
      },
    ],
    nextCursor: null,
  }));
  const dataSource: MailyMailboxDataSource = {
    listMessages,
    getMessage: (id) => ({
      id,
      direction: 'in',
      fromAddress: 'sender@example.com',
      toAddresses: ['me@example.com'],
      subject: 'First subject',
      status: 'sent',
      createdAt: '2026-10-09',
    }),
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
    await flush();
  };
  const close = async () => {
    await act(async () => root.unmount());
    container.remove();
  };
  const trigger = () =>
    container.querySelector<HTMLButtonElement>(
      'button[aria-label="Advanced search"]'
    );
  const form = () =>
    document.querySelector<HTMLFormElement>(
      '[data-slot="popover-content"] form'
    );
  const openAdvanced = async () => {
    expect(trigger(), 'advanced-search trigger').toBeTruthy();
    await act(async () => trigger()!.click());
    expect(form(), 'advanced-search form').toBeTruthy();
  };
  // The controls the open form renders, by visible label, in order.
  const visibleControls = () =>
    Array.from(form()?.querySelectorAll('label') ?? []).map(
      (label) => label.textContent
    );
  const control = <T extends HTMLElement>(key: string) => {
    const element = form()?.querySelector<T>(`[id$="-search-${key}"]`);
    expect(element, `${key} control`).toBeTruthy();
    return element!;
  };
  const type = async (input: HTMLInputElement, value: string) => {
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };
  const fill = async (key: string, value: string) =>
    type(control<HTMLInputElement>(key), value);
  const check = async (key: string) => {
    await act(async () => control<HTMLButtonElement>(key).click());
  };
  const submit = async () => {
    await act(async () => form()!.requestSubmit());
    await flush();
  };
  const searchText = async (value: string) => {
    await type(
      container.querySelector<HTMLInputElement>(
        'input[aria-label="Search mail"]'
      )!,
      value
    );
    await flush();
  };
  const lastRequest = () => listMessages.mock.lastCall?.[0];

  return {
    listMessages,
    container,
    render,
    close,
    trigger,
    form,
    openAdvanced,
    visibleControls,
    control,
    fill,
    check,
    submit,
    searchText,
    lastRequest,
  };
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('mailbox search capabilities', () => {
  it('offers text search alone by default and sends no advanced filters', async () => {
    const f = fixture();
    try {
      await f.render({
        searchScope: 'allMail',
        defaultSearchFilters: {
          from: 'boss@example.com',
          subject: 'Quarterly',
          after: '2026/01/01',
          hasAttachments: true,
          unread: true,
        },
      });
      expect(f.trigger()).toBeNull();
      expect(
        f.container.querySelector('button[aria-label="Clear search"]')
      ).toBeNull();
      // Disabled defaults do not count as a search, so the scope stays put.
      expect(f.lastRequest()).toEqual({
        folder: 'inbox',
        q: undefined,
        search: { text: undefined, labelId: undefined },
        labelId: undefined,
        cursor: undefined,
        limit: 50,
      });

      await f.searchText('invoice from:boss');
      expect(f.lastRequest()).toEqual({
        folder: 'allMail',
        q: 'invoice from:boss',
        search: { text: 'invoice from:boss', labelId: undefined },
        labelId: undefined,
        cursor: undefined,
        limit: 50,
      });
      expect(f.trigger()).toBeNull();
    } finally {
      await f.close();
    }
  });

  it('ignores controlled advanced filters that are not enabled', async () => {
    const f = fixture();
    const onSearchFiltersChange = vi.fn();
    try {
      await f.render({
        searchFilters: { to: 'team@example.com', unread: true, starred: true },
        onSearchFiltersChange,
      });
      expect(f.trigger()).toBeNull();
      // starred is not an advanced form filter; the host's value still applies.
      expect(f.lastRequest()?.search).toEqual({
        starred: true,
        text: undefined,
        labelId: undefined,
      });
      expect(f.lastRequest()?.q).toBe('is:starred');
      expect(onSearchFiltersChange).not.toHaveBeenCalled();
    } finally {
      await f.close();
    }
  });

  it('renders and sends only the enabled filters', async () => {
    const f = fixture();
    const onSearchFiltersChange = vi.fn();
    try {
      await f.render({
        searchCapabilities: { from: true, unread: true, subject: false },
        defaultSearchFilters: { subject: 'Ignored', before: '2026/12/31' },
        onSearchFiltersChange,
      });
      expect(f.lastRequest()?.search).toEqual({
        text: undefined,
        labelId: undefined,
      });

      await f.openAdvanced();
      expect(f.visibleControls()).toEqual(['From', 'Unread']);
      await f.fill('from', 'ana@example.com');
      await f.check('unread');
      await f.submit();

      expect(f.form()).toBeNull();
      expect(onSearchFiltersChange).toHaveBeenLastCalledWith({
        from: 'ana@example.com',
        unread: true,
      });
      expect(f.lastRequest()).toEqual({
        folder: 'inbox',
        q: 'from:ana@example.com is:unread',
        search: {
          from: 'ana@example.com',
          unread: true,
          text: undefined,
          labelId: undefined,
        },
        labelId: undefined,
        cursor: undefined,
        limit: 50,
      });
      expect(
        f.container.querySelector('button[aria-label="Clear search"]')
      ).toBeTruthy();
    } finally {
      await f.close();
    }
  });

  it('renders and sends every filter when all are enabled', async () => {
    const f = fixture();
    try {
      await f.render({ searchCapabilities: ALL });
      await f.openAdvanced();
      expect(f.visibleControls()).toEqual(
        MAILBOX_SEARCH_FILTERS.map((key) => CONTROL_LABELS[key])
      );
      await f.fill('from', 'ana@example.com');
      await f.fill('to', 'team@example.com');
      await f.fill('subject', 'Launch plan');
      await f.fill('after', '2026/01/01');
      await f.fill('before', '2026/12/31');
      await f.check('hasAttachments');
      await f.check('unread');
      await f.submit();

      expect(f.lastRequest()?.search).toEqual({
        from: 'ana@example.com',
        to: 'team@example.com',
        subject: 'Launch plan',
        after: '2026/01/01',
        before: '2026/12/31',
        hasAttachments: true,
        unread: true,
        text: undefined,
        labelId: undefined,
      });
      expect(f.lastRequest()?.q).toBe(
        'from:ana@example.com to:team@example.com subject:"Launch plan" ' +
          'after:2026/01/01 before:2026/12/31 is:unread has:attachment'
      );
    } finally {
      await f.close();
    }
  });

  it('clears filters a capability change disables and does not restore them', async () => {
    const f = fixture();
    const onSearchFiltersChange = vi.fn();
    try {
      await f.render({ searchCapabilities: ALL, onSearchFiltersChange });
      await f.openAdvanced();
      await f.fill('from', 'ana@example.com');
      await f.fill('subject', 'Launch plan');
      await f.check('unread');
      await f.submit();
      expect(f.lastRequest()?.q).toBe(
        'from:ana@example.com subject:"Launch plan" is:unread'
      );

      const before = f.listMessages.mock.calls.length;
      await f.render({
        searchCapabilities: { subject: true, to: true },
        onSearchFiltersChange,
      });
      expect(f.listMessages.mock.calls.length).toBe(before + 1);
      expect(f.lastRequest()?.search).toEqual({
        subject: 'Launch plan',
        text: undefined,
        labelId: undefined,
      });
      expect(f.lastRequest()?.q).toBe('subject:"Launch plan"');
      expect(onSearchFiltersChange).toHaveBeenLastCalledWith({
        subject: 'Launch plan',
      });
      await f.openAdvanced();
      expect(f.visibleControls()).toEqual(['To', 'Subject']);
      expect(f.control<HTMLInputElement>('subject').value).toBe('Launch plan');

      // Enabling a filter again starts it empty, and the request is unchanged.
      const settled = f.listMessages.mock.calls.length;
      await f.render({ searchCapabilities: ALL, onSearchFiltersChange });
      expect(f.listMessages.mock.calls.length).toBe(settled);
      expect(f.lastRequest()?.q).toBe('subject:"Launch plan"');
      expect(f.visibleControls()).toEqual(
        MAILBOX_SEARCH_FILTERS.map((key) => CONTROL_LABELS[key])
      );
      expect(f.control<HTMLInputElement>('from').value).toBe('');
      expect(
        f.control<HTMLButtonElement>('unread').getAttribute('aria-checked')
      ).toBe('false');
    } finally {
      await f.close();
    }
  });

  it('hides the trigger and closes the form when every filter is disabled', async () => {
    const f = fixture();
    try {
      await f.render({ searchCapabilities: { unread: true } });
      await f.openAdvanced();
      await f.check('unread');
      await f.submit();
      expect(f.lastRequest()?.search).toEqual({
        unread: true,
        text: undefined,
        labelId: undefined,
      });

      await f.openAdvanced();
      await f.render({ searchCapabilities: {} });
      expect(f.trigger()).toBeNull();
      expect(f.form()).toBeNull();
      expect(f.lastRequest()?.q).toBeUndefined();
      expect(f.lastRequest()?.search).toEqual({
        text: undefined,
        labelId: undefined,
      });
      expect(
        f.container.querySelector('button[aria-label="Clear search"]')
      ).toBeNull();

      // A returning trigger does not reopen the form it had open.
      await f.render({ searchCapabilities: { unread: true } });
      expect(f.trigger()).toBeTruthy();
      expect(f.form()).toBeNull();
      expect(f.lastRequest()?.q).toBeUndefined();
    } finally {
      await f.close();
    }
  });

  it('drops a disabled filter from a staged form on submit', async () => {
    const f = fixture();
    try {
      await f.render({ searchCapabilities: { from: true, subject: true } });
      await f.openAdvanced();
      await f.fill('from', 'ana@example.com');
      await f.fill('subject', 'Launch plan');
      await f.render({ searchCapabilities: { subject: true } });
      expect(f.visibleControls()).toEqual(['Subject']);
      await f.submit();
      expect(f.lastRequest()?.search).toEqual({
        subject: 'Launch plan',
        text: undefined,
        labelId: undefined,
      });
    } finally {
      await f.close();
    }
  });

  it('excludes a disabled controlled filter without requesting a change', async () => {
    const f = fixture();
    const onSearchFiltersChange = vi.fn();
    const searchFilters = { from: 'ana@example.com', unread: true };
    try {
      await f.render({
        searchCapabilities: { from: true, unread: true },
        searchFilters,
        onSearchFiltersChange,
      });
      expect(f.lastRequest()?.q).toBe('from:ana@example.com is:unread');

      await f.render({
        searchCapabilities: { unread: true },
        searchFilters,
        onSearchFiltersChange,
      });
      expect(f.lastRequest()?.search).toEqual({
        unread: true,
        text: undefined,
        labelId: undefined,
      });
      expect(f.lastRequest()?.q).toBe('is:unread');
      expect(onSearchFiltersChange).not.toHaveBeenCalled();
      await f.openAdvanced();
      expect(f.visibleControls()).toEqual(['Unread']);

      // Submitting the form requests the host value without disabled filters.
      await f.submit();
      expect(onSearchFiltersChange).toHaveBeenCalledWith({ unread: true });

      // The controlled value is authoritative: enabling the filter applies it.
      await f.render({
        searchCapabilities: { from: true, unread: true },
        searchFilters,
        onSearchFiltersChange,
      });
      expect(f.lastRequest()?.q).toBe('from:ana@example.com is:unread');
    } finally {
      await f.close();
    }
  });
});
