import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { cn } from '@/editor/utils/classname';
import {
  Select as SelectPrimitive,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select-primitive';

const EMPTY_SELECT_VALUE = '__maily-empty-value__';
const FLOATING_VIEWPORT_PADDING = 8;
const FLOATING_GAP = 4;
const SELECT_ITEM_ESTIMATED_HEIGHT = 28;
const SELECT_CONTENT_MAX_HEIGHT = 320;

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
  const triggerWrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [contentStyle, setContentStyle] = useState<CSSProperties>();

  const updateContentPosition = useCallback(() => {
    const trigger = triggerWrapperRef.current?.querySelector(
      '[data-slot="select-trigger"]'
    );
    const rect = trigger?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const estimatedContentHeight = Math.min(
      SELECT_CONTENT_MAX_HEIGHT,
      options.length * SELECT_ITEM_ESTIMATED_HEIGHT + FLOATING_VIEWPORT_PADDING
    );
    const availableBelow =
      window.innerHeight - rect.bottom - FLOATING_VIEWPORT_PADDING;
    const availableAbove = rect.top - FLOATING_VIEWPORT_PADDING;
    const placeAbove =
      availableBelow < estimatedContentHeight &&
      availableAbove > availableBelow;
    const maxHeight = Math.max(
      120,
      Math.min(
        SELECT_CONTENT_MAX_HEIGHT,
        (placeAbove ? availableAbove : availableBelow) - FLOATING_GAP
      )
    );
    const height = Math.min(estimatedContentHeight, maxHeight);

    setContentStyle({
      position: 'fixed',
      left: Math.min(
        Math.max(rect.left, FLOATING_VIEWPORT_PADDING),
        window.innerWidth - rect.width - FLOATING_VIEWPORT_PADDING
      ),
      top: placeAbove
        ? Math.max(FLOATING_VIEWPORT_PADDING, rect.top - height - FLOATING_GAP)
        : Math.min(
            rect.bottom + FLOATING_GAP,
            window.innerHeight - FLOATING_VIEWPORT_PADDING
          ),
      minWidth: rect.width,
      maxHeight,
    });
  }, [options.length]);

  useLayoutEffect(() => {
    if (!open) {
      setContentStyle(undefined);
      return;
    }

    updateContentPosition();
    window.addEventListener('resize', updateContentPosition);
    window.addEventListener('scroll', updateContentPosition, true);
    return () => {
      window.removeEventListener('resize', updateContentPosition);
      window.removeEventListener('scroll', updateContentPosition, true);
    };
  }, [open, updateContentPosition]);

  return (
    <div className="relative inline-flex" ref={triggerWrapperRef}>
      <label htmlFor={selectId} className="sr-only">
        {label}
      </label>

      <SelectPrimitive
        open={open}
        onOpenChange={setOpen}
        value={toPrimitiveValue(value || '')}
        onValueChange={(nextValue) => {
          onValueChange(fromPrimitiveValue(nextValue));
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
          position="popper"
          sideOffset={4}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            window.requestAnimationFrame(() => onCloseAutoFocus?.());
          }}
          style={contentStyle}
          className="min-w-(--radix-select-trigger-width) data-[side=bottom]:translate-y-0 data-[side=left]:translate-x-0 data-[side=right]:translate-x-0 data-[side=top]:translate-y-0"
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
