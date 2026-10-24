import { IconPlaceholder } from "@/components/icon-placeholder"
import type { BlockItem } from './types';
import type { TranslateFn } from '../editor/i18n';

export const button = (t: TranslateFn): BlockItem => ({
  title: t('block.button.title'),
  description: t('block.button.description'),
  searchTerms: ['link', 'button', 'cta'],
  icon: <IconPlaceholder
  lucide="MousePointer"
  tabler="IconPointer"
  hugeicons="Cursor01Icon"
  phosphor="Cursor"
  remixicon="RiCursorLine"
  className="h-4 w-4"
/>,
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).setButton().run();
  },
});

export const linkCard = (t: TranslateFn): BlockItem => ({
  title: t('block.linkCard.title'),
  description: t('block.linkCard.description'),
  searchTerms: ['link', 'button', 'image'],
  icon: <IconPlaceholder
  lucide="ArrowUpRightSquare"
  tabler="IconExternalLink"
  hugeicons="ArrowUpRight01Icon"
  phosphor="ArrowUpRight"
  remixicon="RiArrowRightUpLine"
  className="h-4 w-4"
/>,
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).setLinkCard().run();
  },
  render: (editor) => {
    return editor.extensionManager.extensions.findIndex(
      (ext) => ext.name === 'linkCard'
    ) === -1
      ? null
      : true;
  },
});
