'use client';

import { type BlockGroupItem } from '@/blocks/types';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useLayoutEffect,
} from 'react';
import { getDefaultBlocks } from './extensions/slash-command/default-slash-commands';
import {
  defaultLabels,
  englishTranslator,
  type MailyLabels,
  type TranslateFn,
} from './i18n';

import type { Editor } from '@tiptap/core';
import { createDeferredEditorActions } from './utils/deferred-editor-action';

export const DEFAULT_PLACEHOLDER_URL = 'https://maily.to/';

export type MailyContextType = {
  editor?: Editor;
  editorActions?: ReturnType<typeof createDeferredEditorActions>;
  placeholderUrl?: string;
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

type MailyProviderProps = PropsWithChildren<MailyContextType>;

export function MailyProvider(props: MailyProviderProps) {
  const { children, ...values } = props;
  const editorActions = useMemo(
    () =>
      values.editor ? createDeferredEditorActions(values.editor) : undefined,
    [values.editor]
  );
  useLayoutEffect(() => () => editorActions?.invalidate(), [editorActions]);
  const value = useMemo(
    () => ({ ...values, editorActions }),
    [
      values.placeholderUrl,
      values.blocks,
      values.labels,
      values.t,
      values.editor,
      editorActions,
    ]
  );

  return (
    <MailyContext.Provider value={value}>{children}</MailyContext.Provider>
  );
}

export function useMailyContext() {
  const values = useContext(MailyContext);
  if (!values) {
    throw new Error('Missing MailyContext.Provider in the component tree');
  }

  return values;
}
