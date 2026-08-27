import { BubbleMenu } from "@tiptap/react/menus"
import { TextBubbleContent } from "../text-menu/text-bubble-content"
import { type EditorBubbleMenuProps } from "../text-menu/text-bubble-menu"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  FLOATING_BUBBLE_MENU_CLASS,
  useStableBubbleMenuProps,
} from "../ui/floating-menu"

export function VariableBubbleMenu(props: EditorBubbleMenuProps) {
  const { editor, appendTo, ...menuProps } = props
  if (!editor) {
    return null
  }

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
    pluginKey: "variable-menu",
    shouldShow: ({ editor }) => {
      return editor.isActive("variable") && !editor.storage.variable?.popover
    },
    options: {
      placement: "top-start" as const,
      flip: false,
    },
  })

  return (
    <BubbleMenu {...bubbleMenuProps} className={FLOATING_BUBBLE_MENU_CLASS}>
      <TooltipProvider>
        <TextBubbleContent showListMenu={false} editor={editor} />
      </TooltipProvider>
    </BubbleMenu>
  )
}
