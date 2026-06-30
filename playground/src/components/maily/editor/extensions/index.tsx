import { VariableExtension } from '../../extensions';
import { AnyExtension } from '@tiptap/core';
import { HTMLCodeBlockExtension } from '../nodes/html/html';
import { InlineImageExtension } from '../nodes/inline-image/inline-image';
import { getVariableSuggestions } from '../nodes/variable/variable-suggestions';
import { MailyContextType } from '../provider';
import { MailyKit } from './maily-kit';
import { createPlaceholderExtension } from './placeholder';
import { SlashCommandExtension } from './slash-command/slash-command';
import { getSlashCommandSuggestions } from './slash-command/slash-command-view';
import { SelectionExtension } from './selection/selection';
import { englishTranslator, type TranslateFn } from '../i18n';

type ExtensionsProps = Partial<MailyContextType> & {
  extensions?: AnyExtension[];
  t?: TranslateFn;
};

export function extensions(props: ExtensionsProps) {
  const { blocks, extensions = [], t = englishTranslator } = props;

  const defaultExtensions = [
    MailyKit,
    SlashCommandExtension.configure({
      suggestion: getSlashCommandSuggestions(blocks, t),
    }),
    VariableExtension.configure({
      suggestion: getVariableSuggestions(),
    }),
    HTMLCodeBlockExtension,
    InlineImageExtension,
    createPlaceholderExtension(t),
    SelectionExtension,
  ].filter((ext) => {
    return !extensions.some((e) => e.name === ext.name);
  });

  return [...defaultExtensions, ...extensions];
}
