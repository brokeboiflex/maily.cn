import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

function parseFontSize(value: string | null) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export const FontSizeExtension = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) =>
              parseFontSize(
                element.getAttribute('data-maily-font-size') ||
                  element.style.fontSize
              ),
            renderHTML: (attributes) =>
              attributes.fontSize
                ? {
                    'data-maily-font-size': attributes.fontSize,
                    style: `font-size: ${attributes.fontSize}`,
                  }
                : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain()
            .setMark('textStyle', { fontSize: null })
            .removeEmptyTextStyle()
            .run(),
    };
  },
});
