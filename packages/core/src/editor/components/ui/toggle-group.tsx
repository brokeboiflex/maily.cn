import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from '@/editor/utils/classname';

type ToggleGroupProps = React.ComponentPropsWithoutRef<
  typeof ToggleGroupPrimitive.Root
> & {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  spacing?: number;
};

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  (
    { className, variant = 'default', size = 'default', spacing = 2, ...props },
    ref
  ) => (
    <ToggleGroupPrimitive.Root
      ref={ref}
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      style={{ '--gap': spacing } as React.CSSProperties}
      className={cn(
        'group/toggle-group flex w-fit items-center gap-[--spacing(var(--gap))] rounded-lg',
        className
      )}
      {...props}
    />
  )
);
ToggleGroup.displayName = 'ToggleGroup';

type ToggleGroupItemProps = React.ComponentPropsWithoutRef<
  typeof ToggleGroupPrimitive.Item
> & {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
};

const variantClasses = {
  default: 'bg-transparent',
  outline: 'border-input border bg-transparent',
};

const sizeClasses = {
  default: 'h-8 min-w-8 px-2.5',
  sm: 'h-7 min-w-7 px-2.5 text-[0.8rem]',
  lg: 'h-9 min-w-9 px-2.5',
};

const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  ToggleGroupItemProps
>(({ className, variant = 'default', size = 'default', ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    data-slot="toggle-group-item"
    className={cn(
      'hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 data-[state=on]:bg-muted focus-visible:ring-3 inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-transparent text-sm font-medium outline-none transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*="size-"])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0',
      variantClasses[variant],
      sizeClasses[size],
      className
    )}
    {...props}
  />
));
ToggleGroupItem.displayName = 'ToggleGroupItem';

export { ToggleGroup, ToggleGroupItem };
