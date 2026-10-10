import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor } from '@tiptap/core';
import { redoDepth, undoDepth } from '@tiptap/pm/history';
import { afterEach, expect, it, vi } from 'vitest';
import { extensions } from '../extensions';
import { ButtonView } from '../nodes/button/button-view';
import { TextBubbleContent } from './text-menu/text-bubble-content';
import { EditorMenuBar } from './editor-menu-bar';
import { TooltipProvider } from './ui/tooltip';

// Only the NodeView host and outer settings surface are adapted for HappyDOM.
// The settings controls, Select/Popover/ToggleGroup/Command and TipTap are real.
vi.mock('@tiptap/react', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  NodeViewWrapper: ({ children, ...rest }: any) => (
    <div {...rest}>{children}</div>
  ),
  NodeViewContent: () => <div />,
}));
vi.mock('./adaptive-node-popover', () => ({
  AdaptiveNodePopover: ({ children }: any) => <>{children}</>,
}));

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => vi.unstubAllGlobals());

function make(content: any[]) {
  return new Editor({
    extensions: extensions({}),
    content: { type: 'doc', content },
  });
}
async function mount(content: React.ReactNode) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(content));
  return {
    container,
    async dispose() {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}
async function click(element: HTMLElement | null | undefined) {
  expect(element).toBeTruthy();
  await act(async () => element!.click());
}

it('choosing the active implicit Medium button size preserves JSON and Redo', async () => {
  const editor = make([{ type: 'button' }, { type: 'paragraph' }]);
  editor.commands.setNodeSelection(0);
  editor.commands.updateButton({ alignment: 'center' });
  editor.commands.undo();
  expect(redoDepth(editor.state)).toBe(1);
  const before = editor.getJSON();
  const view = await mount(
    <ButtonView
      {...({
        editor,
        node: editor.state.doc.firstChild,
        getPos: () => 0,
        selected: true,
      } as any)}
    />
  );
  try {
    const size = view.container.querySelector<HTMLButtonElement>(
      'button[aria-label=Size]'
    );
    expect(size?.textContent).toContain('Medium');
    await click(size);
    await click(
      document.querySelector<HTMLElement>(
        'button[aria-label=Medium][data-state=on]'
      )
    );
    expect(editor.getJSON()).toEqual(before);
    expect(redoDepth(editor.state)).toBe(1);
    expect(undoDepth(editor.state)).toBe(0);
    expect(editor.commands.redo()).toBe(true);
    expect(editor.state.doc.firstChild?.attrs.alignment).toBe('center');
  } finally {
    await view.dispose();
    editor.destroy();
  }
});

it.each([
  { axis: 'paddingLeft', value: 25 },
  { axis: 'paddingBottom', value: 25 },
  { axis: 'paddingRight', value: '32.5px' },
  { axis: 'paddingRight', value: '32%' },
])(
  'custom $axis=$value is not hidden behind the Medium preset',
  async ({ axis, value }) => {
    const attrs = {
      paddingTop: 10,
      paddingRight: 32,
      paddingBottom: 10,
      paddingLeft: 32,
      [axis]: value,
    };
    const editor = make([{ type: 'button', attrs }, { type: 'paragraph' }]);
    editor.commands.setNodeSelection(0);
    const before = editor.getJSON();
    const view = await mount(
      <ButtonView
        {...({
          editor,
          node: editor.state.doc.firstChild,
          getPos: () => 0,
          selected: true,
        } as any)}
      />
    );
    try {
      const size = view.container.querySelector<HTMLButtonElement>(
        'button[aria-label=Size]'
      );
      expect(size?.textContent).toBe('Size');
      await click(size);
      await click(
        document.querySelector<HTMLElement>('button[aria-label=Medium]')
      );
      expect(editor.state.doc.firstChild?.attrs).toMatchObject({
        paddingTop: 10,
        paddingRight: 32,
        paddingBottom: 10,
        paddingLeft: 32,
      });
      expect(undoDepth(editor.state)).toBe(1);
      editor.commands.undo();
      expect(editor.getJSON()).toEqual(before);
    } finally {
      await view.dispose();
      editor.destroy();
    }
  }
);

it('the active Left control preserves a default paragraph and its Redo branch', async () => {
  const editor = make([
    { type: 'paragraph', content: [{ type: 'text', text: 'abc' }] },
  ]);
  editor.commands.setTextSelection({ from: 1, to: 4 });
  editor.commands.setMark('bold');
  editor.commands.undo();
  const before = editor.getJSON();
  const view = await mount(
    <TooltipProvider>
      <TextBubbleContent editor={editor} />
    </TooltipProvider>
  );
  try {
    await click(
      view.container.querySelector<HTMLElement>('button[aria-label=Alignment]')
    );
    expect(redoDepth(editor.state)).toBe(1);
    await click(
      document.querySelector<HTMLElement>(
        'button[aria-label="Align Left"][data-state=on]'
      )
    );
    expect(editor.getJSON()).toEqual(before);
    expect(redoDepth(editor.state)).toBe(1);
    expect(editor.commands.redo()).toBe(true);
  } finally {
    await view.dispose();
    editor.destroy();
  }
});

it('Left still changes every block in a mixed alignment selection', async () => {
  const editor = make([
    {
      type: 'paragraph',
      attrs: { textAlign: 'center' },
      content: [{ type: 'text', text: 'abc' }],
    },
    {
      type: 'paragraph',
      attrs: { textAlign: 'right' },
      content: [{ type: 'text', text: 'def' }],
    },
  ]);
  editor.commands.setTextSelection({ from: 1, to: 9 });
  const before = editor.getJSON();
  const view = await mount(
    <TooltipProvider>
      <TextBubbleContent editor={editor} />
    </TooltipProvider>
  );
  try {
    await click(
      view.container.querySelector<HTMLElement>('button[aria-label=Alignment]')
    );
    await click(
      document.querySelector<HTMLElement>('button[aria-label="Align Left"]')
    );
    expect(editor.state.doc.child(0).attrs.textAlign).toBe('left');
    expect(editor.state.doc.child(1).attrs.textAlign).toBe('left');
    editor.commands.undo();
    expect(editor.getJSON()).toEqual(before);
  } finally {
    await view.dispose();
    editor.destroy();
  }
});

it.each(['paragraph', 'heading', 'footer'])(
  'the desktop Left control preserves implicit %s alignment and Redo',
  async (type) => {
    const editor = make([
      { type, content: [{ type: 'text', text: 'abc' }] },
      { type: 'paragraph' },
    ]);
    editor.commands.setTextSelection({ from: 1, to: 4 });
    editor.commands.setMark('bold');
    editor.commands.undo();
    const before = editor.getJSON();
    const view = await mount(
      <TooltipProvider>
        <EditorMenuBar
          editor={editor}
          config={{}}
          viewMode="design"
          onViewModeChange={() => {}}
        />
      </TooltipProvider>
    );
    try {
      await click(
        view.container.querySelector<HTMLElement>(
          'button[aria-label="Align Left"]'
        )
      );
      expect(editor.getJSON()).toEqual(before);
      expect(redoDepth(editor.state)).toBe(1);
      expect(undoDepth(editor.state)).toBe(0);
      await act(async () => {
        expect(editor.commands.redo()).toBe(true);
      });
    } finally {
      await view.dispose();
      editor.destroy();
    }
  }
);

it('the desktop Left control still aligns every block in a mixed selection', async () => {
  const editor = make([
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'abc' }],
    },
    {
      type: 'heading',
      attrs: { textAlign: 'right', level: 2 },
      content: [{ type: 'text', text: 'def' }],
    },
    { type: 'paragraph' },
  ]);
  editor.commands.setTextSelection({ from: 1, to: 9 });
  const before = editor.getJSON();
  const view = await mount(
    <TooltipProvider>
      <EditorMenuBar
        editor={editor}
        config={{}}
        viewMode="design"
        onViewModeChange={() => {}}
      />
    </TooltipProvider>
  );
  try {
    await click(
      view.container.querySelector<HTMLElement>(
        'button[aria-label="Align Left"]'
      )
    );
    expect(editor.state.doc.child(0).attrs.textAlign).toBe('left');
    expect(editor.state.doc.child(1).attrs.textAlign).toBe('left');
    expect(undoDepth(editor.state)).toBe(1);
    await act(async () => {
      expect(editor.commands.undo()).toBe(true);
    });
    expect(editor.getJSON()).toEqual(before);
  } finally {
    await view.dispose();
    editor.destroy();
  }
});

