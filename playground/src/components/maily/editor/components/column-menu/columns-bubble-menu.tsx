import { BubbleMenu } from "@tiptap/react/menus"
import { useCallback } from "react"
import { getRenderContainer } from "../../utils/get-render-container"
import { type EditorBubbleMenuProps } from "../text-menu/text-bubble-menu"
import { isTextSelected } from "../../utils/is-text-selected"
import { ColumnsBubbleMenuContent } from "./columns-bubble-menu-content"
import {
  FLOATING_BUBBLE_MENU_CLASS,
  useStableBubbleMenuProps,
} from "../ui/floating-menu"

export function ColumnsBubbleMenu(props: EditorBubbleMenuProps) {
  const { appendTo, editor, ...menuProps } = props
  if (!editor) {
    return null
  }

  const getReferenceClientRect = useCallback(() => {
    const renderContainer = getRenderContainer(editor!, "columns")
    const rect =
      renderContainer?.getBoundingClientRect() ||
      new DOMRect(-1000, -1000, 0, 0)

    return rect
  }, [editor])

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
      if (
        isTextSelected(editor) ||
        editor.isActive("section") ||
        editor.isActive("repeat") ||
        !editor.isEditable
      ) {
        return false
      }

      return editor.isActive("columns")
    },
    getReferencedVirtualElement: () => ({
      getBoundingClientRect: getReferenceClientRect,
    }),
    options: {
      placement: "top" as const,
      offset: 8,
      flip: false,
    },
    pluginKey: "columnsBubbleMenu",
  })

  return (
    <BubbleMenu {...bubbleMenuProps} className={FLOATING_BUBBLE_MENU_CLASS}>
      <ColumnsBubbleMenuContent editor={editor} />
    </BubbleMenu>
  )
}
