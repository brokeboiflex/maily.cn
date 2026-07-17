import * as React from 'react';

import { Input } from '@/editor/components/input';
import { cn } from '@/editor/utils/classname';

function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        'group/input-group border-input has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot=input-group-control]:focus-visible]:ring-3 relative flex h-8 w-full min-w-0 items-center rounded-lg border outline-none transition-colors',
        className
      )}
      {...props}
    />
  );
}

function InputGroupAddon({
  className,
  align = 'inline-start',
  ...props
}: React.ComponentProps<'div'> & {
  align?: 'inline-start' | 'inline-end';
}) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        'text-muted-foreground flex h-auto cursor-text select-none items-center justify-center gap-2 py-1.5 text-sm font-medium [&>svg:not([class*="size-"])]:size-4',
        align === 'inline-end' ? 'order-last pr-2' : 'order-first pl-2',
        className
      )}
      onClick={(event) => {
        event.currentTarget.parentElement?.querySelector('input')?.focus();
      }}
      {...props}
    />
  );
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        'flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent',
        className
      )}
      {...props}
    />
  );
}

export { InputGroup, InputGroupAddon, InputGroupInput };
