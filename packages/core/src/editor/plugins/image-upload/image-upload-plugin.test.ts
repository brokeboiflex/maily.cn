import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import type { Plugin } from '@tiptap/pm/state';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImageUploadPlugin } from './image-upload-plugin';

const editors: Editor[] = [];
const pending = () => {
  let resolve!: (src: string) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<string>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

function setup(onImageUpload: (file: Blob) => Promise<string>) {
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:owned-image'),
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const editor = new Editor({
    extensions: [StarterKit.configure({ trailingNode: false }), Image],
    content: '<p>keep</p>',
  });
  editors.push(editor);
  editor.storage.imageUpload = { placeholderImages: new Set() };
  const discard = vi.fn(async () => {});
  const plugin = ImageUploadPlugin({
    editor,
    allowedMimeTypes: ['image/png'],
    onImageUpload,
    onImageUploadDiscard: discard,
  });
  editor.registerPlugin(plugin);
  return { editor, plugin, discard };
}

function paste(editor: Editor, plugin: Plugin) {
  const event = {
    clipboardData: {
      files: [new File(['image'], 'image.png', { type: 'image/png' })],
    },
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as ClipboardEvent;
  plugin.props.handlePaste!.call(plugin, editor.view, event, null!);
}

const images = (editor: Editor) =>
  editor.getJSON().content?.filter((node) => node.type === 'image') ?? [];

const settle = async () => {
  await vi.waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalled());
};

afterEach(() => {
  editors.splice(0).forEach((editor) => editor.destroy());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('paste/drop upload ownership', () => {
  it('updates the same owned node after its position changes', async () => {
    const upload = pending();
    const { editor, plugin, discard } = setup(() => upload.promise);
    paste(editor, plugin);
    editor.commands.insertContentAt(0, '<p>before</p>');
    upload.resolve('https://example.com/upload.png');
    await settle();
    expect(images(editor)[0]?.attrs?.src).toBe(
      'https://example.com/upload.png'
    );
    expect(discard).not.toHaveBeenCalled();
  });

  it('discards completion after equal document replacement', async () => {
    const upload = pending();
    const { editor, plugin, discard } = setup(() => upload.promise);
    paste(editor, plugin);
    editor.commands.setContent(editor.getJSON());
    upload.resolve('https://example.com/upload.png');
    await settle();
    expect(images(editor)[0]?.attrs?.src).toBe('blob:owned-image');
    expect(discard).toHaveBeenCalledExactlyOnceWith(
      'https://example.com/upload.png'
    );
  });

  it('rejects ambiguous ownership when the immutable node is reused', async () => {
    const upload = pending();
    const { editor, plugin, discard } = setup(() => upload.promise);
    paste(editor, plugin);
    let placeholder;
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'image') placeholder = node;
    });
    editor.view.dispatch(
      editor.state.tr.insert(editor.state.doc.content.size, placeholder!)
    );
    upload.resolve('https://example.com/upload.png');
    await settle();
    expect(images(editor)).toHaveLength(2);
    expect(
      images(editor).every((node) => node.attrs?.src === 'blob:owned-image')
    ).toBe(true);
    expect(discard).toHaveBeenCalledExactlyOnceWith(
      'https://example.com/upload.png'
    );
  });

  it.each(['reject', 'throw'] as const)(
    'removes its failed placeholder and releases resources on handler %s',
    async (mode) => {
      const upload = pending();
      const { editor, plugin } = setup(() => {
        if (mode === 'throw') throw new Error('synchronous upload failure');
        return upload.promise;
      });
      paste(editor, plugin);
      if (mode === 'reject') upload.reject(new Error('upload failure'));
      await settle();
      expect(images(editor)).toEqual([]);
      expect(editor.getText().trim()).toBe('keep');
      expect(editor.storage.imageUpload.placeholderImages.size).toBe(0);
      expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith(
        'blob:owned-image'
      );
    }
  );

  it('does not delete a replacement document on failure', async () => {
    const upload = pending();
    const { editor, plugin } = setup(() => upload.promise);
    paste(editor, plugin);
    editor.commands.setContent('<p>replacement</p>');
    upload.reject(new Error('upload failure'));
    await settle();
    expect(editor.getHTML()).toBe('<p>replacement</p>');
  });

  it('compensates a completion after editor destruction', async () => {
    const upload = pending();
    const { editor, plugin, discard } = setup(() => upload.promise);
    paste(editor, plugin);
    editor.destroy();
    upload.resolve('https://example.com/upload.png');
    await vi.waitFor(() =>
      expect(discard).toHaveBeenCalledExactlyOnceWith(
        'https://example.com/upload.png'
      )
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});
