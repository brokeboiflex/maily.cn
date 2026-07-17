import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../utils/classname';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?:
    | 'default'
    | 'xs'
    | 'sm'
    | 'lg'
    | 'icon'
    | 'icon-xs'
    | 'icon-sm'
    | 'icon-lg';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const baseClass =
      'group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4';
    const variantClasses = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/80',
      destructive:
        'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20',
      outline:
        'border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]',
      ghost:
        'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    };
    const sizeClasses = {
      default: 'h-8 gap-1.5 px-2.5',
      xs: 'h-6 gap-1 px-2 text-xs',
      sm: 'h-7 gap-1 px-2.5 text-[0.8rem]',
      lg: 'h-9 gap-1.5 px-2.5',
      icon: 'size-8',
      'icon-xs': 'size-6',
      'icon-sm': 'size-7',
      'icon-lg': 'size-9',
    };

    const classes = cn(
      baseClass,
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    return <Comp data-slot="button" className={classes} ref={ref} {...props} />;
  }
);

Button.displayName = 'Button';

export { Button };
