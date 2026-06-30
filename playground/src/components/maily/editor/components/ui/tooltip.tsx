'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

// Explicit type annotations to avoid TS2742 errors
const TooltipProvider: React.FC<
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>
> = TooltipPrimitive.Provider;

const Tooltip: React.FC<
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>
> = TooltipPrimitive.Root;

const TooltipTrigger: React.FC<
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
> = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'border-border bg-background animate-in fade-in-0 zoom-in-95 z-50 overflow-hidden rounded-md border px-2 py-1 text-xs',
      className
    )}
    {...props}
  />
)) as React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> &
    React.RefAttributes<React.ElementRef<typeof TooltipPrimitive.Content>>
>;

TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
