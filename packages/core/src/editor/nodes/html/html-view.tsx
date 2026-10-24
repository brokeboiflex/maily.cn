import { updateNodeViewAttributes } from '@/editor/utils/update-attribute';
import { cn } from '@/editor/utils/classname';
import { Button } from '@/editor/components/base-button';
import { useMailyContext } from '@/editor/maily-context';
import { type NodeViewProps } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { type Attrs } from '@tiptap/pm/model';
import { useEffect, useMemo, useRef } from 'react';
import { type HtmlCodeBlockAttributes } from './html';

// The preview sits on the themed editor canvas: a transparent document whose
// text color and color scheme follow the host (see HtmlPreviewFrame). It uses
// the renderer's default email font (DEFAULT_FONT in @maily-to/shared), a
// system font, so the preview loads nothing from the network.
const PREVIEW_STYLE = `
* { font-family: 'Arial', sans-serif; }
html, body { margin: 0; background: transparent; }
body { display: flow-root; }
blockquote, h1, h2, h3, img, li, ol, p, ul { margin-top: 0; margin-bottom: 0; }
img { max-width: 100%; height: auto; }
`;

/**
 * Fits its height to the previewed content, including after width changes, and
 * mirrors the host theme: an iframe document cannot inherit the editor's color.
 */
function HtmlPreviewFrame(props: { title: string; html: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  useEffect(() => () => observerRef.current?.disconnect(), []);

  const applyHostTheme = () => {
    const frame = frameRef.current;
    const root = frame?.contentDocument?.documentElement;
    if (!frame || !root) return;
    const host = getComputedStyle(frame);
    // A matching color scheme keeps the frame transparent over the canvas.
    root.style.colorScheme = host.colorScheme;
    root.style.color = host.color;
  };
  // Host themes switch through an ancestor's class, style or data-* attribute,
  // the system color scheme, or a loaded stylesheet.
  useEffect(() => {
    const observer = new MutationObserver(applyHostTheme);
    for (let el = frameRef.current?.parentElement; el; el = el.parentElement)
      observer.observe(el, { attributes: true });
    const scheme = window.matchMedia?.('(prefers-color-scheme: dark)');
    scheme?.addEventListener('change', applyHostTheme);
    const onLoad = (event: Event) => {
      if (event.target instanceof HTMLLinkElement) applyHostTheme();
    };
    document.addEventListener('load', onLoad, true);
    return () => {
      observer.disconnect();
      scheme?.removeEventListener('change', applyHostTheme);
      document.removeEventListener('load', onLoad, true);
    };
  }, []);

  const fit = () => {
    const frame = frameRef.current;
    const body = frame?.contentDocument?.body;
    // The body's own height: the document is never shorter than the viewport.
    if (frame && body)
      frame.style.height = `${Math.ceil(body.getBoundingClientRect().height)}px`;
  };

  return (
    <iframe
      ref={frameRef}
      title={props.title}
      sandbox="allow-same-origin"
      srcDoc={props.html}
      className="block w-full border-0"
      onLoad={() => {
        observerRef.current?.disconnect();
        observerRef.current = null;
        applyHostTheme();
        fit();
        const body = frameRef.current?.contentDocument?.body;
        if (!body || typeof ResizeObserver === 'undefined') return;
        observerRef.current = new ResizeObserver(fit);
        observerRef.current.observe(body);
      }}
    />
  );
}

/** Authored markup, with variables written as Maily template tokens. */
function htmlBlockSource(node: NodeViewProps['node']) {
  let source = '';
  node.content.forEach((child) => {
    if (child.type.name === 'text') {
      source += child.text ?? '';
    } else if (child.type.name === 'variable') {
      const { id, fallback } = child.attrs ?? {};
      source += fallback ? `{{${id},fallback=${fallback}}}` : `{{${id}}}`;
    }
  });
  return source;
}

export function HTMLCodeBlockView(props: NodeViewProps) {
  const { node, editor } = props;
  const { t } = useMailyContext();
  const updateAttributes = (attrs: Attrs) =>
    updateNodeViewAttributes(props, attrs);

  const { language, activeTab: tab } = node.attrs as HtmlCodeBlockAttributes;
  const activeTab = tab || 'code';

  const languageClass = language ? `language-${language}` : '';
  const source = htmlBlockSource(node);
  const isEmpty = !source.trim();
  // Authored HTML may come from another author: preview it in a document that
  // cannot run scripts or event handlers in the editor's origin.
  const previewDocument = useMemo(
    () =>
      `<!doctype html><html><head><meta charset="utf-8"><style>${PREVIEW_STYLE}</style></head><body>${source}</body></html>`,
    [source]
  );

  return (
    <NodeViewWrapper
      draggable={false}
      data-drag-handle={false}
      data-type="htmlCodeBlock"
    >
      {activeTab === 'code' && (
        <pre
          className={cn(
            'border-border bg-background text-foreground my-0 rounded-lg border p-2 [&_code]:bg-transparent [&_code]:text-inherit'
          )}
        >
          <NodeViewContent<'code'>
            as="code"
            className={cn('is-editable', languageClass)}
          />
        </pre>
      )}

      {activeTab === 'preview' && (
        <div
          className="not-prose border-border rounded-lg border p-2"
          contentEditable={false}
        >
          {isEmpty ? (
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground h-auto min-h-[42px] w-full justify-start font-normal"
              disabled={!editor.isEditable}
              onClick={() => updateAttributes({ activeTab: 'code' })}
            >
              {t('placeholder.html')}
            </Button>
          ) : (
            <HtmlPreviewFrame
              title={t('htmlMenu.preview')}
              html={previewDocument}
            />
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
}
