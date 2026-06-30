'use client';

import { BlockGroupItem } from '../blocks/types';
import { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import { getDefaultBlocks } from './extensions/slash-command/default-slash-commands';
import {
  defaultLabels,
  englishTranslator,
  type MailyLabels,
  type TranslateFn,
} from './i18n';

export const DEFAULT_PLACEHOLDER_URL = 'https://maily.to/';

export type MailyContextType = {
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
  const value = useMemo(
    () => values,
    [values.placeholderUrl, values.blocks, values.labels, values.t]
  );

  return <MailyContext.Provider value={value}>{children}</MailyContext.Provider>;
}

export function useMailyContext() {
  const values = useContext(MailyContext);
  if (!values) {
    throw new Error('Missing MailyContext.Provider in the component tree');
  }

  return values;
}
