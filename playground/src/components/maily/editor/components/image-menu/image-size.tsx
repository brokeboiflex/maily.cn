import { AUTOCOMPLETE_PASSWORD_MANAGERS_OFF } from "../../utils/constants"
import { useMailyContext } from "../../provider"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type ImageSizeProps = {
  value: string
  onValueChange: (value: string) => void
  dimension: "width" | "height"
}

export function ImageSize(props: ImageSizeProps) {
  const { value, onValueChange, dimension } = props
  const { t } = useMailyContext()
  const label =
    dimension === "width" ? t("imageMenu.width") : t("imageMenu.height")

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex shrink-0">
          <InputGroup className="h-7 w-24">
            <InputGroupAddon className="pl-1.5 text-xs leading-none">
              {label}
            </InputGroupAddon>
            <InputGroupInput
              {...AUTOCOMPLETE_PASSWORD_MANAGERS_OFF}
              aria-label={label}
              className="h-full min-w-0 [appearance:textfield] appearance-none px-1 text-sm uppercase tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              type="number"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
            />
            <InputGroupAddon
              align="inline-end"
              className="pr-1.5 text-xs leading-none"
            >
              {t("imageMenu.unitPx")}
            </InputGroupAddon>
          </InputGroup>
        </span>
      </TooltipTrigger>
      <TooltipContent sideOffset={8}>{label}</TooltipContent>
    </Tooltip>
  )
}
