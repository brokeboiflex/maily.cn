import { IconPlaceholder } from "@/components/icon-placeholder"
import { cn } from '@/lib/utils';
import { useMailyContext } from '../../provider';
import { Button } from '@/components/ui/button';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { type Variable } from './variable';

export type VariableSuggestionsPopoverProps = {
  items: Variable[];
  onSelectItem: (item: Variable) => void;
};

export type VariableSuggestionsPopoverRef = {
  moveUp: () => void;
  moveDown: () => void;
  select: () => void;
};

export type VariableSuggestionsPopoverType = React.ForwardRefExoticComponent<
  VariableSuggestionsPopoverProps &
    React.RefAttributes<VariableSuggestionsPopoverRef>
>;

export const VariableSuggestionsPopover: VariableSuggestionsPopoverType =
  forwardRef((props, ref) => {
    const { items, onSelectItem } = props;
    const { t } = useMailyContext();

    const [selectedIndex, setSelectedIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const scrollSelectedIntoView = (index: number) => {
      const container = scrollContainerRef.current;
      const selectedItem = itemRefs.current[index];

      if (!container || !selectedItem) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const itemRect = selectedItem.getBoundingClientRect();

      const padding = 4;
      if (itemRect.bottom > containerRect.bottom) {
        container.scrollTop += itemRect.bottom - containerRect.bottom + padding;
      } else if (itemRect.top < containerRect.top) {
        container.scrollTop += itemRect.top - containerRect.top - padding;
      }
    };

    useEffect(() => {
      setSelectedIndex(0);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      itemRefs.current = items.map(() => null);
    }, [items]);

    useEffect(() => {
      scrollSelectedIntoView(selectedIndex);
    }, [selectedIndex]);

    useImperativeHandle(ref, () => ({
      moveUp: () => {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
      },
      moveDown: () => {
        setSelectedIndex((selectedIndex + 1) % items.length);
      },
      select: () => {
        const item = items[selectedIndex];
        if (!item) {
          return;
        }

        onSelectItem(item);
      },
    }));

    return (
      <div className="border-border bg-background z-50 w-64 rounded-lg border shadow-md transition-all">
        <div className="border-border bg-muted/40 text-muted-foreground flex items-center justify-between gap-2 border-b px-1 py-1.5">
          <span className="text-xs uppercase">{t('variableMenu.title')}</span>
          <VariableIcon>
            <IconPlaceholder
  lucide="Braces"
  tabler="IconBraces"
  hugeicons="BracesIcon"
  phosphor="BracketsCurly"
  remixicon="RiBracesLine"
  className="size-3 stroke-[2.5]"
/>
          </VariableIcon>
        </div>

        <div ref={scrollContainerRef} className="max-h-52 overflow-y-auto">
          <div className="flex w-fit min-w-full flex-col gap-0.5 p-1">
            {items?.length ? (
              items?.map((item, index: number) => (
                <Button
                  type="button"
                  variant="ghost"
                  key={index}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  onClick={() => onSelectItem(item)}
                  className={cn(
                    'text-foreground hover:bg-muted h-auto w-fit min-w-full justify-start gap-2 rounded-md px-2 py-1 text-left font-mono text-sm',
                    index === selectedIndex ? 'bg-muted' : 'bg-background'
                  )}
                >
                  <IconPlaceholder
  lucide="Braces"
  tabler="IconBraces"
  hugeicons="BracesIcon"
  phosphor="BracketsCurly"
  remixicon="RiBracesLine"
  className="size-3 stroke-[2.5] text-rose-600"
/>
                  {item?.label || item.name}
                </Button>
              ))
            ) : (
              <div className="text-foreground hover:bg-muted flex h-7 w-full items-center gap-2 rounded-md px-2 py-1 text-left font-mono text-[13px]">
                {t('variableMenu.noResult')}
              </div>
            )}
          </div>
        </div>

        <div className="border-border text-muted-foreground flex items-center justify-between gap-2 border-t px-1 py-1.5">
          <div className="flex items-center gap-1">
            <VariableIcon>
              <IconPlaceholder
  lucide="ArrowDownIcon"
  tabler="IconArrowDown"
  hugeicons="ArrowDown01Icon"
  phosphor="ArrowDown"
  remixicon="RiArrowDownLine"
  className="size-3 stroke-[2.5]"
/>
            </VariableIcon>
            <VariableIcon>
              <IconPlaceholder
  lucide="ArrowUpIcon"
  tabler="IconArrowUp"
  hugeicons="ArrowUp01Icon"
  phosphor="ArrowUp"
  remixicon="RiArrowUpLine"
  className="size-3 stroke-[2.5]"
/>
            </VariableIcon>
            <span className="text-muted-foreground text-xs">
              {t('variableMenu.navigate')}
            </span>
          </div>
          <VariableIcon>
            <IconPlaceholder
  lucide="CornerDownLeftIcon"
  tabler="IconCornerDownLeft"
  hugeicons="CornerDownLeftIcon"
  phosphor="ArrowBendDownLeft"
  remixicon="RiCornerDownLeftLine"
  className="size-3 stroke-[2.5]"
/>
          </VariableIcon>
        </div>
      </div>
    );
  });

type VariableIconProps = {
  className?: string;
  children: React.ReactNode;
};

function VariableIcon(props: VariableIconProps) {
  const { className, children } = props;

  return (
    <div
      className={cn(
        'border-border flex size-5 items-center justify-center rounded-md border',
        className
      )}
    >
      {children}
    </div>
  );
}
