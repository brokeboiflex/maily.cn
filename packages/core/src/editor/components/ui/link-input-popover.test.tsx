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

async function mount(onValueChange: (value: string) => void) {
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
        <TooltipProvider>
          <LinkInputPopover
            editor={editor}
            defaultValue=""
            onValueChange={onValueChange}
          />
        </TooltipProvider>
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
    unmountHost: () => act(async () => root.unmount()),
    cleanup: async () => {
      await act(async () => root.unmount());
      editor.destroy();
    },
  };
}

it('commits a typed URL once on submit, not on every keystroke', async () => {
  const onValueChange = vi.fn();
  const view = await mount(onValueChange);
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
