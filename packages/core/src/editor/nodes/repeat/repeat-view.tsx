import {
  type NodeViewProps,
  NodeViewWrapper,
  NodeViewContent,
} from '@tiptap/react';
import { Repeat2 } from 'lucide-react';

export function RepeatView(props: NodeViewProps) {
  const { editor, getPos } = props;

  return (
    <NodeViewWrapper
      data-type="repeat"
      draggable={editor.isEditable}
      data-drag-handle={editor.isEditable}
      className="relative [&_[data-node-view-content]>div>*:first-child]:mt-0 [&_[data-node-view-content]>div>*:last-child]:mb-0 [&.has-focus_[data-repeat-indicator]]:opacity-100"
    >
      <NodeViewContent className="is-editable" />

      <div
        role="button"
        data-repeat-indicator=""
        className="absolute inset-y-0 right-0 flex translate-x-full cursor-pointer flex-col items-center gap-1 opacity-60"
        contentEditable={false}
        onClick={() => {
          editor.commands.setNodeSelection(getPos());
        }}
      >
        <Repeat2 className="text-foreground size-3 stroke-[2.5]" />
        <div className="bg-primary/50 w-[1.5px] grow rounded-full" />
      </div>
    </NodeViewWrapper>
  );
}
