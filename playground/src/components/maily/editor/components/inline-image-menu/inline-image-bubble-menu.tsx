import { ImageDownIcon } from "lucide-react"
import { BubbleMenu } from '@tiptap/react';
import { sticky } from 'tippy.js';
import { ImageSize } from '../image-menu/image-size';
import { EditorBubbleMenuProps } from '../text-menu/text-bubble-menu';
import { TooltipProvider } from '../ui/tooltip';
import { useInlineImageState } from './use-inline-image-state';
import { LinkInputPopover } from '../ui/link-input-popover';
import { isTextSelected } from '../../utils/is-text-selected';
import {
  DEFAULT_INLINE_IMAGE_HEIGHT,
  DEFAULT_INLINE_IMAGE_WIDTH,
} from '../../nodes/inline-image/inline-image';
import { useMailyContext } from '../../provider';

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
    <BubbleMenu
      {...bubbleMenuProps}
      className="border-border bg-background flex rounded-lg border p-0.5 shadow-md"
    >
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
            icon={ImageDownIcon}
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
