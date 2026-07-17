import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type BubbleMenuItem } from './text-menu/text-bubble-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { Toggle } from '@/components/ui/toggle';

export function BubbleMenuButton(item: BubbleMenuItem) {
  const { tooltip } = item;

  if (!tooltip) {
    return <BubbleMenuButtonControl item={item} />;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex shrink-0">
          <BubbleMenuButtonControl item={item} />
        </span>
      </TooltipTrigger>
      <TooltipContent sideOffset={8}>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

type BubbleMenuButtonControlProps = {
  item: BubbleMenuItem;
} & Omit<ComponentPropsWithoutRef<'button'>, 'value'>;

const BubbleMenuButtonControl = forwardRef<
  HTMLButtonElement,
  BubbleMenuButtonControlProps
>(({ item, className, ...triggerProps }, ref) => {
  const controlClassName = cn(
    'size-7! px-2.5 disabled:cursor-not-allowed',
    item?.className,
    className
  );
  const content = item.icon ? (
    <span
      className={cn(
        'flex size-3 shrink-0 items-center justify-center [&_svg]:size-3 [&_svg]:shrink-0 [&_svg]:stroke-[2.5]',
        item?.iconClassName
      )}
    >
      {item.icon}
    </span>
  ) : (
    <span
      className={cn(
        'text-muted-foreground text-sm font-medium',
        item?.nameClassName
      )}
    >
      {item.name}
    </span>
  );

  if (item.isActive) {
    return (
      <Toggle
        ref={ref}
        pressed={item.isActive()}
        onPressedChange={() => item.command?.()}
        className={controlClassName}
        type="button"
        aria-label={item.tooltip ?? item.name}
        disabled={item.disbabled}
        {...triggerProps}
      >
        {content}
      </Toggle>
    );
  }

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      {...(item.command ? { onClick: item.command } : {})}
      className={controlClassName}
      type="button"
      aria-label={item.tooltip ?? item.name}
      disabled={item.disbabled}
      {...triggerProps}
    >
      {content}
    </Button>
  );
});

BubbleMenuButtonControl.displayName = 'BubbleMenuButtonControl';
