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
