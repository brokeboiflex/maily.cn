import { AlignCenter, AlignLeft, AlignRight } from "lucide-react"
import { BubbleMenuButton } from './bubble-menu-button';
import { AllowedLogoAlignment, allowedLogoAlignment } from '../nodes/logo/logo';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useMailyContext } from '../provider';

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
      icon: AlignLeft,
      tooltip: t('alignment.left'),
      onClick: () => {
        onAlignmentChange('left');
      },
    },
    center: {
      icon: AlignCenter,
      tooltip: t('alignment.center'),
      onClick: () => {
        onAlignmentChange('center');
      },
    },
    right: {
      icon: AlignRight,
      tooltip: t('alignment.right'),
      onClick: () => {
        onAlignmentChange('right');
      },
    },
  };

  const activeAlignment = alignments[alignment];

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger
            className={cn(
              'data-[state=open]:bg-accent data-[state=open]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex size-7 items-center justify-center gap-1 rounded-md px-1.5 text-sm focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden'
            )}
          >
            <activeAlignment.icon className="h-3 w-3 stroke-[2.5]" />
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>{t('alignment.label')}</TooltipContent>
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
        {Object.entries(alignments).map(([key, value]) => {
          return (
            <BubbleMenuButton
              key={key}
              icon={value.icon}
              tooltip={value.tooltip}
              command={value.onClick}
              isActive={() => key === alignment}
            />
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
