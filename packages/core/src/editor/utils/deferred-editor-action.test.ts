import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, it, expect } from 'vitest';
import { createDeferredEditorActions } from './deferred-editor-action';

describe('deferred editor action ownership', () => {
  it('keeps independent picker channels and limits cancellation to its owner', () => {
    const editor = new Editor({
      extensions: [StarterKit],
      content: '<p>abcd</p>',
    });
    const owner = createDeferredEditorActions(editor);
    const text = owner.capture('color:text-picker');
    const background = owner.capture('color:background-picker');
    let applied = 0;
    expect(text.run(() => applied++)).toBe(true);
    expect(background.run(() => applied++)).toBe(true);
    expect(applied).toBe(2);
    const nextText = owner.capture('color:text-picker');
    const nextBackground = owner.capture('color:background-picker');
    owner.cancel('color:text-picker');
    expect(nextText.isCurrent()).toBe(false);
    expect(nextBackground.run(() => applied++)).toBe(true);
    editor.destroy();
  });
  it('rejects changed selection, changed document, superseded choice and teardown; consumes once', () => {
    const editor = new Editor({
      extensions: [StarterKit],
      content: '<p>abcd</p>',
    });
    const owner = createDeferredEditorActions(editor);
    editor.commands.setTextSelection({ from: 1, to: 2 });
    const font = owner.capture('font');
    editor.commands.setTextSelection({ from: 2, to: 3 });
    expect(
      font.run(() => {
        throw new Error('retargeted');
      })
    ).toBe(false);
    const oldColor = owner.capture('color');
    const newColor = owner.capture('color');
    expect(
      oldColor.run(() => {
        throw new Error('superseded');
      })
    ).toBe(false);
    let applied = 0;
    expect(
      newColor.run(() => {
        applied++;
      })
    ).toBe(true);
    expect(
      newColor.run(() => {
        applied++;
      })
    ).toBe(false);
    expect(applied).toBe(1);
    const beforeEdit = owner.capture('font');
    editor.commands.insertContent('x');
    expect(beforeEdit.isCurrent()).toBe(false);
    const beforeUnmount = owner.capture('font');
    owner.invalidate();
    expect(beforeUnmount.isCurrent()).toBe(false);
    const beforeDestroy = owner.capture('font');
    editor.destroy();
    expect(beforeDestroy.isCurrent()).toBe(false);
  });
});
