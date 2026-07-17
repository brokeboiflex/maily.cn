import {
  type AllowedTextDirection,
  allowedTextDirection,
} from '../nodes/paragraph/paragraph';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '../utils/classname';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Toggle } from './ui/toggle';
import { LtrIcon, RtlIcon } from './icons/text-direction-icon';
import { useMailyContext } from '../provider';

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
      icon: <LtrIcon className="size-3 stroke-[2.5]" />,
      tooltip: t('direction.ltr'),
    },
    rtl: {
      icon: <RtlIcon className="size-3 stroke-[2.5]" />,
      tooltip: t('direction.rtl'),
    },
  };

  const activeDirection = directions[direction];

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger
            className={cn(
              'data-[state=open]:bg-accent data-[state=open]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex size-7 items-center justify-center gap-1 rounded-md px-1.5 text-sm focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden'
            )}
          >
            {activeDirection.icon}
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>{t('direction.label')}</TooltipContent>
      </Tooltip>
      <PopoverContent
        className="flex w-max gap-0.5 rounded-lg p-0.5!"
        side="top"
        sideOffset={8}
        align="center"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <>
          {Object.entries(directions).map(([key, value]) => {
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={key === direction}
                    onPressedChange={() =>
                      onDirectionChange(key as AllowedTextDirection)
                    }
                    aria-label={value.tooltip}
                    className="size-7! min-w-7! px-2.5"
                  >
                    {value.icon}
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>{value.tooltip}</TooltipContent>
              </Tooltip>
            );
          })}
        </>
      </PopoverContent>
    </Popover>
  );
}
