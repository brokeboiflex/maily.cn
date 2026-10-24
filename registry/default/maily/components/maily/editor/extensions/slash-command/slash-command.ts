import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import { Suggestion, type SuggestionOptions } from '@tiptap/suggestion';

/** Its own key, so another suggestion extension cannot collide with it. */
export const SlashCommandPluginKey = new PluginKey('slashCommand');

export type SlashCommandOptions = {
  suggestion: Omit<SuggestionOptions, 'editor'>;
};

export const SlashCommandExtension = Extension.create<SlashCommandOptions>({
  name: 'slash-command',
  addOptions() {
    return {
      suggestion: {
        char: '/',
        pluginKey: SlashCommandPluginKey,
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
