import { IconPlaceholder } from "@/components/icon-placeholder"
import {
  type NodeViewProps,
  NodeViewWrapper,
  NodeViewContent,
} from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { useMailyContext } from '../../provider';

export function RepeatView(props: NodeViewProps) {
  const { editor, getPos } = props;
  const { t } = useMailyContext();

  return (
    <NodeViewWrapper
      data-type="repeat"
      draggable={editor.isEditable}
      data-drag-handle={editor.isEditable}
      className="relative [&.has-focus_[data-repeat-indicator]]:opacity-100 [&_[data-node-view-content]>div>*:first-child]:mt-0 [&_[data-node-view-content]>div>*:last-child]:mb-0"
    >
      <NodeViewContent className="is-editable" />

      <Button
        type="button"
        variant="ghost"
        data-repeat-indicator=""
        className="absolute inset-y-0 right-0 h-auto w-5 translate-x-full cursor-pointer flex-col gap-1 rounded-none p-0 opacity-60"
        contentEditable={false}
        aria-label={t('repeatMenu.selectBlock')}
        onClick={() => {
          editor.commands.setNodeSelection(getPos());
        }}
      >
        <IconPlaceholder
  lucide="Repeat2"
  tabler="IconRepeat"
  hugeicons="RepeatIcon"
  phosphor="Repeat"
  remixicon="RiRepeatLine"
  className="text-foreground size-3 stroke-[2.5]"
/>
        <div className="bg-primary/50 w-[1.5px] grow rounded-full" />
      </Button>
    </NodeViewWrapper>
  );
}
