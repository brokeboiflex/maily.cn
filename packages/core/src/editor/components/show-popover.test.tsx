// @vitest-environment happy-dom

import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { expect, it, vi } from 'vitest';
import { VariableExtension, type Variables } from '../nodes/variable/variable';
import { processVariables } from '../utils/variable';
import { ShowPopover } from './show-popover';
import { TooltipProvider } from './ui/tooltip';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

it.each<{ label: string; variables?: Variables; visible: boolean }>([
  { label: 'omitted', visible: false },
  { label: 'empty list', variables: [], visible: false },
  {
    label: 'populated list',
    variables: [{ name: 'recipient.vip' }],
    visible: true,
  },
  { label: 'provider', variables: () => [], visible: true },
])(
  'shows conditional controls only with registered variables: $label',
  async ({ variables, visible }) => {
    const editor = new Editor({
      extensions: [
        StarterKit,
        variables === undefined
          ? VariableExtension
          : VariableExtension.configure({ variables }),
      ],
    });
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const onSubmit = vi.fn();
    try {
      await act(async () =>
        root.render(
          <form onSubmit={onSubmit}>
            <TooltipProvider>
              <ShowPopover editor={editor} showIfKey="recipient.vip" />
            </TooltipProvider>
          </form>
        )
      );
      const trigger = container.querySelector<HTMLButtonElement>(
        '[aria-label="Show block conditionally"]'
      );
      expect(!!trigger).toBe(visible);
      expect(!!container.querySelector('[role="separator"]')).toBe(visible);
      if (!visible) {
        expect(
          processVariables([], {
            query: 'recipient.vip',
            from: 'content-variable',
            editor,
          })
        ).toEqual([]);
        return;
      }
      await act(async () => trigger!.click());
      const valueButton = document.querySelector<HTMLButtonElement>(
        '[data-slot="popover-content"] button'
      )!;
      await act(async () => valueButton.click());
      const input = document.querySelector<HTMLInputElement>(
        'input[aria-label="Show if"]'
      )!;
      expect(input).toBeTruthy();
      await act(async () => input.form!.requestSubmit());
      expect(onSubmit).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      editor.destroy();
      container.remove();
    }
  }
);
