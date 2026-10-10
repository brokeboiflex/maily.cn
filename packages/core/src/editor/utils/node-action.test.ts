import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { captureNodeAction } from './node-action';
import { Spacer } from '../nodes/spacer';

describe('owned desktop node actions', () => {
  it('rejects a stale position after a host inserts another node', () => {
    const editor = new Editor({
      extensions: [StarterKit.configure({ trailingNode: false })],
      content: '<p>target</p><p>keep</p>',
    });
    const target = captureNodeAction(editor, 0, editor.state.doc.firstChild);
    editor.commands.insertContentAt(0, '<p>new</p>');
    expect(
      target?.run((node, pos) =>
        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize })
      )
    ).toBe(false);
    expect(editor.getHTML()).toBe('<p>new</p><p>target</p><p>keep</p>');
    editor.destroy();
  });
  it('allows selection-only menu changes and consumes duplicate delivery once', () => {
    const editor = new Editor({
      extensions: [StarterKit.configure({ trailingNode: false })],
      content: '<p>target</p><p>keep</p>',
    });
    const target = captureNodeAction(editor, 0, editor.state.doc.firstChild);
    editor.commands.setNodeSelection(0);
    const duplicate = (
      node: NonNullable<typeof editor.state.doc.firstChild>,
      pos: number
    ) => editor.commands.insertContentAt(pos + node.nodeSize, node.toJSON());
    expect(target?.run(duplicate)).toBe(true);
    expect(target?.run(duplicate)).toBe(false);
    expect(editor.getHTML()).toBe('<p>target</p><p>target</p><p>keep</p>');
    editor.destroy();
  });
  it('rejects mismatched nodes and actions after destruction or read-only transition', () => {
    const editor = new Editor({
      extensions: [StarterKit.configure({ trailingNode: false })],
      content: '<p>target</p><p>keep</p>',
    });
    expect(captureNodeAction(editor, 0, editor.state.doc.lastChild)).toBeNull();
    const target = captureNodeAction(editor, 0, editor.state.doc.firstChild);
    editor.setEditable(false);
    expect(
      target?.run(() => {
        throw new Error('must not run');
      })
    ).toBe(false);
    editor.setEditable(true);
    editor.destroy();
    expect(
      target?.run(() => {
        throw new Error('must not run');
      })
    ).toBe(false);
  });
  it('updates spacer height without removing its visibility condition', () => {
    const editor = new Editor({
      extensions: [StarterKit.configure({ trailingNode: false }), Spacer],
      content: {
        type: 'doc',
        content: [
          { type: 'spacer', attrs: { height: 8, showIfKey: 'customer.vip' } },
          { type: 'paragraph' },
        ],
      },
    });
    editor.commands.setNodeSelection(0);
    editor.commands.setSpacerSize(16);
    editor.commands.setSpacerSize(16);
    expect(editor.state.doc.firstChild?.attrs).toMatchObject({
      height: 16,
      showIfKey: 'customer.vip',
    });
    expect(editor.state.doc.childCount).toBe(2);
    editor.destroy();
  });
});
