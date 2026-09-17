import { IconPlaceholder } from "@/components/icon-placeholder"
import { BubbleMenu } from '@tiptap/react/menus';
import { ImageSize } from '../image-menu/image-size';
import { type EditorBubbleMenuProps } from '../text-menu/text-bubble-menu';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useInlineImageState } from './use-inline-image-state';
import { LinkInputPopover } from '../ui/link-input-popover';
import {
  DEFAULT_INLINE_IMAGE_HEIGHT,
  DEFAULT_INLINE_IMAGE_WIDTH,
} from '../../nodes/inline-image/inline-image';
import { useMailyContext } from '../../provider';
import {
  FLOATING_BUBBLE_MENU_CLASS,
  useStableBubbleMenuProps,
} from '../ui/floating-menu';

export function InlineImageBubbleMenu(props: EditorBubbleMenuProps) {
  const { editor, appendTo, ...menuProps } = props;
  if (!editor) {
    return null;
  }

  const state = useInlineImageState(editor);
  const { t } = useMailyContext();

  const bubbleMenuProps = useStableBubbleMenuProps({
    ...menuProps,
    editor,
    ...(appendTo
      ? {
          appendTo: () =>
            appendTo.current ??
            editor.view.dom.parentElement ??
            editor.view.dom,
        }
      : {}),
    shouldShow: ({ editor }) => {
      if (!editor.isEditable) {
        return false;
      }

      return editor.isActive('inlineImage');
    },
    options: {
      placement: 'top' as const,
      flip: false,
    },
  });

  return (
    <BubbleMenu {...bubbleMenuProps} className={FLOATING_BUBBLE_MENU_CLASS}>
      <TooltipProvider>
        <div className="flex gap-x-0.5">
          <LinkInputPopover
            defaultValue={state?.src ?? ''}
            onValueChange={(value, isVariable) => {
              editor
                ?.chain()
                .updateAttributes('inlineImage', {
                  src: value,
                  isSrcVariable: isVariable ?? false,
                })
                .run();
            }}
            tooltip={t('inlineImageMenu.sourceUrl')}
            icon={<IconPlaceholder
  lucide="ImageDownIcon"
  tabler="IconPhotoDown"
  hugeicons="ImageDownloadIcon"
  phosphor="Image"
  remixicon="RiImageDownloadLine"
/>}
            editor={editor}
            isVariable={state.isSrcVariable}
          />

          <LinkInputPopover
            defaultValue={state?.imageExternalLink ?? ''}
            onValueChange={(value, isVariable) => {
              editor
                ?.chain()
                .updateAttributes('inlineImage', {
                  externalLink: value,
                  isExternalLinkVariable: isVariable ?? false,
                })
                .run();
            }}
            tooltip={t('inlineImageMenu.externalUrl')}
            editor={editor}
            isVariable={state.isExternalLinkVariable}
          />

          <ImageSize
            dimension="height"
            value={state?.height}
            onValueChange={(value) => {
              editor
                ?.chain()
                .updateAttributes('inlineImage', {
                  width: value || DEFAULT_INLINE_IMAGE_WIDTH,
                  height: value || DEFAULT_INLINE_IMAGE_HEIGHT,
                })
                .run();
            }}
          />
        </div>
      </TooltipProvider>
    </BubbleMenu>
  );
}
