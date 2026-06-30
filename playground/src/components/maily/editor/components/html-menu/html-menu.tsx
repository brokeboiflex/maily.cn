import { cn } from "@/lib/utils"
import { BubbleMenu } from "@tiptap/react"
import { useCallback } from "react"
import { sticky } from "tippy.js"
import { getRenderContainer } from "../../utils/get-render-container"
import { ShowPopover } from "../show-popover"
import { EditorBubbleMenuProps } from "../text-menu/text-bubble-menu"
import { Divider } from "../ui/divider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"
import { useHtmlState } from "./use-html-state"
import { useMailyContext } from "../../provider"
import { CodeXmlIcon, ViewIcon } from "lucide-react"

export function HTMLBubbleMenu(props: EditorBubbleMenuProps) {
  const { appendTo, editor } = props
  if (!editor) {
    return null
  }

  const state = useHtmlState(editor)
  const { t } = useMailyContext()

  const getReferenceClientRect = useCallback(() => {
    const renderContainer = getRenderContainer(editor!, "htmlCodeBlock")
    const rect =
      renderContainer?.getBoundingClientRect() ||
      new DOMRect(-1000, -1000, 0, 0)

    return rect
  }, [editor])

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    ...(appendTo ? { appendTo: appendTo.current } : {}),
    shouldShow: ({ editor }) => {
      return editor.isActive("htmlCodeBlock")
    },
    tippyOptions: {
      offset: [0, 8],
      popperOptions: {
        modifiers: [{ name: "flip", enabled: false }],
      },
      getReferenceClientRect,
      appendTo: () => appendTo?.current,
      plugins: [sticky],
      sticky: "popper",
      maxWidth: "auto",
    },
    pluginKey: "htmlCodeBlockBubbleMenu",
  }

  const { activeTab = "code" } = state

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      className="flex items-stretch rounded-lg border border-border bg-background p-0.5 shadow-md"
    >
      <TooltipProvider>
        <div className="flex h-7 items-center rounded-md bg-muted px-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden",
                  activeTab === "code" && "bg-background"
                )}
                disabled={activeTab === "code"}
                onClick={() => {
                  editor?.commands?.updateHtmlCodeBlock({
                    activeTab: "code",
                  })
                }}
              >
                <CodeXmlIcon className="size-3 shrink-0 stroke-[2.5]" />
              </button>
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>
              {t("htmlMenu.htmlCode")}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden",
                  activeTab === "preview" && "bg-background"
                )}
                disabled={activeTab === "preview"}
                onClick={() => {
                  editor?.commands?.updateHtmlCodeBlock({
                    activeTab: "preview",
                  })
                }}
              >
                <ViewIcon className="size-3 shrink-0 stroke-[2.5]" />
              </button>
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>
              {t("htmlMenu.preview")}
            </TooltipContent>
          </Tooltip>
        </div>
        <Divider />
        <ShowPopover
          showIfKey={state.currentShowIfKey}
          onShowIfKeyValueChange={(value) => {
            editor.commands.updateHtmlCodeBlock({
              showIfKey: value,
            })
          }}
          editor={editor}
        />
      </TooltipProvider>
    </BubbleMenu>
  )
}
