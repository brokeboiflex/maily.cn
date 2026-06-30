import { IconPlaceholder } from "@/components/icon-placeholder"
import { cn } from '@/lib/utils';
import { useId } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { AUTOCOMPLETE_PASSWORD_MANAGERS_OFF } from '../../utils/constants';
import { useMailyContext } from '../../provider';

type EdgeSpacingControlProps = {
  top?: number;
  onTopValueChange?: (top: number) => void;
  right?: number;
  onRightValueChange?: (right: number) => void;
  bottom?: number;
  onBottomValueChange?: (bottom: number) => void;
  left?: number;
  onLeftValueChange?: (left: number) => void;
};

export function EdgeSpacingControl(props: EdgeSpacingControlProps) {
  const {
    top,
    onTopValueChange,
    right,
    onRightValueChange,
    bottom,
    onBottomValueChange,
    left,
    onLeftValueChange,
  } = props;
  const { t } = useMailyContext();

  return (
    <Popover>
      <PopoverTrigger className="hover:bg-muted rounded">
        <IconPlaceholder
  lucide="ChevronUp"
  tabler="IconChevronUp"
  hugeicons="ChevronUpIcon"
  phosphor="CaretUp"
  remixicon="RiArrowUpSLine"
  size={14}
/>
      </PopoverTrigger>
      <PopoverContent
        className="border-border flex max-w-max gap-0.5 rounded-md border p-0.5! shadow-none"
        side="top"
        sideOffset={8}
      >
        <InputWithLabel
          label={t('edgeSpacing.top')}
          value={top ?? 0}
          onChange={(value) => onTopValueChange?.(value)}
          inputClassName="rounded"
        />
        <InputWithLabel
          label={t('edgeSpacing.right')}
          value={right ?? 0}
          onChange={(value) => onRightValueChange?.(value)}
          inputClassName="rounded"
        />
        <InputWithLabel
          label={t('edgeSpacing.bottom')}
          value={bottom ?? 0}
          onChange={(value) => onBottomValueChange?.(value)}
          inputClassName="rounded"
        />
        <InputWithLabel
          label={t('edgeSpacing.left')}
          value={left ?? 0}
          onChange={(value) => onLeftValueChange?.(value)}
          inputClassName="rounded"
        />
      </PopoverContent>
    </Popover>
  );
}

type InputWithLabelProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  inputClassName?: string;
};

function InputWithLabel(props: InputWithLabelProps) {
  const { label, value, onChange, className, inputClassName } = props;

  const id = `${label}${useId()}`;

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <input
        {...AUTOCOMPLETE_PASSWORD_MANAGERS_OFF}
        id={id}
        min={0}
        type="number"
        // Error: https://github.com/facebook/react/issues/9402
        // adding `+ ''` to convert number to string so that number don't have leading zero(0)
        value={value + ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          'bg-muted size-5 [appearance:textfield] border-0 border-none p-0.5 text-center text-xs tabular-nums outline-hidden focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          inputClassName
        )}
      />
      <label
        className="text-muted-foreground text-[10px] leading-none"
        htmlFor={id}
      >
        {label}
      </label>
    </div>
  );
}
