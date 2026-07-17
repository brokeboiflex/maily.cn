import type { Editor } from '@tiptap/core';
import { type BlockItem } from '@/blocks';
import { type CSSProperties } from 'react';
import { cn } from '@/editor/utils/classname';
import { SlashCommandItem } from './slash-command-item';

type SlashCommandSubmenuProps = {
  commands: BlockItem[];
  activeIndex: number;
  isFocused: boolean;
  editor: Editor;
  side: 'left' | 'right' | 'overlay';
  style?: CSSProperties;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
};

// Side-opening submenu, mirroring shadcn's DropdownMenuSubContent. Rendered as a
// sibling of the popup box (not inside its scroll/overflow-hidden container, which
// would clip it). Its measured placement uses whichever side has room, falling
// back to an in-place overlay on narrow viewports.
export function SlashCommandSubmenu(props: SlashCommandSubmenuProps) {
  const {
    commands,
    activeIndex,
    isFocused,
    editor,
    side,
    style,
    onSelect,
    onHover,
  } = props;

  return (
    <div
      data-slot="slash-command-submenu"
      className={cn(
        'border-border bg-popover text-popover-foreground absolute z-50 space-y-0.5 rounded-md border p-1 shadow-md',
        side === 'right' && 'left-full ml-1',
        side === 'left' && 'right-full mr-1',
        side === 'overlay' && 'left-0'
      )}
      style={style}
    >
      {commands.map((item, index) => (
        <SlashCommandItem
          key={index}
          item={item}
          editor={editor}
          isActive={isFocused && index === activeIndex}
          onSelect={() => onSelect(index)}
          onMouseEnter={() => onHover(index)}
        />
      ))}
    </div>
  );
}
