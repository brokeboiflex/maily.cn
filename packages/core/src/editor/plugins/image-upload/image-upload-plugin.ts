import { Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';

export type ImageUploadPluginOptions = {
  editor: Editor;
  /**
   * Allows you to define a list of allowed mime types for dropped or pasted images.
   * @default ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
   */
  allowedMimeTypes?: string[];

  /**
   * The onImageUpload callback that is called when an image is dropped or pasted.
   * @param file the image file
   * @returns Returns the image URL as a string.
   */
  onImageUpload?: (file: Blob) => Promise<string>;
  /** Compensate an owned upload whose node no longer exists. */
  onImageUploadDiscard?: (src: string) => Promise<void>;
};

export function ImageUploadPlugin(options: ImageUploadPluginOptions) {
  const { editor, onImageUpload, onImageUploadDiscard, allowedMimeTypes } =
    options;
  const placeholders = new Map<string, () => void>();
  let generation = 0;
  let active = false;
  let subscribed = false;
  let destroyed = false;

  const releasePlaceholder = (src: string) => {
    if (!placeholders.delete(src)) return;
    editor.extensionStorage.imageUpload?.placeholderImages.delete(src);
    URL.revokeObjectURL(src);
  };
  const endLifetime = (removeNodes = false, deferRemoval = false) => {
    active = false;
    generation += 1;
    const ownedPlaceholders = [...placeholders];
    const releaseOwned = () => {
      for (const [src, remove] of ownedPlaceholders) {
        if (placeholders.get(src) !== remove) continue;
        if (removeNodes) remove();
        releasePlaceholder(src);
      }
      if (!active && subscribed) {
        editor.off('destroy', onEditorDestroy);
        editor.off('unmount', onEditorUnmount);
        subscribed = false;
      }
    };
    // A removal destructor runs inside PM's plugin-view reconfiguration. Finish
    // that stack before deleting live nodes; keep their blob URLs until then.
    if (deferRemoval) queueMicrotask(releaseOwned);
    else releaseOwned();
  };
  const onEditorDestroy = () => {
    destroyed = true;
    endLifetime();
  };
  const onEditorUnmount = () => endLifetime(true);

  function handleImageUpload(view: EditorView, file: File, pos?: number) {
    const ownedGeneration = generation;
    const isCurrent = () =>
      active &&
      ownedGeneration === generation &&
      !view.isDestroyed &&
      !editor.isDestroyed &&
      view.state.plugins.includes(plugin);
    if (!isCurrent()) return;
    const placeholderSrc = URL.createObjectURL(file);

    const { tr, schema } = view.state;
    const imageNode = schema.nodes.image.create({
      src: placeholderSrc,
      isSrcVariable: false,
      alt: file.name,
      externalLink: '',
      isExternalLinkVariable: false,
    });
    editor?.extensionStorage?.imageUpload?.placeholderImages?.add(
      placeholderSrc
    );

    const resolvedPos =
      pos !== undefined
        ? view.state.doc.resolve(pos)
        : view.state.selection.$head;

    const ownedPosition = () => {
      let position: number | null = null;
      let matches = 0;
      editor.state.doc.descendants((node, pos) => {
        if (node === imageNode) {
          position = pos;
          matches += 1;
          return false;
        }
      });
      return matches === 1 ? position : null;
    };
    const removeOwnedPlaceholder = () => {
      if (destroyed) return;
      // TipTap retains editable state across unmount. Its public commands also
      // update that state, so cleanup must not target the departed EditorView.
      const position = ownedPosition();
      if (position !== null)
        editor.commands.deleteRange({
          from: position,
          to: position + imageNode.nodeSize,
        });
    };
    placeholders.set(placeholderSrc, removeOwnedPlaceholder);
    const transaction = tr.insert(resolvedPos.pos, imageNode);
    view.dispatch(transaction);

    Promise.resolve()
      .then(() => (isCurrent() ? onImageUpload!(file) : undefined))
      .then(async (uploadedSrc) => {
        if (uploadedSrc === undefined) return;
        if (!isCurrent()) {
          await onImageUploadDiscard?.(uploadedSrc);
          return;
        }
        const position = ownedPosition();
        if (position !== null) {
          view.dispatch(
            view.state.tr.setNodeMarkup(position, undefined, {
              ...imageNode.attrs,
              src: uploadedSrc,
            })
          );
        } else await onImageUploadDiscard?.(uploadedSrc);
      })
      .catch((error) => {
        if (isCurrent()) removeOwnedPlaceholder();
        console.error('Image upload failed', error);
      })
      .finally(() => {
        releasePlaceholder(placeholderSrc);
      });
  }

  const plugin = new Plugin({
    key: new PluginKey('imageUpload'),
    view: (view) => {
      active = true;
      if (!subscribed) {
        editor.on('destroy', onEditorDestroy);
        editor.on('unmount', onEditorUnmount);
        subscribed = true;
      }
      return {
        destroy() {
          // ProseMirror recreates every plugin view when any plugin changes.
          // Uploads belong to the retained plugin, not its temporary view.
          if (!view.state.plugins.includes(plugin)) endLifetime(true, true);
        },
      };
    },
    props: {
      handleDrop: (view, event) => {
        if (
          !onImageUpload ||
          // we'll handle drops in the ImageView component
          // this is just for dropping images in empty areas
          !event.dataTransfer?.files?.length
        ) {
          return false;
        }

        const images = Array.from(event.dataTransfer.files).filter((file) =>
          allowedMimeTypes?.includes(file.type)
        );
        if (images.length === 0) {
          return false;
        }

        const pos = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });
        if (!pos) {
          return false;
        }

        event.preventDefault();
        event.stopPropagation();

        images.forEach((file) => handleImageUpload(view, file, pos.pos));
        return true;
      },
      handlePaste: (view, event) => {
        if (!onImageUpload || !event.clipboardData?.files?.length) {
          return false;
        }

        const images = Array.from(event.clipboardData.files).filter((file) =>
          allowedMimeTypes?.includes(file.type)
        );
        if (images.length === 0) {
          return false;
        }

        event.preventDefault();
        event.stopPropagation();

        images.forEach((file) => handleImageUpload(view, file));
        return true;
      },
    },
  });
  return plugin;
}
