import { IconPlaceholder } from "@/components/icon-placeholder"
import { BubbleMenu } from '@tiptap/react';
import { sticky } from 'tippy.js';
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
import { FLOATING_MENU_CLASS } from '../ui/floating-menu';

export function InlineImageBubbleMenu(props: EditorBubbleMenuProps) {
  const { editor, appendTo } = props;
  if (!editor) {
    return null;
  }

  const state = useInlineImageState(editor);
  const { t } = useMailyContext();

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    ...(appendTo ? { appendTo: appendTo.current } : {}),
    shouldShow: ({ editor }) => {
      if (!editor.isEditable) {
        return false;
      }

      return editor.isActive('inlineImage');
    },
    tippyOptions: {
      popperOptions: {
        modifiers: [{ name: 'flip', enabled: false }],
      },
      plugins: [sticky],
      sticky: 'popper',
      maxWidth: '100%',
    },
  };

  return (
    <BubbleMenu {...bubbleMenuProps} className={`${FLOATING_MENU_CLASS} flex`}>
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
