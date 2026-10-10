import { Editor } from "@tiptap/core"
import { Node } from "@tiptap/pm/model"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { EditorView } from "@tiptap/pm/view"

export type ImageUploadPluginOptions = {
  editor: Editor
  /**
   * Allows you to define a list of allowed mime types for dropped or pasted images.
   * @default ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
   */
  allowedMimeTypes?: string[]

  /**
   * The onImageUpload callback that is called when an image is dropped or pasted.
   * @param file the image file
   * @returns Returns the image URL as a string.
   */
  onImageUpload?: (file: Blob) => Promise<string>
  /** Compensate an owned upload whose node no longer exists. */
  onImageUploadDiscard?: (src: string) => Promise<void>
}

export function ImageUploadPlugin(options: ImageUploadPluginOptions) {
  const { editor, onImageUpload, onImageUploadDiscard, allowedMimeTypes } =
    options
  const placeholders = new Set<string>()
  let destroyed = false

  function handleImageUpload(view: EditorView, file: File, pos?: number) {
    const placeholderSrc = URL.createObjectURL(file)
    placeholders.add(placeholderSrc)

    const { tr, schema } = view.state
    const imageNode = schema.nodes.image.create({
      src: placeholderSrc,
      isSrcVariable: false,
      alt: file.name,
      externalLink: "",
      isExternalLinkVariable: false,
    })
    editor?.extensionStorage?.imageUpload?.placeholderImages?.add(
      placeholderSrc
    )

    const resolvedPos =
      pos !== undefined
        ? view.state.doc.resolve(pos)
        : view.state.selection.$head

    const transaction = tr.insert(resolvedPos.pos, imageNode)
    view.dispatch(transaction)

    onImageUpload?.(file)
      .then(async (uploadedSrc) => {
        if (destroyed || editor.isDestroyed) {
          await onImageUploadDiscard?.(uploadedSrc)
          return
        }
        const updateTr = view.state.tr

        // Find the placeholder image node
        const predicate = (node: Node) =>
          node.type.name === "image" && node.attrs.src === placeholderSrc

        view.state.doc.descendants((node, pos) => {
          if (predicate(node)) {
            updateTr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              src: uploadedSrc,
            })
            return false
          }
        })

        if (updateTr.docChanged) view.dispatch(updateTr)
        else await onImageUploadDiscard?.(uploadedSrc)
      })
      .catch((error) => {
        console.error("Image upload failed", error)
      })
      .finally(() => {
        editor.extensionStorage.imageUpload.placeholderImages.delete(
          placeholderSrc
        )
        placeholders.delete(placeholderSrc)
        URL.revokeObjectURL(placeholderSrc)
      })
  }

  return new Plugin({
    key: new PluginKey("imageUpload"),
    view: () => ({
      destroy() {
        destroyed = true
        for (const src of placeholders) URL.revokeObjectURL(src)
        placeholders.clear()
      },
    }),
    props: {
      handleDrop: (view, event) => {
        if (
          !onImageUpload ||
          // we'll handle drops in the ImageView component
          // this is just for dropping images in empty areas
          !event.dataTransfer?.files?.length
        ) {
          return false
        }

        const images = Array.from(event.dataTransfer.files).filter((file) =>
          allowedMimeTypes?.includes(file.type)
        )
        if (images.length === 0) {
          return false
        }

        const pos = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })
        if (!pos) {
          return false
        }

        event.preventDefault()
        event.stopPropagation()

        images.forEach((file) => handleImageUpload(view, file, pos.pos))
        return true
      },
      handlePaste: (view, event) => {
        if (!onImageUpload || !event.clipboardData?.files?.length) {
          return false
        }

        const images = Array.from(event.clipboardData.files).filter((file) =>
          allowedMimeTypes?.includes(file.type)
        )
        if (images.length === 0) {
          return false
        }

        event.preventDefault()
        event.stopPropagation()

        images.forEach((file) => handleImageUpload(view, file))
        return true
      },
    },
  })
}
