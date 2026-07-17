'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/editor/utils/classname';

// Explicit type annotations to avoid TS2742 errors
function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

const Tooltip: React.FC<
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>
> = (props) => <TooltipPrimitive.Root data-slot="tooltip" {...props} />;

const TooltipTrigger: React.FC<
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
> = (props) => (
  <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
);

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 0, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      data-slot="tooltip-content"
      sideOffset={sideOffset}
      className={cn(
        'bg-foreground text-background data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 origin-(--radix-tooltip-content-transform-origin) z-50 inline-flex w-fit max-w-xs items-center gap-1.5 rounded-md px-3 py-1.5 text-xs',
        className
      )}
      {...props}
    >
      {children}
      <TooltipPrimitive.Arrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
)) as React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> &
    React.RefAttributes<React.ElementRef<typeof TooltipPrimitive.Content>>
>;

TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
