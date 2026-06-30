import type { BlockItem } from './types';
import type { TranslateFn } from '../editor/i18n';
import { ColumnsIcon, RectangleHorizontal, Repeat2, MoveVertical, Minus } from "lucide-react";

export const columns = (t: TranslateFn): BlockItem => ({
  title: t('block.columns.title'),
  description: t('block.columns.description'),
  searchTerms: ['layout', 'columns'],
  icon: <ColumnsIcon className="h-4 w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor
      .chain()
      .focus()
      .deleteRange(range)
      // @ts-ignore
      .setColumns()
      .focus(editor.state.selection.head - 2)
      .run();
  },
});

export const section = (t: TranslateFn): BlockItem => ({
  title: t('block.section.title'),
  description: t('block.section.description'),
  searchTerms: ['layout', 'section'],
  icon: <RectangleHorizontal className="h-4 w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).setSection().run();
  },
});

export const repeat = (t: TranslateFn): BlockItem => ({
  title: t('block.repeat.title'),
  description: t('block.repeat.description'),
  searchTerms: ['repeat', 'for', 'loop'],
  icon: <Repeat2 className="h-4 w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).setRepeat().run();
  },
});

export const spacer = (t: TranslateFn): BlockItem => ({
  title: t('block.spacer.title'),
  description: t('block.spacer.description'),
  searchTerms: ['space', 'gap', 'divider'],
  icon: <MoveVertical className="h-4 w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).setSpacer({ height: 'sm' }).run();
  },
});

export const divider = (t: TranslateFn): BlockItem => ({
  title: t('block.divider.title'),
  description: t('block.divider.description'),
  searchTerms: ['divider', 'line'],
  icon: <Minus className="h-4 w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).setHorizontalRule().run();
  },
});
