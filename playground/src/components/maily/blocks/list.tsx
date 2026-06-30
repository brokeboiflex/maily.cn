import { List, ListOrdered } from "lucide-react"
import type { BlockItem } from './types';
import type { TranslateFn } from '../editor/i18n';

export const bulletList = (t: TranslateFn): BlockItem => ({
  title: t('block.bulletList.title'),
  description: t('block.bulletList.description'),
  searchTerms: ['unordered', 'point'],
  icon: <List className="h-4 w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).toggleBulletList().run();
  },
});

export const orderedList = (t: TranslateFn): BlockItem => ({
  title: t('block.orderedList.title'),
  description: t('block.orderedList.description'),
  searchTerms: ['ordered'],
  icon: <ListOrdered className="h-4 w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).toggleOrderedList().run();
  },
});
