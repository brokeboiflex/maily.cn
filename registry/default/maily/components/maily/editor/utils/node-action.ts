import type { Editor } from '@tiptap/core';
import type { Node } from '@tiptap/pm/model';

/** A menu action owns the hovered node and document, and can commit only once. */
export function captureNodeAction(
  editor: Editor,
  pos: number,
  node: Node | null
) {
  if (!node || pos < 0 || editor.state.doc.nodeAt(pos) !== node) return null;
  const doc = editor.state.doc;
  let consumed = false;
  const isCurrent = () =>
    !consumed &&
    !editor.isDestroyed &&
    editor.isEditable &&
    editor.state.doc === doc;
  return {
    isCurrent,
    run(action: (node: Node, pos: number) => void) {
      if (!isCurrent()) return false;
      consumed = true;
      action(node, pos);
      return true;
    },
  };
}
