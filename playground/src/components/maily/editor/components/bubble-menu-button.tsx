import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type BubbleMenuItem } from './text-menu/text-bubble-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

export function BubbleMenuButton(item: BubbleMenuItem) {
  const { tooltip } = item;

  if (!tooltip) {
    return <BubbleMenuButtonControl item={item} />;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <BubbleMenuButtonControl item={item} />
      </TooltipTrigger>
      <TooltipContent sideOffset={8}>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

type BubbleMenuButtonControlProps = {
  item: BubbleMenuItem;
} & ComponentPropsWithoutRef<typeof Button>;

const BubbleMenuButtonControl = forwardRef<
  HTMLButtonElement,
  BubbleMenuButtonControlProps
>(({ item, className, ...triggerProps }, ref) => {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      {...(item.command ? { onClick: item.command } : {})}
      className={cn(
        'size-7! px-2.5 disabled:cursor-not-allowed',
        item?.className,
        className
      )}
      type="button"
      aria-label={item.tooltip ?? item.name}
      disabled={item.disbabled}
      {...triggerProps}
    >
      {item.icon ? (
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
      )}
    </Button>
  );
});

BubbleMenuButtonControl.displayName = 'BubbleMenuButtonControl';
