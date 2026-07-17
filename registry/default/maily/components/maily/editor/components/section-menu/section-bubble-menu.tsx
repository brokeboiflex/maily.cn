import { IconPlaceholder } from "@/components/icon-placeholder"
import { deleteNode } from '../../utils/delete-node';
import { isTextSelected } from '../../utils/is-text-selected';
import { BubbleMenu, findChildren } from '@tiptap/react';
import { useCallback } from 'react';
import { sticky } from 'tippy.js';
import { getRenderContainer } from '../../utils/get-render-container';
import { AlignmentSwitch } from '../alignment-switch';
import { Button } from '@/components/ui/button';
import { BubbleMenuButton } from '../bubble-menu-button';
import { ColumnsBubbleMenuContent } from '../column-menu/columns-bubble-menu-content';
import { MarginIcon } from '../icons/margin-icon';
import { PaddingIcon } from '../icons/padding-icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ShowPopover } from '../show-popover';
import { type EditorBubbleMenuProps } from '../text-menu/text-bubble-menu';
import { ColorPicker } from '../ui/color-picker';
import { Separator } from '@/components/ui/separator';
import { Select } from '../ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useSectionState } from './use-section-state';
import { getClosestNodeByName } from '../../utils/columns';
import { spacing } from '../../utils/spacing';
import { useMailyContext } from '../../provider';
import type { LabelKey } from '../../i18n';
import { FLOATING_MENU_CLASS } from '../ui/floating-menu';

