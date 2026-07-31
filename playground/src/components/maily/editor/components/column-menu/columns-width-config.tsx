import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AUTOCOMPLETE_PASSWORD_MANAGERS_OFF } from '../../utils/constants';
import { useMailyContext } from '../../provider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ToggleGroupCompat,
  ToggleGroupCompatItem,
} from '../ui/toggle-group-compat';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BOTTOM_FLOATING_CONTENT_PROPS } from '../ui/floating-placement';
import { SlidersVertical, Columns2, Columns3 } from "lucide-react";

type ColumnsWidthConfigProps = {
  columnsCount: number;
  onColumnsCountChange: (columns: number) => void;

  columnWidths: string[];
  onColumnWidthChange?: (column: number, width: string) => void;
};

export function ColumnsWidthConfig(props: ColumnsWidthConfigProps) {
  const {
    columnsCount = 2,
    onColumnsCountChange,
    columnWidths,
    onColumnWidthChange,
  } = props;
  const { t } = useMailyContext();

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex shrink-0">
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={t('columnMenu.configureWidths')}
              >
                <SlidersVertical className="h-3 w-3 stroke-[2.5]" />
              </Button>
            </PopoverTrigger>
          </span>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>
          {t('columnMenu.configureWidths')}
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        {...BOTTOM_FLOATING_CONTENT_PROPS}
        className="p-0.5! w-[calc(100vw-1rem)] max-w-[300px] rounded-lg"
        sideOffset={8}
        align="center"
      >
        <ToggleGroupCompat
          selectionMode="single"
          value={String(columnsCount)}
          className="grid w-full grid-cols-2 gap-1"
        >
          <ToggleGroupCompatItem
            value="2"
            pressed={columnsCount === 2}
            onClick={() => onColumnsCountChange(2)}
            className="text-muted-foreground h-7 gap-1 px-2 text-sm"
            type="button"
          >
            <Columns2 className="h-4 w-4 stroke-[2.5]" />
            <span>{t('columnMenu.twoColumns')}</span>
          </ToggleGroupCompatItem>
          <ToggleGroupCompatItem
            value="3"
            pressed={columnsCount === 3}
            onClick={() => onColumnsCountChange(3)}
            className="text-muted-foreground h-7 gap-1 px-2 text-sm"
            type="button"
          >
            <Columns3 className="h-4 w-4 stroke-[2.5]" />
            <span>{t('columnMenu.threeColumns')}</span>
          </ToggleGroupCompatItem>
        </ToggleGroupCompat>

        <Separator orientation="horizontal" className="my-0.5" />

        <div
          className="grid gap-1 p-1"
          style={{ gridTemplateColumns: `repeat(${columnsCount}, 1fr)` }}
        >
          {Array.from({ length: columnsCount }).map((_, index) => {
            const value =
              columnWidths[index] === 'auto' ? '' : columnWidths[index];
            const label =
              columnsCount === 2
                ? index === 0
                  ? t('columnMenu.left')
                  : t('columnMenu.right')
                : index === 0
                  ? t('columnMenu.left')
                  : index === 1
                    ? t('columnMenu.middle')
                    : t('columnMenu.right');

            return (
              <div className="flex flex-col gap-1" key={index}>
                <span className="text-muted-foreground text-xs">{label}</span>

                <InputGroup>
                  <InputGroupInput
                    {...AUTOCOMPLETE_PASSWORD_MANAGERS_OFF}
                    placeholder={t('columnMenu.autoPlaceholder')}
                    min={1}
                    max={90}
                    type="number"
                    className="appearance-none px-1.5 text-sm tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    value={value}
                    onChange={(e) => {
                      const value = e.target.value;
                      onColumnWidthChange?.(index, value);
                    }}
                  />
                  <InputGroupAddon
                    align="inline-end"
                    className="pr-1.5 text-xs tabular-nums"
                  >
                    {t('columnMenu.unitPercent')}
                  </InputGroupAddon>
                </InputGroup>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
