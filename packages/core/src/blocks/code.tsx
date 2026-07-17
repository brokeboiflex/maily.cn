import { CodeXmlIcon } from 'lucide-react';
import { type BlockItem } from './types';
import type { TranslateFn } from '@/editor/i18n';

export const htmlCodeBlock = (t: TranslateFn): BlockItem => ({
  title: t('block.htmlCodeBlock.title'),
  description: t('block.htmlCodeBlock.description'),
  searchTerms: ['html', 'code', 'custom'],
  icon: <CodeXmlIcon className="h-4 w-4" />,
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
