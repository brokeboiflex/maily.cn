import { useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/editor/utils/classname';
import {
  Select as SelectPrimitive,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select-primitive';

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
    />
  );
}

type SelectControlProps = Omit<SelectProps, 'tooltip'> & {
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
}: SelectControlProps) {
  const [open, setOpen] = useState(false);
  const wasOpenRef = useRef(false);

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

      <SelectPrimitive
        open={open}
        onOpenChange={handleOpenChange}
        value={toPrimitiveValue(value || '')}
        onValueChange={(nextValue) => {
          onValueChange(fromPrimitiveValue(nextValue ?? EMPTY_SELECT_VALUE));
        }}
      >
        <SelectTrigger
          id={selectId}
          size="sm"
          aria-label={label}
          className={cn(
            'max-w-max border-0 bg-transparent shadow-none',
            className
          )}
        >
          {icon && (
            <span className="text-muted-foreground flex size-3 shrink-0 items-center justify-center [&_svg]:size-3">
              {icon}
            </span>
          )}
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          align="start"
          sideOffset={4}
          className="max-h-80 min-w-36 data-[side=bottom]:translate-y-0 data-[side=left]:translate-x-0 data-[side=right]:translate-x-0 data-[side=top]:translate-y-0"
        >
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={toPrimitiveValue(option.value)}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectPrimitive>
    </div>
  );
}
