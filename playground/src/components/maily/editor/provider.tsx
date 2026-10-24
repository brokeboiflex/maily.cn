'use client';

import { type PropsWithChildren, useMemo, useLayoutEffect } from 'react';
import { MailyContext, type MailyContextType } from './maily-context';
import { createDeferredEditorActions } from './utils/deferred-editor-action';

// The context moved to maily-context.ts; these re-exports keep earlier
// `./provider` imports (for example in custom NodeViews) compiling.
export {
  DEFAULT_PLACEHOLDER_URL,
  MailyContext,
  useMailyContext,
  type MailyContextType,
} from './maily-context';

type MailyProviderProps = PropsWithChildren<MailyContextType>;

export function MailyProvider(props: MailyProviderProps) {
  const {
    children,
    editor,
    editable,
    placeholderUrl,
    fontProvider,
    blocks,
    labels,
    t,
  } = props;
  const editorActions = useMemo(
    () => (editor ? createDeferredEditorActions(editor) : undefined),
    [editor]
  );
  useLayoutEffect(() => () => editorActions?.invalidate(), [editorActions]);
  const value = useMemo(
    () => ({
      editor,
      editable,
      placeholderUrl,
      fontProvider,
      blocks,
      labels,
      t,
      editorActions,
    }),
    [
      editor,
      editable,
      placeholderUrl,
      fontProvider,
      blocks,
      labels,
      t,
      editorActions,
    ]
  );

  return (
    <MailyContext.Provider value={value}>{children}</MailyContext.Provider>
  );
}
