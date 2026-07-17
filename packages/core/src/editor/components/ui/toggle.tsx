import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cn } from '@/editor/utils/classname';

export interface ToggleProps
  extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

const toggleVariantClasses = {
  default: 'bg-transparent',
  outline: 'border-input hover:bg-muted border bg-transparent',
};

const toggleSizeClasses = {
  default: 'h-8 min-w-8 px-2.5',
  sm: 'h-7 min-w-7 px-2.5 text-[0.8rem]',
  lg: 'h-9 min-w-9 px-2.5',
};

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <TogglePrimitive.Root
        ref={ref}
        data-slot="toggle"
        className={cn(
          'hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-pressed:bg-muted data-[state=on]:bg-muted inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-transparent text-sm font-medium outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*="size-"])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0',
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
