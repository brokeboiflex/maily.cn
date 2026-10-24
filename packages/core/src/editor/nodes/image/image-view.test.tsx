import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor as TiptapEditor } from '@tiptap/core';
import { type NodeViewProps } from '@tiptap/react';
import { Plugin } from '@tiptap/pm/state';
import { StarterKit } from '@tiptap/starter-kit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Editor } from '../../index';
import { ImageUploadExtension } from '../../extensions/image-upload/image-upload';
import { defaultLabels, createTranslator } from '../../i18n';
import { MailyContext } from '../../maily-context';
import { ImageExtension } from './image';
import { ImageView } from './image-view';
import { LogoExtension } from '../logo/logo';
import { LogoView } from '../logo/logo-view';

// HappyDOM does not supply the React NodeView drag context reliably. Preserve
// the wrapper DOM/ref contract; menu registration, React state and PM are real.
vi.mock('@tiptap/react', async () => {
  const actual =
    await vi.importActual<typeof import('@tiptap/react')>('@tiptap/react');
  return {
    ...actual,
    NodeViewWrapper: React.forwardRef<
      HTMLDivElement,
      React.HTMLAttributes<HTMLDivElement> & { as?: string }
    >((props, ref) => {
      const divProps: React.HTMLAttributes<HTMLDivElement> & { as?: string } = {
        ...props,
      };
      delete divProps.as;
      return <div {...divProps} ref={ref} data-node-view-wrapper="" />;
    }),
  };
});

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const cleanups: (() => Promise<void>)[] = [];
const loads: ControlledImage[] = [];
class ControlledImage {
  src = '';
  naturalWidth = 600;
  naturalHeight = 300;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() {
    loads.push(this);
  }
}

const deferred = () => {
  let resolve!: (src: string) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<string>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

function containerRoot() {
  const container = document.createElement('div');
  document.body.append(container);
  return { container, root: createRoot(container) };
}

async function mountNode(
  kind: 'image' | 'logo',
  attrs: Record<string, unknown>,
  onImageUpload = vi.fn(async () => 'https://example.com/upload.png')
) {
  vi.stubGlobal('Image', ControlledImage);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const editor = new TiptapEditor({
    extensions: [
      StarterKit.configure({ trailingNode: false }),
      ImageExtension.extend({ addNodeView: () => null }),
      LogoExtension.extend({ addNodeView: () => null }),
      ImageUploadExtension.configure({ onImageUpload }),
    ],
    content: { type: 'doc', content: [{ type: kind, attrs }] },
  });
  const { container, root } = containerRoot();
  const labels = { ...defaultLabels, 'imageStatus.error': 'Translated error' };
  const t = createTranslator(labels);
  const writes = vi.fn();
  editor.on('transaction', ({ transaction }) => {
    if (transaction.steps.length) writes(transaction);
  });
  const render = () => {
    const View = kind === 'image' ? ImageView : LogoView;
    const props = {
      editor,
      node: editor.state.doc.nodeAt(0)!,
      getPos: () => 0,
      selected: true,
    } as unknown as NodeViewProps;
    root.render(
      <MailyContext.Provider value={{ labels, t }}>
        <View {...props} />
      </MailyContext.Provider>
    );
  };
  editor.on('transaction', render);
  await act(async () => render());
  cleanups.push(async () => {
    editor.off('transaction', render);
    await act(async () => root.unmount());
    editor.destroy();
    container.remove();
  });
  return { editor, container, writes };
}

async function chooseFile(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>('input[type=file]');
  expect(input).not.toBeNull();
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: [new File(['image'], 'image.png', { type: 'image/png' })],
  });
  await act(async () =>
    input!.dispatchEvent(new Event('change', { bubbles: true }))
  );
}

