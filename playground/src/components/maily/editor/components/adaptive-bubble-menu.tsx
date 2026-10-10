import { BubbleMenu, type BubbleMenuProps } from "@tiptap/react/menus"
import { useEditorState } from "@tiptap/react"
import { createPortal } from "react-dom"
import { useMobileEditor } from "./mobile-editor-context"

/** Node settings use the same controls in the mobile panel and desktop bubble. */
export function AdaptiveBubbleMenu(props: BubbleMenuProps) {
  const { compact, nodeTarget } = useMobileEditor()
  const state = useEditorState({
    editor: props.editor ?? null,
    selector: ({ editor }) => editor?.state,
  })
  if (!compact) return <BubbleMenu {...props} />
  const editor = props.editor
  if (!nodeTarget || !editor || !state || !editor.isEditable) return null
  const visible = props.shouldShow?.({
    editor,
    view: editor.view,
    state,
    oldState: state,
    from: state.selection.from,
    to: state.selection.to,
    element: nodeTarget,
  })
  return visible
    ? createPortal(
        <div className="flex min-w-0 flex-wrap items-center gap-2 border-b pb-4 [&>div]:flex-wrap">
          {props.children}
        </div>,
        nodeTarget
      )
    : null
}
