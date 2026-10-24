import { IconPlaceholder } from "@/components/icon-placeholder"
import type { Editor } from '@tiptap/core';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import type { Node } from '@tiptap/pm/model';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DragHandle } from '../plugins/drag-handle/drag-handle';
import { captureNodeAction } from '../utils/node-action';
import { useMailyContext } from '../maily-context';

export type ContentMenuProps = {
  editor: Editor;
};

export function ContentMenu(props: ContentMenuProps) {
  const { editor } = props;
  const { t } = useMailyContext();

  const [menuOpen, setMenuOpen] = useState(false);
  const [currentNodePos, setCurrentNodePos] = useState<number>(-1);
  const menuOpenRef = useRef(false);
  const target = useRef<ReturnType<typeof captureNodeAction>>(null);

  useLayoutEffect(
    () => () => {
      menuOpenRef.current = false;
      target.current = null;
    },
    [editor]
  );

  const handleNodeChange = useCallback(
    (data: { node: Node | null; editor: Editor; pos: number }) => {
      if (menuOpenRef.current) return;
      target.current = captureNodeAction(editor, data.pos, data.node);

      setCurrentNodePos(data.pos);
    },
    [editor]
  );

  function duplicateNode() {
    target.current?.run((node, pos) => {
      editor
        .chain()
        .setMeta('hideDragHandle', true)
        .insertContentAt(pos + node.nodeSize, node.toJSON())
        .run();
    });
    menuOpenRef.current = false;
    setMenuOpen(false);
  }

  function deleteCurrentNode() {
    target.current?.run((node, pos) => {
      editor
        .chain()
        .setMeta('hideDragHandle', true)
        .deleteRange({ from: pos, to: pos + node.nodeSize })
        .run();
    });
    menuOpenRef.current = false;
    setMenuOpen(false);
  }

  function handleAddNewNode() {
    target.current?.run((node, pos) => {
      const insertPos = pos + node.nodeSize;
      const empty = node.type.name === 'paragraph' && node.content.size === 0;
      editor
        .chain()
        .command(({ tr, state }) => {
          if (empty) {
            tr.insertText('/', pos + 1);
          } else {
            tr.insert(
              insertPos,
              state.schema.nodes.paragraph.create(null, [
                state.schema.text('/'),
              ])
            );
          }
          return true;
        })
        .focus(empty ? pos + 2 : insertPos + 2)
        .run();
    });
  }

  // Dispatch only while the menu is open: any transaction lets TipTap's
  // trailing-node plugin append a paragraph, even in a read-only editor.
  useEffect(() => {
    if (!menuOpen) return;
    editor.commands.setMeta('lockDragHandle', true);
    return () => {
      editor.commands.setMeta('lockDragHandle', false);
    };
  }, [editor, menuOpen]);

  return (
    <DragHandle
      pluginKey="ContentMenu"
      editor={editor}
      placement="left"
      zIndex={99}
      onNodeChange={handleNodeChange}
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
                aria-label={t('contentMenu.addNode')}
                type="button"
              >
                <IconPlaceholder
  lucide="Plus"
  tabler="IconPlus"
  hugeicons="Add01Icon"
  phosphor="Plus"
  remixicon="RiAddLine"
  className="size-4 shrink-0"
/>
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>
              {t('contentMenu.addNode')}
            </TooltipContent>
          </Tooltip>
          <DropdownMenu
            open={menuOpen}
            onOpenChange={(open) => {
              menuOpenRef.current = open;
              setMenuOpen(open);
              if (open) {
                const owned = target.current;
                if (!owned?.isCurrent()) {
                  menuOpenRef.current = false;
                  setMenuOpen(false);
                  return;
                }
                editor.commands.setNodeSelection(currentNodePos);
              }
            }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex shrink-0">
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground relative z-1 size-7! cursor-grab"
                      aria-label={t('contentMenu.nodeActions')}
                      type="button"
                    >
                      <IconPlaceholder
  lucide="GripVertical"
  tabler="IconGripVertical"
  hugeicons="GripVerticalIcon"
  phosphor="DotsSixVertical"
  remixicon="RiDraggable"
  className="size-4 shrink-0"
/>
                    </Button>
                  </DropdownMenuTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>
                {t('contentMenu.nodeActions')}
              </TooltipContent>
            </Tooltip>

            <DropdownMenuContent
              align="start"
              side="bottom"
              sideOffset={8}
              className="w-max min-w-36"
            >
              <DropdownMenuItem onClick={duplicateNode}>
                <IconPlaceholder
  lucide="Copy"
  tabler="IconCopy"
  hugeicons="Copy01Icon"
  phosphor="Copy"
  remixicon="RiFileCopyLine"
/>
                {t('contentMenu.duplicate')}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={deleteCurrentNode}
              >
                <IconPlaceholder
  lucide="Trash2"
  tabler="IconTrash"
  hugeicons="Delete02Icon"
  phosphor="Trash"
  remixicon="RiDeleteBinLine"
/>
                {t('contentMenu.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TooltipProvider>
    </DragHandle>
  );
}
