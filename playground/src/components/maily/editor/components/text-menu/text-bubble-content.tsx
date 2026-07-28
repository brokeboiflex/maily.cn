import { Editor } from '@tiptap/core';
import { type BubbleMenuItem } from './text-bubble-menu';

import { BubbleMenuButton } from '../bubble-menu-button';
import { AlignmentSwitch } from '../alignment-switch';
import { TextDirectionSwitch } from '../text-direction-switch';
import { useTextMenuState } from './use-text-menu-state';
import { LinkInputPopover } from '../ui/link-input-popover';
import { Separator } from '@/components/ui/separator';
import { ColorPicker } from '../ui/color-picker';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMailyContext } from '../../provider';
import {
  ToggleGroupCompat,
  ToggleGroupCompatItem,
} from '../ui/toggle-group-compat';
import { FontFamilyPicker } from './font-family-picker';
import { FontSizePicker } from './font-size-picker';
import { BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, CodeIcon, List, ListOrdered } from "lucide-react";

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
      icon: <BoldIcon
/>,
      tooltip: t('toolbar.bold'),
    },
    {
      name: 'italic',
      isActive: () => editor?.isActive('italic')!,
      command: () => editor?.chain().focus().toggleItalic().run()!,
      icon: <ItalicIcon
/>,
      tooltip: t('toolbar.italic'),
    },
    {
      name: 'underline',
      isActive: () => editor?.isActive('underline')!,
      command: () => editor?.chain().focus().toggleUnderline().run()!,
      icon: <UnderlineIcon
/>,
      tooltip: t('toolbar.underline'),
    },
    {
      name: 'strike',
      isActive: () => editor?.isActive('strike')!,
      command: () => editor?.chain().focus().toggleStrike().run()!,
      icon: <StrikethroughIcon
/>,
      tooltip: t('toolbar.strikethrough'),
    },
    {
      name: 'code',
      isActive: () => editor?.isActive('code')!,
      command: () => editor?.chain().focus().toggleCode().run()!,
      icon: <CodeIcon
/>,
      tooltip: t('toolbar.code'),
    },
  ];

  return (
    <>
      <FontFamilyPicker editor={editor} currentFont={state.currentFont} />
      <FontSizePicker
        value={state.currentFontSize}
        onValueChange={(value) => {
          if (value) {
            editor.chain().focus().setFontSize(value).run();
            return;
          }

          editor.chain().focus().unsetFontSize().run();
        }}
      />

      <Separator orientation="vertical" />

      <ToggleGroupCompat
        selectionMode="multiple"
        value={items
          .filter((item) => item.isActive?.())
          .map((item) => item.name!)}
        className="gap-0.5"
      >
        {items.map((item) => (
          <Tooltip key={item.name}>
            <TooltipTrigger asChild>
              <span className="inline-flex shrink-0">
                <ToggleGroupCompatItem
                  value={item.name ?? ''}
                  pressed={!!item.isActive?.()}
                  onClick={() => item.command?.()}
                  aria-label={item.tooltip ?? item.name}
                  disabled={item.disbabled}
                  className="size-7! min-w-7! px-2.5 disabled:cursor-not-allowed"
                  type="button"
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
                </ToggleGroupCompatItem>
              </span>
            </TooltipTrigger>
            {item.tooltip ? (
              <TooltipContent sideOffset={8}>{item.tooltip}</TooltipContent>
            ) : null}
          </Tooltip>
        ))}
      </ToggleGroupCompat>

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
            icon={<List
/>}
            command={() => {
              editor.chain().focus().toggleBulletList().run();
            }}
            tooltip={t('toolbar.bulletList')}
          />
          <BubbleMenuButton
            icon={<ListOrdered
/>}
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

      <Separator orientation="vertical" />

      <ColorPicker
        color={state.currentTextColor}
        onColorChange={(color) => {
          editor?.chain().setColor(color).run();
        }}
        tooltip={t('toolbar.textColor')}
        suggestedColors={suggestedColors}
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
      </ColorPicker>
    </>
  );
}
