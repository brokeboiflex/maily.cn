import { BlockGroupItem, BlockItem } from '@/blocks/types';
import { cn } from '@/editor/utils/classname';
import { Editor, Range } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import { SuggestionOptions } from '@tiptap/suggestion';
import {
  forwardRef,
  Fragment,
  KeyboardEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import tippy, { GetReferenceClientRect, Instance } from 'tippy.js';
import { getDefaultBlocks } from './default-slash-commands';
import { englishTranslator, type TranslateFn } from '@/editor/i18n';
import { TooltipProvider } from '@/editor/components/ui/tooltip';
import { SlashCommandItem } from './slash-command-item';
import { filterSlashCommands } from './slash-command-search';

type CommandListProps = {
  items: BlockGroupItem[];
  command: (item: BlockItem) => void;
  editor: Editor;
  range: Range;
  query: string;
  navigateLabel?: string;
  selectLabel?: string;
};

const CommandList = forwardRef<unknown, CommandListProps>((props, ref) => {
  const {
    items: groups,
    command,
    editor,
    range,
    query,
    navigateLabel = englishTranslator('slashCommand.navigate'),
    selectLabel = englishTranslator('slashCommand.select'),
  } = props;

  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [hoveredItemKey, setHoveredItemKey] = useState<string | null>(null);

  const prevQuery = useRef('');
  const prevSelectedGroupIndex = useRef(0);
  const prevSelectedCommandIndex = useRef(0);

  const selectItem = useCallback(
    (groupIndex: number, commandIndex: number) => {
      const item = groups[groupIndex].commands[commandIndex];
      if (!item) {
        return;
      }

      command(item);
    },
    [command]
  );

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      const navigationKeys = [
        'ArrowUp',
        'ArrowDown',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
      ];
      if (navigationKeys.includes(event.key)) {
        let newCommandIndex = selectedCommandIndex;
        let newGroupIndex = selectedGroupIndex;

        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault();

            const group = groups?.[selectedGroupIndex];
            const isInsideSubCommand = group && 'id' in group;
            if (!isInsideSubCommand) {
              return false;
            }

            editor
              .chain()
              .focus()
              .insertContentAt(range, `/${prevQuery.current}`)
              .run();
            setTimeout(() => {
              setSelectedGroupIndex(prevSelectedGroupIndex.current);
              setSelectedCommandIndex(prevSelectedCommandIndex.current);
            }, 0);
            return true;
          case 'ArrowRight':
            event.preventDefault();

            const command =
              groups?.[selectedGroupIndex]?.commands?.[selectedCommandIndex];
            const isSelectingSubCommand = command && 'commands' in command;
            if (!isSelectingSubCommand) {
              return false;
            }

            selectItem(selectedGroupIndex, selectedCommandIndex);
            prevQuery.current = query;
            prevSelectedGroupIndex.current = selectedGroupIndex;
            prevSelectedCommandIndex.current = selectedCommandIndex;
            return true;
          case 'Enter':
            if (!groups.length) {
              return false;
            }
            selectItem(selectedGroupIndex, selectedCommandIndex);

            prevQuery.current = query;
            prevSelectedGroupIndex.current = selectedGroupIndex;
            prevSelectedCommandIndex.current = selectedCommandIndex;
            return true;
          case 'ArrowUp':
            if (!groups.length) {
              return false;
            }
            newCommandIndex = selectedCommandIndex - 1;
            newGroupIndex = selectedGroupIndex;
            if (newCommandIndex < 0) {
              newGroupIndex = selectedGroupIndex - 1;
              newCommandIndex = groups[newGroupIndex]?.commands.length - 1 || 0;
            }
            if (newGroupIndex < 0) {
              newGroupIndex = groups.length - 1;
              newCommandIndex = groups[newGroupIndex]?.commands.length - 1 || 0;
            }
            setSelectedGroupIndex(newGroupIndex);
            setSelectedCommandIndex(newCommandIndex);
            return true;
          case 'ArrowDown':
            if (!groups.length) {
              return false;
            }
            const commands = groups[selectedGroupIndex].commands;
            newCommandIndex = selectedCommandIndex + 1;
            newGroupIndex = selectedGroupIndex;
            if (commands.length - 1 < newCommandIndex) {
              newCommandIndex = 0;
              newGroupIndex = selectedGroupIndex + 1;
            }
            if (groups.length - 1 < newGroupIndex) {
              newGroupIndex = 0;
            }
            setSelectedGroupIndex(newGroupIndex);
            setSelectedCommandIndex(newCommandIndex);
            return true;
          default:
            return false;
        }
      }
    },
  }));

  const commandListContainer = useRef<HTMLDivElement>(null);
  const activeCommandRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    const container = commandListContainer?.current;
    const activeCommandContainer = activeCommandRef?.current;
    if (!container || !activeCommandContainer) {
      return;
    }

    const { offsetTop, offsetHeight } = activeCommandContainer;
    container.style.transition = 'none';
    container.scrollTop = offsetTop - offsetHeight;
  }, [
    selectedGroupIndex,
    selectedCommandIndex,
    commandListContainer,
    activeCommandRef,
  ]);

  useEffect(() => {
    setSelectedGroupIndex(0);
    setSelectedCommandIndex(0);
  }, [groups]);

  useEffect(() => {
    return () => {
      prevQuery.current = '';
      prevSelectedGroupIndex.current = 0;
      prevSelectedCommandIndex.current = 0;
    };
  }, []);

  if (!groups || groups.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="border-border bg-background z-50 w-72 overflow-hidden rounded-md border shadow-md transition-all">
        <div
          id="slash-command"
          ref={commandListContainer}
          className="h-auto max-h-[330px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {groups.map((group, groupIndex) => (
            <Fragment key={groupIndex}>
              <span
                className={cn(
                  'border-border bg-muted text-muted-foreground block border-b p-2 text-xs uppercase',
                  groupIndex > 0 ? 'border-t' : ''
                )}
              >
                {group.title}
              </span>
              <div className="space-y-0.5 p-1">
                {group.commands.map((item, commandIndex) => {
                  const itemKey = `${groupIndex}-${commandIndex}`;
                  return (
                    <SlashCommandItem
                      key={itemKey}
                      item={item}
                      groupIndex={groupIndex}
                      commandIndex={commandIndex}
                      selectedGroupIndex={selectedGroupIndex}
                      selectedCommandIndex={selectedCommandIndex}
                      selectItem={() => selectItem(groupIndex, commandIndex)}
                      editor={editor}
                      activeCommandRef={activeCommandRef}
                      hoveredItemKey={hoveredItemKey}
                      onHover={(isHovered) =>
                        setHoveredItemKey(isHovered ? itemKey : null)
                      }
                    />
                  );
                })}
              </div>
            </Fragment>
          ))}
        </div>
        <div className="border-border border-t px-1 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-center text-xs">
              <kbd className="border-border rounded border p-1 px-2 font-medium">
                ↑
              </kbd>
              <kbd className="border-border ml-1 rounded border p-1 px-2 font-medium">
                ↓
              </kbd>{' '}
              <span className="ml-1 select-none">{navigateLabel}</span>
            </p>
            <p className="text-muted-foreground text-center text-xs">
              <kbd className="border-border rounded border p-1 px-1.5 font-medium">
                Enter
              </kbd>{' '}
              <span className="ml-1 select-none">{selectLabel}</span>
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
});

