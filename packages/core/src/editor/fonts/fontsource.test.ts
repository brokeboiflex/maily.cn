import {
  createFontSelection,
  dedupeFontsourceFonts,
  fontsourceFileUrl,
  getFontFallback,
  resolveFontSelection,
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
  it('retries a failed version request and deduplicates successful pinned requests', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ latest: '5.2.9' })));
    vi.stubGlobal('fetch', fetcher);
    try {
      const retryFont = { ...font, id: 'retry-audit-font' };
      await expect(resolveFontSelection(retryFont)).rejects.toThrow('offline');
      const [first, second] = await Promise.all([
        resolveFontSelection(retryFont),
        resolveFontSelection(retryFont),
      ]);
      expect(first.fontVersion).toBe('5.2.9');
      expect(second.fontVersion).toBe('5.2.9');
      expect(fetcher).toHaveBeenCalledTimes(2);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each(['latest', 'LATEST', 'Latest', 'invalid', undefined])(
    'rejects an unpinned API version %s',
    async (latest) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(JSON.stringify({ latest })))
      );
      try {
        await expect(
          resolveFontSelection({ ...font, id: `invalid-${String(latest)}` })
        ).rejects.toThrow('invalid pinned version');
      } finally {
        vi.unstubAllGlobals();
      }
    }
  );
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
