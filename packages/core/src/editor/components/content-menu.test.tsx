import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { expect, it, vi } from 'vitest';
import { ContentMenu } from './content-menu';
import type { DragHandleProps } from '../plugins/drag-handle/drag-handle';

const drag = vi.hoisted(() => ({
  update: undefined as DragHandleProps['onNodeChange'],
}));
vi.mock('../plugins/drag-handle/drag-handle', () => ({
  DragHandle: ({
    children,
    onNodeChange,
  }: Pick<DragHandleProps, 'children' | 'onNodeChange'>) => {
    drag.update = onNodeChange;
    return <>{children}</>;
  },
}));
// Exercise the real ContentMenu callbacks without browser menu positioning.
vi.mock('./ui/dropdown-menu', async () => {
  const { Button } = await import('./base-button');
  return {
    DropdownMenu: ({
      children,
      onOpenChange,
    }: {
      children: React.ReactNode;
      onOpenChange: (open: boolean) => void;
    }) => (
      <>
        <Button onClick={() => onOpenChange(true)}>audit-open</Button>
        {children}
      </>
    ),
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    DropdownMenuItem: ({
      children,
      onClick,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
    }) => <Button onClick={onClick}>{children}</Button>,
  };
});

it('keeps the original open-menu target when drag tracking reports a replacement', async () => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  const editor = new Editor({
    extensions: [StarterKit.configure({ trailingNode: false })],
    content: '<p>target</p><p>keep</p>',
  });
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const click = async (text: string) => {
    await act(async () => {
      const control = Array.from(container.querySelectorAll('button')).find(
        (button) => button.textContent === text
      );
      expect(control).toBeTruthy();
      control!.click();
    });
  };
  try {
    await act(async () => root.render(<ContentMenu editor={editor} />));
    await act(async () =>
      drag.update!({ editor, node: editor.state.doc.firstChild, pos: 0 })
    );
    await click('audit-open');
    await act(async () => {
      editor.commands.insertContentAt(0, '<p>replacement</p>');
      // Actual plugin view.update can report a new node even while locked.
      drag.update!({ editor, node: editor.state.doc.firstChild, pos: 0 });
    });
    await click('Delete');
    expect(editor.getHTML()).toBe('<p>replacement</p><p>target</p><p>keep</p>');
  } finally {
    await act(async () => root.unmount());
    container.remove();
    editor.destroy();
  }
});
