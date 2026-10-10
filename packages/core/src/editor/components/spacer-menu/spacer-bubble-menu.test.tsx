import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { expect, it, vi } from 'vitest';
import { Spacer } from '../../nodes/spacer';
import { VariableExtension } from '../../nodes/variable/variable';
import { SpacerBubbleMenu } from './spacer-bubble-menu';

// Floating positioning is unrelated to the command. Keep real menu controls,
// React subscriptions and the TipTap document mutation under test.
vi.mock('../adaptive-bubble-menu', () => ({
  AdaptiveBubbleMenu: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

it('preserves visibility when the actual spacer height controls are reapplied', async () => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  const editor = new Editor({
    extensions: [
      StarterKit.configure({ trailingNode: false }),
      Spacer,
      VariableExtension,
    ],
    content: {
      type: 'doc',
      content: [
        { type: 'spacer', attrs: { height: 8, showIfKey: 'customer.vip' } },
        { type: 'paragraph' },
      ],
    },
  });
  editor.commands.setNodeSelection(0);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<SpacerBubbleMenu editor={editor} />));
    for (const size of ['sm', 'md', 'md']) {
      await act(async () => {
        const control = container.querySelector<HTMLButtonElement>(
          `button[aria-label="${size}"]`
        );
        expect(control).not.toBeNull();
        control!.click();
      });
      expect(editor.state.doc.firstChild?.attrs.showIfKey).toBe('customer.vip');
      expect(editor.state.doc.childCount).toBe(2);
    }
    expect(editor.state.doc.firstChild?.attrs.height).toBe(16);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    editor.destroy();
  }
});
