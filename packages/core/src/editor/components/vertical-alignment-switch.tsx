import {
  AlignVerticalDistributeCenter,
  AlignVerticalDistributeEnd,
  AlignVerticalDistributeStart,
} from 'lucide-react';
import { type AllowedColumnVerticalAlign } from '../nodes/columns/column';
import { useMailyContext } from '../provider';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './base-button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import {
  ToggleGroupCompat,
  ToggleGroupCompatItem,
} from './ui/toggle-group-compat';
import { BOTTOM_FLOATING_CONTENT_PROPS } from './ui/floating-placement';

type VerticalAlignmentSwitchProps = {
  alignment: AllowedColumnVerticalAlign;
  onAlignmentChange: (alignment: AllowedColumnVerticalAlign) => void;
};

export function VerticalAlignmentSwitch(props: VerticalAlignmentSwitchProps) {
  const { alignment = 'top', onAlignmentChange } = props;
  const { t } = useMailyContext();

  const activeAlignment = {
    top: {
      icon: <AlignVerticalDistributeStart />,
      tooltip: t('verticalAlignment.top'),
    },
    middle: {
      icon: <AlignVerticalDistributeCenter />,
      tooltip: t('verticalAlignment.center'),
    },
    bottom: {
      icon: <AlignVerticalDistributeEnd />,
      tooltip: t('verticalAlignment.bottom'),
    },
  }[alignment];

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
                aria-label={t('verticalAlignment.label')}
              >
                {activeAlignment.icon}
              </Button>
            </PopoverTrigger>
          </span>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>
          {t('verticalAlignment.label')}
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        {...BOTTOM_FLOATING_CONTENT_PROPS}
        className="p-0.5! flex w-max gap-0.5 rounded-lg"
        sideOffset={8}
        align="center"
      >
        <ToggleGroupCompat
          selectionMode="single"
          value={alignment}
          className="gap-0.5"
        >
          {Object.entries({
            top: {
              icon: <AlignVerticalDistributeStart />,
              label: t('verticalAlignment.top'),
            },
            middle: {
              icon: <AlignVerticalDistributeCenter />,
              label: t('verticalAlignment.center'),
            },
            bottom: {
              icon: <AlignVerticalDistributeEnd />,
              label: t('verticalAlignment.bottom'),
            },
          }).map(([value, option]) => (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <span className="inline-flex shrink-0">
                  <ToggleGroupCompatItem
                    value={value}
                    pressed={value === alignment}
                    onClick={() =>
                      onAlignmentChange(value as AllowedColumnVerticalAlign)
                    }
                    aria-label={option.label}
                    className="size-7! min-w-7! px-2.5 [&_svg]:size-3 [&_svg]:stroke-[2.5]"
                    type="button"
                  >
                    {option.icon}
                  </ToggleGroupCompatItem>
                </span>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>{option.label}</TooltipContent>
            </Tooltip>
          ))}
        </ToggleGroupCompat>
      </PopoverContent>
    </Popover>
  );
}
