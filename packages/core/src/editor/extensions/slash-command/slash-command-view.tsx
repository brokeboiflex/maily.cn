import { BlockGroupItem, BlockItem } from '@/blocks/types';
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
import { SlashCommandItem } from './slash-command-item';
import { SlashCommandSubmenu } from './slash-command-submenu';
import { filterSlashCommands } from './slash-command-search';

const isSubCommandItem = (item: BlockItem | undefined): boolean =>
  !!item && 'commands' in item;

type SubmenuState = { groupIndex: number; commandIndex: number };

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
  const [submenu, setSubmenu] = useState<SubmenuState | null>(null);
  const [submenuIndex, setSubmenuIndex] = useState(0);
  const [focusInSubmenu, setFocusInSubmenu] = useState(false);
  const [submenuTop, setSubmenuTop] = useState(0);

  const prevQuery = useRef('');
  const prevSelectedGroupIndex = useRef(0);
  const prevSelectedCommandIndex = useRef(0);
  // Scroll the active item into view only for keyboard navigation; hovering must
  // not move the scroll position (mouse-over sets the selection too).
  const keyboardNav = useRef(false);

  const openSubItem = submenu
    ? groups[submenu.groupIndex]?.commands[submenu.commandIndex]
    : undefined;
  const submenuCommands: BlockItem[] =
    openSubItem && 'commands' in openSubItem && Array.isArray(openSubItem.commands)
      ? openSubItem.commands
      : [];

  const openSubmenu = useCallback(
    (groupIndex: number, commandIndex: number, focus: boolean) => {
      setSelectedGroupIndex(groupIndex);
      setSelectedCommandIndex(commandIndex);
      setSubmenu({ groupIndex, commandIndex });
      setSubmenuIndex(0);
      setFocusInSubmenu(focus);
    },
    []
  );

  const closeSubmenu = useCallback(() => {
    setSubmenu(null);
    setSubmenuIndex(0);
    setFocusInSubmenu(false);
  }, []);

  // Selecting a subcommand opens its flyout; selecting a leaf runs its command.
  const selectItem = useCallback(
    (groupIndex: number, commandIndex: number) => {
      const item = groups[groupIndex]?.commands[commandIndex];
      if (!item) {
        return;
      }

      if (isSubCommandItem(item)) {
        openSubmenu(groupIndex, commandIndex, true);
        return;
      }

      command(item);
    },
    [command, groups, openSubmenu]
  );

  const selectSubItem = useCallback(
    (index: number) => {
      const item = submenuCommands[index];
      if (!item) {
        return;
      }

      command(item);
    },
    [command, submenuCommands]
  );

  const handleItemHover = useCallback(
    (groupIndex: number, commandIndex: number) => {
      keyboardNav.current = false;
      setSelectedGroupIndex(groupIndex);
      setSelectedCommandIndex(commandIndex);

      const item = groups[groupIndex]?.commands[commandIndex];
      if (item && isSubCommandItem(item)) {
        setSubmenu({ groupIndex, commandIndex });
        setSubmenuIndex(0);
        setFocusInSubmenu(false);
      } else {
        closeSubmenu();
      }
    },
    [groups, closeSubmenu]
  );

  const handleSubHover = useCallback((index: number) => {
    setSubmenuIndex(index);
    setFocusInSubmenu(true);
  }, []);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      const navigationKeys = [
        'ArrowUp',
        'ArrowDown',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
      ];
      if (!navigationKeys.includes(event.key)) {
        return false;
      }

      // Keyboard focus is inside the open submenu flyout.
      if (submenu && focusInSubmenu) {
        const count = submenuCommands.length;
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            if (count) {
              setSubmenuIndex((index) => (index + 1) % count);
            }
            return true;
          case 'ArrowUp':
            event.preventDefault();
            if (count) {
              setSubmenuIndex((index) => (index - 1 + count) % count);
            }
            return true;
          case 'ArrowLeft':
            event.preventDefault();
            closeSubmenu();
            return true;
          case 'ArrowRight':
            event.preventDefault();
            return true;
          case 'Enter':
            if (!count) {
              return false;
            }
            selectSubItem(submenuIndex);
            return true;
          default:
            return false;
        }
      }

      let newCommandIndex = selectedCommandIndex;
      let newGroupIndex = selectedGroupIndex;

      switch (event.key) {
        case 'ArrowLeft': {
          event.preventDefault();

          // Manual `/headers.` query view: step back out to the parent list.
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
        }
        case 'ArrowRight': {
          event.preventDefault();

          const item =
            groups?.[selectedGroupIndex]?.commands?.[selectedCommandIndex];
          if (!isSubCommandItem(item)) {
            return false;
          }

          openSubmenu(selectedGroupIndex, selectedCommandIndex, true);
          return true;
        }
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
          closeSubmenu();
          keyboardNav.current = true;
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
          closeSubmenu();
          keyboardNav.current = true;
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
    },
  }));

  const wrapperRef = useRef<HTMLDivElement>(null);
  const commandListContainer = useRef<HTMLDivElement>(null);
  const activeCommandRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    // Only auto-scroll on keyboard navigation — hovering also moves the
    // selection, and scrolling on mouse-over makes the list unusable.
    if (!keyboardNav.current) {
      return;
    }
    keyboardNav.current = false;

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

  // Align the submenu flyout to its trigger row (the active item when open).
  useLayoutEffect(() => {
    if (!submenu) {
      return;
    }

    const trigger = activeCommandRef.current;
    const wrapper = wrapperRef.current;
    if (!trigger || !wrapper) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    setSubmenuTop(triggerRect.top - wrapperRect.top);
  }, [submenu, selectedGroupIndex, selectedCommandIndex]);

  useEffect(() => {
    setSelectedGroupIndex(0);
    setSelectedCommandIndex(0);
    setSubmenu(null);
    setSubmenuIndex(0);
    setFocusInSubmenu(false);
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
    <div ref={wrapperRef} className="relative w-72">
      <div className="border-border bg-popover text-popover-foreground z-50 w-full overflow-hidden rounded-md border shadow-md transition-all">
        <div
          id="slash-command"
          ref={commandListContainer}
          className="h-auto max-h-[330px] overflow-y-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {groups.map((group, groupIndex) => (
            <Fragment key={groupIndex}>
              {groupIndex > 0 && <div className="bg-border -mx-1 my-1 h-px" />}
              <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.commands.map((item, commandIndex) => {
                  const isActive =
                    groupIndex === selectedGroupIndex &&
                    commandIndex === selectedCommandIndex;
                  return (
                    <SlashCommandItem
                      key={`${groupIndex}-${commandIndex}`}
                      item={item}
                      isActive={isActive}
                      editor={editor}
                      onSelect={() => selectItem(groupIndex, commandIndex)}
                      onMouseEnter={() =>
                        handleItemHover(groupIndex, commandIndex)
                      }
                      activeRef={isActive ? activeCommandRef : undefined}
                    />
                  );
                })}
              </div>
            </Fragment>
          ))}
        </div>
        <div className="border-border border-t px-4 py-3">
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

      {submenu && submenuCommands.length > 0 && (
        <SlashCommandSubmenu
          commands={submenuCommands}
          activeIndex={submenuIndex}
          isFocused={focusInSubmenu}
          editor={editor}
          style={{ top: submenuTop }}
          onSelect={selectSubItem}
          onHover={handleSubHover}
        />
      )}
    </div>
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
