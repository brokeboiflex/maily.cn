import { Editor, type JSONContent } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { Document } from '@tiptap/extension-document';
import { redoDepth, undoDepth } from '@tiptap/pm/history';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SectionExtension } from '../nodes/section/section';
import { ColumnsExtension } from '../nodes/columns/columns';
import { ColumnExtension } from '../nodes/columns/column';
import { Spacer } from '../nodes/spacer';
import { ButtonExtension } from '../nodes/button/button';
import { RepeatExtension } from '../nodes/repeat/repeat';
import { HTMLCodeBlockExtension } from '../nodes/html/html';
import { VariableExtension } from '../nodes/variable/variable';
import { setColumnCount, updateColumnWidth } from './columns';
import { updateAttribute } from './update-attribute';

afterEach(() => vi.useRealTimers());

function createEditor(content: JSONContent) {
  return new Editor({
    extensions: [
      StarterKit.configure({ document: false, trailingNode: false }),
      Document.extend({ content: '(block|columns)+' }),
      SectionExtension,
      ColumnsExtension,
      ColumnExtension,
      Spacer,
      ButtonExtension,
      RepeatExtension,
      HTMLCodeBlockExtension,
      VariableExtension,
    ],
    content: { type: 'doc', content: [content, { type: 'paragraph' }] },
  });
}

