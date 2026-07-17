import {
  createFontSelection,
  dedupeFontsourceFonts,
  fontsourceFileUrl,
  getFontFallback,
  type FontsourceFont,
} from './fontsource';

const font: FontsourceFont = {
  id: 'fraunces',
  family: 'Fraunces',
  subsets: ['latin', 'latin-ext'],
  weights: [300, 600, 900],
  styles: ['normal', 'italic'],
  defSubset: 'latin',
  variable: true,
  lastModified: '2025-01-01',
  category: 'serif',
  type: 'google',
};

describe('Fontsource font selection', () => {
  it('chooses the closest useful regular and bold weights', () => {
    expect(createFontSelection(font, '5.2.8')).toEqual({
      fontFamily: 'Fraunces',
      fontId: 'fraunces',
      fontFallback: 'Georgia',
      fontSubset: 'latin',
      fontVersion: '5.2.8',
      fontRegularWeight: 300,
      fontBoldWeight: 600,
      fontHasItalic: true,
    });
  });

  it('builds a version-pinned WOFF2 URL', () => {
    const selection = createFontSelection(font, '5.2.8');

    expect(fontsourceFileUrl(selection, 600, 'italic')).toBe(
      'https://cdn.jsdelivr.net/fontsource/fonts/fraunces@5.2.8/latin-600-italic.woff2'
    );
  });

  it('maps Fontsource categories to email-safe fallbacks', () => {
    expect(getFontFallback('serif')).toBe('Georgia');
    expect(getFontFallback('monospace')).toBe('monospace');
    expect(getFontFallback('handwriting')).toBe('cursive');
    expect(getFontFallback('display')).toBe('Arial');
  });

  it('deduplicates normalized family names using static email coverage', () => {
    const variableDuplicate: FontsourceFont = {
      ...font,
      id: 'fraunces-variable',
      family: '  FRAUNCES  ',
      variable: true,
    };
    const staticDuplicate: FontsourceFont = {
      ...font,
      id: 'fraunces-static',
      family: 'Fraunces',
      variable: false,
    };

    expect(dedupeFontsourceFonts([variableDuplicate, staticDuplicate])).toEqual(
      [staticDuplicate]
    );
  });
});
