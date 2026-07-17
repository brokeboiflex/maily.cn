import { ChevronDownIcon, PilcrowIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import {
  type TurnIntoBlockCategory,
  type TurnIntoBlockOptions,
  type TurnIntoOptions,
} from './use-turn-into-block-options';
import { useMemo } from 'react';
import { Button } from '../base-button';
import { cn } from '@/editor/utils/classname';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useMailyContext } from '../../provider';

type TurnIntoBlockProps = {
  options: TurnIntoOptions;
};

const isOption = (
  option: TurnIntoOptions[number]
): option is TurnIntoBlockOptions => option.type === 'option';
const isCategory = (
  option: TurnIntoOptions[number]
): option is TurnIntoBlockCategory => option.type === 'category';

export function TurnIntoBlock(props: TurnIntoBlockProps) {
  const { options } = props;

  const { t } = useMailyContext();
  const activeItem = useMemo(
    () =>
      options.find((option) => option.type === 'option' && option.isActive()),
    [options]
  ) as TurnIntoBlockOptions | undefined;
  const activeIcon = activeItem?.icon ?? (
    <PilcrowIcon className="size-3 shrink-0 stroke-[2.5]" />
  );

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger
            className={cn(
              'data-[state=open]:bg-accent data-[state=open]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex aspect-square h-7 items-center justify-center gap-1 rounded-md px-1.5 text-sm focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden'
            )}
          >
            <span className="flex size-3 items-center justify-center [&_svg]:size-3 [&_svg]:shrink-0 [&_svg]:stroke-[2.5]">
              {activeIcon}
            </span>
            <ChevronDownIcon className="h-3 w-3 shrink-0 stroke-[2.5]" />
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>{t('turnInto.label')}</TooltipContent>
      </Tooltip>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        className="flex w-[160px] flex-col rounded-md p-1"
      >
        {options.map((option, index) => {
          if (isOption(option)) {
            return (
              <Button
                key={option.id}
                onClick={option.onClick}
                variant="ghost"
                className="text-foreground mb-0.5 h-auto justify-start gap-2 rounded! px-2 py-1 text-sm font-normal"
              >
                {option.icon}
                {option.label}
              </Button>
            );
          } else if (isCategory(option)) {
            return (
              <label
                key={option.id}
                className={cn(
                  'text-foreground/60 px-2 text-xs font-medium',
                  index === 0 ? 'mt-1 mb-2' : 'my-2'
                )}
              >
                {option.label}
              </label>
            );
          }
        })}
      </PopoverContent>
    </Popover>
  );
}