it.each([
  { marks: [] },
  { marks: [{ type: 'textStyle', attrs: { color: '#123456' } }] },
])(
  'the Email default control preserves existing default text and Redo',
  async ({ marks }) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] })
    );
    const editor = make([
      { type: 'paragraph', content: [{ type: 'text', text: 'abc', marks }] },
    ]);
    editor.commands.setTextSelection({ from: 1, to: 4 });
    editor.commands.setMark('bold');
    editor.commands.undo();
    const before = editor.getJSON();
    const view = await mount(
      <TooltipProvider>
        <TextBubbleContent editor={editor} />
      </TooltipProvider>
    );
    try {
      const trigger = view.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Font Family"]'
      );
      expect(trigger?.textContent).toContain('Email default');
      await click(trigger);
      expect(redoDepth(editor.state)).toBe(1);
      await click(
        document.querySelector<HTMLElement>(
          '[cmdk-item][data-value="__maily_default_font__"]'
        )
      );
      expect(editor.getJSON()).toEqual(before);
      expect(redoDepth(editor.state)).toBe(1);
      expect(editor.commands.redo()).toBe(true);
    } finally {
      await view.dispose();
      editor.destroy();
    }
  }
);

it('font reset preserves unrelated marks and clears real fonts after a default-first mixed range', () => {
  const editor = make([
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'abc',
          marks: [{ type: 'textStyle', attrs: { color: '#123456' } }],
        },
        {
          type: 'text',
          text: 'def',
          marks: [
            {
              type: 'textStyle',
              attrs: {
                color: '#654321',
                fontFamily: 'Example Serif',
                fontId: 'example-serif',
                fontFallback: 'Georgia',
                fontSubset: 'latin',
                fontVersion: '1.2.3',
                fontRegularWeight: 400,
                fontBoldWeight: 700,
                fontHasItalic: true,
              },
            },
          ],
        },
      ],
    },
  ]);
  try {
    editor.commands.setTextSelection({ from: 1, to: 7 });
    const before = editor.getJSON();
    expect(editor.can().unsetMailyFont()).toBe(true);
    expect(editor.getJSON()).toEqual(before);
    expect(editor.commands.unsetMailyFont()).toBe(true);
    expect(
      editor.state.doc.firstChild?.lastChild?.marks[0].attrs
    ).toMatchObject({
      color: '#654321',
      fontFamily: null,
      fontId: null,
      fontHasItalic: false,
    });
    expect(editor.state.doc.firstChild?.firstChild?.marks[0].attrs.color).toBe(
      '#123456'
    );
    expect(undoDepth(editor.state)).toBe(1);
    editor.commands.undo();
    expect(editor.getJSON()).toEqual(before);
  } finally {
    editor.destroy();
  }
});

