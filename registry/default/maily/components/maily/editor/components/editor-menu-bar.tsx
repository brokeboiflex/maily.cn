import { IconPlaceholder } from "@/components/icon-placeholder"
import {
  Fragment,
  forwardRef,
  useMemo,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { Editor as EditorType } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { type EditorProps } from '..';
import { cn } from '@/lib/utils';
import { BubbleMenuButton } from './bubble-menu-button';
import { type BubbleMenuItem } from './text-menu/text-bubble-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMailyContext } from '../provider';
import { Toggle } from '@/components/ui/toggle';
import {
  ToggleGroupCompat,
  ToggleGroupCompatItem,
} from './ui/toggle-group-compat';
import { LinkInputPopover } from './ui/link-input-popover';

interface EditorMenuItem extends BubbleMenuItem {
  group: 'alignment' | 'image' | 'mark' | 'custom' | 'email';
  render?: ReactNode;
}

type EditorMenuBarProps = {
  config: EditorProps['config'];
  editor: EditorType;
};

// Items in the `mark` group that are real on/off toggles (the rest, e.g. the
// eraser, are one-shot actions and stay plain buttons).
const MARK_TOGGLE_NAMES = new Set(['bold', 'italic', 'underline', 'strike']);

function ToolbarLink({ editor }: { editor: EditorType }) {
  const { t } = useMailyContext();
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      href: editor.getAttributes('link').href ?? '',
      isVariable: editor.getAttributes('link').isUrlVariable ?? false,
    }),
    equalityFn: (previous, next) =>
      previous?.href === next?.href &&
      previous?.isVariable === next?.isVariable,
  }) ?? { href: '', isVariable: false };

  return (
    <LinkInputPopover
      defaultValue={state.href}
      isVariable={state.isVariable}
      tooltip={t('toolbar.link')}
      editor={editor}
      onValueChange={(value, isVariable) => {
        if (!value) {
          editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .unsetLink()
            .unsetUnderline()
            .run();
          return;
        }

        editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .setLink({ href: value })
          .setIsUrlVariable(isVariable ?? false)
          .setUnderline()
          .run();
      }}
    />
  );
}

function ToggleItem({
  item,
  groupItem = false,
}: {
  item: EditorMenuItem;
  groupItem?: boolean;
}) {
  if (!item.tooltip) {
    return <ToggleItemControl item={item} groupItem={groupItem} />;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex shrink-0">
          <ToggleItemControl item={item} groupItem={groupItem} />
        </span>
      </TooltipTrigger>
      <TooltipContent sideOffset={8}>{item.tooltip}</TooltipContent>
    </Tooltip>
  );
}

type ToggleItemControlProps = {
  item: EditorMenuItem;
  groupItem?: boolean;
} & Omit<ComponentPropsWithoutRef<'button'>, 'value'>;

