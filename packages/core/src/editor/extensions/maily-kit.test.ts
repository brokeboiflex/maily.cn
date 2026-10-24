import { Editor } from '@tiptap/core';
import { afterEach, expect, it } from 'vitest';

import { MailyKit } from './maily-kit';

const editors: Editor[] = [];
afterEach(() => editors.splice(0).forEach((editor) => editor.destroy()));

function create(options: Parameters<typeof MailyKit.configure>[0]) {
  const editor = new Editor({ extensions: [MailyKit.configure(options)] });
  editors.push(editor);
  return editor;
}

const optionsOf = (editor: Editor, name: string) =>
  editor.extensionManager.extensions.find(
    (extension) => extension.name === name
  )?.options;

it('applies node options passed to MailyKit', () => {
  const attributes = { HTMLAttributes: { 'data-kit': 'yes' } };
  const editor = create({
    spacer: attributes,
    section: attributes,
    button: attributes,
  });
  for (const name of ['spacer', 'section', 'button'])
    expect(optionsOf(editor, name)?.HTMLAttributes).toMatchObject({
      'data-kit': 'yes',
    });
});

it('saves new links without nofollow', () => {
  const editor = create({});
  expect(optionsOf(editor, 'link')?.HTMLAttributes.rel).toBe(
    'noopener noreferrer'
  );
});
