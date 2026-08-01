import { IconPlaceholder } from "@/components/icon-placeholder"
import { useId, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ToggleGroupCompat,
  ToggleGroupCompatItem,
} from './toggle-group-compat';
import { BOTTOM_FLOATING_CONTENT_PROPS } from './floating-placement';
import { FLOATING_MENU_TRIGGER_CLASS } from './floating-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const EMPTY_SELECT_VALUE = '__maily-empty-value__';

type SelectProps = {
  label: string;
  options: {
    value: string;
    label: string;
  }[];

  value: string;
  onValueChange: (value: string) => void;

  tooltip?: string;
  className?: string;
  onCloseAutoFocus?: () => void;

  icon?: ReactNode;

  placeholder?: string;
};

function toPrimitiveValue(value: string) {
  return value === '' ? EMPTY_SELECT_VALUE : value;
}

function fromPrimitiveValue(value: string) {
  return value === EMPTY_SELECT_VALUE ? '' : value;
}

export function Select(props: SelectProps) {
  const {
    label,
    options,
    value,
    onValueChange,
    className,
    icon,
    placeholder,
    onCloseAutoFocus,
    tooltip,
  } = props;

  const selectId = `mly${useId()}`;

  return (
    <SelectControl
      selectId={selectId}
      label={label}
      options={options}
      value={value}
      onValueChange={onValueChange}
      className={className}
      icon={icon}
      placeholder={placeholder}
      onCloseAutoFocus={onCloseAutoFocus}
      tooltip={tooltip}
    />
  );
}

type SelectControlProps = SelectProps & {
  selectId: string;
};

function SelectControl({
  selectId,
  label,
  options,
  value,
  onValueChange,
  className,
  icon,
  placeholder,
  onCloseAutoFocus,
  tooltip,
}: SelectControlProps) {
  const [open, setOpen] = useState(false);
  const wasOpenRef = useRef(false);
  const selectedValue = toPrimitiveValue(value || '');
  const activeLabel =
    options.find((option) => option.value === (value || ''))?.label ||
    placeholder ||
    label;

  const handleOpenChange = (nextOpen: boolean) => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = nextOpen;
    setOpen(nextOpen);

    if (wasOpen && !nextOpen && onCloseAutoFocus) {
      window.requestAnimationFrame(onCloseAutoFocus);
    }
  };

  return (
    <div className="relative inline-flex">
      <label htmlFor={selectId} className="sr-only">
        {label}
      </label>

      <Popover open={open} onOpenChange={handleOpenChange}>
        {tooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex shrink-0">
                <PopoverTrigger asChild>
                  <Button
                    id={selectId}
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={label}
                    aria-expanded={open}
                    className={cn(
                      FLOATING_MENU_TRIGGER_CLASS,
                      'max-w-max',
                      className
                    )}
                  >
                    {icon && (
                      <span className="text-muted-foreground flex size-3 shrink-0 items-center justify-center [&_svg]:size-3">
                        {icon}
                      </span>
                    )}
                    <span className="truncate text-xs font-medium">
                      {activeLabel}
                    </span>
                    <IconPlaceholder
  lucide="ChevronDownIcon"
  tabler="IconChevronDown"
  hugeicons="ChevronDownIcon"
  phosphor="CaretDown"
  remixicon="RiArrowDownSLine"
  className="text-muted-foreground size-3 shrink-0"
/>
                  </Button>
                </PopoverTrigger>
              </span>
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>{tooltip}</TooltipContent>
          </Tooltip>
        ) : (
          <PopoverTrigger asChild>
            <Button
              id={selectId}
              type="button"
              variant="ghost"
              size="sm"
              aria-label={label}
              aria-expanded={open}
              className={cn(
                FLOATING_MENU_TRIGGER_CLASS,
                'max-w-max',
                className
              )}
            >
              {icon && (
                <span className="text-muted-foreground flex size-3 shrink-0 items-center justify-center [&_svg]:size-3">
                  {icon}
                </span>
              )}
              <span className="truncate text-xs font-medium">
                {activeLabel}
              </span>
              <IconPlaceholder
  lucide="ChevronDownIcon"
  tabler="IconChevronDown"
  hugeicons="ChevronDownIcon"
  phosphor="CaretDown"
  remixicon="RiArrowDownSLine"
  className="text-muted-foreground size-3 shrink-0"
/>
            </Button>
          </PopoverTrigger>
        )}
        <PopoverContent
          {...BOTTOM_FLOATING_CONTENT_PROPS}
          align="start"
          sideOffset={8}
          className="max-h-80 w-max max-w-[calc(100vw-1rem)] gap-0 overflow-y-auto p-1"
        >
          <ToggleGroupCompat
            selectionMode="single"
            value={selectedValue}
            className="flex-col items-stretch gap-0.5"
          >
            {options.map((option) => {
              const optionValue = toPrimitiveValue(option.value);

              return (
                <ToggleGroupCompatItem
                  key={optionValue}
                  value={optionValue}
                  pressed={selectedValue === optionValue}
                  onClick={() => {
                    onValueChange(fromPrimitiveValue(optionValue));
                    handleOpenChange(false);
                  }}
                  aria-label={option.label}
                  className="h-7! justify-start whitespace-nowrap px-2 text-sm"
                  type="button"
                >
                  {option.label}
                </ToggleGroupCompatItem>
              );
            })}
          </ToggleGroupCompat>
        </PopoverContent>
      </Popover>
    </div>
  );
}
