'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/lib/utils';

const Popover: React.FC<
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>
> = PopoverPrimitive.Root;

const PopoverTrigger: React.FC<
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
> = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    portal?: boolean;
  }
>(
  (
    { className, align = 'center', sideOffset = 4, portal = false, ...props },
    ref
  ) => {
    const content = (
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'border-border bg-background text-foreground z-9999 w-72 rounded-md border p-4 shadow-md outline-hidden',
          'mly-editor',
          className
        )}
        {...props}
      />
    );

    if (!portal) {
      return content;
    }

    return <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal>;
  }
);

PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
