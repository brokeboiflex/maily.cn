import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { BubbleMenu } from '@tiptap/react/menus';
import { expect, it } from 'vitest';
import { TurnIntoBlock } from './turn-into-block';
import { TooltipProvider } from '../ui/tooltip';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

it('keeps the bubble trigger attached when its portalled block menu takes focus', async () => {
  const container = document.createElement('div');
  const editorElement = document.createElement('div');
  document.body.append(container, editorElement);
  const editor = new Editor({
    element: editorElement,
    extensions: [StarterKit],
    content: '<p>Selected text</p>',
  });
  const root = createRoot(container);
  try {
    await act(async () => {
      root.render(
        <BubbleMenu editor={editor} shouldShow={() => true} updateDelay={0}>
          <TooltipProvider>
            <TurnIntoBlock
              options={[
                {
                  id: 'heading',
                  type: 'option',
                  label: 'Heading',
                  icon: null,
                  disabled: () => false,
                  isActive: () => false,
                  onClick: () => {
                    editor.chain().focus().setHeading({ level: 1 }).run();
                  },
                },
              ]}
            />
          </TooltipProvider>
        </BubbleMenu>
      );
      editor.commands.setTextSelection({ from: 1, to: 5 });
      editor.view.dom.focus();
    });
    const trigger = document.querySelector<HTMLButtonElement>(
      '[aria-label="Turn into"]'
    )!;
    expect(trigger).toBeTruthy();
    await act(async () => {
      trigger.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          button: 0,
          pointerType: 'mouse',
        })
      );
    });
    const option = document.querySelector<HTMLElement>('[role="menuitem"]')!;
    expect(option).toBeTruthy();
    expect(trigger.isConnected).toBe(true);
    await act(async () => option.click());
    expect(editor.isActive('heading', { level: 1 })).toBe(true);
  } finally {
    await act(async () => root.unmount());
    editor.destroy();
    container.remove();
    editorElement.remove();
  }
});
