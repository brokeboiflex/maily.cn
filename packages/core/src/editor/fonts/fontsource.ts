import type {
  FontFallback,
  MailyFontCategory,
  MailyFontFamily,
  MailyFontProvider,
  MailyFontSelection,
} from './font-provider';

export type {
  FontFallback,
  MailyFontCategory,
  MailyFontFamily,
  MailyFontProvider,
  MailyFontSelection,
} from './font-provider';
export {
  fontSelectionFromAttrs,
  fontStack,
  loadDocumentFonts,
  loadEditorFont,
} from './font-provider';

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

export type FontsourceCategory = MailyFontCategory;

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

type FontsourceVersion = {
  latest: string;
};

let catalogPromise: Promise<FontsourceFont[]> | null = null;
const versionPromises = new Map<string, Promise<string>>();

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
        if (
          typeof value.latest !== 'string' ||
          value.latest.toLowerCase() === 'latest' ||
          !FONT_VERSION_PATTERN.test(value.latest)
        ) {
          throw new Error('Fontsource returned an invalid pinned version');
        }
        return value.latest;
      })
      .catch((error) => {
        versionPromises.delete(font.id);
        throw error;
      });
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

function isListedFont(family: MailyFontFamily): family is FontsourceFont {
  return isFontsourceFont(family);
}

function abortable<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', abort));
  });
}

/**
 * The Fontsource catalog (api.fontsource.org) with version-pinned files on
 * jsDelivr. Opt in by passing it as the editor's `fontProvider`, and pass the
 * renderer's `fontsourceFontFaceUrl` so sent emails load the same files.
 */
export const fontsourceFontProvider: MailyFontProvider = {
  listFamilies: (signal) => abortable(getFontsourceCatalog(), signal),
  resolveSelection: (family, signal) => {
    if (!isListedFont(family))
      return Promise.reject(new Error('Not a Fontsource family'));
    return abortable(resolveFontSelection(family), signal);
  },
  previewSelection: (family) =>
    isListedFont(family)
      ? createFontSelection(family)
      : {
          fontFamily: family.family,
          fontId: family.id,
          fontFallback: getFontFallback(family.category),
          fontSubset: 'latin',
          fontVersion: 'latest',
          fontRegularWeight: 400,
          fontBoldWeight: 700,
          fontHasItalic: false,
        },
  faceUrl: (font, weight, style) => fontsourceFileUrl(font, weight, style),
};
