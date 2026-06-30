import { BubbleMenuButton } from './bubble-menu-button';
import {
  AllowedTextDirection,
  allowedTextDirection,
} from '../nodes/paragraph/paragraph';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
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
      icon: LtrIcon,
      tooltip: t('direction.ltr'),
      onClick: () => {
        onDirectionChange('ltr');
      },
    },
    rtl: {
      icon: RtlIcon,
      tooltip: t('direction.rtl'),
      onClick: () => {
        onDirectionChange('rtl');
      },
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
            <activeDirection.icon className="h-3 w-3 stroke-[2.5]" />
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
        {Object.entries(directions).map(([key, value]) => {
          return (
            <BubbleMenuButton
              key={key}
              icon={value.icon}
              tooltip={value.tooltip}
              command={value.onClick}
              isActive={() => key === direction}
            />
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
