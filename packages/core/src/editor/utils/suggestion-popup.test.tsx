// @vitest-environment happy-dom

import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Editor as TiptapEditor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { afterEach, expect, it } from 'vitest';

import { Editor } from '../index';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
  document.body.innerHTML = '';
});

async function settle() {
  for (let round = 0; round < 5; round += 1)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
}

async function mountEditor() {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  let editor: TiptapEditor | null = null;
  await act(async () => {
    root.render(
      <Editor
        contentHtml="<p></p>"
        config={{ immediatelyRender: true, autofocus: false }}
        onCreate={(created) => {
          editor = created;
        }}
      />
    );
  });
  await settle();
  cleanups.push(async () => {
    await act(async () => root.unmount());
    container.remove();
  });
  expect(editor).toBeTruthy();
  return editor!;
}

const menuText = () =>
  document.querySelector('#slash-command')?.textContent ?? null;

it('N05: keeps the slash menu working after an unrelated plugin is registered', async () => {
  const editor = await mountEditor();
  await act(async () => {
    editor.chain().focus('end').insertContent('/').run();
  });
  await settle();
  expect(menuText()).toBeTruthy();

  await act(async () => {
    editor.registerPlugin(new Plugin({ key: new PluginKey('unrelated') }));
  });
  await settle();
  await act(async () => {
    editor.commands.insertContent('head');
  });
  await settle();
  expect(menuText()).toContain('Heading');
  expect(document.querySelectorAll('#slash-command')).toHaveLength(1);

  await act(async () => {
    editor.view.dom.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );
  });
  await settle();
  expect(menuText()).toBeNull();
});

it('closes the slash menu when the editor unmounts while it is open', async () => {
  const editor = await mountEditor();
  await act(async () => {
    editor.chain().focus('end').insertContent('/').run();
  });
  await settle();
  expect(menuText()).toBeTruthy();
  await cleanups.splice(0)[0]();
  await settle();
  expect(menuText()).toBeNull();
});

it('closes the slash menu on unmount after plugin views were recreated', async () => {
  const editor = await mountEditor();
  await act(async () => {
    editor.chain().focus('end').insertContent('/').run();
  });
  await settle();
  expect(menuText()).toBeTruthy();
  await act(async () => {
    editor.registerPlugin(new Plugin({ key: new PluginKey('unrelated') }));
  });
  await settle();
  expect(menuText()).toBeTruthy();
  // The recreated suggestion view has no props until its next update, so its
  // destroy() never reports an exit.
  await cleanups.splice(0)[0]();
  await settle();
  expect(menuText()).toBeNull();
  expect(document.querySelectorAll('.react-renderer')).toHaveLength(0);
});

it('closes the slash menu on editor.unmount() after plugin views were recreated', async () => {
  const editor = await mountEditor();
  await act(async () => {
    editor.chain().focus('end').insertContent('/').run();
  });
  await settle();
  await act(async () => {
    editor.registerPlugin(new Plugin({ key: new PluginKey('unrelated') }));
  });
  await settle();
  expect(menuText()).toBeTruthy();
  await act(async () => {
    editor.unmount();
  });
  await settle();
  expect(menuText()).toBeNull();
  // TipTap keeps the unmounted editor's state; edits to it must not throw.
  await act(async () => {
    expect(() => editor.commands.insertContent('h')).not.toThrow();
  });
});
