import { Link, LinkIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { Button } from '../base-button';
import { useRef, useState, type ReactNode } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip';
import { DEFAULT_PLACEHOLDER_URL, useMailyContext } from '@/editor/provider';
import { InputAutocomplete } from './input-autocomplete';
import { processVariables } from '@/editor/utils/variable';
import { useMemo } from 'react';
import { Editor } from '@tiptap/core';
import { useVariableOptions } from '@/editor/utils/node-options';
import { DEFAULT_VARIABLE_TRIGGER_CHAR } from '@/editor/nodes/variable/variable';
import { Toggle } from './toggle';
import { BOTTOM_FLOATING_CONTENT_PROPS } from './floating-placement';

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

  const linkInputRef = useRef<HTMLInputElement>(null);

  const { placeholderUrl = DEFAULT_PLACEHOLDER_URL, t } = useMailyContext();
  const options = useVariableOptions(editor);

  const renderVariable = options?.renderVariable;
  const variables = options?.variables;
  const variableTriggerCharacter =
    options?.suggestion?.char ?? DEFAULT_VARIABLE_TRIGGER_CHAR;

  const autoCompleteOptions = useMemo(() => {
    const withoutTrigger = defaultValue.replace(
      new RegExp(variableTriggerCharacter, 'g'),
      ''
    );

    return processVariables(variables, {
      query: withoutTrigger || '',
      from: 'bubble-variable',
      editor,
    }).map((variable) => variable.name);
  }, [variables, variableTriggerCharacter, defaultValue, editor]);

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          setTimeout(() => {
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

            onValueChange?.(input.value);
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
                    setTimeout(() => {
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
                  <LinkIcon className="text-foreground h-3 w-3 stroke-[2.5]" />
                </div>

                <InputAutocomplete
                  editor={editor}
                  value={defaultValue}
                  onValueChange={(value) => {
                    onValueChange?.(value);
                  }}
                  autoCompleteOptions={autoCompleteOptions}
                  ref={linkInputRef}
                  placeholder={placeholderUrl}
                  className="placeholder:text-muted-foreground h-8 w-56 pl-6 pr-6"
                  triggerChar={variableTriggerCharacter}
                  onSelectOption={(value) => {
                    const isVariable =
                      autoCompleteOptions.includes(value) ?? false;
                    if (isVariable) {
                      setIsEditing(false);
                    }

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
