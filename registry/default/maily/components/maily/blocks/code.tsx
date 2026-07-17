import { IconPlaceholder } from "@/components/icon-placeholder"
import { type BlockItem } from './types';
import type { TranslateFn } from '../editor/i18n';

export const htmlCodeBlock = (t: TranslateFn): BlockItem => ({
  title: t('block.htmlCodeBlock.title'),
  description: t('block.htmlCodeBlock.description'),
  searchTerms: ['html', 'code', 'custom'],
  icon: <IconPlaceholder
  lucide="CodeXmlIcon"
  tabler="IconCode"
  hugeicons="SourceCodeIcon"
  phosphor="Code"
  remixicon="RiCodeLine"
  className="h-4 w-4"
/>,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor
      .chain()
      .focus()
      .deleteRange(range)
      // @ts-ignore
      .setHtmlCodeBlock({ language: 'html' })
      .run();
  },
});
