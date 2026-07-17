import { ChevronDownIcon, PilcrowIcon } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

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
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex shrink-0">
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-7! gap-1 px-1.5"
                aria-label={t('turnInto.label')}
              >
                <span className="flex size-3 items-center justify-center [&_svg]:size-3 [&_svg]:shrink-0 [&_svg]:stroke-[2.5]">
                  {activeIcon}
                </span>
                <ChevronDownIcon className="size-3 shrink-0 stroke-[2.5]" />
              </Button>
            </DropdownMenuTrigger>
          </span>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>{t('turnInto.label')}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="start"
        side="bottom"
        sideOffset={8}
        className="w-max min-w-40 max-w-[calc(100vw-1rem)]"
      >
        {options.map((option, index) => {
          if (isOption(option)) {
            return (
              <DropdownMenuItem key={option.id} onSelect={option.onClick}>
                {option.icon}
                {option.label}
              </DropdownMenuItem>
            );
          } else if (isCategory(option)) {
            return (
              <DropdownMenuLabel
                key={option.id}
                className={cn(index === 0 ? undefined : 'mt-1')}
              >
                {option.label}
              </DropdownMenuLabel>
            );
          }
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
