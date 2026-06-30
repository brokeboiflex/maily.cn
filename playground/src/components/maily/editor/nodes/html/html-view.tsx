import { cn } from '@/lib/utils';
import { NodeViewProps } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { useMemo } from 'react';
import { HtmlCodeBlockAttributes } from './html';

// highlight.js token colors for the HTML code view. These are literal
// syntax-theme colors (a code palette is its own thing, not the host's shadcn
// tokens), applied to the lowlight-generated `.hljs-*` spans via arbitrary
// variants so no editor stylesheet is required.
const HLJS_CLASS = [
  '[&_code]:bg-transparent [&_code]:text-inherit',
  '[&_:is(.hljs-comment,.hljs-quote)]:text-[#616161]',
  '[&_:is(.hljs-variable,.hljs-template-variable,.hljs-attribute,.hljs-regexp,.hljs-link,.hljs-selector-id,.hljs-selector-class,.hljs-name)]:text-[#00c951]',
  '[&_.hljs-tag]:text-[#313233]',
  '[&_:is(.hljs-number,.hljs-built\\_in,.hljs-builtin-name,.hljs-literal,.hljs-type,.hljs-params,.hljs-string,.hljs-symbol,.hljs-bullet,.hljs-selector-tag)]:text-[#2b7fff]',
  '[&_:is(.hljs-meta,.hljs-keyword)]:text-[#313233d6]',
  '[&_:is(.hljs-title,.hljs-section)]:text-[#faf594]',
  '[&_.hljs-attr]:text-[#ad46ff]',
  '[&_.hljs-emphasis]:italic [&_.hljs-strong]:font-bold',
].join(' ');

export function HTMLCodeBlockView(props: NodeViewProps) {
  const { node, updateAttributes } = props;

  let { language, activeTab = 'code' } = node.attrs as HtmlCodeBlockAttributes;
  activeTab ||= 'code';

  const languageClass = language ? `language-${language}` : '';

  const html = useMemo(() => {
    const text = node.content.content.reduce((acc, cur) => {
      if (cur.type.name === 'text') {
        return acc + cur.text;
      } else if (cur.type.name === 'variable') {
        const { id: variable, fallback } = cur?.attrs || {};
        const formattedVariable = fallback
          ? `{{${variable},fallback=${fallback}}}`
          : `{{${variable}}}`;
        return acc + formattedVariable;
      }

      return acc;
    }, '');

    const htmlParser = new DOMParser();
    const htmlDoc = htmlParser.parseFromString(text, 'text/html');
    const style = htmlDoc.querySelectorAll('style');
    const body = htmlDoc.body;
    const combinedStyle = Array.from(style)
      .map((s) => s.innerHTML)
      .join('\n');

    return `<style>${combinedStyle}</style>${body.innerHTML}`;
  }, [activeTab]);

  const isEmpty = html === '';

  return (
    <NodeViewWrapper
      draggable={false}
      data-drag-handle={false}
      data-type="htmlCodeBlock"
    >
      {activeTab === 'code' && (
        <pre
          className={cn(
            'border-border bg-background text-foreground my-0 rounded-lg border p-2',
            HLJS_CLASS
          )}
        >
          <NodeViewContent
            as="code"
            className={cn('is-editable', languageClass)}
          />
        </pre>
      )}

      {activeTab === 'preview' && (
        <div
          className={cn(
            'not-prose border-border rounded-lg border p-2',
            isEmpty && 'min-h-[42px]'
          )}
          ref={(node) => {
            if (!node || node?.shadowRoot) {
              return;
            }
            const shadow = node.attachShadow({ mode: 'open' });
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(`
              * { font-family: 'Inter', sans-serif; }
              blockquote, h1, h2, h3, img, li, ol, p, ul {
                margin-top: 0;
                margin-bottom: 0;
              }
            `);
            shadow.adoptedStyleSheets = [sheet];
            const container = document.createElement('div');
            container.innerHTML = html;
            shadow.appendChild(container);
          }}
          contentEditable={false}
          onClick={() => {
            if (!isEmpty) {
              return;
            }

            updateAttributes({
              activeTab: 'code',
            });
          }}
        />
      )}
    </NodeViewWrapper>
  );
}
