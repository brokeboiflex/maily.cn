import * as React from 'react';
import { cn } from '@/editor/utils/classname';

type ToggleGroupContextValue = {
  type: 'single' | 'multiple';
  value: string | string[] | undefined;
  toggleItem: (itemValue: string) => void;
};

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(
  null
);

type ToggleGroupBaseProps = {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  children?: React.ReactNode;
};

type ToggleGroupProps =
  | (ToggleGroupBaseProps & {
      type: 'single';
      value?: string;
      onValueChange?: (value: string) => void;
    })
  | (ToggleGroupBaseProps & {
      type: 'multiple';
      value?: string[];
      onValueChange?: (value: string[]) => void;
    });

function ToggleGroup(props: ToggleGroupProps) {
  const toggleItem = React.useCallback(
    (itemValue: string) => {
      if (props.type === 'single') {
        const next = itemValue === props.value ? '' : itemValue;
        props.onValueChange?.(next);
        return;
      }

      const current = Array.isArray(props.value) ? props.value : [];
      const next = current.includes(itemValue)
        ? current.filter((entry) => entry !== itemValue)
        : [...current, itemValue];
      props.onValueChange?.(next);
    },
    [props]
  );

  return (
    <ToggleGroupContext.Provider
      value={{ type: props.type, value: props.value, toggleItem }}
    >
      <div
        role="group"
        className={cn(
          'flex items-center justify-center gap-0.5',
          props.className
        )}
      >
        {props.children}
      </div>
    </ToggleGroupContext.Provider>
  );
}

export interface ToggleGroupItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  ToggleGroupItemProps
>(({ value, className, onClick, children, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);
  const pressed =
    context?.type === 'multiple'
      ? Array.isArray(context.value) && context.value.includes(value)
      : context?.value === value;

  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={pressed}
      data-state={pressed ? 'on' : 'off'}
      onClick={(event) => {
        onClick?.(event);
        context?.toggleItem(value);
      }}
      className={cn(
        'ring-offset-background focus-visible:ring-ring data-[state=on]:bg-accent data-[state=on]:text-accent-foreground hover:bg-muted hover:text-muted-foreground inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
ToggleGroupItem.displayName = 'ToggleGroupItem';

export { ToggleGroup, ToggleGroupItem };
