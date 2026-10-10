import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';
import { expect, it } from 'vitest';
import { undoDepth, redoDepth } from '@tiptap/pm/history';
import { ColumnExtension } from '../../nodes/columns/column';
import { ColumnsExtension } from '../../nodes/columns/columns';
import { VariableExtension } from '../../nodes/variable/variable';
import { ColumnsBubbleMenuContent } from './columns-bubble-menu-content';

it('the actual count controls reach three from one in a single undo event', async () => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  const editor = new Editor({
    extensions: [
      StarterKit.configure({ document: false, trailingNode: false }),
      Document.extend({ content: '(block|columns)+' }),
      ColumnExtension,
      ColumnsExtension,
      VariableExtension,
    ],
    content: {
      type: 'doc',
      content: [
        {
          type: 'columns',
          attrs: { gap: 24, showIfKey: 'recipient.vip' },
          content: [
            {
              type: 'column',
              attrs: { columnId: 'keep', width: '70', verticalAlign: 'middle' },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Keep this content' }],
                },
              ],
            },
          ],
        },
        { type: 'paragraph' },
      ],
    },
  });
  editor.commands.setTextSelection(5);
  const before = editor.getJSON();
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () =>
      root.render(<ColumnsBubbleMenuContent editor={editor} />)
    );
    await act(async () =>
      container
        .querySelector<HTMLButtonElement>(
          'button[aria-label="Configure Column Widths"]'
        )!
        .click()
    );
    const countControl = () =>
      Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
        (button) => button.textContent?.includes('3 Columns')
      );
    expect(countControl()).toBeDefined();
    const changes: number[] = [];
    editor.on('transaction', ({ transaction }) => {
      if (transaction.docChanged) changes.push(transaction.steps.length);
    });
    await act(async () => countControl()!.click());
    expect(editor.state.doc.firstChild?.childCount).toBe(3);
    expect(editor.state.doc.firstChild?.firstChild?.toJSON()).toEqual(
      before.content![0].content![0]
    );
    expect(editor.state.doc.firstChild?.attrs).toEqual(
      before.content![0].attrs
    );
    expect(editor.state.selection.$from.parent.type.name).toBe('paragraph');
    const desired = editor.getJSON();
    await act(async () => countControl()!.click());
    expect(editor.getJSON()).toEqual(desired);
    expect(changes).toHaveLength(1);
    expect(undoDepth(editor.state)).toBe(1);
    await act(async () => editor.commands.undo());
    expect(editor.getJSON()).toEqual(before);
    expect(editor.state.selection.from).toBe(5);
    expect(redoDepth(editor.state)).toBe(1);
    await act(async () => editor.commands.redo());
    expect(editor.getJSON()).toEqual(desired);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    editor.destroy();
  }
});
