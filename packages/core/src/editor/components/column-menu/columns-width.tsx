import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useMailyContext } from '../../provider';
import { NativeSelect, NativeSelectOption } from '../ui/native-select';

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
      <NativeSelect
        size="sm"
        className="max-w-28 [&_[data-slot=native-select-icon]]:hidden [&_[data-slot=native-select]]:h-auto [&_[data-slot=native-select]]:border-0 [&_[data-slot=native-select]]:p-1 [&_[data-slot=native-select]]:pl-[26px] [&_[data-slot=native-select]]:tabular-nums"
        value={selectedValue}
        onChange={(e) => onValueChange(e.target.value)}
      >
        <NativeSelectOption value="auto">
          {t('columnMenu.fitContent')}
        </NativeSelectOption>
        <NativeSelectOption value="100%">
          {t('columnMenu.stretch')}
        </NativeSelectOption>
      </NativeSelect>
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
