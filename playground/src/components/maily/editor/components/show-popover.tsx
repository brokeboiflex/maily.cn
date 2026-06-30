import { Editor } from "@tiptap/core"
import { memo, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { useVariableOptions } from "../utils/node-options"
import { processVariables } from "../utils/variable"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { InputAutocomplete } from "./ui/input-autocomplete"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import { useMailyContext } from "../provider"
import { Eye, InfoIcon } from "lucide-react"

type ShowPopoverProps = {
  showIfKey?: string
  onShowIfKeyValueChange?: (when: string) => void

  editor: Editor
}

function _ShowPopover(props: ShowPopoverProps) {
  const { showIfKey = "", onShowIfKeyValueChange, editor } = props
  const { t } = useMailyContext()

  const opts = useVariableOptions(editor)
  const variables = opts?.variables
  const renderVariable = opts?.renderVariable
  const [isUpdatingKey, setIsUpdatingKey] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const autoCompleteOptions = useMemo(() => {
    return processVariables(variables, {
      query: showIfKey || "",
      from: "bubble-variable",
      editor,
    }).map((variable) => variable.name)
  }, [variables, showIfKey, editor])

  const isValidWhenKey = showIfKey || autoCompleteOptions.includes(showIfKey)

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) {
          return
        }

        setIsUpdatingKey(false)
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger
            className={cn(
              "flex size-7 items-center justify-center gap-1 rounded-md px-1.5 text-sm hover:bg-accent hover:text-accent-foreground focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
              showIfKey &&
                "bg-rose-100 text-rose-800 hover:bg-rose-100 hover:text-rose-800 data-[state=open]:bg-rose-100 data-[state=open]:text-rose-800"
            )}
          >
            <Eye className="h-3 w-3 stroke-[2.5]" />
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>
          {t("showPopover.showConditionally")}
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        className="flex w-max rounded-lg p-0.5!"
        side="top"
        sideOffset={8}
        align="end"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
        }}
      >
        <div className="flex items-center gap-1.5 px-1.5 text-sm leading-none">
          {t("showPopover.showIf")}
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon
                className={cn("size-3 stroke-[2.5] text-muted-foreground")}
              />
            </TooltipTrigger>
            <TooltipContent
              sideOffset={14}
              className="max-w-[285px]"
              align="start"
            >
              {t("showPopover.showIfHint")}
            </TooltipContent>
          </Tooltip>
        </div>

        {!isUpdatingKey && (
          <button
            onClick={() => {
              setIsUpdatingKey(true)
              setTimeout(() => {
                inputRef.current?.focus()
              }, 0)
            }}
          >
            {renderVariable({
              variable: {
                name: showIfKey,
                valid: !!isValidWhenKey,
              },
              fallback: "",
              from: "bubble-variable",
              editor,
            })}
          </button>
        )}
        {isUpdatingKey && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setIsUpdatingKey(false)
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsUpdatingKey(false)
              }
            }}
          >
            <InputAutocomplete
              editor={editor}
              value={showIfKey || ""}
              onValueChange={(value) => {
                onShowIfKeyValueChange?.(value)
              }}
              onOutsideClick={() => {
                setIsUpdatingKey(false)
              }}
              onSelectOption={(value) => {
                onShowIfKeyValueChange?.(value)
                setIsUpdatingKey(false)
              }}
              autoCompleteOptions={autoCompleteOptions}
              ref={inputRef}
            />
          </form>
        )}
      </PopoverContent>
    </Popover>
  )
}

export const ShowPopover = memo(_ShowPopover)
