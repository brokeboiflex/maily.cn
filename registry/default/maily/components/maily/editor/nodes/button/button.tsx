import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ButtonView } from './button-view';
import { updateAttributes } from '../../utils/update-attribute';
import { DEFAULT_SECTION_SHOW_IF_KEY } from '../section/section';
import { type AllowedLogoAlignment } from '../logo/logo';
import type { MailyFontSelection } from '../../fonts/fontsource';

export const DEFAULT_BUTTON_ALIGNMENT: AllowedLogoAlignment = 'left';
export const DEFAULT_BUTTON_VARIANT: AllowedButtonVariant = 'filled';
export const DEFAULT_BUTTON_BORDER_RADIUS: AllowedButtonBorderRadius = 'smooth';
export const DEFAULT_BUTTON_BACKGROUND_COLOR = null;
export const DEFAULT_BUTTON_TEXT_COLOR = null;

export const DEFAULT_BUTTON_PADDING_TOP = null;
export const DEFAULT_BUTTON_PADDING_RIGHT = null;
export const DEFAULT_BUTTON_PADDING_BOTTOM = null;
export const DEFAULT_BUTTON_PADDING_LEFT = null;
export const DEFAULT_BUTTON_FONT_SIZE = null;

export const allowedButtonVariant = ['filled', 'outline'] as const;
export type AllowedButtonVariant = (typeof allowedButtonVariant)[number];

export const allowedButtonBorderRadius = ['sharp', 'smooth', 'round'] as const;
export type AllowedButtonBorderRadius =
  (typeof allowedButtonBorderRadius)[number];

export type ButtonAttributes = {
  text: string;
  isTextVariable: boolean;

  url: string;
  isUrlVariable: boolean;

  alignment: AllowedLogoAlignment;
  variant: AllowedButtonVariant;
  borderRadius: AllowedButtonBorderRadius;
  buttonColor: string;
  textColor: string;

  showIfKey: string;

  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;

  fontSize: string | null;
  fontFamily: string | null;
  fontId: string | null;
  fontFallback: MailyFontSelection['fontFallback'] | null;
  fontSubset: string | null;
  fontVersion: string | null;
  fontRegularWeight: number | null;
  fontBoldWeight: number | null;
  fontHasItalic: boolean;
};

