import { useOwnedTimeout } from '../../utils/use-owned-timeout';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/editor/components/popover';
import { Button } from '@/editor/components/base-button';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/editor/components/ui/tooltip';
import { DEFAULT_PLACEHOLDER_URL, useMailyContext } from '../../maily-context';
import { InputAutocomplete } from './input-autocomplete';
import { processVariables } from '../../utils/variable';
import { useMemo } from 'react';
import { Editor } from '@tiptap/core';
import type { Selection } from '@tiptap/pm/state';
import { useLatestRef } from '../../utils/state-hooks';
import { useVariableOptions } from '../../utils/node-options';
import { DEFAULT_VARIABLE_TRIGGER_CHAR } from '../../nodes/variable/variable';
import { Toggle } from '@/editor/components/ui/toggle';
import { BOTTOM_FLOATING_CONTENT_PROPS } from './floating-placement';
import { Link } from 'lucide-react';

type LinkInputPopoverProps = {
  defaultValue?: string;
  isVariable?: boolean;
  onValueChange?: (value: string, isVariable?: boolean) => void;

  icon?: ReactNode;
  tooltip?: string;

  editor: Editor;
};

export function LinkInputPopover(props: LinkInputPopoverProps) {
  const {
    defaultValue = '',
    onValueChange,
    tooltip,
    icon,
    editor,

    isVariable,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(!isVariable);
  // Typing edits a local draft. The editor receives one change when the
  // popover commits it (Enter, a suggestion, or closing), so typing never
  // moves focus into the document or adds a history step per keystroke.
  const [draft, setDraft] = useState(defaultValue);
  const [openSelection, setOpenSelection] = useState<Selection | null>(null);
  // If the host surface unmounts while a typed URL is pending (a compact-layout
  // switch, for example), commit it only onto the selection it was typed for.
  const pendingRef = useLatestRef({
    isOpen,
    draft,
    defaultValue,
    openSelection,
    onValueChange,
  });
  useEffect(
    () => () => {
      const pending = pendingRef.current;
      if (
        pending.isOpen &&
        pending.draft !== pending.defaultValue &&
        !editor.isDestroyed &&
        editor.isEditable &&
        pending.openSelection?.eq(editor.state.selection)
      )
        pending.onValueChange?.(pending.draft);
    },
    [editor, pendingRef]
  );

  const { schedule: scheduleTimeout, cancel: cancelTimeout } =
    useOwnedTimeout();
  const linkInputRef = useRef<HTMLInputElement>(null);

  const { placeholderUrl = DEFAULT_PLACEHOLDER_URL, t } = useMailyContext();
  const options = useVariableOptions(editor);

  const renderVariable = options?.renderVariable;
  const variables = options?.variables;
  const variableTriggerCharacter =
    options?.suggestion?.char ?? DEFAULT_VARIABLE_TRIGGER_CHAR;

  const autoCompleteOptions = useMemo(() => {
    const withoutTrigger = draft.replaceAll(variableTriggerCharacter, '');

    return processVariables(variables, {
      query: withoutTrigger || '',
      from: 'bubble-variable',
      editor,
    }).map((variable) => variable.name);
  }, [variables, variableTriggerCharacter, draft, editor]);

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          cancelTimeout();
          if (draft !== defaultValue) onValueChange?.(draft);
        }
        if (open) {
          setDraft(defaultValue);
          setOpenSelection(editor.state.selection);
          scheduleTimeout(() => {
            linkInputRef.current?.focus();
          }, 0);
        }
      }}
    >
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex shrink-0">
              <PopoverTrigger asChild>
                <Toggle
                  pressed={!!defaultValue}
                  onPressedChange={() => undefined}
                  type="button"
                  className="h-7! w-7! px-0"
                  aria-label={tooltip}
                >
                  <span className="text-foreground flex size-3 shrink-0 items-center justify-center [&_svg]:size-3 [&_svg]:stroke-[2.5]">
                    {icon ?? <Link />}
                  </span>
                </Toggle>
              </PopoverTrigger>
            </span>
          </TooltipTrigger>
          <TooltipContent sideOffset={8}>{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        <PopoverTrigger asChild>
          <Toggle
            pressed={!!defaultValue}
            onPressedChange={() => undefined}
            type="button"
            className="h-7! w-7! px-0"
            aria-label={t('toolbar.link')}
          >
            <span className="text-foreground flex size-3 shrink-0 items-center justify-center [&_svg]:size-3 [&_svg]:stroke-[2.5]">
              {icon ?? <Link />}
            </span>
          </Toggle>
        </PopoverTrigger>
      )}

      <PopoverContent
        {...BOTTOM_FLOATING_CONTENT_PROPS}
        align="end"
        className="w-max p-1"
        sideOffset={8}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = linkInputRef.current;
            if (!input) {
              return;
            }

            if (input.value !== defaultValue) onValueChange?.(input.value);
            setIsOpen(false);
          }}
        >
          <div className="isolate flex">
            {!isEditing && (
              <div className="flex h-8 items-center px-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto p-0"
                  onClick={() => {
                    setIsEditing(true);
                    scheduleTimeout(() => {
                      linkInputRef.current?.focus();
                    }, 0);
                  }}
                >
                  {renderVariable({
                    variable: {
                      name: defaultValue,
                      valid: true,
                    },
                    fallback: '',
                    from: 'bubble-variable',
                    editor,
                  })}
                </Button>
              </div>
            )}

            {isEditing && (
              <div className="relative">
                <div className="absolute inset-y-0 left-1.5 z-10 flex items-center">
                  <Link className="text-foreground h-3 w-3 stroke-[2.5]" />
                </div>

                <InputAutocomplete
                  editor={editor}
                  value={draft}
                  onValueChange={setDraft}
                  autoCompleteOptions={autoCompleteOptions}
                  ref={linkInputRef}
                  aria-label={tooltip ?? t('toolbar.link')}
                  placeholder={placeholderUrl}
                  className="placeholder:text-muted-foreground h-8 w-56 pr-6 pl-6"
                  triggerChar={variableTriggerCharacter}
                  onSelectOption={(value) => {
                    const isVariable =
                      autoCompleteOptions.includes(value) ?? false;
                    if (isVariable) {
                      setIsEditing(false);
                    }

                    setDraft(value);
                    onValueChange?.(value, isVariable);
                    setIsOpen(false);
                  }}
                />
              </div>
            )}
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
