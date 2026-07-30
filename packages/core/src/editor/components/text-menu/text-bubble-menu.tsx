import { ColumnExtension } from '@/editor/nodes/columns/column';
import { ColumnsExtension } from '@/editor/nodes/columns/columns';
import { SectionExtension } from '@/editor/nodes/section/section';
import { isCustomNodeSelected } from '@/editor/utils/is-custom-node-selected';
import { isTextSelected } from '@/editor/utils/is-text-selected';
import { BubbleMenu, type BubbleMenuProps } from '@tiptap/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { Separator } from '../ui/divider';
import { TooltipProvider } from '../ui/tooltip';
import { TextBubbleContent } from './text-bubble-content';
import { RepeatExtension } from '@/editor/nodes/repeat/repeat';
import { TurnIntoBlock } from './turn-into-block';
import { useTurnIntoBlockOptions } from './use-turn-into-block-options';
import { FLOATING_MENU_CLASS } from '../ui/floating-menu';

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
  const isPointerSelectingRef = useRef(false);

  if (!editor) {
    return null;
  }

  const activeEditor = editor;

  useEffect(() => {
    const editorElement = activeEditor.view.dom;
    const ownerDocument = editorElement.ownerDocument;

    function handlePointerDown(event: PointerEvent | MouseEvent) {
      if (
        event.button === 0 &&
        event.target instanceof Node &&
        editorElement.contains(event.target)
      ) {
        isPointerSelectingRef.current = true;
      }
    }

    function handlePointerDone() {
      const wasPointerSelecting = isPointerSelectingRef.current;

      isPointerSelectingRef.current = false;

      if (wasPointerSelecting) {
        requestAnimationFrame(() => {
          if (!activeEditor.isDestroyed) {
            const { selection } = activeEditor.state;
            activeEditor.view.dispatch(
              activeEditor.state.tr
                .setSelection(selection)
                .setMeta('mailyPointerSelectionDone', true)
            );
          }
        });
      }
    }

    editorElement.addEventListener('pointerdown', handlePointerDown);
    editorElement.addEventListener('mousedown', handlePointerDown);
    ownerDocument.addEventListener('pointerup', handlePointerDone);
    ownerDocument.addEventListener('mouseup', handlePointerDone);
    ownerDocument.addEventListener('pointercancel', handlePointerDone);

    return () => {
      editorElement.removeEventListener('pointerdown', handlePointerDown);
      editorElement.removeEventListener('mousedown', handlePointerDown);
      ownerDocument.removeEventListener('pointerup', handlePointerDone);
      ownerDocument.removeEventListener('mouseup', handlePointerDone);
      ownerDocument.removeEventListener('pointercancel', handlePointerDone);
    };
  }, [activeEditor]);

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    ...(appendTo ? { appendTo: appendTo.current } : {}),
    pluginKey: 'text-menu',
    shouldShow: ({ editor, from, view }) => {
      if (!view || editor.view.dragging || isPointerSelectingRef.current) {
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
      className={`${FLOATING_MENU_CLASS} flex gap-0.5`}
    >
      <TooltipProvider>
        <TurnIntoBlock options={turnIntoBlockOptions} />

        <Separator orientation="vertical" className="mx-0" />

        <TextBubbleContent editor={editor} />
      </TooltipProvider>
    </BubbleMenu>
  );
}
