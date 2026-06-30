'use client';

import {
  AnyExtension,
  FocusPosition,
  Editor as TiptapEditor,
} from '@tiptap/core';
import { EditorContent, JSONContent, useEditor } from '@tiptap/react';

import { useMemo, useRef } from 'react';
import { ColumnsBubbleMenu } from './components/column-menu/columns-bubble-menu';
import { ContentMenu } from './components/content-menu';
import { EditorMenuBar } from './components/editor-menu-bar';
import { HTMLBubbleMenu } from './components/html-menu/html-menu';
import { ImageBubbleMenu } from './components/image-menu/image-bubble-menu';
import { InlineImageBubbleMenu } from './components/inline-image-menu/inline-image-bubble-menu';
import { RepeatBubbleMenu } from './components/repeat-menu/repeat-bubble-menu';
import { SectionBubbleMenu } from './components/section-menu/section-bubble-menu';
import { SpacerBubbleMenu } from './components/spacer-menu/spacer-bubble-menu';
import { TextBubbleMenu } from './components/text-menu/text-bubble-menu';
import { VariableBubbleMenu } from './components/variable-menu/variable-bubble-menu';
import { extensions as defaultExtensions } from './extensions';
import { getDefaultBlocks } from './extensions/slash-command/default-slash-commands';
import {
  DEFAULT_PLACEHOLDER_URL,
  MailyContextType,
  MailyProvider,
} from './provider';
import {
  createTranslator,
  defaultLabels,
  type MailyLabels,
} from './i18n';
import { cn } from '@/lib/utils';
import { replaceDeprecatedNode } from './utils/replace-deprecated';

type ParitialMailContextType = Partial<MailyContextType>;

// Everything the editor's content area used to get from a dedicated stylesheet,
// expressed as token-based Tailwind so the writing surface follows the host's
// shadcn theme. `prose` comes from the consumer's @tailwindcss/typography plugin.
const EDITOR_CONTENT_CLASS = [
  // pl-14 is the left gutter the hover drag-handle floats in. It lives on the
  // content element (not the body wrapper) so the whole gutter is part of the
  // ProseMirror hover surface — moving the mouse there fires the plugin's
  // mousemove and reveals the handle, instead of only over the text.
  'prose w-full max-w-none pl-14 focus:outline-none',
  // prose colors -> shadcn tokens (keeps the canvas readable in light & dark)
  '[--tw-prose-body:var(--foreground)] [--tw-prose-headings:var(--foreground)] [--tw-prose-bold:var(--foreground)] [--tw-prose-links:var(--foreground)] [--tw-prose-quotes:var(--foreground)] [--tw-prose-code:var(--foreground)] [--tw-prose-bullets:var(--muted-foreground)] [--tw-prose-counters:var(--muted-foreground)] [--tw-prose-hr:var(--border)] [--tw-prose-quote-borders:var(--border)] text-foreground',
  // email-content typography sizing / spacing
  'prose-strong:text-current prose-headings:mt-0 prose-headings:mb-3 prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:text-[15px] prose-p:mb-5 prose-ol:mt-0 prose-ol:mb-5 prose-ul:mt-0 prose-ul:mb-5 prose-li:mb-2 prose-img:mt-0 prose-img:mb-8 prose-hr:my-8 prose-code:before:content-none prose-code:after:content-none',
  '[&_p.text-sm]:text-base [&_:is(h1,h2,h3,hr,table)+p]:mt-0',
  // ProseMirror text rendering
  "[font-variant-ligatures:none] [font-feature-settings:'liga'_0]",
  // variable-pill icon scales with heading level
  '[--variable-icon-size:12px] [--variable-icon-gap:4px] [&_h1]:[--variable-icon-size:28px] [&_h2]:[--variable-icon-size:24px] [&_h3]:[--variable-icon-size:20px] [&_:is(h1,h2,h3)]:[--variable-icon-gap:8px]',
  // block-node spacing
  '[&_.node-button]:mt-0 [&_.node-button]:mb-5 [&_.node-linkCard]:mt-0 [&_.node-linkCard]:mb-5 [&_.node-image]:mt-0 [&_.node-image]:mb-8 [&_.node-image]:leading-none [&_.node-image]:outline-none [&_.node-logo]:mt-0 [&_.node-logo]:mb-8',
  // spacer collapses surrounding margins
  '[&_.spacer+*]:mt-0 [&_*:has(+.spacer)]:mb-0!',
  // selected-node ring (literal accent blue, not theme-driven)
  "[&_.ProseMirror-selectednode]:after:content-[''] [&_.ProseMirror-selectednode]:after:absolute [&_.ProseMirror-selectednode]:after:-inset-0.5 [&_.ProseMirror-selectednode]:after:pointer-events-none [&_.ProseMirror-selectednode]:after:rounded-md [&_.ProseMirror-selectednode]:after:bg-[rgba(35,131,226,0.14)]",
  // gap cursor
  '[&_.ProseMirror-gapcursor]:after:w-6 [&_.ProseMirror-gapcursor]:after:border-[1.5px] [&_.ProseMirror-gapcursor]:after:border-solid [&_.ProseMirror-gapcursor]:after:border-foreground',
].join(' ');

