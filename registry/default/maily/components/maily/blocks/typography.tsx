import { IconPlaceholder } from "@/components/icon-placeholder"
import type { BlockItem } from './types';
import type { TranslateFn } from '../editor/i18n';

export const text = (t: TranslateFn): BlockItem => ({
  title: t('block.text.title'),
  description: t('block.text.description'),
  searchTerms: ['p', 'paragraph'],
  icon: <IconPlaceholder
  lucide="Text"
  tabler="IconTypography"
  hugeicons="TextFontIcon"
  phosphor="TextT"
  remixicon="RiParagraph"
  className="h-4 w-4"
/>,
  command: ({ editor, range }) => {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .toggleNode('paragraph', 'paragraph')
      .run();
  },
});

export const heading1 = (t: TranslateFn): BlockItem => ({
  title: t('block.heading1.title'),
  description: t('block.heading1.description'),
  searchTerms: ['h1', 'title', 'big', 'large'],
  icon: <IconPlaceholder
  lucide="Heading1"
  tabler="IconH1"
  hugeicons="Heading01Icon"
  phosphor="TextHOne"
  remixicon="RiHeading"
  className="h-4 w-4"
/>,
  command: ({ editor, range }) => {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .setNode('heading', { level: 1 })
      .run();
  },
});

export const heading2 = (t: TranslateFn): BlockItem => ({
  title: t('block.heading2.title'),
  description: t('block.heading2.description'),
  searchTerms: ['h2', 'subtitle', 'medium'],
  icon: <IconPlaceholder
  lucide="Heading2"
  tabler="IconH2"
  hugeicons="Heading02Icon"
  phosphor="TextHTwo"
  remixicon="RiHeading"
  className="h-4 w-4"
/>,
  command: ({ editor, range }) => {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .setNode('heading', { level: 2 })
      .run();
  },
});

export const heading3 = (t: TranslateFn): BlockItem => ({
  title: t('block.heading3.title'),
  description: t('block.heading3.description'),
  searchTerms: ['h3', 'subtitle', 'small'],
  icon: <IconPlaceholder
  lucide="Heading3"
  tabler="IconH3"
  hugeicons="Heading03Icon"
  phosphor="TextHThree"
  remixicon="RiHeading"
  className="h-4 w-4"
/>,
  command: ({ editor, range }) => {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .setNode('heading', { level: 3 })
      .run();
  },
});

export const hardBreak = (t: TranslateFn): BlockItem => ({
  title: t('block.hardBreak.title'),
  description: t('block.hardBreak.description'),
  searchTerms: ['break', 'line'],
  icon: <IconPlaceholder
  lucide="DivideIcon"
  tabler="IconDivide"
  hugeicons="DivideSignIcon"
  phosphor="Divide"
  remixicon="RiDivideLine"
  className="h-4 w-4"
/>,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).setHardBreak().run();
  },
});

export const blockquote = (t: TranslateFn): BlockItem => ({
  title: t('block.blockquote.title'),
  description: t('block.blockquote.description'),
  searchTerms: ['quote', 'blockquote'],
  icon: <IconPlaceholder
  lucide="TextQuote"
  tabler="IconQuote"
  hugeicons="QuoteUpIcon"
  phosphor="Quotes"
  remixicon="RiDoubleQuotesL"
  className="h-4 w-4"
/>,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).toggleBlockquote().run();
  },
});

export const footer = (t: TranslateFn): BlockItem => ({
  title: t('block.footer.title'),
  description: t('block.footer.description'),
  searchTerms: ['footer', 'text'],
  icon: <IconPlaceholder
  lucide="FootprintsIcon"
  tabler="IconWalk"
  hugeicons="FootprintsIcon"
  phosphor="Footprints"
  remixicon="RiFootprintLine"
  className="h-4 w-4"
/>,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).setFooter().run();
  },
});

export const clearLine = (t: TranslateFn): BlockItem => ({
  title: t('block.clearLine.title'),
  description: t('block.clearLine.description'),
  searchTerms: ['clear', 'line'],
  icon: <IconPlaceholder
  lucide="EraserIcon"
  tabler="IconEraser"
  hugeicons="EraserIcon"
  phosphor="Eraser"
  remixicon="RiEraserLine"
  className="h-4 w-4"
/>,
  command: ({ editor }) => {
    // @ts-ignore
    editor.chain().focus().selectParentNode().deleteSelection().run();
  },
});
