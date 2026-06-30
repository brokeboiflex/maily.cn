import { IconPlaceholder } from "@/components/icon-placeholder"
import type { Editor } from '@tiptap/core';
import { BlockItem } from '../../../blocks';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import { useCallback, useState, useRef, useEffect, Ref } from 'react';
import { cn } from '@/lib/utils';

type SlashCommandItemProps = {
  item: BlockItem;
  groupIndex: number;
  commandIndex: number;
  selectedGroupIndex: number;
  selectedCommandIndex: number;
  editor: Editor;
  activeCommandRef: Ref<HTMLButtonElement>;
  selectItem: (groupIndex: number, commandIndex: number) => void;
  hoveredItemKey: string | null;
  onHover: (isHovered: boolean) => void;
};

export function SlashCommandItem(props: SlashCommandItemProps) {
  const {
    item,
    groupIndex,
    commandIndex,
    selectedGroupIndex,
    selectedCommandIndex,
    editor,
    activeCommandRef,
    selectItem,
    hoveredItemKey,
    onHover,
  } = props;

  const [open, setOpen] = useState(false);
  const isActive =
    groupIndex === selectedGroupIndex && commandIndex === selectedCommandIndex;

  const itemKey = `${groupIndex}-${commandIndex}`;
  const isHovered = hoveredItemKey === itemKey;

  const isSubCommand = item && 'commands' in item;

  // show tooltip only if this item is hovered OR (active/keyboard selected AND no other item is hovered)
  const shouldOpenTooltip =
    !!item?.preview && (isHovered || (isActive && !hoveredItemKey));

  const hasRenderFunction = typeof item.render === 'function';
  const renderFunctionValue = hasRenderFunction ? item.render?.(editor) : null;

  let value = (
    <>
      <div className="flex h-6 w-6 shrink-0 items-center justify-center">
        {item.icon}
      </div>
      <div className="grow">
        <p className="font-medium">{item.title}</p>
        <p className="text-muted-foreground text-xs">{item.description}</p>
      </div>

      {isSubCommand && (
        <span className="text-muted-foreground block px-1">
          <IconPlaceholder
  lucide="ChevronRightIcon"
  tabler="IconChevronRight"
  hugeicons="ChevronRightIcon"
  phosphor="CaretRight"
  remixicon="RiArrowRightSLine"
  className="size-3.5 stroke-[2.5]"
/>
        </span>
      )}
    </>
  );

  if (renderFunctionValue !== null && renderFunctionValue !== true) {
    value = renderFunctionValue!;
  }

  const openTimerRef = useRef<number>(0);
  const handleDelayedOpen = useCallback(() => {
    window.clearTimeout(openTimerRef.current);
    const delay = 200;
    openTimerRef.current = window.setTimeout(() => {
      setOpen(true);
      openTimerRef.current = 0;
    }, delay);
  }, [setOpen]);

  useEffect(() => {
    if (shouldOpenTooltip) {
      handleDelayedOpen();
    } else {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = 0;
      setOpen(false);
    }
  }, [shouldOpenTooltip]);

  useEffect(() => {
    return () => {
      if (openTimerRef.current) {
        window.clearTimeout(openTimerRef.current);
        openTimerRef.current = 0;
      }
    };
  }, []);

  return (
    <Tooltip open={open} key={`${groupIndex}-${commandIndex}`}>
      <TooltipTrigger asChild>
        <button
          className={cn(
            'text-foreground hover:bg-muted hover:text-foreground flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm',
            isActive ? 'bg-muted text-foreground' : 'bg-transparent'
          )}
          onClick={() => selectItem(groupIndex, commandIndex)}
          onMouseEnter={() => onHover(true)}
          onMouseLeave={() => onHover(false)}
          type="button"
          ref={isActive ? activeCommandRef : null}
        >
          {value}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={10}
        className="w-52 rounded-lg border-none p-1 shadow"
      >
        {typeof item.preview === 'function' ? (
          item?.preview(editor)
        ) : (
          <>
            <figure className="border-border relative aspect-[2.5] w-full overflow-hidden rounded-md border">
              <img
                src={item?.preview}
                alt={item?.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </figure>
            <p className="text-muted-foreground mt-2 px-0.5">
              {item.description}
            </p>
          </>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
