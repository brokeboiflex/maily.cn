import { IconPlaceholder } from "@/components/icon-placeholder"
import type { BlockItem } from './types';
import type { TranslateFn } from '../editor/i18n';
import { DEFAULT_SPACER_HEIGHT } from '../editor/nodes/spacer';
import { getVariableOptions } from '../editor/utils/node-options';
import { hasVariables } from '../editor/utils/variable';

export const columns = (t: TranslateFn): BlockItem => ({
  title: t('block.columns.title'),
  description: t('block.columns.description'),
  searchTerms: ['layout', 'columns'],
  icon: <IconPlaceholder
  lucide="ColumnsIcon"
  tabler="IconColumns"
  hugeicons="LayoutTwoColumnIcon"
  phosphor="Columns"
  remixicon="RiLayoutColumnLine"
  className="h-4 w-4"
/>,
  command: ({ editor, range }) => {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .setColumns()
      .focus(editor.state.selection.head - 2)
      .run();
  },
});

export const section = (t: TranslateFn): BlockItem => ({
  title: t('block.section.title'),
  description: t('block.section.description'),
  searchTerms: ['layout', 'section'],
  icon: <IconPlaceholder
  lucide="RectangleHorizontal"
  tabler="IconRectangle"
  hugeicons="Square01Icon"
  phosphor="Rectangle"
  remixicon="RiRectangleLine"
  className="h-4 w-4"
/>,
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).setSection().run();
  },
});

export const repeat = (t: TranslateFn): BlockItem => ({
  title: t('block.repeat.title'),
  description: t('block.repeat.description'),
  searchTerms: ['repeat', 'for', 'loop'],
  render: (editor) =>
    hasVariables(getVariableOptions(editor).variables) ? true : null,
  icon: <IconPlaceholder
  lucide="Repeat2"
  tabler="IconRepeat"
  hugeicons="RepeatIcon"
  phosphor="Repeat"
  remixicon="RiRepeatLine"
  className="h-4 w-4"
/>,
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).setRepeat().run();
  },
});

export const spacer = (t: TranslateFn): BlockItem => ({
  title: t('block.spacer.title'),
  description: t('block.spacer.description'),
  searchTerms: ['space', 'gap', 'divider'],
  icon: <IconPlaceholder
  lucide="MoveVertical"
  tabler="IconArrowsVertical"
  hugeicons="MoveIcon"
  phosphor="ArrowsVertical"
  remixicon="RiExpandUpDownLine"
  className="h-4 w-4"
/>,
  command: ({ editor, range }) => {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .setSpacer({ height: DEFAULT_SPACER_HEIGHT })
      .run();
  },
});

export const divider = (t: TranslateFn): BlockItem => ({
  title: t('block.divider.title'),
  description: t('block.divider.description'),
  searchTerms: ['divider', 'line'],
  icon: <IconPlaceholder
  lucide="Minus"
  tabler="IconMinus"
  hugeicons="MinusSignIcon"
  phosphor="Minus"
  remixicon="RiSubtractLine"
  className="h-4 w-4"
/>,
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).setHorizontalRule().run();
  },
});
