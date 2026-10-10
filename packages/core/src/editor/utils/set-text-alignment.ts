import { type Editor } from '@tiptap/core';

/** Compare the displayed default across every selected text block. */
export function setTextAlignment(editor: Editor, alignment: string) {
  const changesAlignment = editor.state.selection.ranges.some(
    ({ $from, $to }) => {
      let changes = false;
      editor.state.doc.nodesBetween($from.pos, $to.pos, (node) => {
        if (
          ['paragraph', 'heading', 'footer'].includes(node.type.name) &&
          (node.attrs.textAlign || 'left') !== alignment
        )
          changes = true;
      });
      return changes;
    }
  );
  return (
    !changesAlignment || editor.chain().focus().setTextAlign(alignment).run()
  );
}
