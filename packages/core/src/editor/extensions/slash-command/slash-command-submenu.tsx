import type { Editor } from '@tiptap/core';
import { BlockItem } from '@/blocks';
import { CSSProperties } from 'react';
import { SlashCommandItem } from './slash-command-item';

type SlashCommandSubmenuProps = {
  commands: BlockItem[];
  activeIndex: number;
  isFocused: boolean;
  editor: Editor;
  style?: CSSProperties;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
};

// Side-opening submenu, mirroring shadcn's DropdownMenuSubContent. Rendered as a
// sibling of the popup box (not inside its scroll/overflow-hidden container, which
// would clip it) and positioned at `left-full` of the non-clipping wrapper, with
// `top` measured against the trigger row so it aligns like a real flyout.
export function SlashCommandSubmenu(props: SlashCommandSubmenuProps) {
  const { commands, activeIndex, isFocused, editor, style, onSelect, onHover } =
    props;

  return (
    <div
      className="border-border bg-popover text-popover-foreground absolute left-full z-50 ml-1 w-64 space-y-0.5 rounded-md border p-1 shadow-md"
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
