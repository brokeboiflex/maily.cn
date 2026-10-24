import { Editor, type NodeViewProps } from '@tiptap/core';
import { type Attrs } from '@tiptap/pm/model';
import { SelectionRange, TextSelection } from '@tiptap/pm/state';
import { redoDepth, undoDepth } from '@tiptap/pm/history';
import { describe, expect, it } from 'vitest';
import { MailyKit } from './maily-kit';
import { extensions as defaultExtensions } from './index';
import { updateNodeViewAttributes } from '../utils/update-attribute';

function createEditor() {
  return new Editor({
    extensions: [MailyKit],
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { textAlign: 'center' },
          content: [{ type: 'text', text: 'First' }],
        },
        {
          type: 'paragraph',
          attrs: { textAlign: 'right' },
          content: [{ type: 'text', text: 'Second' }],
        },
        { type: 'paragraph' },
      ],
    },
  });
}

describe('public Maily attribute commands', () => {
  it('updates every selected node but emits steps only for changed targets', () => {
    const editor = createEditor();
    try {
      editor.commands.setTextSelection({ from: 1, to: 14 });
      const before = editor.getJSON();
      const steps: number[] = [];
      editor.on('transaction', ({ transaction }) => {
        if (transaction.docChanged) steps.push(transaction.steps.length);
      });
      expect(
        editor.can().updateAttributes('paragraph', { textAlign: 'center' })
      ).toBe(true);
      expect(editor.getJSON()).toEqual(before);
      expect(editor.commands.setTextAlign('center')).toBe(true);
      expect(steps).toEqual([1]);
      expect(editor.state.doc.child(0).attrs.textAlign).toBe('center');
      expect(editor.state.doc.child(1).attrs.textAlign).toBe('center');
      const selection = editor.state.selection.toJSON();
      expect(
        editor.commands.updateAttributes(editor.schema.nodes.paragraph, {
          textAlign: 'center',
        })
      ).toBe(true);
      expect(steps).toEqual([1]);
      expect(editor.state.selection.toJSON()).toEqual(selection);
      expect(editor.commands.updateAttributes('unknown', {})).toBe(false);
      expect(
        editor.commands.updateAttributes('image', { alignment: 'left' })
      ).toBe(false);
      editor.commands.undo();
      expect(editor.getJSON()).toEqual(before);
      editor.commands.setTextSelection({ from: 1, to: 5 });
      editor.commands.setTextAlign('center');
      expect(redoDepth(editor.state)).toBe(1);
    } finally {
      editor.destroy();
    }
  });

  it('uses the live chained document and handles separate selection ranges', () => {
    const editor = createEditor();
    try {
      expect(
        editor
          .chain()
          .insertContentAt(0, {
            type: 'paragraph',
            content: [{ type: 'text', text: 'New' }],
          })
          .setTextSelection(2)
          .updateAttributes('paragraph', { textDirection: 'rtl' })
          .updateAttributes('paragraph', { textDirection: 'rtl' })
          .run()
      ).toBe(true);
      expect(editor.state.doc.firstChild?.textContent).toBe('New');
      expect(editor.state.doc.firstChild?.attrs.textDirection).toBe('rtl');
      const tr = editor.state.tr;
      const selection = TextSelection.create(tr.doc, 1, 15);
      selection.ranges = [
        new SelectionRange(tr.doc.resolve(1), tr.doc.resolve(3)),
        new SelectionRange(tr.doc.resolve(14), tr.doc.resolve(16)),
      ];
      editor.view.dispatch(tr.setSelection(selection));
      editor.commands.updateAttributes('paragraph', {
        showIfKey: 'recipient.vip',
      });
      expect(editor.state.doc.child(0).attrs.showIfKey).toBe('recipient.vip');
      expect(editor.state.doc.child(1).attrs.showIfKey).toBeNull();
      expect(editor.state.doc.child(2).attrs.showIfKey).toBe('recipient.vip');
    } finally {
      editor.destroy();
    }
  });

  it('resets defaults without empty history events', () => {
    const editor = createEditor();
    try {
      editor.commands.setTextSelection(1);
      expect(editor.can().resetAttributes('paragraph', 'textAlign')).toBe(true);
      expect(editor.state.doc.firstChild?.attrs.textAlign).toBe('center');
      expect(editor.commands.resetAttributes('paragraph', 'textAlign')).toBe(
        true
      );
      expect(editor.state.doc.firstChild?.attrs.textAlign).toBeNull();
      expect(editor.commands.resetAttributes('unknown', 'textAlign')).toBe(
        false
      );
      const depth = undoDepth(editor.state);
      editor.commands.resetAttributes('paragraph', 'textAlign');
      expect(undoDepth(editor.state)).toBe(depth);
      editor.commands.undo();
      editor.commands.resetAttributes('paragraph', 'showIfKey');
      expect(redoDepth(editor.state)).toBe(1);
    } finally {
      editor.destroy();
    }
  });

  it.each(['textStyle', 'link'])(
    'keeps %s merge, range, no-op and stored-mark behavior',
    (type) => {
      const editor = createEditor();
      try {
        const initial =
          type === 'textStyle'
            ? { color: '#123456', fontSize: '14px' }
            : { href: 'https://example.com', target: '_self' };
        const desired =
          type === 'textStyle'
            ? { fontSize: '18px' }
            : { href: 'https://example.org' };
        editor.commands.setTextSelection({ from: 1, to: 6 });
        editor.commands.setMark(type, initial);
        editor.commands.setTextSelection({ from: 1, to: 2 });
        editor.commands.setMark('bold');
        editor.commands.setTextSelection({ from: 2, to: 4 });
        expect(editor.can().updateAttributes(type, desired)).toBe(true);
        expect(
          editor.commands.updateAttributes(editor.schema.marks[type], desired)
        ).toBe(true);
        const marks: Array<{ text: string; attrs: Attrs }> = [];
        editor.state.doc.firstChild?.forEach((node) =>
          marks.push({
            text: node.textContent,
            attrs: node.marks.find((mark) => mark.type.name === type)!.attrs,
          })
        );
        expect(marks[0].attrs).toMatchObject(initial);
        expect(marks[1].attrs).toMatchObject({ ...initial, ...desired });
        expect(marks[2].attrs).toMatchObject(initial);
        const json = editor.getJSON();
        const depth = undoDepth(editor.state);
        let documentChanges = 0;
        editor.on('transaction', ({ transaction }) => {
          if (transaction.docChanged) documentChanges++;
        });
        editor.commands.updateAttributes(type, desired);
        expect(editor.getJSON()).toEqual(json);
        expect(documentChanges).toBe(0);
        expect(undoDepth(editor.state)).toBe(depth);
        editor.commands.resetAttributes(type, Object.keys(desired));
        const resetJson = editor.getJSON();
        const resetDepth = undoDepth(editor.state);
        editor.commands.resetAttributes(type, Object.keys(desired));
        expect(editor.getJSON()).toEqual(resetJson);
        expect(undoDepth(editor.state)).toBe(resetDepth);
        editor.commands.setTextSelection(3);
        editor.commands.setMark(type, desired);
        const stored = editor.state.storedMarks;
        // updateAttributes does not add/change stored marks at a cursor.
        expect(editor.commands.updateAttributes(type, initial)).toBe(false);
        expect(editor.state.storedMarks).toEqual(stored);
      } finally {
        editor.destroy();
      }
    }
  );

  it('NodeView writes merge live attributes and preserve history on a repeated value', () => {
    const editor = createEditor();
    const props: Pick<NodeViewProps, 'editor' | 'node' | 'getPos'> = {
      editor,
      node: editor.state.doc.firstChild!,
      getPos: () => 0,
    };
    try {
      editor.commands.setTextSelection(1);
      editor.commands.updateAttributes('paragraph', {
        showIfKey: 'recipient.vip',
      });
      updateNodeViewAttributes(props, { textDirection: 'rtl' });
      expect(editor.state.doc.firstChild?.attrs).toMatchObject({
        showIfKey: 'recipient.vip',
        textDirection: 'rtl',
      });
      const before = editor.getJSON();
      let documentChanges = 0;
      editor.on('transaction', ({ transaction }) => {
        if (transaction.docChanged) documentChanges++;
      });
      updateNodeViewAttributes(props, { textDirection: 'rtl' });
      expect(documentChanges).toBe(0);
      expect(editor.getJSON()).toEqual(before);
      editor.commands.undo();
      updateNodeViewAttributes(props, { textDirection: 'ltr' });
      expect(redoDepth(editor.state)).toBe(1);
    } finally {
      editor.destroy();
    }
  });
});

