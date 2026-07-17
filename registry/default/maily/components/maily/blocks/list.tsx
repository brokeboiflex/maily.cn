import { IconPlaceholder } from "@/components/icon-placeholder"
import type { BlockItem } from './types';
import type { TranslateFn } from '../editor/i18n';

export const bulletList = (t: TranslateFn): BlockItem => ({
  title: t('block.bulletList.title'),
  description: t('block.bulletList.description'),
  searchTerms: ['unordered', 'point'],
  icon: <IconPlaceholder
  lucide="List"
  tabler="IconList"
  hugeicons="LeftToRightListBulletIcon"
  phosphor="ListBullets"
  remixicon="RiListUnordered"
  className="h-4 w-4"
/>,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).toggleBulletList().run();
  },
});

export const orderedList = (t: TranslateFn): BlockItem => ({
  title: t('block.orderedList.title'),
  description: t('block.orderedList.description'),
  searchTerms: ['ordered'],
  icon: <IconPlaceholder
  lucide="ListOrdered"
  tabler="IconListNumbers"
  hugeicons="LeftToRightListNumberIcon"
  phosphor="ListNumbers"
  remixicon="RiListOrdered"
  className="h-4 w-4"
/>,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).toggleOrderedList().run();
  },
});
