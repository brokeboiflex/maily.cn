// @vitest-environment happy-dom

import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';

import {
  defaultMailboxLabels,
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
        account: { id: crypto.randomUUID() },
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

describe('defaultMailboxLabels', () => {
  it('describes the rich compose mode without exposing the implementation name', () => {
    expect(defaultMailboxLabels['compose.mode.mailyEditor']).toBe(
      'Visual editor'
    );
  });
});

describe('MailboxView message actions', () => {
  it.each([null, '<original@example.com>'])(
    'uses only the RFC message ID when replying (%s)',
    async (messageId) => {
      const createDraft = vi.fn(() => ({ id: 'draft-1' }));
      const rendered = await renderSelectedMailbox({
        dataSource: createDataSource({
          getMessage: () => ({ ...messageDetail, messageId }),
          createDraft,
        }),
      });
      try {
        await act(async () => {
          rendered.container
            .querySelector<HTMLButtonElement>('[aria-label="Reply"]')!
            .click();
        });
        await act(async () => {
          Array.from(rendered.container.querySelectorAll('button'))
            .find((button) => button.textContent === 'Save draft')!
            .click();
        });
        expect(createDraft).toHaveBeenCalledWith(
          expect.objectContaining({
            to: ['sender@example.com'],
            subject: 'Re: Capability check',
            inReplyTo: messageId,
          })
        );
      } finally {
        rendered.unmount();
      }
    }
  );

  it.each(['Save draft', 'Send'])(
    'preserves reply threading when a reopened draft uses %s',
    async (action) => {
      const draft = {
        ...messageDetail,
        direction: 'out' as const,
        status: 'draft' as const,
        inReplyTo: '<original@example.com>',
      };
      const updateDraft = vi.fn(() => ({ id: draft.id }));
      const rendered = await renderSelectedMailbox({
        dataSource: createDataSource({
          listMessages: () => ({ items: [draft], nextCursor: null }),
          getMessage: () => draft,
          updateDraft,
        }),
      });
      try {
        await act(async () => {
          Array.from(rendered.container.querySelectorAll('button'))
            .find((button) => button.textContent === action)!
            .click();
        });
        expect(updateDraft).toHaveBeenCalledWith(
          draft.id,
          expect.objectContaining({
            inReplyTo: '<original@example.com>',
          })
        );
      } finally {
        rendered.unmount();
      }
    }
  );

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

describe('MailboxView attachments', () => {
  it('renders metadata without a download capability or list paperclip flag', async () => {
    const rendered = await renderSelectedMailbox({
      labels: {
        ...defaultMailboxLabels,
        'message.attachments': 'Załączniki ({count})',
        'attachment.sizeKB': '{size} kilobajtów',
      },
      dataSource: createDataSource({
        getMessage: () => ({
          ...messageDetail,
          hasAttachments: false,
          attachments: [
            {
              filename: 'report.pdf',
              contentType: 'application/pdf',
              size: 1536,
            },
            { filename: 'empty.txt', size: 0 },
            { filename: '<script>alert(1)</script>.txt' },
          ],
        }),
      }),
    });
    try {
      const section = rendered.container.querySelector(
        'section[aria-label="Załączniki (3)"]'
      );
      expect(section?.textContent).toContain('report.pdf');
      expect(section?.textContent).toContain(
        'application/pdf · 1.5 kilobajtów'
      );
      expect(section?.textContent).toContain('0 B');
      expect(section?.textContent).toContain('<script>alert(1)</script>.txt');
      expect(section?.querySelector('script')).toBeNull();
      expect(section?.querySelectorAll('li')).toHaveLength(3);
      expect(section?.querySelector('button')).toBeNull();
    } finally {
      rendered.unmount();
    }
  });

  it.each([undefined, []])(
    'omits the attachment section for %j',
    async (attachments) => {
      const rendered = await renderSelectedMailbox({
        dataSource: createDataSource({
          getMessage: () => ({
            ...messageDetail,
            hasAttachments: true,
            attachments,
          }),
        }),
      });
      try {
        expect(
          rendered.container.querySelector('section[aria-label^="Attachments"]')
        ).toBeNull();
      } finally {
        rendered.unmount();
      }
    }
  );

  it('keeps attachments visible when the body and valid sizes are unavailable', async () => {
    const rendered = await renderSelectedMailbox({
      dataSource: createDataSource({
        getMessage: () => ({
          ...messageDetail,
          bodyText: null,
          attachments: [
            { filename: 'missing.pdf' },
            { filename: 'invalid.pdf', size: -1 },
            { filename: 'unknown.pdf', size: NaN },
          ],
        }),
      }),
    });
    try {
      expect(rendered.container.textContent).toContain('No message body.');
      expect(
        rendered.container.querySelectorAll('[data-slot="attachment-title"]')
      ).toHaveLength(3);
      expect(
        rendered.container.querySelectorAll(
          '[data-slot="attachment-description"]'
        )
      ).toHaveLength(0);
    } finally {
      rendered.unmount();
    }
  });

  it('downloads the correct same-named file and prevents duplicate pending requests', async () => {
    let complete!: () => void;
    const downloadAttachment = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve;
        })
    );
    const attachments = [
      { id: 'part-1', filename: 'report.pdf' },
      { id: 'part-2', filename: 'report.pdf' },
    ];
    const rendered = await renderSelectedMailbox({
      dataSource: createDataSource({
        getMessage: () => ({ ...messageDetail, attachments }),
        downloadAttachment,
      }),
    });
    try {
      const buttons = rendered.container.querySelectorAll<HTMLButtonElement>(
        '[aria-label="Download report.pdf"]'
      );
      await act(async () => {
        buttons[1].click();
        buttons[1].click();
      });
      expect(downloadAttachment).toHaveBeenCalledTimes(1);
      expect(downloadAttachment).toHaveBeenCalledWith({
        messageId: 'msg-1',
        attachment: attachments[1],
        attachmentIndex: 1,
      });
      expect(buttons[1].disabled).toBe(true);
      expect(buttons[1].getAttribute('aria-label')).toBe(
        'Downloading report.pdf'
      );
      expect(buttons[0].disabled).toBe(false);
      await act(async () => {
        complete();
      });
      expect(buttons[1].disabled).toBe(false);
      expect(buttons[1].getAttribute('aria-label')).toBe('Download report.pdf');
    } finally {
      rendered.unmount();
    }
  });

  it('reports download failures beside the file and retries through the host adapter', async () => {
    const error = new Error('Download failed');
    const onError = vi.fn();
    const downloadAttachment = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue(undefined);
    const rendered = await renderSelectedMailbox({
      onError,
      dataSource: createDataSource({
        getMessage: () => ({
          ...messageDetail,
          attachments: [{ filename: 'report.pdf' }],
        }),
        downloadAttachment,
      }),
    });
    try {
      const button = rendered.container.querySelector<HTMLButtonElement>(
        '[aria-label="Download report.pdf"]'
      )!;
      await act(async () => {
        button.click();
      });
      expect(
        rendered.container.querySelector('[role="alert"]')?.textContent
      ).toBe('Could not download report.pdf. Try again.');
      expect(onError).toHaveBeenCalledWith(error, 'attachmentDownload');
      expect(button.disabled).toBe(false);
      await act(async () => {
        button.click();
      });
      expect(downloadAttachment).toHaveBeenCalledTimes(2);
      expect(rendered.container.querySelector('[role="alert"]')).toBeNull();
    } finally {
      rendered.unmount();
    }
  });
});

