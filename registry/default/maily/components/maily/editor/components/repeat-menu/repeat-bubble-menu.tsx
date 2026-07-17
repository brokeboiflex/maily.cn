import { IconPlaceholder } from "@/components/icon-placeholder"
import { cn } from '@/lib/utils';
import { isTextSelected } from '../../utils/is-text-selected';
import { BubbleMenu, findChildren } from '@tiptap/react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { sticky } from 'tippy.js';
import { getRenderContainer } from '../../utils/get-render-container';
import { ShowPopover } from '../show-popover';
import { type EditorBubbleMenuProps } from '../text-menu/text-bubble-menu';
import { Separator } from '@/components/ui/separator';
import { InputAutocomplete } from '../ui/input-autocomplete';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRepeatState } from './use-repeat-state';
import { getClosestNodeByName } from '../../utils/columns';
import { processVariables } from '../../utils/variable';
import { useVariableOptions } from '../../utils/node-options';
import { useMailyContext } from '../../provider';
import { Button } from '@/components/ui/button';

export function RepeatBubbleMenu(props: EditorBubbleMenuProps) {
  const { appendTo, editor } = props;
  if (!editor) {
    return null;
  }

  const state = useRepeatState(editor);
  const { t } = useMailyContext();

  const getReferenceClientRect = useCallback(() => {
    const renderContainer = getRenderContainer(editor!, 'repeat');
    const rect =
      renderContainer?.getBoundingClientRect() ||
      new DOMRect(-1000, -1000, 0, 0);

    return rect;
  }, [editor]);

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    ...(appendTo ? { appendTo: appendTo.current } : {}),
    shouldShow: ({ editor }) => {
      const activeForNode = getClosestNodeByName(editor, 'repeat');
      const sectionNodeChildren = activeForNode
        ? findChildren(activeForNode?.node, (node) => {
            return node.type.name === 'section';
          })?.[0]
        : null;
      const hasActiveSectionNodeChildren =
        sectionNodeChildren && editor.isActive('section');

      if (
        isTextSelected(editor) ||
        hasActiveSectionNodeChildren ||
        !editor.isEditable
      ) {
        return false;
      }

      return editor.isActive('repeat');
    },
    tippyOptions: {
      offset: [0, 8],
      popperOptions: {
        modifiers: [{ name: 'flip', enabled: false }],
      },
      getReferenceClientRect,
      appendTo: () => appendTo?.current,
      plugins: [sticky],
      sticky: 'popper',
      maxWidth: 'auto',
    },
    pluginKey: 'repeatBubbleMenu',
  };

  const opts = useVariableOptions(editor);
  const variables = opts?.variables;
  const renderVariable = opts?.renderVariable;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);

  const eachKey = state?.each || '';
  const autoCompleteOptions = useMemo(() => {
    return processVariables(variables, {
      query: eachKey || '',
      editor,
      from: 'repeat-variable',
    }).map((variable) => variable.name);
  }, [variables, eachKey, editor]);

  const isValidEachKey = eachKey;

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      className="border-border bg-background flex items-stretch rounded-lg border p-0.5 shadow-md"
    >
      <TooltipProvider>
        <div className="flex items-center gap-1.5 px-1.5 text-sm leading-none">
          {t('repeatMenu.label')}
          <Tooltip>
            <TooltipTrigger>
              <IconPlaceholder
  lucide="InfoIcon"
  tabler="IconInfoCircle"
  hugeicons="InformationCircleIcon"
  phosphor="Info"
  remixicon="RiInformationLine"
  className={cn('text-muted-foreground size-3 stroke-[2.5]')}
/>
            </TooltipTrigger>
            <TooltipContent
              sideOffset={14}
              className="max-w-[260px]"
              align="start"
            >
              {t('repeatMenu.iterableHint')}
            </TooltipContent>
          </Tooltip>
        </div>
        {!isUpdatingKey && (
          <Button
            type="button"
            variant="ghost"
            className="h-auto p-0"
            onClick={() => {
              setIsUpdatingKey(true);
              setTimeout(() => {
                inputRef.current?.focus();
              }, 0);
            }}
          >
            {renderVariable({
              variable: {
                name: state?.each,
                valid: isValidEachKey,
              },
              fallback: '',
              from: 'bubble-variable',
              editor,
            })}
          </Button>
        )}
        {isUpdatingKey && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsUpdatingKey(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsUpdatingKey(false);
              }
            }}
          >
            <InputAutocomplete
              editor={editor}
              placeholder={t('repeatMenu.placeholder')}
              value={state?.each || ''}
              onValueChange={(value) => {
                editor.commands.updateRepeat({
                  each: value,
                });
              }}
              onOutsideClick={() => {
                setIsUpdatingKey(false);
              }}
              onSelectOption={(value) => {
                editor.commands.updateRepeat({
                  each: value,
                });
                setIsUpdatingKey(false);
              }}
              autoCompleteOptions={autoCompleteOptions}
              ref={inputRef}
            />
          </form>
        )}

        <Separator orientation="vertical" />
        <ShowPopover
          showIfKey={state.currentShowIfKey}
          onShowIfKeyValueChange={(value) => {
            editor.commands.updateRepeat({
              showIfKey: value,
            });
          }}
          editor={editor}
        />
      </TooltipProvider>
    </BubbleMenu>
  );
}
