import * as React from 'react';
import { cn } from '@/editor/utils/classname';

export interface ToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

const toggleVariantClasses = {
  default: 'bg-transparent',
  outline:
    'border-input border bg-transparent hover:bg-accent hover:text-accent-foreground',
};

const toggleSizeClasses = {
  default: 'h-10 min-w-10 px-3',
  sm: 'h-9 min-w-9 px-2.5',
  lg: 'h-11 min-w-11 px-5',
};

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      pressed,
      onPressedChange,
      onClick,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={pressed}
        data-state={pressed ? 'on' : 'off'}
        onClick={(event) => {
          onClick?.(event);
          onPressedChange?.(!pressed);
        }}
        className={cn(
          'ring-offset-background focus-visible:ring-ring data-[state=on]:bg-accent data-[state=on]:text-accent-foreground hover:bg-muted hover:text-muted-foreground inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50',
          toggleVariantClasses[variant],
          toggleSizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Toggle.displayName = 'Toggle';

export { Toggle };
