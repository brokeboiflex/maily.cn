// @vitest-environment happy-dom

import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { afterEach, expect, it, vi } from 'vitest';

import { defaultLabels, englishTranslator } from '../../i18n';
import { MailyProvider } from '../../provider';
import { VariableExtension } from '../../nodes/variable/variable';
import { TooltipProvider } from './tooltip';
import { LinkInputPopover } from './link-input-popover';
import type { ImageUploadOptions } from '../../extensions/image-upload/image-upload';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  document.body.innerHTML = '';
});

async function settle() {
  for (let round = 0; round < 3; round += 1)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
}

async function mount(
  onValueChange: (value: string) => void,
  imageUpload?: ImageUploadOptions,
  onSubmit?: React.FormEventHandler<HTMLFormElement>
) {
  const editor = new Editor({
    extensions: [StarterKit, VariableExtension],
    content: '<p>Text</p>',
  });
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  await act(async () =>
    root.render(
      <MailyProvider
        editor={editor}
        labels={defaultLabels}
        t={englishTranslator}
      >
        <form onSubmit={onSubmit}>
          <TooltipProvider>
            <LinkInputPopover
              editor={editor}
              defaultValue=""
              onValueChange={onValueChange}
              imageUpload={imageUpload}
            />
          </TooltipProvider>
        </form>
      </MailyProvider>
    )
  );
  const trigger = container.querySelector<HTMLButtonElement>('button')!;
  await act(async () => trigger.click());
  await settle();
  const input = document.querySelector<HTMLInputElement>(
    'input[role="combobox"]'
  )!;
  const type = async (value: string) => {
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };
  return {
    editor,
    input,
    type,
    chooseFile: async (type = 'image/png') => {
      const fileInput =
        document.querySelector<HTMLInputElement>('input[type=file]')!;
      Object.defineProperty(fileInput, 'files', {
        configurable: true,
        value: [new File(['image bytes'], 'image.png', { type })],
      });
      await act(async () =>
        fileInput.dispatchEvent(new Event('change', { bubbles: true }))
      );
    },
    unmountHost: () => act(async () => root.unmount()),
    cleanup: async () => {
      await act(async () => root.unmount());
      editor.destroy();
    },
  };
}

it('commits a typed URL once on submit, not on every keystroke', async () => {
  const onValueChange = vi.fn();
  const onSubmit = vi.fn();
  const view = await mount(onValueChange, undefined, onSubmit);
  try {
    expect(view.input).toBeTruthy();
    for (const value of ['h', 'ht', 'https://example.com'])
      await view.type(value);
    // Applying while typing focused the document and closed the popover.
    expect(onValueChange).not.toHaveBeenCalled();
    expect(view.input.isConnected).toBe(true);
    await act(async () => view.input.form!.requestSubmit());
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('https://example.com');
    expect(onSubmit).not.toHaveBeenCalled();
  } finally {
    await view.cleanup();
  }
});

it('keeps a typed URL when the popover closes without Enter', async () => {
  const onValueChange = vi.fn();
  const view = await mount(onValueChange);
  try {
    await view.type('https://example.com');
    await act(async () => {
      view.input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      );
    });
    await settle();
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('https://example.com');
  } finally {
    await view.cleanup();
  }
});

it('commits a pending URL onto its selection when the host unmounts', async () => {
  const onValueChange = vi.fn();
  const view = await mount(onValueChange);
  try {
    await view.type('https://example.com');
    await view.unmountHost();
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('https://example.com');
  } finally {
    view.editor.destroy();
  }
});

it('drops a pending URL when the selection moved before the host unmounts', async () => {
  const onValueChange = vi.fn();
  const view = await mount(onValueChange);
  try {
    await view.type('https://example.com');
    await act(async () => {
      view.editor.commands.setTextSelection(3);
    });
    await view.unmountHost();
    expect(onValueChange).not.toHaveBeenCalled();
  } finally {
    view.editor.destroy();
  }
});

it('uploads actual file bytes once and replaces a pending URL with the returned source', async () => {
  let resolve!: (src: string) => void;
  const onImageUpload = vi.fn<(file: Blob) => Promise<string>>(
    () =>
      new Promise<string>((done) => {
        resolve = done;
      })
  );
  const onValueChange = vi.fn();
  const view = await mount(onValueChange, {
    onImageUpload,
    allowedMimeTypes: ['image/png'],
  });
  try {
    await view.type('https://example.com/unfinished');
    await view.chooseFile();
    await view.chooseFile();
    expect(onImageUpload).toHaveBeenCalledTimes(1);
    expect(await onImageUpload.mock.calls[0][0].text()).toBe('image bytes');
    expect(view.input.disabled).toBe(true);
    await act(async () => resolve('https://example.com/uploaded.png'));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(
      'https://example.com/uploaded.png',
      false
    );
    expect(document.querySelector('input[type=file]')).toBeNull();
  } finally {
    await view.cleanup();
  }
  expect(onValueChange).toHaveBeenCalledTimes(1);
});

it.each(['document', 'selection', 'unmount'] as const)(
  'discards upload results after %s ownership changes',
  async (change) => {
    let resolve!: (src: string) => void;
    const onImageUpload = vi.fn<(file: Blob) => Promise<string>>(
      () =>
        new Promise<string>((done) => {
          resolve = done;
        })
    );
    const onImageUploadDiscard = vi.fn(async () => {});
    const onValueChange = vi.fn();
    const view = await mount(onValueChange, {
      onImageUpload,
      onImageUploadDiscard,
      allowedMimeTypes: ['image/png'],
    });
    try {
      await view.chooseFile();
      if (change === 'unmount') await view.unmountHost();
      else
        await act(async () => {
          if (change === 'document')
            view.editor.commands.setContent('<p>Replacement</p>');
          else view.editor.commands.setTextSelection(3);
        });
      await act(async () => resolve('https://example.com/stale.png'));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(onImageUploadDiscard).toHaveBeenCalledExactlyOnceWith(
        'https://example.com/stale.png'
      );
    } finally {
      if (change === 'unmount') view.editor.destroy();
      else await view.cleanup();
    }
  }
);

it('rejects unsupported files and allows retry after the upload handler fails', async () => {
  const onImageUpload = vi
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce('https://example.com/retry.png');
  const onValueChange = vi.fn();
  const view = await mount(onValueChange, {
    onImageUpload,
    allowedMimeTypes: ['image/png'],
  });
  try {
    await view.chooseFile('text/plain');
    expect(onImageUpload).not.toHaveBeenCalled();
    await view.chooseFile();
    expect(document.querySelector('[role=alert]')?.textContent).toBe(
      defaultLabels['imageUpload.error']
    );
    expect(onValueChange).not.toHaveBeenCalled();
    await view.chooseFile();
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(
      'https://example.com/retry.png',
      false
    );
  } finally {
    await view.cleanup();
  }
});
