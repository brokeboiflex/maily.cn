import { type NodeViewProps } from "@tiptap/core"
import { NodeViewWrapper } from "@tiptap/react"
import { useCallback, useEffect, useRef } from "react"
import { useState } from "react"
import { type LogoAttributes, logoSizes } from "./logo"
import { type ImageStatus, ImageStatusLabel } from "../image/image-view"
import { useImageUploadOptions } from "../../extensions/image-upload/image-upload"
import { cn } from "@/lib/utils"
import { useMailyContext } from "../../provider"

export function LogoView(props: NodeViewProps) {
  const { t } = useMailyContext()
  const { node, editor, updateAttributes, getPos } = props

  const uploadLock = useRef(false)
  const uploadGeneration = useRef(0)
  useEffect(
    () => () => {
      uploadGeneration.current += 1
    },
    []
  )
  const [status, setStatus] = useState<ImageStatus>("idle")
  const [, setIsPlaceholderImage] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const {
    onImageUpload,
    onImageUploadDiscard,
    allowedMimeTypes = [],
  } = useImageUploadOptions(editor)

  let {
    alignment = "center",
    src: logoSrc,
    isSrcVariable,
    size = "sm",
  } = (node.attrs || {}) as LogoAttributes

  const hasImageSrc = !!logoSrc
  const isDroppable =
    !!onImageUpload && editor.isEditable && !isSrcVariable && status === "idle"

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isDroppable || !e.target.files || e.target.files.length === 0) {
      return
    }

    const file = e.target.files[0]
    await handleImageUpload(file)
  }

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!isDroppable || uploadLock.current) return
      uploadLock.current = true
      const generation = ++uploadGeneration.current
      try {
        setStatus("loading")
        const imageUrl = await onImageUpload(file)
        let currentNode
        if (!editor.isDestroyed) {
          try {
            const position = getPos()
            currentNode =
              typeof position === "number"
                ? editor.state.doc.nodeAt(position)
                : null
          } catch {
            /* Deleted node views can no longer resolve a position. */
          }
        }
        if (
          generation !== uploadGeneration.current ||
          editor.isDestroyed ||
          !currentNode ||
          currentNode !== node ||
          currentNode.type.name !== node.type.name ||
          currentNode.attrs.src !== node.attrs.src ||
          currentNode.attrs.isSrcVariable !== node.attrs.isSrcVariable
        ) {
          if (generation === uploadGeneration.current && !editor.isDestroyed)
            setStatus("idle")
          await onImageUploadDiscard?.(imageUrl)
          return
        }
        updateAttributes({ src: imageUrl })
        setIsPlaceholderImage(false)
        setStatus("loaded")
      } catch (error) {
        console.error("Error uploading image:", error)
        if (generation === uploadGeneration.current) setStatus("error")
      } finally {
        uploadLock.current = false
      }
    },
    [
      onImageUpload,
      onImageUploadDiscard,
      updateAttributes,
      isDroppable,
      editor,
      getPos,
      node,
    ]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!isDroppable) {
        return
      }

      e.preventDefault()
      e.stopPropagation()
      setIsDraggingOver(true)
    },
    [onImageUpload]
  )

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!isDroppable) {
        return
      }

      e.preventDefault()
      e.stopPropagation()
      setIsDraggingOver(false)
    },
    [onImageUpload]
  )

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      if (!isDroppable) {
        return
      }

      e.preventDefault()
      e.stopPropagation()
      setIsDraggingOver(false)
      const files = e.dataTransfer?.files
      if (!files || files?.length === 0) {
        return
      }

      const firstFile = files[0]
      if (!allowedMimeTypes.includes(firstFile.type)) {
        return
      }

      await handleImageUpload(firstFile)
    },
    [handleImageUpload]
  )

  // load the image using new Image() to avoid layout shift
  // then if the image is loaded, set the status to loaded
  useEffect(() => {
    if (!logoSrc) {
      return
    }

    setStatus("loading")
    const isPlaceHolder =
      editor?.extensionStorage?.imageUpload?.placeholderImages?.has(logoSrc) ??
      false
    setIsPlaceholderImage(isPlaceHolder)
    const img = new Image()
    img.src = logoSrc
    img.onload = () => {
      setStatus("loaded")
    }
    img.onerror = () => {
      setStatus("error")
    }

    return () => {
      img.src = ""
      img.onload = null
      img.onerror = null
    }
  }, [logoSrc])

  const logoSize = logoSizes[size]

  return (
    <NodeViewWrapper
      as="div"
      draggable={editor.isEditable}
      data-drag-handle={editor.isEditable}
      style={{
        overflow: "hidden",
        position: "relative",
        // Weird! Basically tiptap/prose wraps this in a span and the line height causes an annoying buffer.
        lineHeight: "0px",
        display: "block",
      }}
      className={cn(
        "mly-image-drop-zone after:pointer-events-none after:absolute after:inset-0 after:rounded after:border-2 after:border-dashed after:border-primary after:opacity-0 after:transition-opacity after:duration-200 after:content-['']",
        isDraggingOver && "mly-drag-over after:opacity-100"
      )}
      {...(isDroppable
        ? {
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onDrop: handleDrop,
          }
        : {})}
    >
      {!hasImageSrc && status === "idle" && (
        <ImageStatusLabel
          status="idle"
          minHeight={logoSize}
          isDropZone={isDroppable}
        />
      )}

      {!hasImageSrc && status === "loading" && !isSrcVariable && (
        <ImageStatusLabel status="loading" minHeight={logoSize} />
      )}

      {hasImageSrc && isSrcVariable && (
        <ImageStatusLabel status="variable" minHeight={logoSize} />
      )}
      {hasImageSrc && status === "loading" && !isSrcVariable && (
        <ImageStatusLabel status="loading" minHeight={logoSize} />
      )}
      {hasImageSrc && status === "error" && !isSrcVariable && (
        <ImageStatusLabel status="error" minHeight={logoSize} />
      )}

      {isDroppable && (
        /* shadcn-audit-ignore-next-line invisible native file input overlay */
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0"
          multiple={false}
          aria-label={t("imageStatus.dropImage")}
        />
      )}

      {hasImageSrc && status === "loaded" && !isSrcVariable && (
        <img
          src={logoSrc}
          alt={t("logo.alt")}
          style={{
            height: logoSize,
            width: logoSize,
            cursor: "default",
            marginBottom: 0,
            ...({
              center: { marginLeft: "auto", marginRight: "auto" },
              left: { marginRight: "auto" },
              right: { marginLeft: "auto" },
            }[alignment] || {}),
          }}
          draggable={editor.isEditable}
        />
      )}
    </NodeViewWrapper>
  )
}
