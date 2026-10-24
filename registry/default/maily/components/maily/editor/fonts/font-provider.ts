import type { JSONContent } from '@tiptap/core';

export type MailyFontCategory =
  'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';

export type FontFallback = 'Arial' | 'Georgia' | 'monospace' | 'cursive';

/** The font attributes saved on a text style, button or link card. */
export type MailyFontSelection = {
  fontFamily: string;
  fontId: string;
  fontFallback: FontFallback;
  fontSubset: string;
  fontVersion: string;
  fontRegularWeight: number;
  fontBoldWeight: number;
  fontHasItalic: boolean;
};

/** One family the font picker offers. */
export type MailyFontFamily = {
  id: string;
  family: string;
  category: MailyFontCategory;
};

/**
 * Where the editor's fonts come from. Maily has no font service of its own:
 * without a provider there is no font picker and no network request, and
 * saved fonts show their fallback stacks. `fontsourceFontProvider` offers the
 * Fontsource catalog.
 */
export type MailyFontProvider = {
  /** Families for the picker, loaded when it first opens. */
  listFamilies(signal: AbortSignal): Promise<MailyFontFamily[]>;
  /** The attributes saved when a family is chosen. */
  resolveSelection(
    family: MailyFontFamily,
    signal: AbortSignal
  ): Promise<MailyFontSelection>;
  /** The attributes used to preview a family in the picker. */
  previewSelection(family: MailyFontFamily): MailyFontSelection;
  /** URL of one face, or null to skip it. */
  faceUrl(
    font: MailyFontSelection,
    weight: number,
    style: 'normal' | 'italic'
  ): string | null;
};

export function fontStack(
  font: Pick<MailyFontSelection, 'fontFamily' | 'fontFallback'>
): string {
  return `'${font.fontFamily.replaceAll("'", "\\'")}', ${font.fontFallback}`;
}

export function fontSelectionFromAttrs(
  attrs?: Record<string, unknown> | null
): MailyFontSelection | null {
  if (
    !attrs ||
    typeof attrs.fontFamily !== 'string' ||
    typeof attrs.fontId !== 'string' ||
    typeof attrs.fontFallback !== 'string' ||
    typeof attrs.fontSubset !== 'string' ||
    typeof attrs.fontVersion !== 'string' ||
    typeof attrs.fontRegularWeight !== 'number' ||
    typeof attrs.fontBoldWeight !== 'number'
  ) {
    return null;
  }

  return {
    fontFamily: attrs.fontFamily,
    fontId: attrs.fontId,
    fontFallback: attrs.fontFallback as FontFallback,
    fontSubset: attrs.fontSubset,
    fontVersion: attrs.fontVersion,
    fontRegularWeight: attrs.fontRegularWeight,
    fontBoldWeight: attrs.fontBoldWeight,
    fontHasItalic: attrs.fontHasItalic === true,
  };
}

const loadedEditorFaces = new Set<string>();

function loadFace(
  font: MailyFontSelection,
  weight: number,
  style: 'normal' | 'italic',
  provider: MailyFontProvider
) {
  if (
    typeof document === 'undefined' ||
    typeof FontFace === 'undefined' ||
    !document.fonts
  ) {
    return;
  }

  const url = provider.faceUrl(font, weight, style);
  if (!url || loadedEditorFaces.has(url)) {
    return;
  }

  loadedEditorFaces.add(url);
  const face = new FontFace(font.fontFamily, `url(${JSON.stringify(url)})`, {
    style,
    weight: String(weight),
    display: 'swap',
  });

  document.fonts.add(face);
  void face.load().catch(() => {
    loadedEditorFaces.delete(url);
    document.fonts.delete(face);
  });
}

/** Loads a chosen font's faces into the page through its provider. */
export function loadEditorFont(
  font: MailyFontSelection,
  provider: MailyFontProvider
) {
  loadFace(font, font.fontRegularWeight, 'normal', provider);

  if (font.fontBoldWeight !== font.fontRegularWeight) {
    loadFace(font, font.fontBoldWeight, 'normal', provider);
  }

  if (font.fontHasItalic) {
    loadFace(font, font.fontRegularWeight, 'italic', provider);
    if (font.fontBoldWeight !== font.fontRegularWeight) {
      loadFace(font, font.fontBoldWeight, 'italic', provider);
    }
  }
}

/** Loads every font a document uses; without a provider, nothing loads. */
export function loadDocumentFonts(
  content: JSONContent,
  provider: MailyFontProvider | undefined
) {
  if (!provider) return;

  const visit = (node: JSONContent) => {
    const nodeFont = fontSelectionFromAttrs(node.attrs);
    if (nodeFont) {
      loadEditorFont(nodeFont, provider);
    }

    for (const mark of node.marks ?? []) {
      if (mark.type !== 'textStyle') {
        continue;
      }

      const font = fontSelectionFromAttrs(mark.attrs);
      if (font) {
        loadEditorFont(font, provider);
      }
    }

    for (const child of node.content ?? []) {
      visit(child);
    }
  };

  visit(content);
}
