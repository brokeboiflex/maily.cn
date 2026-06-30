import { LockOpenIcon } from "lucide-react"
import { BaseButton } from "../base-button"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { useMailyContext } from "../../provider"
import { LockIcon } from "lucide-react"

type LockAspectRatioButtonProps = {
  onClick: () => void
  isLocked: boolean
}

export function LockAspectRatioButton(props: LockAspectRatioButtonProps) {
  const { onClick, isLocked } = props
  const { t } = useMailyContext()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <BaseButton
          variant="ghost"
          size="sm"
          type="button"
          className="size-7"
          data-state={isLocked}
          onClick={onClick}
        >
          {isLocked ? (
            <LockIcon className="h-3 w-3 shrink-0 stroke-[2.5] text-foreground" />
          ) : (
            <LockOpenIcon className="h-3 w-3 shrink-0 stroke-[2.5] text-foreground" />
          )}
        </BaseButton>
      </TooltipTrigger>
      <TooltipContent sideOffset={8}>
        {isLocked
          ? t("imageMenu.lockAspectRatioUnlock")
          : t("imageMenu.lockAspectRatioLock")}
      </TooltipContent>
    </Tooltip>
  )
}