describe('original message source', () => {
  const click = async (container: HTMLElement, label: string) => {
    const button = Array.from(container.querySelectorAll('button')).find(
      (node) =>
        node.textContent === label || node.getAttribute('aria-label') === label
    );
    expect(button).toBeTruthy();
    await act(async () => {
      button!.click();
    });
  };

  it('fetches only on demand and displays literal MIME safely with a way back', async () => {
    const raw =
      'From: sender@example.com\r\nContent-Type: text/html\r\n\r\n<script>alert(1)</script><img src="https://tracker.invalid/pixel">';
    const getMessageSource = vi.fn(() => raw);
    const view = await renderSelectedMailbox({
      dataSource: createDataSource({ getMessageSource }),
      messageActions: ['showOriginal'],
    });
    try {
      expect(getMessageSource).not.toHaveBeenCalled();
      await click(view.container, 'Show original');
      expect(getMessageSource).toHaveBeenCalledWith('msg-1');
      expect(view.container.querySelector('pre')?.textContent).toBe(raw);
      expect(
        view.container.querySelector('pre script, pre img, iframe')
      ).toBeNull();
      await click(view.container, 'Back to message');
      expect(
        view.container.querySelector('section[aria-label="Show original"]')
      ).toBeNull();
      expect(view.container.textContent).toContain('Body');
    } finally {
      view.unmount();
    }
  });

  it('hides unsupported original action and retries a failed source request', async () => {
    const hidden = await renderSelectedMailbox({
      messageActions: ['showOriginal'],
    });
    expect(
      hidden.container.querySelector('[aria-label="Show original"]')
    ).toBeNull();
    hidden.unmount();
    const onError = vi.fn();
    const getMessageSource = vi
      .fn()
      .mockRejectedValueOnce(new Error('Gone'))
      .mockResolvedValueOnce('Recovered source');
    const view = await renderSelectedMailbox({
      dataSource: createDataSource({ getMessageSource }),
      messageActions: ['showOriginal'],
      onError,
    });
    try {
      await click(view.container, 'Show original');
      expect(view.container.querySelector('[role="alert"]')?.textContent).toBe(
        defaultMailboxLabels['source.error']
      );
      expect(onError).toHaveBeenCalledOnce();
      await click(view.container, 'Retry');
      expect(view.container.querySelector('pre')?.textContent).toBe(
        'Recovered source'
      );
    } finally {
      view.unmount();
    }
  });

  it('lets the reader leave a pending request without exposing its late result', async () => {
    let resolve!: (source: string) => void;
    const getMessageSource = vi.fn(
      () =>
        new Promise<string>((done) => {
          resolve = done;
        })
    );
    const view = await renderSelectedMailbox({
      dataSource: createDataSource({ getMessageSource }),
      messageActions: ['showOriginal'],
    });
    try {
      await click(view.container, 'Show original');
      expect(view.container.querySelector('[role="status"]')?.textContent).toBe(
        defaultMailboxLabels.loading
      );
      await click(view.container, 'Back to message');
      await act(async () => {
        resolve('Late source');
      });
      expect(view.container.textContent).not.toContain('Late source');
    } finally {
      view.unmount();
    }
  });
});

