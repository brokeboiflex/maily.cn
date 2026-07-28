import { ChevronDownIcon } from 'lucide-react';
import { Button } from '../base-button';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import {
  ToggleGroupCompat,
  ToggleGroupCompatItem,
} from '../ui/toggle-group-compat';
import { useMailyContext } from '../../provider';

const DEFAULT_FONT_SIZE_VALUE = '__maily-default-font-size__';

const FONT_SIZE_OPTIONS = [
  '',
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '24px',
  '30px',
  '36px',
] as const;

type FontSizePickerProps = {
  value: string;
  onValueChange: (value: string) => void;
};

function toToggleValue(value: string) {
  return value || DEFAULT_FONT_SIZE_VALUE;
}

function fromToggleValue(value: string) {
  return value === DEFAULT_FONT_SIZE_VALUE ? '' : value;
}

export function FontSizePicker(props: FontSizePickerProps) {
  const { t } = useMailyContext();
  const label = t('toolbar.fontSize');
  const activeLabel = props.value || t('fontSize.default');

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex shrink-0">
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-[5.5rem] justify-between px-2"
                aria-label={label}
              >
                <span className="truncate text-xs font-medium">
                  {activeLabel}
                </span>
                <ChevronDownIcon className="text-muted-foreground size-3 shrink-0" />
              </Button>
            </PopoverTrigger>
          </span>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>{label}</TooltipContent>
      </Tooltip>

      <PopoverContent
        className="w-[6.25rem] gap-0 p-1"
        side="top"
        sideOffset={8}
        align="start"
      >
        <ToggleGroupCompat
          selectionMode="single"
          value={toToggleValue(props.value)}
          className="flex-col items-stretch gap-0.5"
        >
          {FONT_SIZE_OPTIONS.map((size) => {
            const optionLabel = size || t('fontSize.default');
            const toggleValue = toToggleValue(size);

            return (
              <ToggleGroupCompatItem
                key={toggleValue}
                value={toggleValue}
                pressed={props.value === size}
                onClick={() =>
                  props.onValueChange(fromToggleValue(toggleValue))
                }
                aria-label={optionLabel}
                className="h-7! justify-start px-2 text-sm"
                type="button"
              >
                {optionLabel}
              </ToggleGroupCompatItem>
            );
          })}
        </ToggleGroupCompat>
      </PopoverContent>
    </Popover>
  );
}
