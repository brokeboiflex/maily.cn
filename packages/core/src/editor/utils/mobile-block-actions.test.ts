import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import {
  runMobileBlockAction,
  selectedMobileBlock,
} from './mobile-block-actions';

describe('mobile block actions', () => {
  it('moves the selected block across siblings without losing content and supports undo', () => {
    const editor = new Editor({
      extensions: [StarterKit.configure({ trailingNode: false })],
      content: '<p>one</p><h2>two</h2><p>three</p>',
    });
    editor.commands.setTextSelection(7);
    expect(selectedMobileBlock(editor)?.node.type.name).toBe('heading');
    expect(runMobileBlockAction(editor, 'up')).toBe(true);
    expect(editor.getHTML()).toBe('<h2>two</h2><p>one</p><p>three</p>');
    expect(runMobileBlockAction(editor, 'up', false)).toBe(false);
    editor.commands.undo();
    expect(editor.getHTML()).toBe('<p>one</p><h2>two</h2><p>three</p>');
    editor.commands.setTextSelection(7);
    expect(runMobileBlockAction(editor, 'down')).toBe(true);
    expect(editor.getHTML()).toBe('<p>one</p><p>three</p><h2>two</h2>');
    expect(runMobileBlockAction(editor, 'down', false)).toBe(false);
    editor.destroy();
  });

  it('duplicates or deletes only the selected block, including node selections', () => {
    const editor = new Editor({
      extensions: [StarterKit.configure({ trailingNode: false })],
      content: '<p>keep</p><hr><p>tail</p>',
    });
    editor.commands.setNodeSelection(6);
    expect(runMobileBlockAction(editor, 'duplicate')).toBe(true);
    expect(editor.getHTML()).toBe('<p>keep</p><hr><hr><p>tail</p>');
    editor.commands.setNodeSelection(6);
    runMobileBlockAction(editor, 'delete');
    expect(editor.getHTML()).toBe('<p>keep</p><hr><p>tail</p>');
    editor.setEditable(false);
    expect(runMobileBlockAction(editor, 'delete')).toBe(false);
    editor.destroy();
  });
});
