import { goToColumn } from '../../utils/columns';
import { updateAttributes } from '../../utils/update-attribute';
import { mergeAttributes } from '@tiptap/core';
import { Node } from '@tiptap/core';
import { DEFAULT_SECTION_SHOW_IF_KEY } from '../section/section';
import { createId } from '../../utils/create-id';

export const DEFAULT_COLUMNS_GAP = 8;

interface ColumnsAttributes {
  showIfKey: string;
  gap: number;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columns: {
      setColumns: () => ReturnType;
      updateColumns: (attrs: Partial<ColumnsAttributes>) => ReturnType;
    };
  }
}

export const ColumnsExtension = Node.create({
  name: 'columns',
  group: 'columns',
  content: 'column+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      showIfKey: {
        default: DEFAULT_SECTION_SHOW_IF_KEY,
        parseHTML: (element) => {
          return (
            element.getAttribute('data-show-if-key') ||
            DEFAULT_SECTION_SHOW_IF_KEY
          );
        },
        renderHTML(attributes) {
          if (!attributes.showIfKey) {
            return {};
          }

          return {
            'data-show-if-key': attributes.showIfKey,
          };
        },
      },
      gap: {
        default: DEFAULT_COLUMNS_GAP,
        parseHTML: (element) => {
          return Number(element.style.gap) || DEFAULT_COLUMNS_GAP;
        },
        renderHTML(attributes) {
          if (!attributes.gap) {
            return {};
          }

          return {
            style: `gap: ${attributes.gap}px`,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      setColumns:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {},
            content: [
              {
                type: 'column',
                attrs: {
                  columnId: createId(),
                },
                content: [
                  {
                    type: 'paragraph',
                  },
                ],
              },
              {
                type: 'column',
                attrs: {
                  columnId: createId(),
                },
                content: [
                  {
                    type: 'paragraph',
                  },
                ],
              },
            ],
          });
        },
      updateColumns: (attrs) => updateAttributes(this.name, attrs),
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'columns',
        // layout + a dashed boundary hint on child columns when the group is
        // hovered or focused (replaces the former editor stylesheet rules).
        class:
          'relative flex m-0 p-0 [&.has-focus_[data-type=column]]:outline-dashed [&.has-focus_[data-type=column]]:outline-[1.5px] [&.has-focus_[data-type=column]]:outline-border [&:hover_[data-type=column]]:outline-dashed [&:hover_[data-type=column]]:outline-[1.5px] [&:hover_[data-type=column]]:outline-border',
      }),
      0,
    ];
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="columns"]',
      },
    ];
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        return goToColumn(this.editor, 'next');
      },
      'Shift-Tab': () => {
        return goToColumn(this.editor, 'previous');
      },
    };
  },
});
