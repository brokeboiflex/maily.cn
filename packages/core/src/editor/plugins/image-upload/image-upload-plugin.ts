import {
  combineTransactionSteps,
  Editor,
  getChangedRanges,
} from '@tiptap/core';
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
  // Redo can bring back a placeholder whose upload was discarded or failed
  // after Undo removed it. Its blob URL is revoked, so that image is removed.
  const revokedPlaceholders = new Set<string>();
  let generation = 0;
  let active = false;
  let subscribed = false;
  let destroyed = false;

  const releasePlaceholder = (src: string) => {
    if (!placeholders.delete(src)) return;
    revokedPlaceholders.add(src);
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
    revokedPlaceholders.delete(placeholderSrc);

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
      // Outside history: Undo must not bring back a revoked placeholder.
      if (position !== null)
        editor.commands.command(({ tr }) => {
          tr.delete(position, position + imageNode.nodeSize);
          tr.setMeta('addToHistory', false);
          return true;
        });
    };
    placeholders.set(placeholderSrc, removeOwnedPlaceholder);
    const transaction = tr.insert(resolvedPos.pos, imageNode);
    view.dispatch(transaction);

    Promise.resolve()
      .then(() => (isCurrent() ? onImageUpload!(file) : undefined))
      .then(async (uploadedSrc) => {
        if (uploadedSrc === undefined) return;
        // A discarded upload releases its blob first: a Redo while the host
        // discards must find it revoked, not still owned.
        if (!isCurrent()) {
          releasePlaceholder(placeholderSrc);
          await onImageUploadDiscard?.(uploadedSrc);
          return;
        }
        const position = ownedPosition();
        if (position !== null) {
          // The insertion is the undoable step; swapping in the uploaded URL is
          // not, so history rebases over it and never revives the revoked blob.
          view.dispatch(
            view.state.tr
              .setNodeMarkup(position, undefined, {
                ...imageNode.attrs,
                src: uploadedSrc,
              })
              .setMeta('addToHistory', false)
          );
        } else {
          releasePlaceholder(placeholderSrc);
          await onImageUploadDiscard?.(uploadedSrc);
        }
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
    appendTransaction: (transactions, oldState, newState) => {
      if (
        !revokedPlaceholders.size ||
        !transactions.some((transaction) => transaction.docChanged)
      )
        return null;
      const revoked = new Map<number, number>();
      const transform = combineTransactionSteps(oldState.doc, [
        ...transactions,
      ]);
      for (const { newRange } of getChangedRanges(transform)) {
        newState.doc.nodesBetween(newRange.from, newRange.to, (node, pos) => {
          if (
            node.type.name === 'image' &&
            revokedPlaceholders.has(node.attrs.src) &&
            !placeholders.has(node.attrs.src)
          )
            revoked.set(pos, pos + node.nodeSize);
        });
      }
      if (!revoked.size) return null;
      const tr = newState.tr;
      // From the end, so earlier positions stay valid.
      for (const [from, to] of [...revoked].sort(([a], [b]) => b - a))
        tr.delete(from, to);
      return tr.setMeta('addToHistory', false);
    },
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
