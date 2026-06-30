import { type LucideIcon } from "lucide-react"
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { SVGIcon } from '../icons/grid-lines';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { AUTOCOMPLETE_PASSWORD_MANAGERS_OFF } from '../../utils/constants';

type NumberInputProps = {
  value: number;
  onValueChange: (value: number) => void;
  icon?: LucideIcon | SVGIcon;
  max?: number;

  tooltip?: string;
};

export const NumberInput = forwardRef<HTMLLabelElement, NumberInputProps>(
  (props, ref) => {
    const { value, onValueChange, icon: Icon, max, tooltip } = props;

    const content = (
      <label ref={ref} className="relative flex items-center justify-center">
        {Icon ? <Icon className="absolute left-1.5 size-3.5" /> : null}
        <input
          {...AUTOCOMPLETE_PASSWORD_MANAGERS_OFF}
          min={0}
          {...(max ? { max } : {})}
          type="number"
          // Error: https://github.com/facebook/react/issues/9402
          // adding `+ ''` to convert number to string so that number don't have leading zero(0)
          value={value + ''}
          onChange={(e) => onValueChange(Number(e.target.value))}
          className={cn(
            'h-auto max-w-12 [appearance:textfield] border-0 border-none p-1 text-center text-sm tabular-nums outline-hidden focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            Icon ? 'pl-[26px]' : ''
          )}
        />
      </label>
    );

    if (tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{content}</span>
          </TooltipTrigger>
          <TooltipContent sideOffset={8}>{tooltip}</TooltipContent>
        </Tooltip>
      );
    }

    return content;
  }
);

NumberInput.displayName = 'NumberInput';
