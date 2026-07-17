import { IconPlaceholder } from "@/components/icon-placeholder"
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { cn } from '@/lib/utils';
import { AUTOCOMPLETE_PASSWORD_MANAGERS_OFF } from '../../utils/constants';
import { useMailyContext } from '../../provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

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
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="size-7">
          <IconPlaceholder
  lucide="SlidersVertical"
  tabler="IconAdjustments"
  hugeicons="SlidersVerticalIcon"
  phosphor="Sliders"
  remixicon="RiEqualizerLine"
  className="h-3 w-3 stroke-[2.5]"
/>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] rounded-lg p-0.5!"
        side="top"
        sideOffset={8}
        align="center"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <div className="grid grid-cols-2 gap-1">
          <SwitchButton
            onClick={() => onColumnsCountChange(2)}
            isActive={columnsCount === 2}
          >
            <IconPlaceholder
  lucide="Columns2"
  tabler="IconColumns2"
  hugeicons="LayoutTwoColumnIcon"
  phosphor="Columns"
  remixicon="RiLayoutColumnLine"
  className="h-4 w-4 stroke-[2.5]"
/>
            <span>{t('columnMenu.twoColumns')}</span>
          </SwitchButton>
          <SwitchButton
            onClick={() => onColumnsCountChange(3)}
            isActive={columnsCount === 3}
          >
            <IconPlaceholder
  lucide="Columns3"
  tabler="IconColumns3"
  hugeicons="LayoutThreeColumnIcon"
  phosphor="Columns"
  remixicon="RiLayout3Line"
  className="h-4 w-4 stroke-[2.5]"
/>
            <span>{t('columnMenu.threeColumns')}</span>
          </SwitchButton>
        </div>

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

                <label className="relative">
                  <Input
                    {...AUTOCOMPLETE_PASSWORD_MANAGERS_OFF}
                    placeholder={t('columnMenu.autoPlaceholder')}
                    min={1}
                    max={90}
                    type="number"
                    className="bg-muted focus:bg-muted focus:ring-foreground/50 w-full [appearance:textfield] appearance-none rounded-md px-1.5 py-1 pr-6 text-sm tabular-nums outline-hidden focus:ring-1 focus:outline-hidden [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    value={value}
                    onChange={(e) => {
                      const value = e.target.value;
                      onColumnWidthChange?.(index, value);
                    }}
                  />
                  <span className="text-muted-foreground absolute inset-y-0 right-0 flex aspect-square items-center justify-center text-xs tabular-nums">
                    {t('columnMenu.unitPercent')}
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

type SwitchButtonProps = {
  isActive?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};

function SwitchButton(props: SwitchButtonProps) {
  const { onClick, isActive = false, children } = props;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        'text-muted-foreground hover:bg-muted hover:text-foreground flex h-7 items-center gap-1 rounded-md px-2 text-sm',
        isActive && 'bg-muted text-foreground'
      )}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
