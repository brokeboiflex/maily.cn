// @vitest-environment happy-dom

import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Editor as TiptapEditor } from '@tiptap/core';
import { afterEach, expect, it, vi } from 'vitest';

import { Editor } from '../index';
import type { MailyFontProvider } from './font-provider';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

async function settle() {
  for (let round = 0; round < 3; round += 1)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
}

const font = {
  fontFamily: 'Fraunces',
  fontId: 'fraunces',
  fontFallback: 'Georgia',
  fontSubset: 'latin',
  fontVersion: '5.2.8',
  fontRegularWeight: 400,
  fontBoldWeight: 700,
  fontHasItalic: false,
};

const content = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Styled',
          marks: [{ type: 'textStyle', attrs: font }],
        },
      ],
    },
  ],
};

async function mount(fontProvider?: MailyFontProvider) {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const loaded: string[] = [];
  vi.stubGlobal(
    'FontFace',
    class {
      constructor(_family: string, source: string) {
        loaded.push(source);
      }
      load() {
        return Promise.resolve(this);
      }
    }
  );
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: { add: () => undefined, delete: () => true },
  });
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  let editor: TiptapEditor | null = null;
  await act(async () =>
    root.render(
      <Editor
        contentJson={content}
        fontProvider={fontProvider}
        config={{ immediatelyRender: true, autofocus: false }}
        onCreate={(created) => {
          editor = created;
        }}
      />
    )
  );
  await settle();
  await act(async () => {
    editor!.commands.setTextSelection({ from: 1, to: 7 });
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
  });
  await settle();
  return { root, fetch, loaded, container };
}

it('offers no font picker and loads no fonts without a provider', async () => {
  const { root, fetch, loaded } = await mount();
  try {
    expect(document.querySelector('[aria-label="Font Family"]')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect(loaded).toEqual([]);
  } finally {
    await act(async () => root.unmount());
  }
});

it("loads the document's fonts and offers the picker through a provider", async () => {
  const provider: MailyFontProvider = {
    listFamilies: vi.fn(async () => []),
    resolveSelection: vi.fn(),
    previewSelection: vi.fn(),
    faceUrl: (selection, weight, style) =>
      `https://fonts.example/${selection.fontId}-${weight}-${style}.woff2`,
  };
  const { root, fetch, loaded } = await mount(provider);
  try {
    expect(document.querySelector('[aria-label="Font Family"]')).not.toBeNull();
    expect(loaded).toEqual([
      'url("https://fonts.example/fraunces-400-normal.woff2")',
      'url("https://fonts.example/fraunces-700-normal.woff2")',
    ]);
    expect(fetch).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});
