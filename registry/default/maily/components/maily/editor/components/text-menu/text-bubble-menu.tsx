import { ColumnExtension } from '../../nodes/columns/column';
import { ColumnsExtension } from '../../nodes/columns/columns';
import { SectionExtension } from '../../nodes/section/section';
import { isCustomNodeSelected } from '../../utils/is-custom-node-selected';
import { isTextSelected } from '../../utils/is-text-selected';
import { BubbleMenu, type BubbleMenuProps } from '@tiptap/react/menus';
import { useEffect, useRef, type ReactNode } from 'react';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TextBubbleContent } from './text-bubble-content';
import { RepeatExtension } from '../../nodes/repeat/repeat';
import { TurnIntoBlock } from './turn-into-block';
import { useTurnIntoBlockOptions } from './use-turn-into-block-options';
import {
  FLOATING_BUBBLE_MENU_CLASS,
  useStableBubbleMenuProps,
} from '../ui/floating-menu';

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

export type EditorBubbleMenuProps = Omit<
  BubbleMenuProps,
  'appendTo' | 'children'
> & {
  appendTo?: React.RefObject<HTMLElement | null>;
};

export function TextBubbleMenu(props: EditorBubbleMenuProps) {
  const { editor, appendTo, ...menuProps } = props;
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
    options: {
      placement: 'top-start' as const,
      shift: {
        padding: 8,
      },
      flip: {
        fallbackPlacements: ['bottom-start', 'top-end', 'bottom-end'],
      },
    },
  });

  const turnIntoBlockOptions = useTurnIntoBlockOptions(editor);

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      data-maily-bubble-menu="text"
      className={FLOATING_BUBBLE_MENU_CLASS}
    >
      <TooltipProvider>
        <TurnIntoBlock options={turnIntoBlockOptions} />

        <Separator orientation="vertical" />

        <TextBubbleContent editor={editor} />
      </TooltipProvider>
    </BubbleMenu>
  );
}
