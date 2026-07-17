import { BubbleMenu } from '@tiptap/react';
import { useCallback } from 'react';
import { getRenderContainer } from '../../utils/get-render-container';
import { sticky } from 'tippy.js';
import { type EditorBubbleMenuProps } from '../text-menu/text-bubble-menu';
import { isTextSelected } from '@/editor/utils/is-text-selected';
import { ColumnsBubbleMenuContent } from './columns-bubble-menu-content';

export function ColumnsBubbleMenu(props: EditorBubbleMenuProps) {
  const { appendTo, editor } = props;
  if (!editor) {
    return null;
  }

  const getReferenceClientRect = useCallback(() => {
    const renderContainer = getRenderContainer(editor!, 'columns');
    const rect =
      renderContainer?.getBoundingClientRect() ||
      new DOMRect(-1000, -1000, 0, 0);

    return rect;
  }, [editor]);

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    ...(appendTo ? { appendTo: appendTo.current } : {}),
    shouldShow: ({ editor }) => {
      if (
        isTextSelected(editor) ||
        editor.isActive('section') ||
        editor.isActive('repeat') ||
        !editor.isEditable
      ) {
        return false;
      }

      return editor.isActive('columns');
    },
    tippyOptions: {
      offset: [0, 8],
      popperOptions: {
        modifiers: [{ name: 'flip', enabled: false }],
      },
      getReferenceClientRect,
      appendTo: () => appendTo?.current,
      plugins: [sticky],
      sticky: 'popper',
      maxWidth: 'auto',
    },
    pluginKey: 'columnsBubbleMenu',
  };

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      className="border-border bg-background rounded-lg border p-0.5 shadow-md"
    >
      <ColumnsBubbleMenuContent editor={editor} />
    </BubbleMenu>
  );
}
