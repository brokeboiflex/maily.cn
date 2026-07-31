import type { JSONContent } from '@tiptap/core';

export const FONTSOURCE_API_URL = 'https://api.fontsource.org/v1';

const FONT_ID_PATTERN = /^[a-z0-9-]+$/;
const FONT_VERSION_PATTERN = /^(?:latest|\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?)$/i;
const FONT_SUBSET_PATTERN = /^[a-z0-9-]+$/;
const FONT_CATEGORIES = new Set<FontsourceCategory>([
  'sans-serif',
  'serif',
  'display',
  'handwriting',
  'monospace',
]);

export type FontsourceCategory =
  | 'sans-serif'
  | 'serif'
  | 'display'
  | 'handwriting'
  | 'monospace';

export type FontFallback = 'Arial' | 'Georgia' | 'monospace' | 'cursive';

export type FontsourceFont = {
  id: string;
  family: string;
  subsets: string[];
  weights: number[];
  styles: string[];
  defSubset: string;
  variable: boolean;
  lastModified: string;
  category: FontsourceCategory;
  license?: string;
  type: 'google' | 'other';
};

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

type FontsourceVersion = {
  latest: string;
};

let catalogPromise: Promise<FontsourceFont[]> | null = null;
const versionPromises = new Map<string, Promise<string>>();
const loadedEditorFaces = new Set<string>();

function isFontsourceFont(value: unknown): value is FontsourceFont {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const font = value as Partial<FontsourceFont>;
  return (
    typeof font.id === 'string' &&
    FONT_ID_PATTERN.test(font.id) &&
    typeof font.family === 'string' &&
    font.family.length > 0 &&
    font.family.length <= 120 &&
    Array.isArray(font.subsets) &&
    Array.isArray(font.weights) &&
    font.weights.some((weight) => Number.isFinite(weight)) &&
    Array.isArray(font.styles) &&
    typeof font.defSubset === 'string' &&
    FONT_SUBSET_PATTERN.test(font.defSubset) &&
    typeof font.category === 'string' &&
    FONT_CATEGORIES.has(font.category as FontsourceCategory) &&
    (font.type === 'google' || font.type === 'other')
  );
}

export function resetFontsourceCatalog() {
  catalogPromise = null;
}

function normalizedFamilyName(font: FontsourceFont): string {
  return font.family
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('en-US');
}

function staticEmailCoverage(font: FontsourceFont): number[] {
  return [
    Number(font.weights.includes(400)) + Number(font.weights.includes(700)),
    Number(font.styles.includes('italic')),
    font.weights.length,
    Number(!font.variable),
    font.subsets.length,
  ];
}

function preferFontsourceFont(
  current: FontsourceFont,
  candidate: FontsourceFont
): FontsourceFont {
  const currentCoverage = staticEmailCoverage(current);
  const candidateCoverage = staticEmailCoverage(candidate);

  for (let index = 0; index < currentCoverage.length; index += 1) {
    if (candidateCoverage[index] !== currentCoverage[index]) {
      return candidateCoverage[index] > currentCoverage[index]
        ? candidate
        : current;
    }
  }

  return candidate.id.localeCompare(current.id) < 0 ? candidate : current;
}

export function dedupeFontsourceFonts(
  fonts: FontsourceFont[]
): FontsourceFont[] {
  const fontsByFamily = new Map<string, FontsourceFont>();

  for (const font of fonts) {
    const family = normalizedFamilyName(font);
    const existing = fontsByFamily.get(family);
    fontsByFamily.set(
      family,
      existing ? preferFontsourceFont(existing, font) : font
    );
  }

  return [...fontsByFamily.values()];
}