it.each([
  { marks: [] },
  { marks: [{ type: 'textStyle', attrs: { color: '#123456' } }] },
])(
  'the active default font-size control preserves JSON and Redo',
  async ({ marks }) => {
    const editor = make([
      { type: 'paragraph', content: [{ type: 'text', text: 'abc', marks }] },
    ]);
    editor.commands.setTextSelection({ from: 1, to: 4 });
    editor.commands.setMark('bold');
    editor.commands.undo();
    const before = editor.getJSON();
    const view = await mount(
      <TooltipProvider>
        <TextBubbleContent editor={editor} />
      </TooltipProvider>
    );
    try {
      await click(
        view.container.querySelector<HTMLElement>(
          'button[aria-label="Font Size"]'
        )
      );
      expect(redoDepth(editor.state)).toBe(1);
      await click(
        document.querySelector<HTMLElement>(
          'button[aria-label=Default][data-state=on]'
        )
      );
      expect(editor.getJSON()).toEqual(before);
      expect(redoDepth(editor.state)).toBe(1);
      expect(editor.commands.redo()).toBe(true);
    } finally {
      await view.dispose();
      editor.destroy();
    }
  }
);

it('font resets use live chained and stored marks without losing other typography', () => {
  const editor = make([
    { type: 'paragraph', content: [{ type: 'text', text: 'abcdef' }] },
  ]);
  try {
    editor.commands.setTextSelection({ from: 1, to: 7 });
    expect(editor.chain().setFontSize('18px').unsetFontSize().run()).toBe(true);
    expect(editor.state.doc.firstChild?.firstChild?.marks).toEqual([]);
    editor
      .chain()
      .setMark('textStyle', { color: '#123456', fontSize: '18px' })
      .run();
    const before = editor.getJSON();
    editor.commands.setTextSelection({ from: 2, to: 5 });
    editor.commands.unsetFontSize();
    const parts: any[] = [];
    editor.state.doc.firstChild?.forEach((node) => parts.push(node.toJSON()));
    expect(parts.map((node) => node.text)).toEqual(['a', 'bcd', 'ef']);
    expect(parts[0].marks[0].attrs.fontSize).toBe('18px');
    expect(parts[1].marks[0].attrs).toMatchObject({
      color: '#123456',
      fontSize: null,
    });
    expect(parts[2].marks[0].attrs.fontSize).toBe('18px');
    editor.commands.undo();
    expect(editor.getJSON()).toEqual(before);
    editor.commands.setTextSelection(3);
    editor.commands.setMark('textStyle', {
      color: '#654321',
      fontSize: '20px',
      fontFamily: 'Example Serif',
    });
    editor.commands.unsetFontSize();
    expect(editor.getAttributes('textStyle')).toMatchObject({
      color: '#654321',
      fontSize: null,
      fontFamily: 'Example Serif',
    });
    editor.commands.unsetMailyFont();
    expect(editor.getAttributes('textStyle')).toMatchObject({
      color: '#654321',
      fontSize: null,
      fontFamily: null,
      fontHasItalic: false,
    });
  } finally {
    editor.destroy();
  }
});
