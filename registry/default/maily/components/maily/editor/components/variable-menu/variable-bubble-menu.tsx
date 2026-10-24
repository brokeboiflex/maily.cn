import { AdaptiveBubbleMenu as BubbleMenu } from '../adaptive-bubble-menu';
import { TextBubbleContent } from '../text-menu/text-bubble-content';
import { type EditorBubbleMenuProps } from '../text-menu/text-bubble-menu';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  FLOATING_BUBBLE_MENU_CLASS,
  useStableBubbleMenuProps,
} from '../ui/floating-menu';

export function VariableBubbleMenu(props: EditorBubbleMenuProps) {
  const { editor, appendTo, ...menuProps } = props;

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
    pluginKey: 'variable-menu',
    shouldShow: ({ editor }) => {
      // A custom shouldShow replaces TipTap's, which checked editability.
      return (
        editor.isEditable &&
        editor.isActive('variable') &&
        !editor.storage.variable?.popover
      );
    },
    options: {
      placement: 'top-start' as const,
      flip: false,
    },
  });

  return (
    <BubbleMenu {...bubbleMenuProps} className={FLOATING_BUBBLE_MENU_CLASS}>
      <TooltipProvider>
        <TextBubbleContent showListMenu={false} editor={editor} />
      </TooltipProvider>
    </BubbleMenu>
  );
}
