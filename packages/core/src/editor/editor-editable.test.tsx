// @vitest-environment happy-dom

import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Node, type Editor as TiptapEditor } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { afterEach, expect, it, vi } from 'vitest';

import { Editor } from './index';
import { useMailyContext } from './maily-context';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  document.body.innerHTML = '';
});

async function settle() {
  for (let round = 0; round < 3; round += 1)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
}

it('applies editable changes after creation without a content update', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const onUpdate = vi.fn();
  let editor: TiptapEditor | null = null;
  const render = (editable: boolean) =>
    root.render(
      <Editor
        editable={editable}
        contentHtml="<p>Read me</p>"
        config={{ immediatelyRender: true, autofocus: false }}
        onCreate={(created) => {
          editor = created;
        }}
        onUpdate={onUpdate}
      />
    );
  const surface = () =>
    container.querySelector('[aria-hidden="false"] .tiptap');
  try {
    await act(async () => render(true));
    await settle();
    expect(surface()?.getAttribute('contenteditable')).toBe('true');
    expect(container.querySelector('[aria-label="Bold"]')).toBeTruthy();

    await act(async () => render(false));
    await settle();
    expect(editor!.isEditable).toBe(false);
    expect(surface()?.getAttribute('contenteditable')).toBe('false');
    // Formatting would mutate a read-only document; the view mode remains.
    expect(container.querySelector('[aria-label="Bold"]')).toBeNull();
    expect(
      container.querySelector('[aria-label="Editor view mode"]')
    ).toBeTruthy();

    await act(async () => render(true));
    await settle();
    expect(editor!.isEditable).toBe(true);
    expect(surface()?.getAttribute('contenteditable')).toBe('true');
    expect(container.querySelector('[aria-label="Bold"]')).toBeTruthy();
    expect(onUpdate).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});

it('refreshes node view chrome when only editability changes', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const render = (editable: boolean) =>
    root.render(
      <Editor
        editable={editable}
        contentJson={{
          type: 'doc',
          content: [
            {
              type: 'image',
              attrs: { src: 'https://example.com/a.png', width: 100 },
            },
          ],
        }}
        config={{ immediatelyRender: true, autofocus: false }}
      />
    );
  // The image NodeView's outer wrapper is draggable only while editable.
  const draggable = () =>
    container
      .querySelector('[aria-hidden="false"] .tiptap [data-drag-handle]')
      ?.getAttribute('draggable');
  try {
    await act(async () => render(true));
    await settle();
    expect(draggable()).toBe('true');

    await act(async () => render(false));
    await settle();
    expect(draggable()).toBe('false');
  } finally {
    await act(async () => root.unmount());
  }
});

it('offers no node settings in a read-only editor', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const onUpdate = vi.fn();
  const render = (editable: boolean) =>
    root.render(
      <Editor
        editable={editable}
        contentJson={{
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'variable', attrs: { id: 'name', fallback: 'x' } },
              ],
            },
            {
              type: 'htmlCodeBlock',
              attrs: { activeTab: 'preview' },
            },
          ],
        }}
        config={{ immediatelyRender: true, autofocus: false }}
        onUpdate={onUpdate}
      />
    );
  try {
    await act(async () => render(false));
    await settle();
    const surface = container.querySelector('[aria-hidden="false"] .tiptap')!;
    // The variable shows without the button that opens its settings.
    expect(surface.textContent).toContain('name');
    expect(
      surface.querySelector('button[data-slot="popover-trigger"]')
    ).toBeNull();
    // The empty HTML block cannot switch itself to code.
    const html = [...surface.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('HTML')
    );
    expect(html?.hasAttribute('disabled')).toBe(true);
    // Neither mounting nor switching editability changes the document.
    await act(async () => render(true));
    await settle();
    await act(async () => render(false));
    await settle();
    expect(onUpdate).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});

