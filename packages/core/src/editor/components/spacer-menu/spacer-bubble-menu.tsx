import { BubbleMenu } from '@tiptap/react';

import { BubbleMenuButton } from '../bubble-menu-button';
import {
  type BubbleMenuItem,
  type EditorBubbleMenuProps,
} from '../text-menu/text-bubble-menu';
import { Separator } from '../ui/divider';
import { useSpacerState } from './use-spacer-state';
import { ShowPopover } from '../show-popover';
import { TooltipProvider } from '../ui/tooltip';
import { spacing } from '@/editor/utils/spacing';
import { useMemo } from 'react';
import { FLOATING_MENU_CLASS } from '../ui/floating-menu';

export function SpacerBubbleMenu(props: EditorBubbleMenuProps) {
  const { editor, appendTo } = props;
  if (!editor) {
    return null;
  }

  const items: BubbleMenuItem[] = useMemo(
    () =>
      spacing.map((space) => {
        const { value: height, short: name } = space;
        return {
          name,
          isActive: () => editor?.isActive('spacer', { height }),
          command: () => {
            editor?.chain().focus().setSpacer({ height }).run();
          },
        };
      }),
    [editor]
  );

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    ...(appendTo ? { appendTo: appendTo.current } : {}),
    shouldShow: ({ editor }) => {
      if (!editor.isEditable) {
        return false;
      }

      return editor.isActive('spacer');
    },
    tippyOptions: {
      maxWidth: '100%',
      moveTransition: 'transform 0.15s ease-out',
    },
  };

  const state = useSpacerState(editor);

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      className={`${FLOATING_MENU_CLASS} flex gap-0.5`}
    >
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
        <Separator orientation="vertical" />
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
