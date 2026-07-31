import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { LinkCardComponent } from '../nodes/link-card';
import type { MailyFontSelection } from '../fonts/fontsource';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    linkCard: {
      setLinkCard: () => ReturnType;
    };
  }
}

export type LinkCardOptions = {};

export type LinkCardAttributes = {
  mailyComponent: string;
  title: string;
  description: string;
  link: string;
  linkTitle: string;
  image: string;
  subTitle: string;
  badgeText: string;
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

export const LinkCardExtension = Node.create({
  name: 'linkCard',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      mailyComponent: {
        default: 'linkCard',
      },
      title: {
        default: '',
      },
      description: {
        default: '',
      },
      link: {
        default: '',
      },
      linkTitle: {
        default: '',
      },
      image: {
        default: '',
      },
      subTitle: {
        default: '',
      },
      badgeText: {
        default: '',
      },
      fontSize: {
        default: null,
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
        tag: `a[data-maily-component="${this.name}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        {
          'data-maily-component': this.name,
        },
        HTMLAttributes
      ),
    ];
  },

  addCommands() {
    return {
      setLinkCard:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              mailyComponent: this.name,
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkCardComponent, {
      className: 'relative',
    });
  },
});
