import { Extension } from '@tiptap/core';
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const SelectionExtension = Extension.create({
  name: 'selection',

  addProseMirrorPlugins() {
    const { editor } = this;

    return [
      new Plugin({
        key: new PluginKey('selection'),
        props: {
          decorations(state) {
            if (
              state.selection.empty ||
              state.selection instanceof NodeSelection
            ) {
              return null;
            }

            if (editor.isFocused === true) {
              return null;
            }

            // this is a hack to make sure the selection is visible
            // when the editor is not focused (e.g. when trigger a popover or something similar)
            return DecorationSet.create(state.doc, [
              Decoration.inline(state.selection.from, state.selection.to, {
                class:
                  'selection box-decoration-clone rounded-sm bg-ring/15 text-foreground',
              }),
            ]);
          },
        },
      }),
    ];
  },
});
