import { BubbleMenu } from '@tiptap/react';
import { sticky } from 'tippy.js';
import { TextBubbleContent } from '../text-menu/text-bubble-content';
import { type EditorBubbleMenuProps } from '../text-menu/text-bubble-menu';
import { TooltipProvider } from '../ui/tooltip';
import { FLOATING_BUBBLE_MENU_CLASS } from '../ui/floating-menu';

export function VariableBubbleMenu(props: EditorBubbleMenuProps) {
  const { editor, appendTo } = props;
  if (!editor) {
    return null;
  }

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    pluginKey: 'variable-menu',
    shouldShow: ({ editor }) => {
      return editor.isActive('variable') && !editor.storage.variable?.popover;
    },
    tippyOptions: {
      popperOptions: {
        modifiers: [{ name: 'flip', enabled: false }],
      },
      plugins: [sticky],
      sticky: 'popper',
      maxWidth: '100%',
      appendTo: () => appendTo?.current || 'parent',
      placement: 'top-start',
    },
  };

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      className={FLOATING_BUBBLE_MENU_CLASS}
    >
      <TooltipProvider>
        <TextBubbleContent showListMenu={false} editor={editor} />
      </TooltipProvider>
    </BubbleMenu>
  );
}
