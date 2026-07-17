import {
  type AllowedTextDirection,
  allowedTextDirection,
} from '../nodes/paragraph/paragraph';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { PilcrowLeft, PilcrowRight } from 'lucide-react';
import { useMailyContext } from '../provider';
import { Button } from './base-button';
import {
  ToggleGroupCompat,
  ToggleGroupCompatItem,
} from './ui/toggle-group-compat';

type TextDirectionSwitchProps = {
  direction: AllowedTextDirection;
  onDirectionChange: (direction: AllowedTextDirection) => void;
};

export function TextDirectionSwitch(props: TextDirectionSwitchProps) {
  const { direction: rawDirection, onDirectionChange } = props;
  const { t } = useMailyContext();
  const direction = allowedTextDirection.includes(
    rawDirection as AllowedTextDirection
  )
    ? rawDirection
    : 'ltr';

  const directions = {
    ltr: {
      icon: <PilcrowLeft className="size-3 stroke-[2.5]" />,
      tooltip: t('direction.ltr'),
    },
    rtl: {
      icon: <PilcrowRight className="size-3 stroke-[2.5]" />,
      tooltip: t('direction.rtl'),
    },
  };

  const activeDirection = directions[direction];

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex shrink-0">
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={t('direction.label')}
              >
                {activeDirection.icon}
              </Button>
            </PopoverTrigger>
          </span>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>{t('direction.label')}</TooltipContent>
      </Tooltip>
      <PopoverContent
        className="p-0.5! flex w-max gap-0.5 rounded-lg"
        side="top"
        sideOffset={8}
        align="center"
      >
        <ToggleGroupCompat
          selectionMode="single"
          value={direction}
          className="gap-0.5"
        >
          {Object.entries(directions).map(([key, value]) => {
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <span className="inline-flex shrink-0">
                    <ToggleGroupCompatItem
                      value={key}
                      pressed={key === direction}
                      onClick={() =>
                        onDirectionChange(key as AllowedTextDirection)
                      }
                      aria-label={value.tooltip}
                      className="size-7! min-w-7! px-2.5"
                      type="button"
                    >
                      {value.icon}
                    </ToggleGroupCompatItem>
                  </span>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>{value.tooltip}</TooltipContent>
              </Tooltip>
            );
          })}
        </ToggleGroupCompat>
      </PopoverContent>
    </Popover>
  );
}
