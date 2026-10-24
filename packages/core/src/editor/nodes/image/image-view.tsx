import {
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { type NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { useImageUploadOptions } from '../../extensions/image-upload/image-upload';
import { cn } from '@/editor/utils/classname';
import { useEvent } from '../../utils/use-event';
import { captureNodeAction } from '../../utils/node-action';
import { updateNodeViewAttributes } from '../../utils/update-attribute';
import { getAspectRatio, getNewHeight } from '../../utils/aspect-ratio';
import { useMailyContext } from '../../maily-context';
import { useResettableState } from '../../utils/state-hooks';
import { Ban, BracesIcon, GrabIcon, ImageOffIcon, Loader2 } from 'lucide-react';

const MIN_WIDTH = 20;
// Node settings that are not <img> attributes.
const NODE_ONLY_ATTRIBUTES = new Set([
  'externalLink',
  'isExternalLinkVariable',
  'isSrcVariable',
  'showIfKey',
  'aspectRatio',
  'borderRadius',
  'lockAspectRatio',
]);
export const IMAGE_MAX_WIDTH = 600;
export const IMAGE_MAX_HEIGHT = 400;

export type ImageStatus = 'idle' | 'loading' | 'loaded' | 'error';

function isUploadPlaceholder(editor: NodeViewProps['editor'], src: string) {
  return (
    editor?.extensionStorage?.imageUpload?.placeholderImages?.has(src) ?? false
  );
}

export function ImageView(props: NodeViewProps) {
  const { t } = useMailyContext();
  const { node, selected, editor, getPos } = props;

  const resizeCleanup = useRef<(() => void) | null>(null);
  useLayoutEffect(() => () => resizeCleanup.current?.(), []);
  const uploadLock = useRef(false);
  const uploadGeneration = useRef(0);
  useLayoutEffect(
    () => () => {
      uploadGeneration.current += 1;
    },
    []
  );
  const { src, isSrcVariable } = node.attrs || {};
  // Every node revision reloads its image source, so its status starts over.
  const loadKeys = [node, src, isSrcVariable];
  const [status, setStatus] = useResettableState<ImageStatus>(
    () => (!src || isSrcVariable ? 'idle' : 'loading'),
    loadKeys
  );
  // React reuses this view for a replacement node (for example after
  // setContent). An in-flight upload belongs to the node that started it.
  const uploadNode = useRef(node);
  useLayoutEffect(() => {
    if (uploadNode.current === node) return;
    uploadNode.current = node;
    if (!uploadLock.current) return;
    uploadGeneration.current += 1;
    uploadLock.current = false;
    setStatus('idle');
  }, [node, setStatus]);
  const [isPlaceholderImage, setIsPlaceholderImage] = useResettableState(
    () => !!src && !isSrcVariable && isUploadPlaceholder(editor, src),
    loadKeys
  );

  const {
    onImageUpload,
    onImageUploadDiscard,
    allowedMimeTypes = [],
  } = useImageUploadOptions(editor);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [resizingStyle, setResizingStyle] = useState<
    Pick<CSSProperties, 'width' | 'height'> | undefined
  >();

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleMouseDown = useEvent(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const imageParent = document.querySelector(
        '.ProseMirror-selectednode'
      ) as HTMLDivElement;

      if (!imgRef.current || !imageParent || !selected) {
        return;
      }

      let position;
      try {
        position = getPos();
      } catch {
        return;
      }
      const action =
        typeof position === 'number'
          ? captureNodeAction(editor, position, node)
          : null;
      if (!action) return;

      const imageParentWidth = Math.max(
        imageParent.offsetWidth,
        IMAGE_MAX_WIDTH
      );

      resizeCleanup.current?.();
      event.preventDefault();
      const direction = event.currentTarget.dataset.direction || '--';
      const initialXPosition = event.clientX;
      const initialYPosition = event.clientY;
      const currentWidth = imgRef.current.width;
      const currentHeight = imgRef.current.height;
      let newWidth = currentWidth;
      let newHeight = currentHeight;
      const transformX = direction[1] === 'w' ? -1 : 1;
      const transformY = direction[0] === 'n' ? -1 : 1;

      const cleanup = () => {
        window.removeEventListener('mousemove', mouseMoveHandler);
        window.removeEventListener('mouseup', removeListeners);
        resizeCleanup.current = null;
      };
      const removeListeners = () => {
        cleanup();
        const aspectRatio = getAspectRatio(newWidth, newHeight);
        action.run(() => {
          if (
            node.attrs.width !== newWidth ||
            node.attrs.height !== newHeight ||
            node.attrs.aspectRatio !== aspectRatio
          )
            updateNodeViewAttributes(props, {
              width: newWidth,
              height: newHeight,
              aspectRatio,
            });
        });
        setResizingStyle(undefined);
      };

      const mouseMoveHandler = (event: MouseEvent) => {
        if (!action.isCurrent()) {
          cleanup();
          setResizingStyle(undefined);
          return;
        }
        newWidth = Math.max(
          currentWidth + transformX * (event.clientX - initialXPosition),
          MIN_WIDTH
        );
        newHeight = Math.max(
          currentHeight + transformY * (event.clientY - initialYPosition),
          MIN_WIDTH
        );

        if (newWidth > imageParentWidth) {
          newWidth = imageParentWidth;
        }
        if (newHeight > IMAGE_MAX_HEIGHT) {
          newHeight = IMAGE_MAX_HEIGHT;
        }

        // If aspect ratio is locked, calculate height based on aspect ratio
        if (node.attrs.lockAspectRatio) {
          const aspectRatio =
            node.attrs.aspectRatio &&
            isFinite(node.attrs.aspectRatio) &&
            node.attrs.aspectRatio > 0
              ? node.attrs.aspectRatio
              : currentWidth / currentHeight;
          newHeight = getNewHeight(newWidth, aspectRatio);
        }

        setResizingStyle({ width: newWidth, height: newHeight });
        // If mouse is up, remove event listeners
        if (!event.buttons) {
          return removeListeners();
        }
      };

      resizeCleanup.current = cleanup;
      window.addEventListener('mousemove', mouseMoveHandler);
      window.addEventListener('mouseup', removeListeners);
    }
  );

  const dragCornerButton = useCallback(
    (direction: string) => {
      if (isPlaceholderImage) {
        return null;
      }

      return (
        <div
          aria-hidden="true"
          onMouseDown={handleMouseDown}
          data-direction={direction}
          className="bg-primary"
          style={{
            position: 'absolute',
            height: '10px',
            width: '10px',
            ...{ n: { top: 0 }, s: { bottom: 0 } }[direction[0]],
            ...{ w: { left: 0 }, e: { right: 0 } }[direction[1]],
            cursor: `${direction}-resize`,
          }}
        />
      );
    },
    [handleMouseDown, isPlaceholderImage]
  );

  const {
    alignment = 'center',
    width,
    height,
    borderRadius,
  } = node.attrs || {};

  const attrs = Object.fromEntries(
    Object.entries(node.attrs || {}).filter(
      ([key]) => !NODE_ONLY_ATTRIBUTES.has(key)
    )
  );

  const hasImageSrc = !!src;
  const isDroppable =
    !!onImageUpload &&
    editor.isEditable &&
    !hasImageSrc &&
    !isSrcVariable &&
    (status === 'idle' || status === 'error');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isDroppable || !e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    e.target.value = '';
    // Picked files obey the host's types, as dropped files do.
    if (!allowedMimeTypes.includes(file.type)) return;
    await handleImageUpload(file);
  };

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!isDroppable || uploadLock.current) return;
      uploadLock.current = true;
      const generation = ++uploadGeneration.current;
      try {
        setStatus('loading');
        const imageUrl = await onImageUpload(file);
        let currentNode;
        if (!editor.isDestroyed) {
          try {
            const position = getPos();
            currentNode =
              typeof position === 'number'
                ? editor.state.doc.nodeAt(position)
                : null;
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
            setStatus('idle');
          await onImageUploadDiscard?.(imageUrl);
          return;
        }
        updateNodeViewAttributes(props, { src: imageUrl });
        setIsPlaceholderImage(false);
        setStatus('loaded');
      } catch (error) {
        console.error('Error uploading image:', error);
        if (generation === uploadGeneration.current) setStatus('error');
      } finally {
        // A replaced node already released the lock; a newer upload owns it.
        if (generation === uploadGeneration.current) uploadLock.current = false;
      }
    },
    [
      onImageUpload,
      setStatus,
      setIsPlaceholderImage,
      onImageUploadDiscard,
      props,
      isDroppable,
      editor,
      getPos,
      node,
    ]
  );

  // load the image using new Image() to avoid layout shift
  // Loading an image only reports its status. The document keeps the size the
  // user chose: `auto` renders at the image's own size in the editor and in
  // the email, so the saved width never depends on the editing device.
  useEffect(() => {
    if (!src || isSrcVariable) return;

    let active = true;
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (!active) return;
      let currentNode;
      if (!editor.isDestroyed) {
        try {
          const position = getPos();
          currentNode =
            typeof position === 'number'
              ? editor.state.doc.nodeAt(position)
              : null;
        } catch {
          /* Removed node views have no position. */
        }
      }
      if (currentNode === node) setStatus('loaded');
    };
    img.onerror = () => {
      if (active) setStatus('error');
    };

    return () => {
      active = false;
      img.src = '';
      img.onload = null;
      img.onerror = null;
    };
  }, [editor, getPos, node, src, isSrcVariable, setStatus]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!isDroppable) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(true);
    },
    [isDroppable]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!isDroppable) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);
    },
    [isDroppable]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      if (!isDroppable) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);
      const files = e.dataTransfer?.files;
      if (!files || files?.length === 0) {
        return;
      }

      const firstFile = files[0];
      if (!allowedMimeTypes.includes(firstFile.type)) {
        return;
      }

      await handleImageUpload(firstFile);
    },
    [handleImageUpload, isDroppable, allowedMimeTypes]
  );

  return (
    <NodeViewWrapper
      as="div"
      draggable={editor.isEditable}
      data-drag-handle={editor.isEditable}
      className={cn(
        "mly-image-drop-zone after:border-primary relative after:pointer-events-none after:absolute after:inset-0 after:rounded after:border-2 after:border-dashed after:opacity-0 after:transition-opacity after:duration-200 after:content-['']",
        isDraggingOver && 'mly-drag-over after:opacity-100'
      )}
      style={{
        ...(hasImageSrc && status === 'loaded'
          ? {
              width: width && width !== 'auto' ? `${width}px` : undefined,
              height: height && height !== 'auto' ? `${height}px` : undefined,
              ...resizingStyle,
            }
          : {}),
        overflow: 'hidden',
        position: 'relative',
        // Weird! Basically tiptap/prose wraps this in a span and the line height causes an annoying buffer.
        lineHeight: '0px',
        display: 'block',
        maxWidth: '100%',
        ...({
          center: { marginLeft: 'auto', marginRight: 'auto' },
          left: { marginRight: 'auto' },
          right: { marginLeft: 'auto' },
        }[alignment as string] || {}),
      }}
      ref={wrapperRef}
      {...(isDroppable
        ? {
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onDrop: handleDrop,
          }
        : {})}
    >
      {!hasImageSrc && status === 'idle' && (
        <ImageStatusLabel
          status="idle"
          minHeight={height}
          isDropZone={isDroppable}
        />
      )}

      {!hasImageSrc && status === 'loading' && !isSrcVariable && (
        <ImageStatusLabel status="loading" minHeight={height} />
      )}

      {hasImageSrc && isSrcVariable && (
        <ImageStatusLabel status="variable" minHeight={height} />
      )}

      {hasImageSrc && status === 'loading' && !isSrcVariable && (
        <ImageStatusLabel status="loading" minHeight={height} />
      )}
      {status === 'error' && !isSrcVariable && (
        <ImageStatusLabel status="error" minHeight={height} />
      )}

      {isDroppable && (
        /* shadcn-audit-ignore-next-line invisible native file input overlay */
        <input
          type="file"
          accept={allowedMimeTypes.join(',')}
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0"
          multiple={false}
          aria-label={t('imageStatus.dropImage')}
        />
      )}

      {hasImageSrc && status === 'loaded' && !isSrcVariable && (
        <>
          <img
            {...attrs}
            ref={imgRef}
            style={{
              ...resizingStyle,
              cursor: 'default',
              objectFit: 'fill',
              marginBottom: 0,
              borderRadius,
              width: resizingStyle?.width
                ? `${resizingStyle.width}px`
                : width && width !== 'auto'
                  ? `${width}px`
                  : 'auto',
              height: resizingStyle?.height
                ? `${resizingStyle.height}px`
                : height && height !== 'auto'
                  ? `${height}px`
                  : 'auto',
            }}
            draggable={editor.isEditable}
            className={cn(isPlaceholderImage && 'animate-pulse opacity-40')}
          />

          {selected && editor.isEditable && !isPlaceholderImage && (
            <>
              {/* Don't use a simple border as it pushes other content around. */}
              {[
                { left: 0, top: 0, height: '100%', width: '1px' },
                { right: 0, top: 0, height: '100%', width: '1px' },
                { top: 0, left: 0, width: '100%', height: '1px' },
                { bottom: 0, left: 0, width: '100%', height: '1px' },
              ].map((style, i) => (
                <div
                  key={i}
                  className="bg-primary"
                  style={{
                    position: 'absolute',
                    ...style,
                  }}
                />
              ))}
              {dragCornerButton('nw')}
              {dragCornerButton('ne')}
              {dragCornerButton('sw')}
              {dragCornerButton('se')}
            </>
          )}
        </>
      )}
    </NodeViewWrapper>
  );
}

