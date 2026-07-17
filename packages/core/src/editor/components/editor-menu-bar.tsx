import { forwardRef, useMemo, type ComponentPropsWithoutRef } from 'react';
import { Editor as EditorType } from '@tiptap/core';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BoldIcon,
  EraserIcon,
  ItalicIcon,
  LinkIcon,
  SeparatorHorizontal,
  StrikethroughIcon,
  UnderlineIcon,
} from 'lucide-react';
import { type EditorProps } from '@/editor';
import { cn } from '../utils/classname';
import { BubbleMenuButton } from './bubble-menu-button';
import { type BubbleMenuItem } from './text-menu/text-bubble-menu';
import { Toggle } from './ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useMailyContext } from '../provider';

interface EditorMenuItem extends BubbleMenuItem {
  group: 'alignment' | 'image' | 'mark' | 'custom' | 'email';
}

type EditorMenuBarProps = {
  config: EditorProps['config'];
  editor: EditorType;
};

// Items in the `mark` group that are real on/off toggles (the rest, e.g. the
// eraser, are one-shot actions and stay plain buttons).
const MARK_TOGGLE_NAMES = new Set(['bold', 'italic', 'underline', 'strike']);

function ToggleItem({
  item,
  pressed,
}: {
  item: EditorMenuItem;
  pressed: boolean;
}) {
  if (!item.tooltip) {
    return <ToggleItemControl item={item} pressed={pressed} />;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ToggleItemControl item={item} pressed={pressed} />
      </TooltipTrigger>
      <TooltipContent sideOffset={8}>{item.tooltip}</TooltipContent>
    </Tooltip>
  );
}

type ToggleItemControlProps = {
  item: EditorMenuItem;
  pressed: boolean;
} & ComponentPropsWithoutRef<typeof Toggle>;

const ToggleItemControl = forwardRef<HTMLButtonElement, ToggleItemControlProps>(
  ({ item, pressed, className, ...triggerProps }, ref) => {
    return (
      <Toggle
        ref={ref}
        pressed={pressed}
        onPressedChange={() => item.command?.()}
        aria-label={item.tooltip ?? item.name}
        disabled={item.disbabled}
        className={cn(
          'size-7! min-w-7! px-2.5 disabled:cursor-not-allowed',
          className
        )}
        {...triggerProps}
      >
        {item.icon ? (
          <span className="flex size-3 items-center justify-center [&_svg]:size-3 [&_svg]:shrink-0 [&_svg]:stroke-[2.5]">
            {item.icon}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm font-medium">
            {item.name}
          </span>
        )}
      </Toggle>
    );
  }
);

ToggleItemControl.displayName = 'ToggleItemControl';

export const EditorMenuBar = (props: EditorMenuBarProps) => {
  const { editor, config } = props;
  const { t } = useMailyContext();

  const items: EditorMenuItem[] = useMemo(
    () => [
      {
        name: 'bold',
        command: () => editor.chain().focus().toggleBold().run(),
        isActive: () => editor.isActive('bold'),
        group: 'mark',
        icon: <BoldIcon />,
        tooltip: t('toolbar.bold'),
      },
      {
        name: 'italic',
        command: () => editor.chain().focus().toggleItalic().run(),
        isActive: () => editor.isActive('italic'),
        group: 'mark',
        icon: <ItalicIcon />,
        tooltip: t('toolbar.italic'),
      },
      {
        name: 'underline',
        command: () => editor.chain().focus().toggleUnderline().run(),
        isActive: () => editor.isActive('underline'),
        group: 'mark',
        icon: <UnderlineIcon />,
        tooltip: t('toolbar.underline'),
      },
      {
        name: 'strike',
        command: () => editor.chain().focus().toggleStrike().run(),
        isActive: () => editor.isActive('strike'),
        group: 'mark',
        icon: <StrikethroughIcon />,
        tooltip: t('toolbar.strikethrough'),
      },
      {
        name: 'delete-line',
        command: () =>
          editor.chain().focus().selectParentNode().deleteSelection().run(),
        isActive: () => false,
        group: 'mark',
        icon: <EraserIcon />,
        tooltip: t('block.clearLine.title'),
      },
      {
        name: 'divider',
        command: () => editor.chain().focus().setHorizontalRule().run(),
        isActive: () => editor.isActive('horizontalRule'),
        group: 'custom',
        icon: <SeparatorHorizontal />,
        tooltip: t('block.divider.title'),
      },
      {
        name: 'link',
        command: () => {
          const previousUrl = editor.getAttributes('link').href;
          const url = window.prompt(t('toolbar.linkPrompt'), previousUrl);
          // If the user cancels the prompt, we don't want to toggle the link
          if (url === null) return;
          // If the user deletes the URL entirely, we'll unlink the selected text
          if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
          }

          // Otherwise, we set the link to the given URL
          editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: url })
            .run();
        },
        isActive: () => editor.isActive('link'),
        group: 'custom',
        icon: <LinkIcon />,
        tooltip: t('toolbar.link'),
      },
      {
        name: 'left',
        command: () => editor.chain().focus().setTextAlign('left').run(),
        isActive: () => editor.isActive({ textAlign: 'left' }),
        group: 'alignment',
        icon: <AlignLeft />,
        tooltip: t('alignment.left'),
      },
      {
        name: 'center',
        command: () => editor.chain().focus().setTextAlign('center').run(),
        isActive: () => editor.isActive({ textAlign: 'center' }),
        group: 'alignment',
        icon: <AlignCenter />,
        tooltip: t('alignment.center'),
      },
      {
        name: 'right',
        command: () => editor.chain().focus().setTextAlign('right').run(),
        isActive: () => editor.isActive({ textAlign: 'right' }),
        group: 'alignment',
        icon: <AlignRight />,
        tooltip: t('alignment.right'),
      },
    ],
    [editor, t]
  );

  const groups = useMemo(
    () =>
      items.reduce((acc, item) => {
        if (!acc.includes(item.group)) {
          acc.push(item.group);
        }
        return acc;
      }, [] as string[]),
    [items]
  );

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-3', config?.toolbarClassName)}>
      {groups.map((group) => {
        const groupItems = items.filter((item) => item.group === group);

        return (
          <div
            key={group}
            className="border-border bg-background flex items-center gap-1 rounded-md border p-1"
          >
            {renderGroup(group, groupItems)}
          </div>
        );
      })}
    </div>
  );
};

function renderGroup(group: string, groupItems: EditorMenuItem[]) {
  // Single-select alignment toggle (left / center / right).
  if (group === 'alignment') {
    return (
      <>
        {groupItems.map((item) => (
          <ToggleItem
            key={item.name}
            item={item}
            pressed={!!item.isActive?.()}
          />
        ))}
      </>
    );
  }

  // Multi-select text marks (bold / italic / underline / strike); any
  // non-toggle items in the group (the eraser) render as plain buttons.
  if (group === 'mark') {
    const toggleItems = groupItems.filter((item) =>
      MARK_TOGGLE_NAMES.has(item.name!)
    );
    const actionItems = groupItems.filter(
      (item) => !MARK_TOGGLE_NAMES.has(item.name!)
    );
    return (
      <>
        {toggleItems.map((item) => (
          <ToggleItem
            key={item.name}
            item={item}
            pressed={!!item.isActive?.()}
          />
        ))}
        {actionItems.map((item) => (
          <BubbleMenuButton key={item.name} {...item} />
        ))}
      </>
    );
  }

  // Everything else (divider, link, …) stays a plain action button.
  return groupItems.map((item) => (
    <BubbleMenuButton key={item.name} {...item} />
  ));
}
