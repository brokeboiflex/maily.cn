'use client';

import { type BlockGroupItem } from '@/blocks/types';
import type { Editor } from '@tiptap/core';
import { createContext, useContext } from 'react';
import { getDefaultBlocks } from './extensions/slash-command/default-slash-commands';
import {
  defaultLabels,
  englishTranslator,
  type MailyLabels,
  type TranslateFn,
} from './i18n';
import { type createDeferredEditorActions } from './utils/deferred-editor-action';
import { type MailyFontProvider } from './fonts/font-provider';

/** Link inputs show no example URL unless the host passes `placeholderUrl`. */
export const DEFAULT_PLACEHOLDER_URL = '';

export type MailyContextType = {
  editor?: Editor;
  /**
   * Whether the editor accepts edits. NodeViews do not re-render when only
   * editability changes; this value changing re-renders every context
   * consumer, so their render-time `editor.isEditable` reads stay current.
   */
  editable?: boolean;
  editorActions?: ReturnType<typeof createDeferredEditorActions>;
  placeholderUrl?: string;
  /**
   * Where fonts come from. Without one there is no font picker and the
   * editor loads no fonts; pass `fontsourceFontProvider` for Fontsource.
   */
  fontProvider?: MailyFontProvider;
  blocks?: BlockGroupItem[];
  labels: MailyLabels;
  t: TranslateFn;
};

export const MailyContext = createContext<MailyContextType>({
  placeholderUrl: DEFAULT_PLACEHOLDER_URL,
  blocks: getDefaultBlocks(englishTranslator),
  labels: { ...defaultLabels },
  t: englishTranslator,
});

export function useMailyContext() {
  const values = useContext(MailyContext);
  if (!values) {
    throw new Error('Missing MailyContext.Provider in the component tree');
  }

  return values;
}
