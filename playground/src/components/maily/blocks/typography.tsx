import type { BlockItem } from './types';
import type { TranslateFn } from '../editor/i18n';
import { Text, Heading1, Heading2, Heading3, DivideIcon, TextQuote, FootprintsIcon, EraserIcon } from "lucide-react";

export const text = (t: TranslateFn): BlockItem => ({
  title: t('block.text.title'),
  description: t('block.text.description'),
  searchTerms: ['p', 'paragraph'],
  icon: <Text className="h-4 w-4" />,
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
  icon: <Heading1 className="h-4 w-4" />,
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
  icon: <Heading2 className="h-4 w-4" />,
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
  icon: <Heading3 className="h-4 w-4" />,
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
  icon: <DivideIcon className="h-4 w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).setHardBreak().run();
  },
});

export const blockquote = (t: TranslateFn): BlockItem => ({
  title: t('block.blockquote.title'),
  description: t('block.blockquote.description'),
  searchTerms: ['quote', 'blockquote'],
  icon: <TextQuote className="h-4 w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).toggleBlockquote().run();
  },
});

export const footer = (t: TranslateFn): BlockItem => ({
  title: t('block.footer.title'),
  description: t('block.footer.description'),
  searchTerms: ['footer', 'text'],
  icon: <FootprintsIcon className="h-4 w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).setFooter().run();
  },
});

export const clearLine = (t: TranslateFn): BlockItem => ({
  title: t('block.clearLine.title'),
  description: t('block.clearLine.description'),
  searchTerms: ['clear', 'line'],
  icon: <EraserIcon className="h-4 w-4" />,
  command: ({ editor }) => {
    // @ts-ignore
    editor.chain().focus().selectParentNode().deleteSelection().run();
  },
});
