import type { Editor } from '@tiptap/core';
import { type BlockItem } from '../../../blocks';
import { type Ref } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronRightIcon } from "lucide-react";

type SlashCommandItemProps = {
  item: BlockItem;
  isActive: boolean;
  editor: Editor;
  onSelect: () => void;
  onMouseEnter: () => void;
  activeRef?: Ref<HTMLButtonElement>;
};

export function SlashCommandItem(props: SlashCommandItemProps) {
  const { item, isActive, editor, onSelect, onMouseEnter, activeRef } = props;

  const isSubCommand = item && 'commands' in item;

  const hasRenderFunction = typeof item.render === 'function';
  const renderFunctionValue = hasRenderFunction ? item.render?.(editor) : null;

  let value = (
    <>
      <div className="flex h-6 w-6 shrink-0 items-center justify-center">
        {item.icon}
      </div>
      <div className="min-w-0 grow">
        <p className="truncate font-medium">{item.title}</p>
        <p className="text-muted-foreground truncate text-xs">
          {item.description}
        </p>
      </div>

      {isSubCommand && (
        <ChevronRightIcon className="text-muted-foreground ml-auto size-4 shrink-0" />
      )}
    </>
  );

  if (renderFunctionValue !== null && renderFunctionValue !== true) {
    value = renderFunctionValue!;
  }

  return (
    <Button
      variant="ghost"
      className={cn(
        'text-foreground hover:bg-accent hover:text-accent-foreground hover:**:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground dark:hover:bg-accent h-auto w-full cursor-pointer justify-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
        isActive && 'bg-accent text-accent-foreground **:text-accent-foreground'
      )}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      type="button"
      ref={activeRef}
    >
      {value}
    </Button>
  );
}
