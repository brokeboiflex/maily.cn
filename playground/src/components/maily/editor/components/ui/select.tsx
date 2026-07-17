import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

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

  icon?: ReactNode;

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
    icon,
    placeholder,
  } = props;

  const selectId = `mly${useId()}`;

  if (!tooltip) {
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
      />
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SelectControl
          selectId={selectId}
          label={label}
          options={options}
          value={value}
          onValueChange={onValueChange}
          className={className}
          icon={icon}
          placeholder={placeholder}
        />
      </TooltipTrigger>
      <TooltipContent sideOffset={8}>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

type SelectControlProps = Omit<SelectProps, 'tooltip'> & {
  selectId: string;
} & Omit<ComponentPropsWithoutRef<'div'>, 'onChange'>;

const SelectControl = forwardRef<HTMLDivElement, SelectControlProps>(
  (
    {
      selectId,
      label,
      options,
      value,
      onValueChange,
      className,
      icon,
      placeholder,
      ...triggerProps
    },
    ref
  ) => (
    <div ref={ref} className="relative" {...triggerProps}>
      <label htmlFor={selectId} className="sr-only">
        {label}
      </label>

      {icon && (
        <div className="pointer-events-none absolute inset-y-0 left-2 z-20 flex items-center [&_svg]:size-3">
          {icon}
        </div>
      )}

      <NativeSelect
        id={selectId}
        size="sm"
        className={cn(
          'max-w-max [&_[data-slot=native-select]]:border-0 [&_[data-slot=native-select]]:bg-transparent [&_[data-slot=native-select]]:shadow-none',
          !!icon && '[&_[data-slot=native-select]]:pl-7',
          className
        )}
        value={value || ''}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {placeholder && (
          <NativeSelectOption value="" disabled hidden>
            {placeholder}
          </NativeSelectOption>
        )}

        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
);

SelectControl.displayName = 'SelectControl';