type ImageStatusLabelProps = {
  status: ImageStatus | 'variable';
  minHeight?: number | string;
  isDropZone?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export function ImageStatusLabel(props: ImageStatusLabelProps) {
  const { t } = useMailyContext();
  const { status, minHeight, className, style, isDropZone, ...rest } = props;

  return (
    <div
      {...rest}
      className={cn(
        'bg-muted flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
        {
          'text-muted-foreground hover:bg-muted/60': status === 'loading',
          'text-destructive hover:bg-muted/60': status === 'error',
        },
        className
      )}
      style={{
        ...(minHeight
          ? {
              minHeight,
            }
          : {}),
        ...style,
      }}
    >
      {status === 'idle' && !isDropZone && (
        <>
          <ImageOffIcon className="size-4 stroke-[2.5]" />
          <span>{t('imageStatus.noImage')}</span>
        </>
      )}

      {status === 'idle' && isDropZone && (
        <>
          <GrabIcon className="size-4 stroke-[2.5]" />
          <span>{t('imageStatus.dropImage')}</span>
        </>
      )}

      {status === 'loading' && (
        <>
          <Loader2 className="size-4 animate-spin stroke-[2.5]" />
          <span>{t('imageStatus.loading')}</span>
        </>
      )}
      {status === 'error' && (
        <>
          <Ban className="size-4 stroke-[2.5]" />
          <span>{t('imageStatus.error')}</span>
        </>
      )}
      {status === 'variable' && (
        <>
          <BracesIcon className="size-4 stroke-[2.5]" />
          <span>{t('imageStatus.variable')}</span>
        </>
      )}
    </div>
  );
}
