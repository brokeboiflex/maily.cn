import type { JSONContent } from '@tiptap/core';

const FONT_ID_PATTERN = /^[a-z0-9-]+$/;
const FONT_VERSION_PATTERN = /^(?:latest|\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?)$/i;
const FONT_SUBSET_PATTERN = /^[a-z0-9-]+$/;
const FALLBACK_FONTS = new Set([
  'Arial',
  'Helvetica',
  'Verdana',
  'Georgia',
  'Times New Roman',
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
]);

type EmailFontSelection = {
  fontFamily: string;
  fontId: string;
  fontFallback: string;
  fontSubset: string;
  fontVersion: string;
  fontRegularWeight: number;
  fontBoldWeight: number;
  fontHasItalic: boolean;
};

function numberAttribute(value: unknown): number | null {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 1000
    ? number
    : null;
}

function escapeCssString(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll("'", "\\'")
    .replace(/[\n\r\f]/g, ' ');
}

export function emailFontStack(
  fontFamily: unknown,
  fontFallback: unknown,
  defaultFallback = 'sans-serif'
): string | undefined {
  if (typeof fontFamily !== 'string' || !fontFamily.trim()) {
    return undefined;
  }

  const fallback =
    typeof fontFallback === 'string' && FALLBACK_FONTS.has(fontFallback)
      ? fontFallback
      : defaultFallback;

  return `'${escapeCssString(fontFamily.trim())}', ${fallback}`;
}

export function selectionFromAttrs(
  attrs?: Record<string, unknown>
): EmailFontSelection | null {
  if (!attrs) {
    return null;
  }

  const regularWeight = numberAttribute(attrs.fontRegularWeight);
  const boldWeight = numberAttribute(attrs.fontBoldWeight);
  if (
    typeof attrs.fontFamily !== 'string' ||
    !attrs.fontFamily.trim() ||
    attrs.fontFamily.length > 120 ||
    typeof attrs.fontId !== 'string' ||
    !FONT_ID_PATTERN.test(attrs.fontId) ||
    typeof attrs.fontFallback !== 'string' ||
    !FALLBACK_FONTS.has(attrs.fontFallback) ||
    typeof attrs.fontSubset !== 'string' ||
    !FONT_SUBSET_PATTERN.test(attrs.fontSubset) ||
    typeof attrs.fontVersion !== 'string' ||
    !FONT_VERSION_PATTERN.test(attrs.fontVersion) ||
    regularWeight === null ||
    boldWeight === null
  ) {
    return null;
  }

  return {
    fontFamily: attrs.fontFamily.trim(),
    fontId: attrs.fontId,
    fontFallback: attrs.fontFallback,
    fontSubset: attrs.fontSubset,
    fontVersion: attrs.fontVersion,
    fontRegularWeight: regularWeight,
    fontBoldWeight: boldWeight,
    fontHasItalic:
      attrs.fontHasItalic === true || attrs.fontHasItalic === 'true',
  };
}

function fileUrl(
  font: EmailFontSelection,
  weight: number,
  style: 'normal' | 'italic'
) {
  return `https://cdn.jsdelivr.net/fontsource/fonts/${font.fontId}@${font.fontVersion}/${font.fontSubset}-${weight}-${style}.woff2`;
}

function faceStyle(
  font: EmailFontSelection,
  weight: number,
  style: 'normal' | 'italic'
) {
  return `@font-face{font-family:'${escapeCssString(font.fontFamily)}';font-style:${style};font-weight:${weight};mso-font-alt:'${font.fontFallback}';font-display:swap;src:url(${fileUrl(font, weight, style)}) format('woff2')}`;
}

export function fontsourceStyles(content: JSONContent): string {
  const selections = new Map<string, EmailFontSelection>();

  const visit = (node: JSONContent) => {
    const nodeSelection = selectionFromAttrs(node.attrs);
    if (nodeSelection) {
      selections.set(
        `${nodeSelection.fontId}@${nodeSelection.fontVersion}/${nodeSelection.fontSubset}`,
        nodeSelection
      );
    }

    for (const mark of node.marks ?? []) {
      if (mark.type !== 'textStyle') {
        continue;
      }

      const selection = selectionFromAttrs(mark.attrs);
      if (selection) {
        selections.set(
          `${selection.fontId}@${selection.fontVersion}/${selection.fontSubset}`,
          selection
        );
      }
    }

    for (const child of node.content ?? []) {
      visit(child);
    }
  };

  visit(content);

  return [...selections.values()]
    .flatMap((font) => {
      const faces = [faceStyle(font, font.fontRegularWeight, 'normal')];

      if (font.fontBoldWeight !== font.fontRegularWeight) {
        faces.push(faceStyle(font, font.fontBoldWeight, 'normal'));
      }

      if (font.fontHasItalic) {
        faces.push(faceStyle(font, font.fontRegularWeight, 'italic'));
        if (font.fontBoldWeight !== font.fontRegularWeight) {
          faces.push(faceStyle(font, font.fontBoldWeight, 'italic'));
        }
      }

      return faces;
    })
    .join('');
}
