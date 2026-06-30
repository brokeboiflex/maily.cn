import type { Editor } from '@tiptap/core';
import { useCallback, useEffect, useState } from 'react';

import type { NodeSelection } from '@tiptap/pm/state';

import type { Node } from '@tiptap/pm/model';
import { Copy, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from './base-button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Divider } from './ui/divider';
import { DragHandle } from '../plugins/drag-handle/drag-handle';
import { cn } from '../utils/classname';
import { useMailyContext } from '../provider';

export type ContentMenuProps = {
  editor: Editor;
};

export function ContentMenu(props: ContentMenuProps) {
  const { editor } = props;
  const { t } = useMailyContext();

  const [menuOpen, setMenuOpen] = useState(false);
  const [currentNode, setCurrentNode] = useState<Node | null>(null);
  const [currentNodePos, setCurrentNodePos] = useState<number>(-1);

  const handleNodeChange = useCallback(
    (data: { node: Node | null; editor: Editor; pos: number }) => {
      if (data.node) {
        setCurrentNode(data.node);
      }

      setCurrentNodePos(data.pos);
    },
    [setCurrentNodePos, setCurrentNode]
  );

  function duplicateNode() {
    editor.commands.setNodeSelection(currentNodePos);
    const { $anchor } = editor.state.selection;
    const selectedNode =
      $anchor.node(1) || (editor.state.selection as NodeSelection).node;
    editor
      .chain()
      .setMeta('hideDragHandle', true)
      .insertContentAt(
        currentNodePos + (currentNode?.nodeSize || 0),
        selectedNode.toJSON()
      )
      .run();

    setMenuOpen(false);
  }

  function deleteCurrentNode() {
    editor
      .chain()
      .setMeta('hideDragHandle', true)
      .setNodeSelection(currentNodePos)
      .deleteSelection()
      .run();

    setMenuOpen(false);
  }

  function handleAddNewNode() {
    if (currentNodePos !== -1) {
      const currentNodeSize = currentNode?.nodeSize || 0;
      const insertPos = currentNodePos + currentNodeSize;
      const currentNodeIsEmptyParagraph =
        currentNode?.type.name === 'paragraph' &&
        currentNode?.content?.size === 0;
      const focusPos = currentNodeIsEmptyParagraph
        ? currentNodePos + 2
        : insertPos + 2;
      editor
        .chain()
        .command(({ dispatch, tr, state }) => {
          if (dispatch) {
            if (currentNodeIsEmptyParagraph) {
              tr.insertText('/', currentNodePos, currentNodePos + 1);
            } else {
              tr.insert(
                insertPos,
                state.schema.nodes.paragraph.create(null, [
                  state.schema.text('/'),
                ])
              );
            }

            return dispatch(tr);
          }

          return true;
        })
        .focus(focusPos)
        .run();
    }
  }

  useEffect(() => {
    if (menuOpen) {
      editor.commands.setMeta('lockDragHandle', true);
    } else {
      editor.commands.setMeta('lockDragHandle', false);
    }

    return () => {
      editor.commands.setMeta('lockDragHandle', false);
    };
  }, [editor, menuOpen]);

  return (
    <DragHandle
      pluginKey="ContentMenu"
      editor={editor}
      tippyOptions={{
        placement: 'left',
        offset: [0, 0],
        zIndex: 99,
      }}
      onNodeChange={handleNodeChange}
      className={cn(editor.isEditable ? 'visible' : 'hidden')}
    >
      <TooltipProvider>
        <div className="flex items-center pr-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground size-7! cursor-grab"
                onClick={handleAddNewNode}
                type="button"
              >
                <Plus className="size-4 shrink-0" />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>
              {t('contentMenu.addNode')}
            </TooltipContent>
          </Tooltip>
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <div className="relative flex flex-col">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground relative z-1 size-7! cursor-grab"
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpen(true);
                      editor.commands.setNodeSelection(currentNodePos);
                    }}
                    type="button"
                  >
                    <GripVertical className="size-4 shrink-0" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>
                  {t('contentMenu.nodeActions')}
                </TooltipContent>
              </Tooltip>
              <PopoverTrigger className="absolute top-0 left-0 z-0 h-7 w-7" />
            </div>

            <PopoverContent
              align="start"
              side="bottom"
              sideOffset={8}
              className="flex w-max flex-col rounded-md p-1"
            >
              <Button
                variant="ghost"
                onClick={duplicateNode}
                className="h-auto justify-start gap-2 rounded! px-2 py-1 text-sm font-normal"
              >
                <Copy className="size-[15px] shrink-0" />
                {t('contentMenu.duplicate')}
              </Button>
              <Divider type="horizontal" />
              <Button
                onClick={deleteCurrentNode}
                className="bg-destructive/10 text-destructive h-auto justify-start gap-2 rounded! px-2 py-1 text-sm font-normal hover:bg-red-200 focus:bg-red-200"
              >
                <Trash2 className="size-[15px] shrink-0" />
                {t('contentMenu.delete')}
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </TooltipProvider>
    </DragHandle>
  );
}
