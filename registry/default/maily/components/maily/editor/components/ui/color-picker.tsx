'use client';

import { HexColorPicker, HexColorInput } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { useMailyContext } from '../../provider';

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

  const popoverButton = (
    <PopoverTrigger asChild>
      {children || (
        <Button
          variant="ghost"
          className="h-7 w-7 shrink-0"
          size="sm"
          type="button"
        >
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
        </Button>
      )}
    </PopoverTrigger>
  );

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
          <TooltipTrigger asChild>{popoverButton}</TooltipTrigger>
          <TooltipContent sideOffset={8}>{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        popoverButton
      )}

      <PopoverContent
        className="w-full rounded-none border-0 bg-transparent! p-0! shadow-none drop-shadow-md"
        sideOffset={8}
      >
        <div className="border-border bg-background min-w-[260px] rounded-xl border p-4">
          <HexColorPicker
            color={color}
            onChange={handleColorChange}
            className="flex w-full! flex-col gap-4"
          />
          <HexColorInput
            alpha={true}
            color={color}
            onChange={handleColorChange}
            className="border-border bg-background focus-visible:border-ring mt-4 w-full min-w-0 rounded-lg border px-2 py-1.5 text-sm uppercase focus-visible:outline-hidden"
            prefixed
          />

          {suggestedColors.length > 0 && (
            <div>
              <div className="bg-muted -mx-4 my-4 h-px" />

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
