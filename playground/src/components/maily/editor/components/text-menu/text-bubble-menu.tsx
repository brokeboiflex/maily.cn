import { ColumnExtension } from '../../nodes/columns/column';
import { ColumnsExtension } from '../../nodes/columns/columns';
import { SectionExtension } from '../../nodes/section/section';
import { isCustomNodeSelected } from '../../utils/is-custom-node-selected';
import { isTextSelected } from '../../utils/is-text-selected';
import { BubbleMenu, type BubbleMenuProps } from '@tiptap/react';
import type { ReactNode } from 'react';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TextBubbleContent } from './text-bubble-content';
import { RepeatExtension } from '../../nodes/repeat/repeat';
import { TurnIntoBlock } from './turn-into-block';
import { useTurnIntoBlockOptions } from './use-turn-into-block-options';

export interface BubbleMenuItem {
  name?: string;
  isActive?: () => boolean;
  command?: () => void;
  shouldShow?: () => boolean;
  icon?: ReactNode;
  className?: string;
  iconClassName?: string;
  nameClassName?: string;
  disbabled?: boolean;

  tooltip?: string;
}

export type EditorBubbleMenuProps = Omit<BubbleMenuProps, 'children'> & {
  appendTo?: React.RefObject<any>;
};

export function TextBubbleMenu(props: EditorBubbleMenuProps) {
  const { editor, appendTo } = props;

  if (!editor) {
    return null;
  }

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    ...(appendTo ? { appendTo: appendTo.current } : {}),
    pluginKey: 'text-menu',
    shouldShow: ({ editor, from, view }) => {
      if (!view || editor.view.dragging) {
        return false;
      }

      const domAtPos = view.domAtPos(from || 0).node as HTMLElement;
      const nodeDOM = view.nodeDOM(from || 0) as HTMLElement;
      const node = nodeDOM || domAtPos;

      if (isCustomNodeSelected(editor, node) || !editor.isEditable) {
        return false;
      }

      const nestedNodes = [
        RepeatExtension.name,
        SectionExtension.name,
        ColumnsExtension.name,
        ColumnExtension.name,
      ];

      const isNestedNodeSelected =
        nestedNodes.some((name) => editor.isActive(name)) &&
        node?.classList?.contains('ProseMirror-selectednode');
      return isTextSelected(editor) && !isNestedNodeSelected;
    },
    tippyOptions: {
      popperOptions: {
        placement: 'top-start',
        modifiers: [
          {
            name: 'preventOverflow',
            options: {
              boundary: 'viewport',
              padding: 8,
            },
          },
          {
            name: 'flip',
            options: {
              fallbackPlacements: ['bottom-start', 'top-end', 'bottom-end'],
            },
          },
        ],
      },
      maxWidth: '100%',
    },
  };

  const turnIntoBlockOptions = useTurnIntoBlockOptions(editor);

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      className="border-border bg-background flex gap-0.5 rounded-lg border p-0.5 shadow-md"
    >
      <TooltipProvider>
        <TurnIntoBlock options={turnIntoBlockOptions} />

        <Separator orientation="vertical" className="mx-0" />

        <TextBubbleContent editor={editor} />
      </TooltipProvider>
    </BubbleMenu>
  );
}
