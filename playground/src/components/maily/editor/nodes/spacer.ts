import { mergeAttributes, Node } from '@tiptap/core';
import { DEFAULT_SECTION_SHOW_IF_KEY } from './section/section';
import { updateSelectedAttributes } from '../utils/update-attribute';
import { normalizeSpacerHeight } from '../utils/spacing';

export interface SpacerOptions {
  height: number;
  showIfKey: string;
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spacer: {
      setSpacer: (options: { height: number }) => ReturnType;
      setSpacerSize: (height: number) => ReturnType;
      setSpacerShowIfKey: (showIfKey: string) => ReturnType;
      unsetSpacer: () => ReturnType;
    };
  }
}

export const DEFAULT_SPACER_HEIGHT = 8;

export const Spacer = Node.create<SpacerOptions>({
  name: 'spacer',
  priority: 1000,

  group: 'block',
  draggable: true,
  addAttributes() {
    return {
      height: {
        default: DEFAULT_SPACER_HEIGHT,
        parseHTML: (element) =>
          normalizeSpacerHeight(
            element.getAttribute('data-height'),
            DEFAULT_SPACER_HEIGHT
          ),
        renderHTML: (attributes) => {
          return {
            'data-height': attributes.height,
          };
        },
      },
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
    };
  },

  addCommands() {
    return {
      setSpacer:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              height: normalizeSpacerHeight(
                options.height,
                DEFAULT_SPACER_HEIGHT
              ),
            },
          });
        },

      setSpacerSize: (height) =>
        updateSelectedAttributes('spacer', {
          height: normalizeSpacerHeight(height, DEFAULT_SPACER_HEIGHT),
        }),

      setSpacerShowIfKey: (showIfKey) =>
        updateSelectedAttributes('spacer', { showIfKey }),

      unsetSpacer:
        () =>
        ({ commands }) => {
          return commands.deleteNode('spacer');
        },
    };
  },
  renderHTML({ HTMLAttributes, node }) {
    const height = normalizeSpacerHeight(
      (node.attrs as SpacerOptions).height,
      DEFAULT_SPACER_HEIGHT
    );

    return [
      'div',
      mergeAttributes(
        {
          'data-maily-component': this.name,
        },
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          class: 'spacer relative full z-50',
          contenteditable: false,
          style: `height: ${height}px;--spacer-height: ${height}px;`,
        }
      ),
    ];
  },
  parseHTML() {
    return [{ tag: `div[data-maily-component="${this.name}"]` }];
  },
});
