import { PilcrowIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "../popover"
import {
  TurnIntoBlockCategory,
  TurnIntoBlockOptions,
  TurnIntoOptions,
} from "./use-turn-into-block-options"
import { useMemo } from "react"
import { BaseButton } from "../base-button"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { useMailyContext } from "../../provider"
import { ChevronDownIcon } from "lucide-react"

type TurnIntoBlockProps = {
  options: TurnIntoOptions
}

const isOption = (
  option: TurnIntoOptions[number]
): option is TurnIntoBlockOptions => option.type === "option"
const isCategory = (
  option: TurnIntoOptions[number]
): option is TurnIntoBlockCategory => option.type === "category"

export function TurnIntoBlock(props: TurnIntoBlockProps) {
  const { options } = props

  const { t } = useMailyContext()
  const activeItem = useMemo(
    () =>
      options.find((option) => option.type === "option" && option.isActive()),
    [options]
  ) as TurnIntoBlockOptions | undefined
  const { icon: ActiveIcon = PilcrowIcon } = activeItem || {}

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger
            className={cn(
              "flex aspect-square h-7 items-center justify-center gap-1 rounded-md px-1.5 text-sm hover:bg-accent hover:text-accent-foreground focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
            )}
          >
            <ActiveIcon className="h-3 w-3 shrink-0 stroke-[2.5]" />
            <ChevronDownIcon className="h-3 w-3 shrink-0 stroke-[2.5]" />
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>{t("turnInto.label")}</TooltipContent>
      </Tooltip>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        className="flex w-[160px] flex-col rounded-md p-1"
      >
        {options.map((option, index) => {
          if (isOption(option)) {
            return (
              <BaseButton
                key={option.id}
                onClick={option.onClick}
                variant="ghost"
                className="mb-0.5 h-auto justify-start gap-2 rounded! px-2 py-1 text-left text-sm font-normal text-foreground"
              >
                <option.icon className="size-[15px] shrink-0" />
                {option.label}
              </BaseButton>
            )
          } else if (isCategory(option)) {
            return (
              <label
                key={option.id}
                className={cn(
                  "px-2 text-xs font-medium text-foreground/60",
                  index === 0 ? "mt-1 mb-2" : "my-2"
                )}
              >
                {option.label}
              </label>
            )
          }
        })}
      </PopoverContent>
    </Popover>
  )
}
