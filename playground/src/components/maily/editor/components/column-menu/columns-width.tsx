import { forwardRef } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useMailyContext } from '../../provider';

type ColumnsWidthProps = {
  selectedValue: string;
  onValueChange: (value: string) => void;
  tooltip?: string;
};

export function ColumnsWidth(props: ColumnsWidthProps) {
  const { selectedValue, onValueChange, tooltip } = props;
  const { t } = useMailyContext();

  const content = (
    <label className="relative flex items-center">
      <span className="text-muted-foreground absolute inset-y-0 left-2 flex items-center text-xs leading-none">
        {t('columnMenu.width')}
      </span>
      <select
        className="h-auto max-w-28 appearance-none border-0 border-none p-1 pl-[26px] text-sm tabular-nums outline-hidden focus-visible:outline-hidden"
        value={selectedValue}
        onChange={(e) => onValueChange(e.target.value)}
      >
        <option value="auto">{t('columnMenu.fitContent')}</option>
        <option value="100%">{t('columnMenu.stretch')}</option>
      </select>
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
