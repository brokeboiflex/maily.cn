// @vitest-environment happy-dom

import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor as TiptapEditor, type JSONContent } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { afterEach, describe, expect, it } from 'vitest';

import { Editor } from '../index';
import { spacer } from '../../blocks/layout';
import { englishTranslator } from '../i18n';
import { Spacer } from './spacer';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const cleanups: Array<() => Promise<void> | void> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
  document.body.innerHTML = '';
});

async function settle() {
  for (let round = 0; round < 3; round += 1)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
}

describe('N13 spacer heights', () => {
  function spacerEditor(content: string | JSONContent = '<p></p>') {
    const editor = new TiptapEditor({
      extensions: [StarterKit, Spacer],
      content,
    });
    cleanups.push(() => editor.destroy());
    return editor;
  }

  it('stores a pixel height for the actual Spacer preset', () => {
    const editor = spacerEditor();
    const { command } = spacer(englishTranslator);
    expect(command).toBeTypeOf('function');
    command!({ editor, range: { from: 1, to: 1 } });
    const node = editor.getJSON().content?.find((n) => n.type === 'spacer');
    expect(node?.attrs?.height).toBe(8);
    expect(editor.getHTML()).toContain('height: 8px');
  });

  it('reads legacy named and invalid heights as pixels', () => {
    const editor = spacerEditor(
      '<div data-maily-component="spacer" data-height="lg"></div>' +
        '<div data-maily-component="spacer" data-height="tall"></div>'
    );
    const heights = editor
      .getJSON()
      .content?.filter((n) => n.type === 'spacer')
      .map((n) => n.attrs?.height);
    expect(heights).toEqual([32, 8]);
    editor.commands.setContent({
      type: 'doc',
      content: [{ type: 'spacer', attrs: { height: 'md' } }],
    });
    expect(editor.getHTML()).toContain('height: 16px');
    expect(editor.getHTML()).not.toContain('mdpx');
  });
});

describe('N14 HTML block preview', () => {
  async function mount(content: JSONContent) {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    let editor: TiptapEditor | null = null;
    await act(async () => {
      root.render(
        <Editor
          contentJson={content}
          config={{ immediatelyRender: true, autofocus: false }}
          onCreate={(created) => {
            editor = created;
          }}
        />
      );
    });
    await settle();
    cleanups.push(async () => {
      await act(async () => root.unmount());
      container.remove();
    });
    return { container, editor: editor! };
  }

  const htmlBlock = (text?: string): JSONContent => ({
    type: 'doc',
    content: [
      {
        type: 'htmlCodeBlock',
        attrs: { activeTab: 'preview' },
        content: text ? [{ type: 'text', text }] : undefined,
      },
    ],
  });

  it('opens the code tab from an empty preview', async () => {
    const { container, editor } = await mount(htmlBlock());
    const empty = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Type your HTML code')
    );
    expect(empty).toBeTruthy();
    await act(async () => empty!.click());
    expect(editor.state.doc.firstChild?.attrs.activeTab).toBe('code');
  });

  it('previews authored HTML in a script-free sandboxed document', async () => {
    const markup =
      '<style>p{color:red}</style><p>Hello</p><img src="x" onerror="window.__maily=1">';
    const { container } = await mount(htmlBlock(markup));
    const frame = container.querySelector<HTMLIFrameElement>('iframe[srcdoc]');
    expect(frame).toBeTruthy();
    expect(frame!.getAttribute('sandbox')).toBe('allow-same-origin');
    expect(frame!.getAttribute('srcdoc')).toContain('<p>Hello</p>');
    // The markup never becomes part of the editor's own document.
    expect(container.querySelector('img[src="x"]')).toBeNull();
    expect(
      Array.from(container.querySelectorAll('*')).some(
        (element) => element.shadowRoot
      )
    ).toBe(false);
  });
});