async function beginResize(container: HTMLElement) {
  const wrapper = container.firstElementChild as HTMLElement;
  wrapper.classList.add('ProseMirror-selectednode');
  Object.defineProperty(wrapper, 'offsetWidth', { value: 300 });
  await act(async () => loads.at(-1)!.onload?.());
  const image = container.querySelector('img')!;
  Object.defineProperties(image, {
    width: { configurable: true, value: 120 },
    height: { configurable: true, value: 60 },
  });
  const corner = container.querySelector('[data-direction="se"]')!;
  await act(async () =>
    corner.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 100 })
    )
  );
  await act(async () =>
    window.dispatchEvent(
      new MouseEvent('mousemove', { buttons: 1, clientX: 130, clientY: 115 })
    )
  );
}

afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  loads.length = 0;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('image and logo owned async UI', () => {
  it.each(['image', 'logo'] as const)(
    'keeps a translated error and retries an empty %s upload through its file input',
    async (kind) => {
      const first = deferred();
      const onUpload = vi
        .fn()
        .mockImplementationOnce(() => first.promise)
        .mockResolvedValueOnce('https://example.com/retry.png');
      const { container, editor } = await mountNode(
        kind,
        { src: '' },
        onUpload
      );
      await chooseFile(container);
      await act(async () => first.reject(new Error('upload rejected')));
      expect(editor.state.doc.firstChild?.attrs.src).toBe('');
      expect(container.textContent).toContain('Translated error');
      await chooseFile(container);
      expect(onUpload).toHaveBeenCalledTimes(2);
      expect(editor.state.doc.firstChild?.attrs.src).toBe(
        'https://example.com/retry.png'
      );
    }
  );

  it.each(['image', 'logo'] as const)(
    'gives a reused %s view to its replacement node without the departed upload UI',
    async (kind) => {
      const first = deferred();
      const onUpload = vi
        .fn()
        .mockImplementationOnce(() => first.promise)
        .mockResolvedValueOnce('https://example.com/replacement.png');
      const { container, editor } = await mountNode(
        kind,
        { src: '' },
        onUpload
      );
      await chooseFile(container);
      expect(container.querySelector('input[type=file]')).toBeNull();
      // Equal JSON creates a replacement immutable node in the same view.
      await act(async () => {
        editor.commands.setContent(editor.getJSON());
      });
      expect(container.querySelector('input[type=file]')).not.toBeNull();
      await act(async () => first.reject(new Error('departed upload failed')));
      expect(container.textContent).not.toContain('Translated error');
      await chooseFile(container);
      expect(onUpload).toHaveBeenCalledTimes(2);
      expect(editor.state.doc.firstChild?.attrs.src).toBe(
        'https://example.com/replacement.png'
      );
    }
  );

  it.each(['image', 'logo'] as const)(
    'offers only the allowed MIME types in the %s file picker',
    async (kind) => {
      const { container, editor } = await mountNode(kind, { src: '' });
      const allowed: string[] =
        editor.extensionManager.extensions.find(
          (extension) => extension.name === 'imageUpload'
        )?.options.allowedMimeTypes ?? [];
      const picker =
        container.querySelector<HTMLInputElement>('input[type="file"]');
      expect(allowed.length).toBeGreaterThan(0);
      expect(picker?.accept).toBe(allowed.join(','));
    }
  );

  it('preserves dimensions selected after same-source intrinsic loading began', async () => {
    const { container, editor } = await mountNode('image', {
      src: 'https://example.com/image.png',
    });
    Object.defineProperty(container.firstElementChild, 'offsetWidth', {
      value: 300,
    });
    const pendingLoad = loads.at(-1)!;
    await act(async () => {
      const node = editor.state.doc.firstChild!;
      editor.view.dispatch(
        editor.state.tr.setNodeMarkup(0, undefined, {
          ...node.attrs,
          width: 120,
          height: 60,
        })
      );
    });
    await act(async () => pendingLoad.onload?.());
    expect(editor.state.doc.firstChild?.attrs).toMatchObject({
      width: 120,
      height: 60,
    });
  });

  it.each([true, false])(
    'never writes dimensions when an image loads (editable: %s)',
    async (editable) => {
      const { container, editor, writes } = await mountNode('image', {
        src: 'https://example.com/image.png',
      });
      Object.defineProperty(container.firstElementChild, 'offsetWidth', {
        value: 300,
      });
      await act(async () => {
        editor.setEditable(editable, false);
        editor.view.dispatch(editor.state.tr);
      });
      await act(async () => loads.at(-1)!.onload?.());
      expect(writes).not.toHaveBeenCalled();
      expect(editor.state.doc.firstChild?.attrs).toMatchObject({
        width: 'auto',
        height: 'auto',
      });
    }
  );

  it.each(['image', 'logo'] as const)(
    'offers and accepts only the host image types when picking a %s',
    async (kind) => {
      const onImageUpload = vi.fn(async () => 'https://example.com/upload.png');
      const { container } = await mountNode(kind, { src: '' }, onImageUpload);
      const input =
        container.querySelector<HTMLInputElement>('input[type="file"]')!;
      expect(input.accept).toBe(
        'image/jpeg,image/png,image/gif,image/webp,image/svg+xml'
      );
      Object.defineProperty(input, 'files', {
        configurable: true,
        value: [new File(['x'], 'x.bmp', { type: 'image/bmp' })],
      });
      await act(async () =>
        input.dispatchEvent(new Event('change', { bubbles: true }))
      );
      expect(onImageUpload).not.toHaveBeenCalled();
    }
  );

  it('ignores an old load callback after equal node replacement', async () => {
    const { container, editor, writes } = await mountNode('image', {
      src: 'https://example.com/image.png',
    });
    Object.defineProperty(container.firstElementChild, 'offsetWidth', {
      value: 300,
    });
    const oldCallback = loads.at(-1)!.onload!;
    await act(async () => editor.commands.setContent(editor.getJSON()));
    const replacementWrites = writes.mock.calls.length;
    await act(async () => oldCallback());
    expect(writes).toHaveBeenCalledTimes(replacementWrites);
    expect(editor.state.doc.firstChild?.attrs.width).toBe('auto');
    await act(async () => loads.at(-1)!.onload?.());
    expect(writes).toHaveBeenCalledTimes(replacementWrites);
    expect(editor.state.doc.firstChild?.attrs.width).toBe('auto');
  });

  it('loads a current image after an unrelated same-source attribute edit', async () => {
    const { container, editor } = await mountNode('image', {
      src: 'https://example.com/image.png',
    });
    Object.defineProperty(container.firstElementChild, 'offsetWidth', {
      value: 300,
    });
    await act(async () => {
      const node = editor.state.doc.firstChild!;
      editor.view.dispatch(
        editor.state.tr.setNodeMarkup(0, undefined, {
          ...node.attrs,
          alignment: 'right',
        })
      );
    });
    await act(async () => loads.at(-1)!.onload?.());
    expect(editor.state.doc.firstChild?.attrs).toMatchObject({
      width: 'auto',
      alignment: 'right',
    });
  });

  it('rejects resize release after equal document replacement', async () => {
    const { container, editor, writes } = await mountNode('image', {
      src: 'https://example.com/image.png',
      width: 120,
      height: 60,
      aspectRatio: 2,
    });
    await beginResize(container);
    await act(async () => editor.commands.setContent(editor.getJSON()));
    const replacementWrites = writes.mock.calls.length;
    await act(async () => window.dispatchEvent(new MouseEvent('mouseup')));
    expect(writes).toHaveBeenCalledTimes(replacementWrites);
    expect(editor.state.doc.firstChild?.attrs.width).toBe(120);
  });

  // captureNodeAction rejects commits from a read-only editor.
  it('drops a resize released after the editor became read-only', async () => {
    const { container, editor, writes } = await mountNode('image', {
      src: 'https://example.com/image.png',
      width: 120,
      height: 60,
      aspectRatio: 2,
    });
    await beginResize(container);
    await act(async () => editor.setEditable(false, false));
    await act(async () => window.dispatchEvent(new MouseEvent('mouseup')));
    expect(writes).not.toHaveBeenCalled();
    expect(editor.state.doc.firstChild?.attrs.width).toBe(120);
  });

  it('commits a current resize once and removes its native listeners', async () => {
    const { container, editor, writes } = await mountNode('image', {
      src: 'https://example.com/image.png',
      width: 120,
      height: 60,
      aspectRatio: 2,
    });
    await beginResize(container);
    await act(async () => {
      window.dispatchEvent(new MouseEvent('mouseup'));
      window.dispatchEvent(new MouseEvent('mouseup'));
    });
    expect(writes).toHaveBeenCalledTimes(1);
    expect(editor.state.doc.firstChild?.attrs).toMatchObject({
      width: 150,
      height: 75,
    });
  });

  it('completes pasted uploads after the public Editor registers its ordinary menus', async () => {
    vi.stubGlobal('Image', ControlledImage);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:public-editor'),
      revokeObjectURL: vi.fn(),
    });
    const upload = deferred();
    const discard = vi.fn(async () => {});
    const extensions = [
      ImageUploadExtension.configure({
        onImageUpload: () => upload.promise,
        onImageUploadDiscard: discard,
      }),
    ];
    const { container, root } = containerRoot();
    let editor: TiptapEditor | undefined;
    cleanups.push(async () => {
      await act(async () => root.unmount());
      container.remove();
    });
    await act(async () =>
      root.render(
        <Editor
          contentHtml="<p>keep</p>"
          extensions={extensions}
          onCreate={(value) => {
            editor = value;
          }}
        />
      )
    );
    await act(async () => vi.waitFor(() => expect(editor).toBeDefined()));
    expect(
      editor!.state.plugins.filter((plugin) =>
        (plugin as unknown as { key: string }).key.includes('BubbleMenu')
      ).length
    ).toBeGreaterThan(0);
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', {
      value: {
        files: [new File(['image'], 'image.png', { type: 'image/png' })],
        getData: () => '',
        types: [],
      },
    });
    await act(async () => editor!.view.dom.dispatchEvent(event));
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    await act(async () => loads.at(-1)!.onload?.());
    expect(JSON.stringify(editor!.getJSON())).toContain('blob:public-editor');
    expect(
      editor!.getJSON().content?.find((node) => node.type === 'image')?.attrs
        ?.width
    ).toBe('auto');
    await act(async () => editor!.registerPlugin(new Plugin({})));
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    await act(async () =>
      upload.resolve('https://example.com/public-upload.png')
    );
    await vi.waitFor(() =>
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
    );
    expect(JSON.stringify(editor!.getJSON())).toContain(
      'https://example.com/public-upload.png'
    );
    expect(discard).not.toHaveBeenCalled();
  });

  it('removes an owned pending placeholder after public-editor menu reconfiguration finishes', async () => {
    vi.stubGlobal('Image', ControlledImage);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:removed-upload'),
      revokeObjectURL: vi.fn(),
    });
    const upload = deferred();
    const onUpload = vi.fn(() => upload.promise);
    const discard = vi.fn(async () => {});
    const extensions = [
      ImageUploadExtension.configure({
        onImageUpload: onUpload,
        onImageUploadDiscard: discard,
      }),
    ];
    const { container, root } = containerRoot();
    let editor: TiptapEditor | undefined;
    cleanups.push(async () => {
      await act(async () => root.unmount());
      container.remove();
    });
    await act(async () =>
      root.render(
        <Editor
          contentHtml="<p>keep</p>"
          extensions={extensions}
          onCreate={(value) => {
            editor = value;
          }}
        />
      )
    );
    await act(async () => vi.waitFor(() => expect(editor).toBeDefined()));
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', {
      value: {
        files: [new File(['image'], 'image.png', { type: 'image/png' })],
        getData: () => '',
        types: [],
      },
    });
    await act(async () => editor!.view.dom.dispatchEvent(event));
    expect(onUpload).toHaveBeenCalledTimes(1);
    await act(async () => editor!.unregisterPlugin('imageUpload'));
    expect(JSON.stringify(editor!.getJSON())).not.toContain(
      'blob:removed-upload'
    );
    expect(editor!.getText().trim()).toBe('keep');
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    await act(async () => upload.resolve('https://example.com/discard.png'));
    await vi.waitFor(() =>
      expect(discard).toHaveBeenCalledExactlyOnceWith(
        'https://example.com/discard.png'
      )
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });
});
