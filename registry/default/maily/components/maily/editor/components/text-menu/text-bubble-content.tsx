import { BoldIcon, CodeIcon, ItalicIcon, List, ListOrdered, StrikethroughIcon, UnderlineIcon } from "lucide-react"
import { Editor } from '@tiptap/core';
import { BubbleMenuItem } from './text-bubble-menu';

import { BubbleMenuButton } from '../bubble-menu-button';
import { AlignmentSwitch } from '../alignment-switch';
import { TextDirectionSwitch } from '../text-direction-switch';
import { useTextMenuState } from './use-text-menu-state';
import { LinkInputPopover } from '../ui/link-input-popover';
import { Divider } from '../ui/divider';
import { ColorPicker } from '../ui/color-picker';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useMailyContext } from '../../provider';

type TextBubbleContentProps = {
  editor: Editor;
  showListMenu?: boolean;
};

export function TextBubbleContent(props: TextBubbleContentProps) {
  const { editor, showListMenu = true } = props;

  const { t } = useMailyContext();
  const state = useTextMenuState(editor);
  const colors = editor?.storage.color.colors as Set<string>;
  const suggestedColors = Array?.from(colors)?.reverse()?.slice(0, 6) ?? [];

  const items: BubbleMenuItem[] = [
    {
      name: 'bold',
      isActive: () => editor?.isActive('bold')!,
      command: () => editor?.chain().focus().toggleBold().run()!,
      icon: BoldIcon,
      tooltip: t('toolbar.bold'),
    },
    {
      name: 'italic',
      isActive: () => editor?.isActive('italic')!,
      command: () => editor?.chain().focus().toggleItalic().run()!,
      icon: ItalicIcon,
      tooltip: t('toolbar.italic'),
    },
    {
      name: 'underline',
      isActive: () => editor?.isActive('underline')!,
      command: () => editor?.chain().focus().toggleUnderline().run()!,
      icon: UnderlineIcon,
      tooltip: t('toolbar.underline'),
    },
    {
      name: 'strike',
      isActive: () => editor?.isActive('strike')!,
      command: () => editor?.chain().focus().toggleStrike().run()!,
      icon: StrikethroughIcon,
      tooltip: t('toolbar.strikethrough'),
    },
    {
      name: 'code',
      isActive: () => editor?.isActive('code')!,
      command: () => editor?.chain().focus().toggleCode().run()!,
      icon: CodeIcon,
      tooltip: t('toolbar.code'),
    },
  ];

  return (
    <>
      <ToggleGroup
        type="multiple"
        value={items
          .filter((item) => item.isActive?.())
          .map((item) => item.name!)}
      >
        {items.map((item) => (
          <Tooltip key={item.name}>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value={item.name!}
                aria-label={item.name}
                onClick={item.command}
                disabled={item.disbabled}
                className="size-7! px-2.5 disabled:cursor-not-allowed"
              >
                {item.icon ? (
                  <item.icon className="h-3 w-3 shrink-0 stroke-[2.5]" />
                ) : (
                  <span className="text-muted-foreground text-sm font-medium">
                    {item.name}
                  </span>
                )}
              </ToggleGroupItem>
            </TooltipTrigger>
            {item.tooltip ? (
              <TooltipContent sideOffset={8}>{item.tooltip}</TooltipContent>
            ) : null}
          </Tooltip>
        ))}
      </ToggleGroup>

      <AlignmentSwitch
        alignment={state.textAlign}
        onAlignmentChange={(alignment) => {
          editor?.chain().focus().setTextAlign(alignment).run();
        }}
      />

      <TextDirectionSwitch
        direction={state.textDirection}
        onDirectionChange={(direction) => {
          if (state.isFooterActive) {
            editor?.chain().focus().setFooterTextDirection(direction).run();
          } else if (state.isHeadingActive) {
            editor
              ?.chain()
              .focus()
              .updateAttributes('heading', { textDirection: direction })
              .run();
          } else {
            editor?.chain().focus().setTextDirection(direction).run();
          }
        }}
      />

      {!state.isListActive && showListMenu && (
        <>
          <BubbleMenuButton
            icon={List}
            command={() => {
              editor.chain().focus().toggleBulletList().run();
            }}
            tooltip={t('toolbar.bulletList')}
          />
          <BubbleMenuButton
            icon={ListOrdered}
            command={() => {
              editor.chain().focus().toggleOrderedList().run();
            }}
            tooltip={t('toolbar.orderedList')}
          />
        </>
      )}

      <LinkInputPopover
        defaultValue={state?.linkUrl ?? ''}
        onValueChange={(value, isVariable) => {
          if (!value) {
            editor
              ?.chain()
              .focus()
              .extendMarkRange('link')
              .unsetLink()
              .unsetUnderline()
              .run();
            return;
          }

          editor
            ?.chain()
            .extendMarkRange('link')
            .setLink({ href: value })
            .setIsUrlVariable(isVariable ?? false)
            .setUnderline()
            .run()!;
        }}
        tooltip={t('toolbar.link')}
        editor={editor}
        isVariable={state.isUrlVariable}
      />

      <Divider />

      <ColorPicker
        color={state.currentTextColor}
        onColorChange={(color) => {
          editor?.chain().setColor(color).run();
        }}
        tooltip={t('toolbar.textColor')}
        suggestedColors={suggestedColors}
      >
        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="h-7 w-7 shrink-0 p-0"
        >
          <div className="flex flex-col items-center justify-center gap-px">
            <span className="font-bolder text-foreground font-mono text-xs">
              A
            </span>
            <div
              className="h-[2px] w-3"
              style={{ backgroundColor: state.currentTextColor }}
            />
          </div>
        </Button>
      </ColorPicker>
    </>
  );
}
