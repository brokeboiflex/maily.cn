import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Plugin } from '@tiptap/pm/state';
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
    await Promise.resolve();
    editor.destroy();
    upload.resolve('https://example.com/upload.png');
    await vi.waitFor(() =>
      expect(discard).toHaveBeenCalledExactlyOnceWith(
        'https://example.com/upload.png'
      )
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith(
      'blob:owned-image'
    );
  });

  it('keeps an in-flight placeholder alive across plugin-view recreation', async () => {
    const upload = pending();
    const { editor, plugin, discard } = setup(() => upload.promise);
    paste(editor, plugin);
    await Promise.resolve();
    editor.registerPlugin(new Plugin({}));
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    expect(editor.storage.imageUpload.placeholderImages.size).toBe(1);
    upload.resolve('https://example.com/upload.png');
    await settle();
    expect(images(editor)[0]?.attrs?.src).toBe(
      'https://example.com/upload.png'
    );
    expect(discard).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('ends ownership and compensates once when the upload plugin is removed', async () => {
    const upload = pending();
    const { editor, plugin, discard } = setup(() => upload.promise);
    paste(editor, plugin);
    await Promise.resolve();
    editor.unregisterPlugin('imageUpload');
    await Promise.resolve();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    upload.resolve('https://example.com/upload.png');
    await vi.waitFor(() => expect(discard).toHaveBeenCalledTimes(1));
    expect(images(editor)).toEqual([]);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('skips queued host work after synchronous destruction', async () => {
    const upload = vi.fn(async () => 'https://example.com/upload.png');
    const { editor, plugin, discard } = setup(upload);
    paste(editor, plugin);
    editor.destroy();
    await settle();
    expect(upload).not.toHaveBeenCalled();
    expect(discard).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('ends pending ownership on editor unmount', async () => {
    const upload = pending();
    const { editor, plugin, discard } = setup(() => upload.promise);
    paste(editor, plugin);
    await Promise.resolve();
    editor.unmount();
    expect(images(editor)).toEqual([]);
    expect(editor.getText().trim()).toBe('keep');
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    upload.resolve('https://example.com/upload.png');
    await vi.waitFor(() => expect(discard).toHaveBeenCalledTimes(1));
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('removes a cancelled placeholder before revoking its URL across unmount/remount', async () => {
    const upload = pending();
    const { editor, plugin, discard } = setup(() => upload.promise);
    vi.mocked(URL.revokeObjectURL).mockImplementation(() => {
      expect(images(editor)).toEqual([]);
    });
    paste(editor, plugin);
    await Promise.resolve();
    const oldView = editor.view;
    editor.unmount();
    expect(oldView.isDestroyed).toBe(true);
    editor.mount(document.createElement('div'));
    expect(editor.isDestroyed).toBe(false);
    expect(images(editor)).toEqual([]);
    expect(editor.getText().trim()).toBe('keep');
    upload.resolve('https://example.com/departed.png');
    await vi.waitFor(() =>
      expect(discard).toHaveBeenCalledExactlyOnceWith(
        'https://example.com/departed.png'
      )
    );
    expect(images(editor)).toEqual([]);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('finishes queued removal after an intervening unmount/remount', async () => {
    const upload = pending();
    const { editor, plugin, discard } = setup(() => upload.promise);
    paste(editor, plugin);
    await Promise.resolve();
    editor.unregisterPlugin('imageUpload');
    editor.unmount();
    editor.mount(document.createElement('div'));
    await Promise.resolve();
    expect(images(editor)).toEqual([]);
    expect(editor.getText().trim()).toBe('keep');
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    upload.resolve('https://example.com/departed.png');
    await vi.waitFor(() => expect(discard).toHaveBeenCalledTimes(1));
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('keeps a new remounted upload independent of departed queued cleanup', async () => {
    const oldUpload = pending();
    const newUpload = pending();
    const upload = vi
      .fn()
      .mockImplementationOnce(() => oldUpload.promise)
      .mockImplementationOnce(() => newUpload.promise);
    const { editor, plugin, discard } = setup(upload);
    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce('blob:departed')
      .mockReturnValueOnce('blob:remounted');
    paste(editor, plugin);
    await Promise.resolve();
    editor.unregisterPlugin('imageUpload');
    editor.unmount();
    editor.mount(document.createElement('div'));
    editor.registerPlugin(plugin);
    paste(editor, plugin);
    await Promise.resolve();
    expect(images(editor)[0]?.attrs?.src).toBe('blob:remounted');
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith(
      'blob:departed'
    );
    newUpload.resolve('https://example.com/current.png');
    oldUpload.resolve('https://example.com/departed.png');
    await vi.waitFor(() =>
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2)
    );
    expect(images(editor)[0]?.attrs?.src).toBe(
      'https://example.com/current.png'
    );
    expect(discard).toHaveBeenCalledExactlyOnceWith(
      'https://example.com/departed.png'
    );
  });

  it('does not delete an equal replacement when unmount cancels the old upload', async () => {
    const upload = pending();
    const { editor, plugin, discard } = setup(() => upload.promise);
    paste(editor, plugin);
    await Promise.resolve();
    editor.commands.setContent(editor.getJSON());
    const replacement = editor.state.doc;
    editor.unmount();
    editor.mount(document.createElement('div'));
    expect(editor.state.doc).toBe(replacement);
    upload.resolve('https://example.com/departed.png');
    await vi.waitFor(() => expect(discard).toHaveBeenCalledTimes(1));
    expect(editor.state.doc).toBe(replacement);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('does not dispatch queued removal into a destroyed editor', async () => {
    const upload = pending();
    const { editor, plugin, discard } = setup(() => upload.promise);
    paste(editor, plugin);
    await Promise.resolve();
    editor.unregisterPlugin('imageUpload');
    const updates = vi.fn();
    editor.on('update', updates);
    editor.destroy();
    await Promise.resolve();
    expect(updates).not.toHaveBeenCalled();
    upload.resolve('https://example.com/departed.png');
    await vi.waitFor(() => expect(discard).toHaveBeenCalledTimes(1));
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('does not release a new upload when removed-plugin cleanup finishes', async () => {
    const oldUpload = pending();
    const newUpload = pending();
    const upload = vi
      .fn()
      .mockImplementationOnce(() => oldUpload.promise)
      .mockImplementationOnce(() => newUpload.promise);
    const { editor, plugin, discard } = setup(upload);
    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce('blob:old-upload')
      .mockReturnValueOnce('blob:new-upload');
    paste(editor, plugin);
    await Promise.resolve();
    editor.unregisterPlugin('imageUpload');
    editor.registerPlugin(plugin);
    paste(editor, plugin);
    await Promise.resolve();
    expect(images(editor)).toHaveLength(1);
    expect(images(editor)[0]?.attrs?.src).toBe('blob:new-upload');
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith(
      'blob:old-upload'
    );
    newUpload.resolve('https://example.com/new.png');
    oldUpload.resolve('https://example.com/old.png');
    await vi.waitFor(() =>
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2)
    );
    expect(images(editor)[0]?.attrs?.src).toBe('https://example.com/new.png');
    expect(discard).toHaveBeenCalledExactlyOnceWith(
      'https://example.com/old.png'
    );
  });
});