export type EditorProps = {
  contentHtml?: string;
  contentJson?: JSONContent;
  onUpdate?: (editor: TiptapEditor) => void;
  onCreate?: (editor: TiptapEditor) => void;
  extensions?: AnyExtension[];
  config?: {
    hasMenuBar?: boolean;
    hideContextMenu?: boolean;
    spellCheck?: boolean;
    wrapClassName?: string;
    toolbarClassName?: string;
    contentClassName?: string;
    bodyClassName?: string;
    autofocus?: FocusPosition;
    immediatelyRender?: boolean;
  };
  editable?: boolean;
  scrollThreshold?: number;
  scrollMargin?: number;
  labels?: MailyLabels;
} & ParitialMailContextType;

export function Editor(props: EditorProps) {
  const {
    config: {
      wrapClassName = '',
      contentClassName = '',
      bodyClassName = '',
      hasMenuBar = true,
      hideContextMenu = false,
      spellCheck = false,
      autofocus = 'end',
      immediatelyRender = false,
    } = {},
    onCreate,
    onUpdate,
    extensions,
    contentHtml,
    contentJson,
    blocks,
    labels,
    editable = true,
    placeholderUrl = DEFAULT_PLACEHOLDER_URL,
    scrollThreshold = 40,
    scrollMargin = 40,
  } = props;

  const resolvedLabels: MailyLabels = labels ?? { ...defaultLabels };
  const t = useMemo(() => createTranslator(resolvedLabels), [resolvedLabels]);
  const resolvedBlocks = useMemo(
    () => blocks ?? getDefaultBlocks(t),
    [blocks, t]
  );

  const formattedContent = useMemo(() => {
    if (contentJson) {
      const json =
        contentJson?.type === 'doc'
          ? contentJson
          : ({
              type: 'doc',
              content: contentJson,
            } as JSONContent);

      return replaceDeprecatedNode(json);
    } else if (contentHtml) {
      return contentHtml;
    } else {
      return {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [],
          },
        ],
      };
    }
  }, [contentHtml, contentJson, replaceDeprecatedNode]);

  const menuContainerRef = useRef(null);
  const editor = useEditor({
    editorProps: {
      scrollThreshold,
      scrollMargin,
      attributes: {
        class: cn(EDITOR_CONTENT_CLASS, contentClassName),
        spellCheck: spellCheck ? 'true' : 'false',
      },
    },
    immediatelyRender,
    onCreate: ({ editor }) => {
      onCreate?.(editor);
    },
    onUpdate: ({ editor }) => {
      onUpdate?.(editor);
    },
    extensions: defaultExtensions({
      extensions,
      blocks: resolvedBlocks,
      t,
    }),
    content: formattedContent,
    autofocus,
    editable,
  });

  if (!editor) {
    return null;
  }

  return (
    <MailyProvider
      placeholderUrl={placeholderUrl}
      blocks={resolvedBlocks}
      labels={resolvedLabels}
      t={t}
    >
      <div
        id="mly-editor"
        className={cn(
          'mly-editor antialiased',
          editor.isEditable ? 'mly-editable' : 'mly-not-editable',
          wrapClassName
        )}
        ref={menuContainerRef}
      >
        {hasMenuBar && <EditorMenuBar config={props.config} editor={editor} />}
        <div
          className={cn(
            'border-border bg-background mt-4 rounded-lg border py-4 pr-4',
            bodyClassName
          )}
        >
          <TextBubbleMenu editor={editor} appendTo={menuContainerRef} />
          <ImageBubbleMenu editor={editor} appendTo={menuContainerRef} />
          <SpacerBubbleMenu editor={editor} appendTo={menuContainerRef} />
          <EditorContent editor={editor} />
          <SectionBubbleMenu editor={editor} appendTo={menuContainerRef} />
          <ColumnsBubbleMenu editor={editor} appendTo={menuContainerRef} />
          {!hideContextMenu && <ContentMenu editor={editor} />}
          <VariableBubbleMenu editor={editor} appendTo={menuContainerRef} />
          <RepeatBubbleMenu editor={editor} appendTo={menuContainerRef} />
          <HTMLBubbleMenu editor={editor} appendTo={menuContainerRef} />
          <InlineImageBubbleMenu editor={editor} appendTo={menuContainerRef} />
        </div>
      </div>
    </MailyProvider>
  );
}

export { defaultLabels, createTranslator } from './i18n';
export type { MailyLabels, LabelKey, TranslateFn } from './i18n';
