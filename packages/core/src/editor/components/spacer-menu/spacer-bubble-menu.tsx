import { AdaptiveBubbleMenu as BubbleMenu } from '../adaptive-bubble-menu';

import { BubbleMenuButton } from '../bubble-menu-button';
import {
  type BubbleMenuItem,
  type EditorBubbleMenuProps,
} from '../text-menu/text-bubble-menu';
import { useSpacerState } from './use-spacer-state';
import { ShowPopover } from '../show-popover';
import { TooltipProvider } from '../ui/tooltip';
import { spacing } from '@/editor/utils/spacing';
import { useMemo } from 'react';
import {
  FLOATING_BUBBLE_MENU_CLASS,
  useStableBubbleMenuProps,
} from '../ui/floating-menu';

export function SpacerBubbleMenu(props: EditorBubbleMenuProps) {
  const { editor, appendTo, ...menuProps } = props;

  const items: BubbleMenuItem[] = useMemo(
    () =>
      spacing.map((space) => {
        const { value: height, short: name } = space;
        return {
          name,
          isActive: () => editor?.isActive('spacer', { height }),
          command: () => {
            editor?.chain().focus().setSpacerSize(height).run();
          },
        };
      }),
    [editor]
  );

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

      return editor.isActive('spacer');
    },
    options: {
      placement: 'top' as const,
    },
  });

  const state = useSpacerState(editor);

  return (
    <BubbleMenu {...bubbleMenuProps} className={FLOATING_BUBBLE_MENU_CLASS}>
      <TooltipProvider>
        {items.map((item, index) => (
          <BubbleMenuButton
            key={index}
            className="!h-7 w-7 shrink-0 p-0"
            iconClassName="w-3 h-3"
            nameClassName="text-xs"
            {...item}
          />
        ))}
        <ShowPopover
          showIfKey={state.currentShowIfKey}
          onShowIfKeyValueChange={(value) => {
            editor.commands.setSpacerShowIfKey(value);
          }}
          editor={editor}
        />
      </TooltipProvider>
    </BubbleMenu>
  );
}
