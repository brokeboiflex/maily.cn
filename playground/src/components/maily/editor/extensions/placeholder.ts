import Placeholder from '@tiptap/extension-placeholder';
import type { TranslateFn } from '../i18n';

// The placeholder text is painted by a `::before` pseudo-element that reads the
// `data-placeholder` attribute. Tiptap adds `is-editor-empty` / `is-empty` to
// empty nodes; we attach the (token-based) Tailwind utilities that render the
// pseudo-element directly to those classes, so no editor stylesheet is needed.
const PLACEHOLDER_CLASS =
  'before:content-[attr(data-placeholder)] before:float-left before:h-0 before:pointer-events-none before:text-muted-foreground';

export function createPlaceholderExtension(t: TranslateFn) {
  return Placeholder.configure({
    emptyEditorClass: `is-editor-empty ${PLACEHOLDER_CLASS}`,
    emptyNodeClass: `is-empty ${PLACEHOLDER_CLASS}`,
    placeholder: ({ node }) => {
      if (node.type.name === 'heading') {
        return t('placeholder.heading', { level: node.attrs.level });
      } else if (node.type.name === 'htmlCodeBlock') {
        return t('placeholder.html');
      } else if (
        [
          'columns',
          'column',
          'section',
          'repeat',
          'show',
          'blockquote',
          'bulletList',
          'orderedList',
          'listItem',
        ].includes(node.type.name)
      ) {
        return '';
      }

      return t('placeholder.default');
    },
    includeChildren: true,
  });
}
