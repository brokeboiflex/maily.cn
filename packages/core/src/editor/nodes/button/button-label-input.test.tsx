// @vitest-environment happy-dom

import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { VariableExtension } from '../variable/variable';
import { expect, it } from 'vitest';

import { createTranslator, defaultLabels } from '../../i18n';
import { MailyContext } from '../../maily-context';
import { ButtonLabelInput } from './button-label-input';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

it('names the button text field with a translated label', async () => {
  const editor = new Editor({ extensions: [StarterKit, VariableExtension] });
  const labels = { ...defaultLabels, 'buttonMenu.text': 'Texte du bouton' };
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () =>
      root.render(
        <MailyContext.Provider value={{ labels, t: createTranslator(labels) }}>
          <ButtonLabelInput value="" editor={editor} />
        </MailyContext.Provider>
      )
    );
    const input = container.querySelector('input')!;
    expect(input.getAttribute('aria-label')).toBe('Texte du bouton');
    expect(input.getAttribute('placeholder')).toBe('Texte du bouton');
  } finally {
    await act(async () => root.unmount());
    container.remove();
    editor.destroy();
  }
});
