import { IconPlaceholder } from "@/components/icon-placeholder"
import {
  type AllowedLogoAlignment,
  allowedLogoAlignment,
} from '../nodes/logo/logo';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMailyContext } from '../provider';
import { Button } from '@/components/ui/button';
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
      icon: <IconPlaceholder
  lucide="AlignLeft"
  tabler="IconAlignLeft"
  hugeicons="TextAlignLeftIcon"
  phosphor="TextAlignLeft"
  remixicon="RiAlignLeft"
  className="size-3 stroke-[2.5]"
/>,
      tooltip: t('alignment.left'),
    },
    center: {
      icon: <IconPlaceholder
  lucide="AlignCenter"
  tabler="IconAlignCenter"
  hugeicons="TextAlignCenterIcon"
  phosphor="TextAlignCenter"
  remixicon="RiAlignCenter"
  className="size-3 stroke-[2.5]"
/>,
      tooltip: t('alignment.center'),
    },
    right: {
      icon: <IconPlaceholder
  lucide="AlignRight"
  tabler="IconAlignRight"
  hugeicons="TextAlignRightIcon"
  phosphor="TextAlignRight"
  remixicon="RiAlignRight"
  className="size-3 stroke-[2.5]"
/>,
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
