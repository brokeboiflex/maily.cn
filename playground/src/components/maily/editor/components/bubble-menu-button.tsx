import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { BubbleMenuItem } from "./text-menu/text-bubble-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

export function BubbleMenuButton(item: BubbleMenuItem) {
  const { tooltip } = item

  const content = (
    <Button
      variant="ghost"
      size="sm"
      {...(item.command ? { onClick: item.command } : {})}
      className={cn(
        "size-7! px-2.5 disabled:cursor-not-allowed",
        item?.className
      )}
      type="button"
      disabled={item.disbabled}
    >
      {item.icon ? (
        <item.icon
          className={cn("h-3 w-3 shrink-0 stroke-[2.5]", item?.iconClassName)}
        />
      ) : (
        <span
          className={cn(
            "text-sm font-medium text-muted-foreground",
            item?.nameClassName
          )}
        >
          {item.name}
        </span>
      )}
    </Button>
  )

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent sideOffset={8}>{tooltip}</TooltipContent>
      </Tooltip>
    )
  }

  return content
}