function dataAttribute(name: string) {
  return `data-maily-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

function parseStringAttribute(element: HTMLElement, name: string) {
  return element.getAttribute(dataAttribute(name)) || null;
}

function parseNumberAttribute(element: HTMLElement, name: string) {
  const value = element.getAttribute(dataAttribute(name));
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function renderStringAttribute(
  attributes: Record<string, unknown>,
  name: string
) {
  const value = attributes[name];
  return typeof value === 'string' && value
    ? { [dataAttribute(name)]: value }
    : {};
}

function renderNumberAttribute(
  attributes: Record<string, unknown>,
  name: string
) {
  const value = attributes[name];
  return typeof value === 'number' && Number.isFinite(value)
    ? { [dataAttribute(name)]: value }
    : {};
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    button: {
      setButton: () => ReturnType;
      updateButton: (attrs: Partial<ButtonAttributes>) => ReturnType;
    };
  }
}

export const ButtonExtension = Node.create({
  name: 'button',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      text: {
        default: 'Button',
        parseHTML: (element) => {
          return element.getAttribute('data-text') || '';
        },
        renderHTML: (attributes) => {
          return {
            'data-text': attributes.text,
          };
        },
      },
      isTextVariable: {
        default: false,
        parseHTML: (element) => {
          return element.getAttribute('data-is-text-variable') === 'true';
        },
        renderHTML: (attributes) => {
          if (!attributes.isTextVariable) {
            return {};
          }

          return {
            'data-is-text-variable': 'true',
          };
        },
      },

      url: {
        default: '',
        parseHTML: (element) => {
          return element.getAttribute('data-url') || '';
        },
        renderHTML: (attributes) => {
          return {
            'data-url': attributes.url,
          };
        },
      },
      // Later we will remove this attribute
      // and use the `url` attribute instead when implement
      // the URL variable feature
      isUrlVariable: {
        default: false,
        parseHTML: (element) => {
          return element.getAttribute('data-is-url-variable') === 'true';
        },
        renderHTML: (attributes) => {
          if (!attributes.isUrlVariable) {
            return {};
          }

          return {
            'data-is-url-variable': 'true',
          };
        },
      },

      alignment: {
        default: DEFAULT_BUTTON_ALIGNMENT,
        parseHTML: (element) => {
          return (
            element.getAttribute('data-alignment') || DEFAULT_BUTTON_ALIGNMENT
          );
        },
        renderHTML: (attributes) => {
          return {
            'data-alignment': attributes.alignment,
          };
        },
      },
      variant: {
        default: DEFAULT_BUTTON_VARIANT,
        parseHTML: (element) => {
          return element.getAttribute('data-variant') || DEFAULT_BUTTON_VARIANT;
        },
        renderHTML: (attributes) => {
          return {
            'data-variant': attributes.variant,
          };
        },
      },
      borderRadius: {
        default: DEFAULT_BUTTON_BORDER_RADIUS,
        parseHTML: (element) => {
          return (
            element.getAttribute('data-border-radius') ||
            DEFAULT_BUTTON_BORDER_RADIUS
          );
        },
        renderHTML: (attributes) => {
          return {
            'data-border-radius': attributes.borderRadius,
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

      buttonColor: DEFAULT_BUTTON_BACKGROUND_COLOR,
      textColor: DEFAULT_BUTTON_TEXT_COLOR,

      paddingTop: DEFAULT_BUTTON_PADDING_TOP,
      paddingRight: DEFAULT_BUTTON_PADDING_RIGHT,
      paddingBottom: DEFAULT_BUTTON_PADDING_BOTTOM,
      paddingLeft: DEFAULT_BUTTON_PADDING_LEFT,
      fontSize: {
        default: DEFAULT_BUTTON_FONT_SIZE,
        parseHTML: (element) =>
          element.getAttribute('data-maily-font-size') ||
          element.style.fontSize ||
          null,
        renderHTML: (attributes) =>
          attributes.fontSize
            ? { 'data-maily-font-size': attributes.fontSize }
            : {},
      },
      fontFamily: {
        default: null,
        parseHTML: (element) => parseStringAttribute(element, 'fontFamily'),
        renderHTML: (attributes) =>
          renderStringAttribute(attributes, 'fontFamily'),
      },
      fontId: {
        default: null,
        parseHTML: (element) => parseStringAttribute(element, 'fontId'),
        renderHTML: (attributes) => renderStringAttribute(attributes, 'fontId'),
      },
      fontFallback: {
        default: null,
        parseHTML: (element) => parseStringAttribute(element, 'fontFallback'),
        renderHTML: (attributes) =>
          renderStringAttribute(attributes, 'fontFallback'),
      },
      fontSubset: {
        default: null,
        parseHTML: (element) => parseStringAttribute(element, 'fontSubset'),
        renderHTML: (attributes) =>
          renderStringAttribute(attributes, 'fontSubset'),
      },
      fontVersion: {
        default: null,
        parseHTML: (element) => parseStringAttribute(element, 'fontVersion'),
        renderHTML: (attributes) =>
          renderStringAttribute(attributes, 'fontVersion'),
      },
      fontRegularWeight: {
        default: null,
        parseHTML: (element) =>
          parseNumberAttribute(element, 'fontRegularWeight'),
        renderHTML: (attributes) =>
          renderNumberAttribute(attributes, 'fontRegularWeight'),
      },
      fontBoldWeight: {
        default: null,
        parseHTML: (element) => parseNumberAttribute(element, 'fontBoldWeight'),
        renderHTML: (attributes) =>
          renderNumberAttribute(attributes, 'fontBoldWeight'),
      },
      fontHasItalic: {
        default: false,
        parseHTML: (element) =>
          element.getAttribute(dataAttribute('fontHasItalic')) === 'true',
        renderHTML: (attributes) =>
          attributes.fontHasItalic
            ? { [dataAttribute('fontHasItalic')]: 'true' }
            : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `div[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': this.name,
      }),
    ];
  },

  addCommands() {
    return {
      setButton:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {},
            content: [],
          });
        },
      updateButton: (attrs) => updateAttributes(this.name, attrs),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ButtonView, {
      contentDOMElementTag: 'div',
      className: 'relative',
    });
  },
});
