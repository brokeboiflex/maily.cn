import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { Plugin } from '@tiptap/pm/state';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DragHandlePlugin } from './drag-handle-plugin';

const editors: Editor[] = [];
const hitTestDescriptor = Object.getOwnPropertyDescriptor(
  document,
  'elementsFromPoint'
);
afterEach(() => {
  editors.splice(0).forEach((editor) => editor.destroy());
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  if (hitTestDescriptor)
    Object.defineProperty(document, 'elementsFromPoint', hitTestDescriptor);
  else delete (document as Partial<Document>).elementsFromPoint;
});

function setup() {
  const parent = document.createElement('div');
  document.body.append(parent);
  const editor = new Editor({
    element: parent,
    extensions: [StarterKit.configure({ trailingNode: false })],
    content: '<p>drag me</p>',
  });
  editors.push(editor);
  const paragraph = editor.view.dom.querySelector('p')!;
  // Hit testing/layout are the browser-only boundary. Native listener setup,
  // ProseMirror plugin reconfiguration and dragging ownership are real.
  Object.defineProperty(document, 'elementsFromPoint', {
    configurable: true,
    value: vi.fn(() => [paragraph, editor.view.dom]),
  });
  vi.spyOn(editor.view, 'posAtCoords').mockReturnValue({ pos: 1, inside: 0 });
  const element = document.createElement('div');
  const added = vi.spyOn(element, 'addEventListener');
  const removed = vi.spyOn(element, 'removeEventListener');
  const plugin = DragHandlePlugin({ editor, element });
  editor.registerPlugin(plugin);
  const start = () => {
    const transfer = { clearData: vi.fn(), setDragImage: vi.fn() };
    const event = new Event('dragstart', { bubbles: true });
    Object.defineProperties(event, {
      dataTransfer: { value: transfer },
      clientX: { value: 100 },
      clientY: { value: 20 },
    });
    element.dispatchEvent(event);
    return transfer;
  };
  return { editor, element, added, removed, start };
}

describe('native drag-handle lifecycle', () => {
  it('reinstalls native listeners after plugin-view recreation', () => {
    const { editor, added, removed, start } = setup();
    expect(start().setDragImage).toHaveBeenCalledTimes(1);
    editor.registerPlugin(new Plugin({}));
    expect(start().setDragImage).toHaveBeenCalledTimes(1);
    expect(
      added.mock.calls.filter(([name]) => name === 'dragstart')
    ).toHaveLength(2);
    expect(
      removed.mock.calls.filter(([name]) => name === 'dragstart')
    ).toHaveLength(1);
  });

  it('clears its cancelled drag and leaves another dragging owner intact', () => {
    const { editor, element, start } = setup();
    expect(start().setDragImage).toHaveBeenCalledTimes(1);
    expect(editor.view.dragging).not.toBeNull();
    element.dispatchEvent(new Event('dragend'));
    expect(editor.view.dragging).toBeNull();
    expect(element.style.pointerEvents).toBe('auto');
    expect(start().setDragImage).toHaveBeenCalledTimes(1);
    const other = { ...editor.view.dragging!, move: false };
    editor.view.dragging = other;
    element.dispatchEvent(new Event('dragend'));
    expect(editor.view.dragging).toBe(other);
  });

  it('removes listeners and clone resources on actual plugin removal', () => {
    const { editor, element, start } = setup();
    expect(start().setDragImage).toHaveBeenCalledTimes(1);
    editor.unregisterPlugin('dragHandle');
    expect(start().setDragImage).not.toHaveBeenCalled();
    expect(editor.view.dragging).toBeNull();
    expect(element.isConnected).toBe(false);
    expect(document.querySelector('[style*="-10000px"]')).toBeNull();
  });
});

describe('drag-handle positioning', () => {
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
  const hover = (editor: Editor) =>
    editor.view.dom.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 40, clientY: 20 })
    );

  it('shows the handle beside the hovered block and hides it on leave', async () => {
    const { editor, element } = setup();
    const floating = element.parentElement!;
    expect(floating.style.visibility).toBe('hidden');
    hover(editor);
    await settle();
    expect(floating.style.visibility).toBe('visible');
    expect(floating.style.left).toMatch(/px$/);
    editor.view.dom.dispatchEvent(
      new MouseEvent('mouseleave', { bubbles: true, relatedTarget: null })
    );
    expect(floating.style.visibility).toBe('hidden');
  });

  it('stays hidden while the primary button is pressed and when locked', async () => {
    const { editor, element } = setup();
    const floating = element.parentElement!;
    editor.view.dom.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        buttons: 1,
        clientX: 40,
        clientY: 20,
      })
    );
    await settle();
    expect(floating.style.visibility).toBe('hidden');
    editor.commands.setMeta('lockDragHandle', true);
    hover(editor);
    await settle();
    expect(floating.style.visibility).toBe('hidden');
  });
});
