import { LucideIcon } from "lucide-react"
import { useId } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { cn } from '@/lib/utils';
import { SVGIcon } from '../icons/grid-lines';
import { ChevronDownIcon } from "lucide-react"

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

  icon?: LucideIcon | SVGIcon;
  iconClassName?: string;

  placeholder?: string;
};

export function Select(props: SelectProps) {
  const {
    label,
    options,
    value,
    onValueChange,
    tooltip,
    className,
    icon: Icon,
    iconClassName,
    placeholder,
  } = props;

  const selectId = `mly${useId()}`;

  const content = (
    <div className="relative">
      <label htmlFor={selectId} className="sr-only">
        {label}
      </label>

      {Icon && (
        <div className="pointer-events-none absolute inset-y-0 left-2 z-20 flex items-center">
          <Icon className={cn('size-3', iconClassName)} />
        </div>
      )}

      <select
        id={selectId}
        className={cn(
          'bg-background text-foreground ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring active:bg-accent active:text-accent-foreground flex min-h-7 max-w-max appearance-none items-center rounded-md px-1.5 py-0.5 pr-7 text-sm transition-colors focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden',
          !!Icon && 'pl-7',
          className
        )}
        value={value || ''}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-0 z-10 flex h-full w-7 items-center justify-center peer-disabled:opacity-50">
        <ChevronDownIcon size={16} strokeWidth={2} aria-hidden="true" role="img" />
      </span>
    </div>
  );

  if (!tooltip) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent sideOffset={8}>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
