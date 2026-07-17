import { useMailyContext } from '@/editor/provider';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Braces,
  CornerDownLeftIcon,
} from 'lucide-react';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { type Variable } from './variable';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/editor/components/ui/command';
import { Kbd, KbdGroup } from '@/editor/components/ui/kbd';

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
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const itemValue = (item: Variable, index: number) =>
      `${item.name}-${index}`;

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
        if (!items.length) return;
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
      },
      moveDown: () => {
        if (!items.length) return;
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
      <Command
        shouldFilter={false}
        value={
          items[selectedIndex]
            ? itemValue(items[selectedIndex], selectedIndex)
            : ''
        }
        onValueChange={(value) => {
          const nextIndex = items.findIndex(
            (item, index) => itemValue(item, index) === value
          );
          if (nextIndex >= 0) setSelectedIndex(nextIndex);
        }}
        className="ring-foreground/10 z-50 w-[min(16rem,calc(100vw-1rem))] rounded-xl shadow-md ring-1"
      >
        <CommandList ref={scrollContainerRef} className="max-h-52">
          <CommandGroup heading={t('variableMenu.title')}>
            <CommandEmpty>{t('variableMenu.noResult')}</CommandEmpty>
            {items.map((item, index: number) => (
              <CommandItem
                key={itemValue(item, index)}
                value={itemValue(item, index)}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                onSelect={() => onSelectItem(item)}
                className="font-mono"
              >
                <Braces className="size-3 stroke-[2.5] text-rose-600" />
                {item?.label || item.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>

        <div className="border-border text-muted-foreground flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t px-1 py-1.5">
          <div className="flex items-center gap-1">
            <KbdGroup>
              <Kbd>
                <ArrowDownIcon className="size-3 stroke-[2.5]" />
              </Kbd>
              <Kbd>
                <ArrowUpIcon className="size-3 stroke-[2.5]" />
              </Kbd>
            </KbdGroup>
            <span className="text-muted-foreground text-xs">
              {t('variableMenu.navigate')}
            </span>
          </div>
          <Kbd>
            <CornerDownLeftIcon className="size-3 stroke-[2.5]" />
          </Kbd>
        </div>
      </Command>
    );
  });