describe('desired block type commands preserve history', () => {
  it.each(['paragraph', 'heading', 'footer', 'htmlCodeBlock'])(
    'repeating the active %s type preserves Redo',
    (type) => {
      const editor = new Editor({
        extensions: defaultExtensions({}),
        content: {
          type: 'doc',
          content: [
            {
              type,
              attrs: type === 'heading' ? { level: 2 } : {},
              content: [{ type: 'text', text: 'abc' }],
            },
          ],
        },
      });
      try {
        editor.commands.setTextSelection({ from: 1, to: 4 });
        editor.commands.setMark('bold');
        editor.commands.undo();
        const before = editor.getJSON();
        const selection = editor.state.selection.toJSON();
        expect(redoDepth(editor.state)).toBe(1);
        expect(
          editor.can().setNode(type, type === 'heading' ? { level: 2 } : {})
        ).toBe(true);
        expect(
          editor.commands.setNode(type, type === 'heading' ? { level: 2 } : {})
        ).toBe(true);
        expect(editor.getJSON()).toEqual(before);
        expect(editor.state.selection.toJSON()).toEqual(selection);
        expect(redoDepth(editor.state)).toBe(1);
        expect(editor.commands.redo()).toBe(true);
      } finally {
        editor.destroy();
      }
    }
  );

  it('uses live chained nodes and still changes attributes, mixed types and list hierarchy', () => {
    const editor = createEditor();
    try {
      expect(
        editor
          .chain()
          .setTextSelection(2)
          .setHeading({ level: 2 })
          .setHeading({ level: 2 })
          .run()
      ).toBe(true);
      expect(editor.state.doc.firstChild?.type.name).toBe('heading');
      expect(editor.state.doc.firstChild?.attrs.level).toBe(2);
      expect(undoDepth(editor.state)).toBe(1);
      editor.commands.setHeading({ level: 3 });
      expect(editor.state.doc.firstChild?.attrs.level).toBe(3);
      editor.commands.setTextSelection({ from: 1, to: 13 });
      expect(editor.can().setParagraph()).toBe(true);
      expect(editor.commands.setParagraph()).toBe(true);
      expect(editor.state.doc.child(0).type.name).toBe('paragraph');
      expect(editor.state.doc.child(1).type.name).toBe('paragraph');
      editor.commands.setTextSelection(2);
      editor.commands.toggleBulletList();
      expect(editor.isActive('bulletList')).toBe(true);
      expect(
        editor.chain().liftListItem('listItem').setHeading({ level: 2 }).run()
      ).toBe(true);
      expect(editor.isActive('bulletList')).toBe(false);
      expect(editor.state.doc.firstChild?.type.name).toBe('heading');
    } finally {
      editor.destroy();
    }
  });
});
