import { BubbleMenu } from '@tiptap/react';
import { sticky } from 'tippy.js';
import { TextBubbleContent } from '../text-menu/text-bubble-content';
import { type EditorBubbleMenuProps } from '../text-menu/text-bubble-menu';
import { TooltipProvider } from '../ui/tooltip';

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
      className="border-border bg-background flex gap-0.5 rounded-lg border p-0.5 shadow-md"
    >
      <TooltipProvider>
        <TextBubbleContent showListMenu={false} editor={editor} />
      </TooltipProvider>
    </BubbleMenu>
  );
}
