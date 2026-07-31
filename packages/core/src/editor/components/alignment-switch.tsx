import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import {
  type AllowedLogoAlignment,
  allowedLogoAlignment,
} from '../nodes/logo/logo';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useMailyContext } from '../provider';
import { Button } from './base-button';
import {
  ToggleGroupCompat,
  ToggleGroupCompatItem,
} from './ui/toggle-group-compat';
import { BOTTOM_FLOATING_CONTENT_PROPS } from './ui/floating-placement';

type AlignmentSwitchProps = {
  alignment: AllowedLogoAlignment;
  onAlignmentChange: (alignment: AllowedLogoAlignment) => void;
};

export function AlignmentSwitch(props: AlignmentSwitchProps) {
  const { alignment: rawAlignment, onAlignmentChange } = props;
  const { t } = useMailyContext();
  const alignment = allowedLogoAlignment.includes(
    rawAlignment as AllowedLogoAlignment
  )
    ? rawAlignment
    : 'left';

  const alignments = {
    left: {
      icon: <AlignLeft className="size-3 stroke-[2.5]" />,
      tooltip: t('alignment.left'),
    },
    center: {
      icon: <AlignCenter className="size-3 stroke-[2.5]" />,
      tooltip: t('alignment.center'),
    },
    right: {
      icon: <AlignRight className="size-3 stroke-[2.5]" />,
      tooltip: t('alignment.right'),
    },
  };

  const activeAlignment = alignments[alignment];

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
                aria-label={t('alignment.label')}
              >
                {activeAlignment.icon}
              </Button>
            </PopoverTrigger>
          </span>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>{t('alignment.label')}</TooltipContent>
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
          {Object.entries(alignments).map(([key, value]) => {
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <span className="inline-flex shrink-0">
                    <ToggleGroupCompatItem
                      value={key}
                      pressed={key === alignment}
                      onClick={() =>
                        onAlignmentChange(key as AllowedLogoAlignment)
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