const ToggleItemControl = forwardRef<HTMLButtonElement, ToggleItemControlProps>(
  ({ item, groupItem = false, className, ...triggerProps }, ref) => {
    const controlClassName = cn(
      'size-7! min-w-7! px-2.5 disabled:cursor-not-allowed',
      className
    );
    const content = item.icon ? (
      <span className="flex size-3 items-center justify-center [&_svg]:size-3 [&_svg]:shrink-0 [&_svg]:stroke-[2.5]">
        {item.icon}
      </span>
    ) : (
      <span className="text-muted-foreground text-sm font-medium">
        {item.name}
      </span>
    );

    if (groupItem) {
      return (
        <ToggleGroupCompatItem
          ref={ref}
          value={item.name ?? ''}
          pressed={!!item.isActive?.()}
          onClick={() => item.command?.()}
          aria-label={item.tooltip ?? item.name}
          disabled={item.disbabled}
          className={controlClassName}
          type="button"
          {...triggerProps}
        >
          {content}
        </ToggleGroupCompatItem>
      );
    }

    return (
      <Toggle
        ref={ref}
        pressed={!!item.isActive?.()}
        onPressedChange={() => item.command?.()}
        aria-label={item.tooltip ?? item.name}
        disabled={item.disbabled}
        className={controlClassName}
        {...triggerProps}
      >
        {content}
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
        icon: <IconPlaceholder
  lucide="BoldIcon"
  tabler="IconBold"
  hugeicons="TextBoldIcon"
  phosphor="TextB"
  remixicon="RiBold"
/>,
        tooltip: t('toolbar.bold'),
      },
      {
        name: 'italic',
        command: () => editor.chain().focus().toggleItalic().run(),
        isActive: () => editor.isActive('italic'),
        group: 'mark',
        icon: <IconPlaceholder
  lucide="ItalicIcon"
  tabler="IconItalic"
  hugeicons="TextItalicIcon"
  phosphor="TextItalic"
  remixicon="RiItalic"
/>,
        tooltip: t('toolbar.italic'),
      },
      {
        name: 'underline',
        command: () => editor.chain().focus().toggleUnderline().run(),
        isActive: () => editor.isActive('underline'),
        group: 'mark',
        icon: <IconPlaceholder
  lucide="UnderlineIcon"
  tabler="IconUnderline"
  hugeicons="TextUnderlineIcon"
  phosphor="TextUnderline"
  remixicon="RiUnderline"
/>,
        tooltip: t('toolbar.underline'),
      },
      {
        name: 'strike',
        command: () => editor.chain().focus().toggleStrike().run(),
        isActive: () => editor.isActive('strike'),
        group: 'mark',
        icon: <IconPlaceholder
  lucide="StrikethroughIcon"
  tabler="IconStrikethrough"
  hugeicons="TextStrikethroughIcon"
  phosphor="TextStrikethrough"
  remixicon="RiStrikethrough"
/>,
        tooltip: t('toolbar.strikethrough'),
      },
      {
        name: 'delete-line',
        command: () =>
          editor.chain().focus().selectParentNode().deleteSelection().run(),
        isActive: () => false,
        group: 'mark',
        icon: <IconPlaceholder
  lucide="EraserIcon"
  tabler="IconEraser"
  hugeicons="EraserIcon"
  phosphor="Eraser"
  remixicon="RiEraserLine"
/>,
        tooltip: t('block.clearLine.title'),
      },
      {
        name: 'divider',
        command: () => editor.chain().focus().setHorizontalRule().run(),
        isActive: () => editor.isActive('horizontalRule'),
        group: 'custom',
        icon: <IconPlaceholder
  lucide="SeparatorHorizontal"
  tabler="IconSeparatorHorizontal"
  hugeicons="MinusSignIcon"
  phosphor="Minus"
  remixicon="RiSeparator"
/>,
        tooltip: t('block.divider.title'),
      },
      {
        name: 'link',
        group: 'custom',
        tooltip: t('toolbar.link'),
        render: <ToolbarLink editor={editor} />,
      },
      {
        name: 'left',
        command: () => editor.chain().focus().setTextAlign('left').run(),
        isActive: () => editor.isActive({ textAlign: 'left' }),
        group: 'alignment',
        icon: <IconPlaceholder
  lucide="AlignLeft"
  tabler="IconAlignLeft"
  hugeicons="TextAlignLeftIcon"
  phosphor="TextAlignLeft"
  remixicon="RiAlignLeft"
/>,
        tooltip: t('alignment.left'),
      },
      {
        name: 'center',
        command: () => editor.chain().focus().setTextAlign('center').run(),
        isActive: () => editor.isActive({ textAlign: 'center' }),
        group: 'alignment',
        icon: <IconPlaceholder
  lucide="AlignCenter"
  tabler="IconAlignCenter"
  hugeicons="TextAlignCenterIcon"
  phosphor="TextAlignCenter"
  remixicon="RiAlignCenter"
/>,
        tooltip: t('alignment.center'),
      },
      {
        name: 'right',
        command: () => editor.chain().focus().setTextAlign('right').run(),
        isActive: () => editor.isActive({ textAlign: 'right' }),
        group: 'alignment',
        icon: <IconPlaceholder
  lucide="AlignRight"
  tabler="IconAlignRight"
  hugeicons="TextAlignRightIcon"
  phosphor="TextAlignRight"
  remixicon="RiAlignRight"
/>,
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
    <div
      className={cn(
        'flex min-w-0 flex-wrap items-center gap-2',
        config?.toolbarClassName
      )}
    >
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
    const activeValue =
      groupItems.find((item) => item.isActive?.())?.name ?? '';
    return (
      <ToggleGroupCompat
        selectionMode="single"
        value={activeValue}
        className="gap-1"
      >
        {groupItems.map((item) => (
          <ToggleItem key={item.name} item={item} groupItem />
        ))}
      </ToggleGroupCompat>
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
    const activeValues = toggleItems
      .filter((item) => item.isActive?.())
      .map((item) => item.name!);
    return (
      <>
        <ToggleGroupCompat
          selectionMode="multiple"
          value={activeValues}
          className="gap-1"
        >
          {toggleItems.map((item) => (
            <ToggleItem key={item.name} item={item} groupItem />
          ))}
        </ToggleGroupCompat>
        {actionItems.map((item) => (
          <BubbleMenuButton key={item.name} {...item} />
        ))}
      </>
    );
  }

  // Everything else (divider, link, …) stays a plain action button.
  return groupItems.map((item) => (
    <Fragment key={item.name}>
      {item.render ?? <BubbleMenuButton {...item} />}
    </Fragment>
  ));
}