export function getSlashCommandSuggestions(
  groups: BlockGroupItem[] = getDefaultBlocks(englishTranslator),
  t: TranslateFn = englishTranslator
): Omit<SuggestionOptions, 'editor'> {
  const navigateLabel = t('slashCommand.navigate');
  const selectLabel = t('slashCommand.select');

  const BoundCommandList = forwardRef<unknown, CommandListProps>(
    (props, ref) => (
      <CommandList
        {...props}
        navigateLabel={navigateLabel}
        selectLabel={selectLabel}
        ref={ref}
      />
    )
  );

  return {
    items: ({ query, editor }) => {
      return filterSlashCommands({ query, editor, groups });
    },
    allow: ({ editor }) => {
      const isInsideHTMLCodeBlock = editor.isActive('htmlCodeBlock');
      if (isInsideHTMLCodeBlock) {
        return false;
      }

      return true;
    },
    render: () => {
      let component: ReactRenderer<any>;
      let popup: Instance<any>[] | null = null;

      return {
        onStart: (props) => {
          component = new ReactRenderer(BoundCommandList, {
            props,
            editor: props.editor,
          });

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect as GetReferenceClientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'top-start',
          });
        },
        onUpdate: (props) => {
          const currentPopup = popup?.[0];
          if (!currentPopup || currentPopup?.state?.isDestroyed) {
            return;
          }

          component?.updateProps(props);
          currentPopup.setProps({
            getReferenceClientRect: props.clientRect,
          });
        },
        onKeyDown: (props) => {
          if (props.event.key === 'Escape') {
            const currentPopup = popup?.[0];
            if (!currentPopup?.state?.isDestroyed) {
              currentPopup?.destroy();
            }

            component?.destroy();
            return true;
          }

          return component?.ref?.onKeyDown(props);
        },
        onExit: () => {
          if (!popup || !popup?.[0] || !component) {
            return;
          }

          const currentPopup = popup?.[0];
          if (!currentPopup.state.isDestroyed) {
            currentPopup.destroy();
          }

          component?.destroy();
        },
      };
    },
  };
}
