import { Extension } from '@tiptap/core';
import type { MailyFontSelection } from '../fonts/fontsource';
import { fontStack } from '../fonts/fontsource';

export const FONT_ATTRIBUTE_KEYS = [
  'fontFamily',
  'fontId',
  'fontFallback',
  'fontSubset',
  'fontVersion',
  'fontRegularWeight',
  'fontBoldWeight',
  'fontHasItalic',
] as const;

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontFamily: {
      setMailyFont: (font: MailyFontSelection) => ReturnType;
      unsetMailyFont: () => ReturnType;
    };
  }
}

function dataAttribute(name: string) {
  return `data-maily-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

function parseNumber(value: string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const FontFamilyExtension = Extension.create({
  name: 'fontFamily',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) =>
              element.getAttribute(dataAttribute('fontFamily')) ||
              element.style.fontFamily
                .split(',')[0]
                ?.replace(/^['"]|['"]$/g, '') ||
              null,
            renderHTML: (attributes) =>
              attributes.fontFamily
                ? {
                    [dataAttribute('fontFamily')]: attributes.fontFamily,
                    style: `font-family: ${fontStack(attributes as MailyFontSelection)}`,
                  }
                : {},
          },
          fontId: {
            default: null,
            parseHTML: (element) =>
              element.getAttribute(dataAttribute('fontId')),
            renderHTML: (attributes) =>
              attributes.fontId
                ? { [dataAttribute('fontId')]: attributes.fontId }
                : {},
          },
          fontFallback: {
            default: null,
            parseHTML: (element) =>
              element.getAttribute(dataAttribute('fontFallback')),
            renderHTML: (attributes) =>
              attributes.fontFallback
                ? {
                    [dataAttribute('fontFallback')]: attributes.fontFallback,
                  }
                : {},
          },
          fontSubset: {
            default: null,
            parseHTML: (element) =>
              element.getAttribute(dataAttribute('fontSubset')),
            renderHTML: (attributes) =>
              attributes.fontSubset
                ? { [dataAttribute('fontSubset')]: attributes.fontSubset }
                : {},
          },
          fontVersion: {
            default: null,
            parseHTML: (element) =>
              element.getAttribute(dataAttribute('fontVersion')),
            renderHTML: (attributes) =>
              attributes.fontVersion
                ? { [dataAttribute('fontVersion')]: attributes.fontVersion }
                : {},
          },
          fontRegularWeight: {
            default: null,
            parseHTML: (element) =>
              parseNumber(
                element.getAttribute(dataAttribute('fontRegularWeight'))
              ),
            renderHTML: (attributes) =>
              attributes.fontRegularWeight
                ? {
                    [dataAttribute('fontRegularWeight')]:
                      attributes.fontRegularWeight,
                  }
                : {},
          },
          fontBoldWeight: {
            default: null,
            parseHTML: (element) =>
              parseNumber(
                element.getAttribute(dataAttribute('fontBoldWeight'))
              ),
            renderHTML: (attributes) =>
              attributes.fontBoldWeight
                ? {
                    [dataAttribute('fontBoldWeight')]:
                      attributes.fontBoldWeight,
                  }
                : {},
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
        },
      },
    ];
  },

  addCommands() {
    return {
      setMailyFont:
        (font: MailyFontSelection) =>
        ({ chain }) =>
          chain().setMark('textStyle', font).run(),
      unsetMailyFont:
        () =>
        ({ chain }) =>
          chain()
            .setMark(
              'textStyle',
              Object.fromEntries(FONT_ATTRIBUTE_KEYS.map((key) => [key, null]))
            )
            .removeEmptyTextStyle()
            .run(),
    };
  },
});
