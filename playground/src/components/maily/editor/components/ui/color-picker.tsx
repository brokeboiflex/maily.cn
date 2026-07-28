'use client';

import { HexColorPicker, HexColorInput } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';
import { useMailyContext } from '../../provider';
import { Separator } from '@/components/ui/separator';
import { InputGroup } from '@/components/ui/input-group';

type ColorPickerProps = {
  color: string;
  onColorChange: (color: string) => void;

  borderColor?: string;
  backgroundColor?: string;
  tooltip?: string;
  className?: string;

  children?: ReactNode;
  onClose?: (color: string) => void;
  suggestedColors?: string[];
};

export function ColorPicker(props: ColorPickerProps) {
  const {
    color,
    onColorChange,
    borderColor,
    backgroundColor,
    tooltip,
    className,

    children,
    onClose,

    suggestedColors = [],
  } = props;
  const { t } = useMailyContext();

  const handleColorChange = (color: string) => {
    // HACK: This is a workaround for a bug in tiptap
    // https://github.com/ueberdosis/tiptap/issues/3580
    //
    //     ERROR: flushSync was called from inside a lifecycle
    //
    // To fix this, we need to make sure that the onChange
    // callback is run after the current execution context.
    queueMicrotask(() => {
      onColorChange(color);
    });
  };

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) {
          onClose?.(color);
        }
      }}
    >
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex shrink-0">
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="size-7 shrink-0 p-0"
                  size="sm"
                  type="button"
                  aria-label={tooltip}
                >
                  {children || (
                    <div
                      className={cn(
                        'border-border h-4 w-4 shrink-0 rounded border-2',
                        className
                      )}
                      style={{
                        ...(borderColor ? { borderColor } : {}),
                        backgroundColor: backgroundColor || 'transparent',
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
            </span>
          </TooltipTrigger>
          <TooltipContent sideOffset={8}>{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="size-7 shrink-0 p-0"
            size="sm"
            type="button"
            aria-label={t('colorPicker.open')}
          >
            {children || (
              <div
                className={cn(
                  'border-border h-4 w-4 shrink-0 rounded border-2',
                  className
                )}
                style={{
                  ...(borderColor ? { borderColor } : {}),
                  backgroundColor: backgroundColor || 'transparent',
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
      )}

      <PopoverContent
        className="w-[calc(100vw-1rem)] max-w-[260px]"
        sideOffset={8}
      >
        <div>
          <HexColorPicker
            color={color}
            onChange={handleColorChange}
            className="w-full! flex flex-col gap-4"
          />
          <InputGroup className="mt-4">
            <HexColorInput
              alpha={true}
              color={color}
              onChange={handleColorChange}
              data-slot="input-group-control"
              className="h-7 flex-1 border-0 bg-transparent px-2.5 py-0 text-sm uppercase outline-none focus-visible:ring-0"
              prefixed
            />
          </InputGroup>

          {suggestedColors.length > 0 && (
            <div>
              <Separator className="my-4" />

              <h2 className="text-muted-foreground text-xs">
                {t('colorPicker.recentlyUsed')}
              </h2>

              <div className="mt-2 flex flex-wrap gap-0.5">
                {suggestedColors.map((suggestedColor) => (
                  <Button
                    key={suggestedColor}
                    variant="ghost"
                    size="sm"
                    className="!size-7 shrink-0"
                    type="button"
                    onClick={() => handleColorChange(suggestedColor)}
                    aria-label={t('colorPicker.useColor', {
                      color: suggestedColor,
                    })}
                  >
                    <div
                      className="h-4 w-4 shrink-0 rounded"
                      style={{
                        backgroundColor: suggestedColor,
                      }}
                    />
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