it('shows the render preview only in Render mode, as read-only', async () => {
  // A custom node view that reports the context's editability.
  const Probe = Node.create({
    name: 'probe',
    group: 'block',
    atom: true,
    parseHTML: () => [{ tag: 'div[data-probe]' }],
    renderHTML: () => ['div', { 'data-probe': '' }],
    addNodeView: () =>
      ReactNodeViewRenderer(function ProbeView() {
        const { editable } = useMailyContext();
        return <NodeViewWrapper data-probe-editable={String(editable)} />;
      }),
  });
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const probes = () =>
    [...container.querySelectorAll('[data-probe-editable]')].map((probe) =>
      probe.getAttribute('data-probe-editable')
    );
  try {
    await act(async () =>
      root.render(
        <Editor
          extensions={[Probe]}
          contentJson={{
            type: 'doc',
            content: [{ type: 'probe' }, { type: 'paragraph' }],
          }}
          config={{ immediatelyRender: true, autofocus: false }}
        />
      )
    );
    await settle();
    expect(container.querySelector('.mly-render-preview')).toBeNull();
    expect(probes()).toEqual(['true']);

    await act(async () => {
      (container.querySelector('[aria-label="Render"]') as HTMLElement).click();
    });
    await settle();
    expect(container.querySelector('.mly-render-preview')).toBeTruthy();
    expect(probes()).toEqual(['true', 'false']);
  } finally {
    await act(async () => root.unmount());
  }
});

// Bubble menus show after TipTap's update delay, through an inline
// visibility style.
async function menusUpdated() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
  });
  await settle();
}
const shown = (selector: string) =>
  [...document.querySelectorAll(selector)].filter((element) => {
    for (
      let node: Element | null = element;
      node && node !== document.body;
      node = node.parentElement
    )
      if (/visibility: visible/.test(node.getAttribute('style') ?? ''))
        return true;
    return false;
  }).length;

it.each([true, false])(
  'shows the variable and HTML menus only while editable (editable: %s)',
  async (editable) => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    let editor: TiptapEditor | null = null;
    try {
      await act(async () =>
        root.render(
          <Editor
            editable={editable}
            contentJson={{
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'Hi ' },
                    { type: 'variable', attrs: { id: 'name', fallback: 'x' } },
                  ],
                },
                {
                  type: 'htmlCodeBlock',
                  attrs: { activeTab: 'code' },
                  content: [{ type: 'text', text: '<p>x</p>' }],
                },
                { type: 'paragraph' },
              ],
            }}
            config={{ immediatelyRender: true, autofocus: false }}
            onCreate={(created) => {
              editor = created;
            }}
          />
        )
      );
      await settle();
      const positions: Record<string, number> = {};
      editor!.state.doc.descendants((node, pos) => {
        positions[node.type.name] ??= pos;
      });

      // A click selects a variable node even in a read-only editor.
      await act(async () => {
        editor!.commands.setNodeSelection(positions.variable);
      });
      await menusUpdated();
      expect(shown('[aria-label="Bold"]') > 0).toBe(editable);

      await act(async () => {
        editor!.commands.setTextSelection(positions.htmlCodeBlock + 2);
      });
      await menusUpdated();
      expect(shown('[aria-label="Preview"]') > 0).toBe(editable);
    } finally {
      await act(async () => root.unmount());
    }
  }
);

it('closes an open bubble menu when the editor becomes read-only', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  let editor: TiptapEditor | null = null;
  const render = (editable: boolean) =>
    root.render(
      <Editor
        editable={editable}
        contentJson={{
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Hi ' },
                { type: 'variable', attrs: { id: 'name', fallback: 'x' } },
              ],
            },
          ],
        }}
        config={{ immediatelyRender: true, autofocus: false }}
        onCreate={(created) => {
          editor = created;
        }}
      />
    );
  try {
    await act(async () => render(true));
    await settle();
    let variable = -1;
    editor!.state.doc.descendants((node, pos) => {
      if (node.type.name === 'variable') variable = pos;
    });
    await act(async () => {
      editor!.commands.setNodeSelection(variable);
    });
    await menusUpdated();
    expect(shown('[aria-label="Bold"]')).toBeGreaterThan(0);

    await act(async () => render(false));
    await menusUpdated();
    expect(shown('[aria-label="Bold"]')).toBe(0);
  } finally {
    await act(async () => root.unmount());
  }
});
