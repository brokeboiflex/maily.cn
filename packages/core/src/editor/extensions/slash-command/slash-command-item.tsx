import type { Editor } from '@tiptap/core';
import { BlockItem } from '@/blocks';
import { ChevronRightIcon } from 'lucide-react';
import { Ref } from 'react';
import { cn } from '@/editor/utils/classname';

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
      <div className="grow">
        <p className="font-medium">{item.title}</p>
        <p className="text-muted-foreground text-xs">{item.description}</p>
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
    <button
      className={cn(
        'text-foreground flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
        isActive ? 'bg-muted text-foreground' : 'bg-transparent'
      )}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      type="button"
      ref={activeRef}
    >
      {value}
    </button>
  );
}
