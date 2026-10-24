import type { Editor } from '@tiptap/core';
import { NodeSelection, Selection } from '@tiptap/pm/state';

export function selectedMobileBlock(editor: Editor) {
  const { selection } = editor.state;
  if (selection instanceof NodeSelection && selection.node.isBlock) {
    return { node: selection.node, pos: selection.from };
  }
  const { $from } = selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.isBlock && node.type.name !== 'column')
      return { node, pos: $from.before(depth) };
  }
  return null;
}

export function runMobileBlockAction(
  editor: Editor,
  action: 'duplicate' | 'delete' | 'up' | 'down',
  apply = true
) {
  const block = selectedMobileBlock(editor);
  if (!block || !editor.isEditable) return false;
  const { node, pos } = block;
  const end = pos + node.nodeSize;
  const $pos = editor.state.doc.resolve(pos);
  const index = $pos.index();
  const parent = $pos.parent;
  if (action === 'duplicate') {
    if (!parent.canReplaceWith(index, index, node.type)) return false;
    if (apply) editor.commands.insertContentAt(end, node.toJSON());
    return true;
  }
  if (action === 'delete') {
    if (apply) editor.commands.deleteRange({ from: pos, to: end });
    return true;
  }
  const sibling =
    action === 'up'
      ? parent.maybeChild(index - 1)
      : parent.maybeChild(index + 1);
  if (
    !sibling ||
    (sibling.type !== node.type &&
      !parent.canReplaceWith(
        action === 'up' ? index - 1 : index + 1,
        action === 'up' ? index : index + 2,
        node.type
      ))
  )
    return false;
  if (!apply) return true;
  const target =
    action === 'up' ? pos - sibling.nodeSize : pos + sibling.nodeSize;
  const tr = editor.state.tr.delete(pos, end).insert(target, node);
  tr.setSelection(Selection.near(tr.doc.resolve(target + 1)));
  editor.view.dispatch(tr.scrollIntoView());
  return true;
}