describe('MailboxView mutation recovery', () => {
  it('retains draft revision observed with editable content and advances after success', async () => {
    const draft = {
      ...messageDetail,
      direction: 'out' as const,
      status: 'draft' as const,
      _revision: 'observed-v1',
    };
    const updateDraft = vi.fn(
      (..._args: Parameters<MailyMailboxDataSource['updateDraft']>) => ({
        id: draft.id,
        _revision: 'saved-v2',
      })
    );
    const rendered = await renderSelectedMailbox({
      dataSource: createDataSource({
        listMessages: () => ({ items: [draft] }),
        getMessage: () => draft,
        updateDraft,
      }),
    });
    try {
      for (let i = 0; i < 2; i++) {
        await act(async () => {
          Array.from(rendered.container.querySelectorAll('button'))
            .find((button) => button.textContent === 'Save draft')!
            .click();
        });
      }
      expect(updateDraft.mock.calls[0][1].revision).toBe('observed-v1');
      expect(updateDraft.mock.calls[1][1].revision).toBe('saved-v2');
    } finally {
      rendered.unmount();
    }
  });

  it('recovers an unknown send after remount without creating or rewriting its draft', async () => {
    const draft = {
      ...messageDetail,
      direction: 'out' as const,
      status: 'draft' as const,
      _revision: 'v1',
    };
    const account = { id: crypto.randomUUID() };
    const createDraft = vi.fn(() => ({ id: 'unexpected' }));
    const updateDraft = vi.fn(() => ({ id: draft.id, _revision: 'v2' }));
    const sendDraft = vi
      .fn()
      .mockRejectedValueOnce(Error('response lost'))
      .mockResolvedValue({ id: draft.id });
    const dataSource = createDataSource({
      listMessages: () => ({ items: [draft] }),
      getMessage: () => draft,
      createDraft,
      updateDraft,
      sendDraft,
    });
    const first = await renderSelectedMailbox({ dataSource, account });
    await act(async () => {
      Array.from(first.container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Send')!
        .click();
    });
    first.unmount();
    const resumed = await renderSelectedMailbox({ dataSource, account });
    try {
      await act(async () => {
        Array.from(resumed.container.querySelectorAll('button'))
          .find((button) => button.textContent === 'Send')!
          .click();
      });
      expect(createDraft).not.toHaveBeenCalled();
      expect(updateDraft).toHaveBeenCalledTimes(1);
      expect(sendDraft.mock.calls).toEqual([[draft.id], [draft.id]]);
    } finally {
      resumed.unmount();
    }
  });
});

describe('compose hydration ownership', () => {
  it('does not mount editable compose before matching draft content arrives', async () => {
    let resolve!: (value: MailyMailboxMessageDetail) => void;
    const pending = new Promise<MailyMailboxMessageDetail>((done) => {
      resolve = done;
    });
    const draft = {
      ...messageDetail,
      id: 'draft-hydration',
      status: 'draft' as const,
      direction: 'out' as const,
      subject: 'Capability check',
      bodyText: 'saved draft body',
      _revision: 'captured-revision',
    };
    const updateDraft = vi.fn(() => ({ id: draft.id }));
    const view = await renderSelectedMailbox({
      dataSource: createDataSource({
        listMessages: () => ({ items: [draft], nextCursor: null }),
        getMessage: () => pending,
        updateDraft,
      }),
    });
    expect(view.container.querySelector('textarea')).toBeNull();
    expect(view.container.querySelector('form')).toBeNull();
    expect(updateDraft).not.toHaveBeenCalled();
    await act(async () => {
      resolve(draft);
      await pending;
    });
    expect(view.container.querySelector('textarea')?.value).toBe(
      'saved draft body'
    );
    view.unmount();
  });
});

describe('mailbox lifetime and actor recovery scope', () => {
  it('retains the prepared draft but never sends after the owning mailbox leaves', async () => {
    let resolve!: (value: { id: string; _revision: string }) => void;
    const prepared = new Promise<{ id: string; _revision: string }>((done) => {
      resolve = done;
    });
    const draft = {
      ...messageDetail,
      direction: 'out' as const,
      status: 'draft' as const,
      _revision: 'v1',
    };
    const account = { id: crypto.randomUUID() };
    const recoveryScope = `${account.id}:actor-A`;
    const sendDraft = vi.fn();
    const onSent = vi.fn();
    const view = await renderSelectedMailbox({
      account,
      recoveryScope,
      onSent,
      dataSource: createDataSource({
        listMessages: () => ({ items: [draft] }),
        getMessage: () => draft,
        updateDraft: () => prepared,
        sendDraft,
      }),
    });
    await act(async () => {
      Array.from(view.container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Send')!
        .click();
    });
    view.unmount();
    await act(async () => {
      resolve({ id: draft.id, _revision: 'v2' });
      await prepared;
    });
    expect(sendDraft).not.toHaveBeenCalled();
    expect(onSent).not.toHaveBeenCalled();
    expect(
      window.sessionStorage.getItem(`maily:pending-send:${recoveryScope}`)
    ).toBe(draft.id);
    window.sessionStorage.removeItem(`maily:pending-send:${recoveryScope}`);
  });

  it('keeps an unscoped legacy send blocked instead of adopting another actor intent', async () => {
    const account = { id: crypto.randomUUID() };
    const legacyKey = `maily:pending-send:${account.id}`;
    window.sessionStorage.setItem(legacyKey, 'legacy-draft');
    const createDraft = vi.fn();
    const sendDraft = vi.fn();
    const view = await renderSelectedMailbox({
      account,
      recoveryScope: `${account.id}:actor-B`,
      dataSource: createDataSource({ createDraft, sendDraft }),
    });
    try {
      await act(async () => {
        view.container
          .querySelector<HTMLButtonElement>(
            `button[aria-label="${defaultMailboxLabels['compose.new']}"]`
          )!
          .click();
      });
      expect(createDraft).not.toHaveBeenCalled();
      expect(sendDraft).not.toHaveBeenCalled();
      expect(window.sessionStorage.getItem(legacyKey)).toBe('legacy-draft');
      expect(view.container.textContent).toContain(
        defaultMailboxLabels['errors.send']
      );
    } finally {
      view.unmount();
      window.sessionStorage.removeItem(legacyKey);
    }
  });
});
