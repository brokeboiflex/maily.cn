// @vitest-environment happy-dom

import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { afterEach, expect, it, vi } from 'vitest';

import { defaultLabels, englishTranslator } from '../../i18n';
import { MailyProvider } from '../../provider';
import {
  fontsourceFontProvider,
  resetFontsourceCatalog,
} from '../../fonts/fontsource';
import { TooltipProvider } from '../ui/tooltip';
import { FontFamilyPicker } from './font-family-picker';

// Layout is the browser-only boundary: render every row instead of measuring.
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index,
        start: index * 58,
        size: 58,
      })),
    getTotalSize: () => count * 58,
    scrollToOffset: () => undefined,
    scrollToIndex: () => undefined,
  }),
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const catalog = [
  {
    id: 'fraunces',
    family: 'Fraunces',
    subsets: ['latin'],
    weights: [400, 700],
    styles: ['normal'],
    defSubset: 'latin',
    variable: false,
    lastModified: '2025-01-01',
    category: 'serif',
    type: 'google',
  },
];

afterEach(() => {
  resetFontsourceCatalog();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

async function settle() {
  for (let round = 0; round < 4; round += 1)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
}

it('N06: removing an idle picker does not cancel another picker selection', async () => {
  let releaseVersion!: () => void;
  const version = new Promise<Response>((resolve) => {
    releaseVersion = () =>
      resolve(new Response(JSON.stringify({ latest: '5.2.9' })));
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      url.endsWith('/fonts') ? new Response(JSON.stringify(catalog)) : version
    )
  );
  const editor = new Editor({
    extensions: [StarterKit],
    content: '<p>Text</p>',
  });
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const onFontChange = vi.fn();
  const render = (withSibling: boolean) =>
    root.render(
      <MailyProvider
        editor={editor}
        labels={defaultLabels}
        t={englishTranslator}
      >
        <TooltipProvider>
          <FontFamilyPicker
            editor={editor}
            provider={fontsourceFontProvider}
            currentFont={null}
            onFontChange={onFontChange}
          />
          {withSibling && (
            <FontFamilyPicker
              editor={editor}
              provider={fontsourceFontProvider}
              currentFont={null}
            />
          )}
        </TooltipProvider>
      </MailyProvider>
    );
  try {
    await act(async () => render(true));
    const [trigger] = Array.from(container.querySelectorAll('button'));
    await act(async () => trigger.click());
    await settle();
    const row = Array.from(
      document.querySelectorAll<HTMLElement>('[cmdk-item]')
    ).find((item) => item.textContent?.includes('Fraunces'));
    expect(row).toBeTruthy();
    await act(async () => row!.click());
    await act(async () => render(false));
    releaseVersion();
    await settle();
    expect(onFontChange).toHaveBeenCalledWith(
      expect.objectContaining({ fontId: 'fraunces', fontVersion: '5.2.9' })
    );
  } finally {
    await act(async () => root.unmount());
    editor.destroy();
  }
});
