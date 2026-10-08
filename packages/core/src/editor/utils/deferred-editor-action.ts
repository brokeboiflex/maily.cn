import type { Editor } from '@tiptap/core';

/** Deferred formatting owns the captured document, selection and mounted editor. */
export function createDeferredEditorActions(editor: Editor) {
  let lifecycle = 0;
  const channels = new Map<string, number>();
  return {
    invalidate() {
      lifecycle++;
      channels.clear();
    },
    cancel(channel: string) {
      channels.set(channel, (channels.get(channel) ?? 0) + 1);
    },
    capture(channel: string) {
      const generation = (channels.get(channel) ?? 0) + 1;
      channels.set(channel, generation);
      const owner = lifecycle;
      let consumed = false;
      const { doc, selection } = editor.state;
      const isOwned = () =>
        owner === lifecycle &&
        channels.get(channel) === generation &&
        !editor.isDestroyed;
      const isCurrent = () =>
        !consumed &&
        isOwned() &&
        editor.state.doc === doc &&
        editor.state.selection.eq(selection);
      return {
        isCurrent,
        isOwned,
        run(callback: () => void) {
          if (!isCurrent()) return false;
          consumed = true;
          callback();
          return true;
        },
      };
    },
  };
}