export function SectionBubbleMenu(props: EditorBubbleMenuProps) {
  const { appendTo, editor } = props;
  if (!editor) {
    return null;
  }

  const getReferenceClientRect = useCallback(() => {
    const renderContainer = getRenderContainer(editor!, 'section');
    const rect =
      renderContainer?.getBoundingClientRect() ||
      new DOMRect(-1000, -1000, 0, 0);

    return rect;
  }, [editor]);

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    ...(appendTo ? { appendTo: appendTo.current } : {}),
    shouldShow: ({ editor }) => {
      const activeSectionNode = getClosestNodeByName(editor, 'section');
      const repeatNodeChildren = activeSectionNode
        ? findChildren(activeSectionNode?.node, (node) => {
            return node.type.name === 'repeat';
          })?.[0]
        : null;
      const inlineImageNodeChildren = activeSectionNode
        ? findChildren(activeSectionNode?.node, (node) => {
            return node.type.name === 'inlineImage';
          })?.[0]
        : null;
      const hasActiveRepeatNodeChildren =
        repeatNodeChildren && editor.isActive('repeat');
      const hasActiveInlineImageNodeChildren =
        inlineImageNodeChildren && editor.isActive('inlineImage');

      if (
        isTextSelected(editor) ||
        hasActiveRepeatNodeChildren ||
        hasActiveInlineImageNodeChildren ||
        !editor.isEditable
      ) {
        return false;
      }

      return editor.isActive('section');
    },
    tippyOptions: {
      offset: [0, 8],
      popperOptions: {
        modifiers: [{ name: 'flip', enabled: false }],
      },
      getReferenceClientRect,
      appendTo: () => appendTo?.current,
      plugins: [sticky],
      sticky: 'popper',
      maxWidth: 'auto',
    },
    pluginKey: 'sectionBubbleMenu',
  };

  const state = useSectionState(editor);
  const { t } = useMailyContext();

  const borderRadiusOptions = [
    { value: '0', label: t('sectionMenu.radius.sharp') },
    { value: '6', label: t('sectionMenu.radius.smooth') },
    { value: '9999', label: t('sectionMenu.radius.round') },
  ];

  const spacingOptions = (noneKey: LabelKey) => [
    { value: '0', label: t(noneKey) },
    ...spacing.map((space) => ({
      label: t(`spacing.${space.short}` as LabelKey),
      value: String(space.value),
    })),
  ];

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      className={`${FLOATING_MENU_CLASS} flex items-stretch`}
    >
      <TooltipProvider>
        <AlignmentSwitch
          alignment={state.currentAlignment}
          onAlignmentChange={(alignment) => {
            editor?.commands?.updateSection({
              align: alignment,
            });
          }}
        />

        <Separator orientation="vertical" />

        <div className="flex gap-x-0.5">
          <Select
            label={t('sectionMenu.borderRadius')}
            value={String(state.currentBorderRadius)}
            options={borderRadiusOptions}
            onValueChange={(value) => {
              editor?.commands?.updateSection({
                borderRadius: Number(value),
              });
            }}
            tooltip={t('sectionMenu.borderRadius')}
            className="capitalize"
          />

          <Select
            label={t('sectionMenu.borderWidth')}
            value={String(state.currentBorderWidth)}
            options={[
              { value: '0', label: t('sectionMenu.borderWidth.none') },
              { value: '1', label: t('sectionMenu.borderWidth.thin') },
              { value: '2', label: t('sectionMenu.borderWidth.medium') },
              { value: '3', label: t('sectionMenu.borderWidth.thick') },
            ]}
            onValueChange={(value) => {
              editor?.commands?.updateSection({
                borderWidth: Number(value),
              });
            }}
            tooltip={t('sectionMenu.borderWidth')}
            className="capitalize"
          />
        </div>

        <Separator orientation="vertical" />

        <Select
          icon={<MarginIcon className="size-3.5 stroke-[1.2]" />}
          label={t('sectionMenu.margin')}
          value={String(state.currentMarginTop)}
          options={spacingOptions('sectionMenu.margin.none')}
          onValueChange={(_value) => {
            const value = Number(_value);
            editor?.commands?.updateSection({
              marginTop: value,
              marginRight: value,
              marginBottom: value,
              marginLeft: value,
            });
          }}
          tooltip={t('sectionMenu.margin')}
          className="capitalize"
        />

        <Separator orientation="vertical" />

        <Select
          icon={<PaddingIcon className="stroke-[1]" />}
          label={t('sectionMenu.padding')}
          value={String(state.currentPaddingTop)}
          options={spacingOptions('sectionMenu.padding.none')}
          onValueChange={(_value) => {
            const value = Number(_value);
            editor?.commands?.updateSection({
              paddingTop: value,
              paddingRight: value,
              paddingBottom: value,
              paddingLeft: value,
            });
          }}
          tooltip={t('sectionMenu.padding')}
          className="capitalize"
        />

        <Separator orientation="vertical" />

        <div className="flex gap-x-0.5">
          <ColorPicker
            color={state.currentBorderColor}
            onColorChange={(color) => {
              editor?.commands?.updateSection({
                borderColor: color,
              });
            }}
            tooltip={t('sectionMenu.borderColor')}
            borderColor={state.currentBorderColor}
          />
          <ColorPicker
            color={state.currentBackgroundColor}
            onColorChange={(color) => {
              editor?.commands?.updateSection({
                backgroundColor: color,
              });
            }}
            backgroundColor={state.currentBackgroundColor}
            tooltip={t('sectionMenu.backgroundColor')}
            className="border-background rounded-full border-[1.5px] shadow"
          />
        </div>

        <Separator orientation="vertical" />

        <BubbleMenuButton
          icon={<IconPlaceholder
  lucide="Trash"
  tabler="IconTrash"
  hugeicons="Delete02Icon"
  phosphor="Trash"
  remixicon="RiDeleteBinLine"
/>}
          tooltip={t('sectionMenu.delete')}
          command={() => {
            deleteNode(editor, 'section');
          }}
        />

        <Separator orientation="vertical" />

        <ShowPopover
          showIfKey={state.currentShowIfKey}
          onShowIfKeyValueChange={(value) => {
            editor.commands.updateSection({
              showIfKey: value,
            });
          }}
          editor={editor}
        />

        {state.isColumnsActive && (
          <>
            <Separator orientation="vertical" />
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="sm">
                  {t('sectionMenu.column')}
                  <IconPlaceholder
  lucide="ChevronUp"
  tabler="IconChevronUp"
  hugeicons="ChevronUpIcon"
  phosphor="CaretUp"
  remixicon="RiArrowUpSLine"
  className="size-3"
/>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0.5! w-max rounded-lg"
                side="top"
                sideOffset={8}
                align="end"
              >
                <ColumnsBubbleMenuContent editor={editor} />
              </PopoverContent>
            </Popover>
          </>
        )}
      </TooltipProvider>
    </BubbleMenu>
  );
}