export function getFontsourceCatalog(): Promise<FontsourceFont[]> {
  if (!catalogPromise) {
    catalogPromise = fetch(`${FONTSOURCE_API_URL}/fonts`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Fontsource returned ${response.status}`);
        }

        const value: unknown = await response.json();
        if (!Array.isArray(value)) {
          throw new Error('Fontsource returned an invalid catalog');
        }

        return dedupeFontsourceFonts(value.filter(isFontsourceFont)).sort(
          (a, b) => a.family.localeCompare(b.family)
        );
      })
      .catch((error) => {
        catalogPromise = null;
        throw error;
      });
  }

  return catalogPromise;
}

export function getFontFallback(category: FontsourceCategory): FontFallback {
  switch (category) {
    case 'serif':
      return 'Georgia';
    case 'monospace':
      return 'monospace';
    case 'handwriting':
      return 'cursive';
    default:
      return 'Arial';
  }
}

function closestWeight(weights: number[], target: number): number {
  return weights.reduce((closest, weight) => {
    const distance = Math.abs(weight - target);
    const closestDistance = Math.abs(closest - target);

    if (distance === closestDistance) {
      return weight > closest ? weight : closest;
    }

    return distance < closestDistance ? weight : closest;
  });
}

export function createFontSelection(
  font: FontsourceFont,
  version = 'latest'
): MailyFontSelection {
  const weights = font.weights.filter((weight) => Number.isFinite(weight));

  return {
    fontFamily: font.family,
    fontId: font.id,
    fontFallback: getFontFallback(font.category),
    fontSubset: font.defSubset,
    fontVersion: FONT_VERSION_PATTERN.test(version) ? version : 'latest',
    fontRegularWeight: closestWeight(weights, 400),
    fontBoldWeight: closestWeight(weights, 700),
    fontHasItalic: font.styles.includes('italic'),
  };
}

export async function resolveFontSelection(
  font: FontsourceFont
): Promise<MailyFontSelection> {
  let promise = versionPromises.get(font.id);

  if (!promise) {
    promise = fetch(`${FONTSOURCE_API_URL}/version/${font.id}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Fontsource returned ${response.status}`);
        }

        const value = (await response.json()) as Partial<FontsourceVersion>;
        return typeof value.latest === 'string' &&
          FONT_VERSION_PATTERN.test(value.latest)
          ? value.latest
          : 'latest';
      })
      .catch(() => 'latest');
    versionPromises.set(font.id, promise);
  }

  return createFontSelection(font, await promise);
}

export function fontsourceFileUrl(
  font: MailyFontSelection,
  weight = font.fontRegularWeight,
  style: 'normal' | 'italic' = 'normal'
): string | null {
  if (
    !FONT_ID_PATTERN.test(font.fontId) ||
    !FONT_VERSION_PATTERN.test(font.fontVersion) ||
    !FONT_SUBSET_PATTERN.test(font.fontSubset) ||
    !Number.isFinite(weight)
  ) {
    return null;
  }

  return `https://cdn.jsdelivr.net/fontsource/fonts/${font.fontId}@${font.fontVersion}/${font.fontSubset}-${weight}-${style}.woff2`;
}

export function fontStack(
  font: Pick<MailyFontSelection, 'fontFamily' | 'fontFallback'>
): string {
  return `'${font.fontFamily.replaceAll("'", "\\'")}', ${font.fontFallback}`;
}

function loadFace(
  font: MailyFontSelection,
  weight: number,
  style: 'normal' | 'italic'
) {
  if (
    typeof document === 'undefined' ||
    typeof FontFace === 'undefined' ||
    !document.fonts
  ) {
    return;
  }

  const url = fontsourceFileUrl(font, weight, style);
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

export function loadEditorFont(font: MailyFontSelection) {
  loadFace(font, font.fontRegularWeight, 'normal');

  if (font.fontBoldWeight !== font.fontRegularWeight) {
    loadFace(font, font.fontBoldWeight, 'normal');
  }

  if (font.fontHasItalic) {
    loadFace(font, font.fontRegularWeight, 'italic');
    if (font.fontBoldWeight !== font.fontRegularWeight) {
      loadFace(font, font.fontBoldWeight, 'italic');
    }
  }
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

export function loadDocumentFonts(content: JSONContent) {
  const visit = (node: JSONContent) => {
    const nodeFont = fontSelectionFromAttrs(node.attrs);
    if (nodeFont) {
      loadEditorFont(nodeFont);
    }

    for (const mark of node.marks ?? []) {
      if (mark.type !== 'textStyle') {
        continue;
      }

      const font = fontSelectionFromAttrs(mark.attrs);
      if (font) {
        loadEditorFont(font);
      }
    }

    for (const child of node.content ?? []) {
      visit(child);
    }
  };

  visit(content);
}