describe('desired node settings preserve history', () => {
  it.each([
    {
      name: 'section settings',
      node: { type: 'section', content: [{ type: 'paragraph' }] },
      select: (editor: Editor) => editor.commands.setTextSelection(2),
      write: (editor: Editor) =>
        editor.commands.updateSection({ align: 'center' }),
      reset: (editor: Editor) =>
        editor.commands.updateSection({ align: 'left' }),
    },
    {
      name: 'spacer height',
      node: {
        type: 'spacer',
        attrs: { height: 8, showIfKey: 'recipient.vip' },
      },
      select: (editor: Editor) => editor.commands.setNodeSelection(0),
      write: (editor: Editor) => editor.commands.setSpacerSize(16),
      reset: (editor: Editor) => editor.commands.setSpacerSize(8),
    },
    {
      name: 'single-attribute settings',
      node: { type: 'spacer', attrs: { height: 8 } },
      select: (editor: Editor) => editor.commands.setNodeSelection(0),
      write: (editor: Editor) =>
        editor.commands.command(updateAttribute('spacer', 'height', 16)),
      reset: (editor: Editor) => editor.commands.setSpacerSize(8),
    },
    {
      name: 'column width',
      node: {
        type: 'columns',
        content: [
          {
            type: 'column',
            attrs: { columnId: 'existing' },
            content: [{ type: 'paragraph' }],
          },
        ],
      },
      select: (editor: Editor) => editor.commands.setTextSelection(3),
      write: (editor: Editor) => updateColumnWidth(editor, 0, '50'),
      reset: (editor: Editor) => updateColumnWidth(editor, 0, 'auto'),
    },
    {
      name: 'column settings',
      node: {
        type: 'columns',
        content: [
          {
            type: 'column',
            attrs: { columnId: 'existing' },
            content: [{ type: 'paragraph' }],
          },
        ],
      },
      select: (editor: Editor) => editor.commands.setTextSelection(3),
      write: (editor: Editor) =>
        editor.commands.updateColumn({ verticalAlign: 'middle' }),
      reset: (editor: Editor) =>
        editor.commands.updateColumn({ verticalAlign: 'top' }),
    },
    {
      name: 'columns settings',
      node: {
        type: 'columns',
        content: [
          {
            type: 'column',
            attrs: { columnId: 'existing' },
            content: [{ type: 'paragraph' }],
          },
        ],
      },
      select: (editor: Editor) => editor.commands.setTextSelection(3),
      write: (editor: Editor) => editor.commands.updateColumns({ gap: 16 }),
      reset: (editor: Editor) => editor.commands.updateColumns({ gap: 8 }),
    },
    {
      name: 'button settings',
      node: { type: 'button' },
      select: (editor: Editor) => editor.commands.setNodeSelection(0),
      write: (editor: Editor) =>
        editor.commands.updateButton({ alignment: 'center' }),
      reset: (editor: Editor) =>
        editor.commands.updateButton({ alignment: 'left' }),
    },
    {
      name: 'repeat settings',
      node: { type: 'repeat', content: [{ type: 'paragraph' }] },
      select: (editor: Editor) => editor.commands.setTextSelection(2),
      write: (editor: Editor) =>
        editor.commands.updateRepeat({ each: 'records' }),
      reset: (editor: Editor) =>
        editor.commands.updateRepeat({ each: 'items' }),
    },
    {
      name: 'HTML mode',
      node: { type: 'htmlCodeBlock', attrs: { activeTab: 'code' } },
      select: (editor: Editor) => editor.commands.setTextSelection(1),
      write: (editor: Editor) =>
        editor.commands.updateHtmlCodeBlock({ activeTab: 'preview' }),
      reset: (editor: Editor) =>
        editor.commands.updateHtmlCodeBlock({ activeTab: 'code' }),
    },
  ])(
    '$name has one undo event and preserves redo on the existing value',
    ({ node, select, write, reset }) => {
      vi.useFakeTimers();
      const editor = createEditor(node);
      try {
        select(editor);
        const before = editor.getJSON();
        const changes: number[] = [];
        editor.on('transaction', ({ transaction }) => {
          if (transaction.docChanged) changes.push(transaction.steps.length);
        });
        write(editor);
        const desired = editor.getJSON();
        expect(desired).not.toEqual(before);
        vi.advanceTimersByTime(600);
        write(editor);
        expect(editor.getJSON()).toEqual(desired);
        expect(changes).toHaveLength(1);
        expect(undoDepth(editor.state)).toBe(1);
        editor.commands.undo();
        expect(editor.getJSON()).toEqual(before);
        editor.commands.redo();
        expect(editor.getJSON()).toEqual(desired);
        editor.commands.undo();
        // Reapply the current value while a redo branch exists.
        reset(editor);
        expect(editor.getJSON()).toEqual(before);
        expect(redoDepth(editor.state)).toBe(1);
        expect(editor.commands.redo()).toBe(true);
        expect(editor.getJSON()).toEqual(desired);
      } finally {
        editor.destroy();
      }
    }
  );

  it('changes a larger imported group to the requested count atomically and retains selection in surviving content', () => {
    const editor = createEditor({
      type: 'columns',
      content: Array.from({ length: 5 }, (_, index) => ({
        type: 'column',
        attrs: { columnId: String(index), width: '20' },
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: `Column ${index}` }],
          },
        ],
      })),
    });
    try {
      editor.commands.setTextSelection(5);
      const before = editor.getJSON();
      let documentChanges = 0;
      editor.on('transaction', ({ transaction }) => {
        if (transaction.docChanged) documentChanges++;
      });
      expect(setColumnCount(editor, 2)).toBe(true);
      expect(editor.state.doc.firstChild?.childCount).toBe(2);
      expect(editor.getJSON().content![0].content).toEqual(
        before.content![0].content!.slice(0, 2)
      );
      expect(editor.state.selection.from).toBe(5);
      const desired = editor.getJSON();
      expect(setColumnCount(editor, 2)).toBe(true);
      expect(documentChanges).toBe(1);
      expect(undoDepth(editor.state)).toBe(1);
      editor.commands.undo();
      expect(editor.getJSON()).toEqual(before);
      editor.commands.redo();
      expect(editor.getJSON()).toEqual(desired);
      for (const invalid of [0, -1, 1.5, Number.NaN])
        expect(setColumnCount(editor, invalid)).toBe(false);
      expect(editor.getJSON()).toEqual(desired);
      expect(updateColumnWidth(editor, 10, '50')).toBe(false);
      expect(editor.getJSON()).toEqual(desired);
    } finally {
      editor.destroy();
    }
  });

  it('keeps the column controls active when reducing from a removed column', () => {
    const editor = createEditor({
      type: 'columns',
      content: [
        {
          type: 'column',
          attrs: { columnId: 'keep' },
          content: [{ type: 'paragraph' }],
        },
      ],
    });
    try {
      editor.commands.setTextSelection(3);
      setColumnCount(editor, 3);
      expect(editor.state.selection.$from.index(1)).toBe(2);
      setColumnCount(editor, 2);
      expect(editor.isActive('column')).toBe(true);
      expect(editor.state.selection.$from.index(1)).toBe(1);
      const before = editor.getJSON();
      const selection = editor.state.selection.toJSON();
      setColumnCount(editor, 2);
      expect(editor.getJSON()).toEqual(before);
      expect(editor.state.selection.toJSON()).toEqual(selection);
    } finally {
      editor.destroy();
    }
  });
});
