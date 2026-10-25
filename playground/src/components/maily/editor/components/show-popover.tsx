import { useOwnedTimeout } from '../utils/use-owned-timeout';
import { Editor } from '@tiptap/core';
import { memo, useId, useMemo, useRef, useState } from 'react';
import { cn } from 'cn';
import { useVariableOptions } from '../utils/node-options';
import { hasVariables, processVariables } from '../utils/variable';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { InputAutocomplete } from './ui/input-autocomplete';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useMailyContext } from '../maily-context';
import { Button } from '@/components/ui/button';
import { BOTTOM_FLOATING_CONTENT_PROPS } from './ui/floating-placement';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { Eye } from "lucide-react";

type ShowPopoverProps = {
  showIfKey?: string;
  onShowIfKeyValueChange?: (when: string) => void;

  editor: Editor;
};

function ShowPopoverControl(props: ShowPopoverProps) {
  const { showIfKey = '', onShowIfKeyValueChange, editor } = props;
  const { t } = useMailyContext();

  const opts = useVariableOptions(editor);
  const variables = opts?.variables;
  const renderVariable = opts?.renderVariable;
  const [isUpdatingKey, setIsUpdatingKey] = useState(!showIfKey);
  const inputId = useId();
  const { schedule: scheduleTimeout, cancel: cancelTimeout } =
    useOwnedTimeout();
  const inputRef = useRef<HTMLInputElement>(null);

  const autoCompleteOptions = useMemo(() => {
    return processVariables(variables, {
      query: showIfKey || '',
      from: 'bubble-variable',
      editor,
    }).map((variable) => variable.name);
  }, [variables, showIfKey, editor]);

  const isValidWhenKey = showIfKey || autoCompleteOptions.includes(showIfKey);

  if (!hasVariables(variables)) return null;

  return (
    <>
      <Separator orientation="vertical" />
      <Popover
        onOpenChange={(open) => {
          if (!open) cancelTimeout();
          if (open) {
            setIsUpdatingKey(!showIfKey);
            return;
          }

          setIsUpdatingKey(false);
        }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex shrink-0">
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'size-7',
                    showIfKey &&
                      'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary aria-expanded:bg-primary/15 aria-expanded:text-primary'
                  )}
                  aria-label={t('showPopover.showConditionally')}
                >
                  <Eye className="h-3 w-3 stroke-[2.5]" />
                </Button>
              </PopoverTrigger>
            </span>
          </TooltipTrigger>
          <TooltipContent sideOffset={8}>
            {t('showPopover.showConditionally')}
          </TooltipContent>
        </Tooltip>
        <PopoverContent
          {...BOTTOM_FLOATING_CONTENT_PROPS}
          className="w-64 max-w-[calc(100vw-1rem)]"
          sideOffset={8}
          align="end"
        >
          <Field>
            <FieldLabel htmlFor={inputId}>{t('showPopover.showIf')}</FieldLabel>
            {!isUpdatingKey && showIfKey && (
              <Button
                type="button"
                variant="ghost"
                id={inputId}
                className="h-auto min-h-8 justify-start overflow-hidden p-0 text-left"
                onClick={() => {
                  setIsUpdatingKey(true);
                  scheduleTimeout(() => {
                    inputRef.current?.focus();
                  }, 0);
                }}
              >
                {renderVariable({
                  variable: {
                    name: showIfKey,
                    valid: !!isValidWhenKey,
                  },
                  fallback: '',
                  from: 'bubble-variable',
                  editor,
                })}
              </Button>
            )}
            {(isUpdatingKey || !showIfKey) && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsUpdatingKey(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsUpdatingKey(false);
                  }
                }}
              >
                <InputAutocomplete
                  id={inputId}
                  editor={editor}
                  value={showIfKey || ''}
                  onValueChange={(value) => {
                    onShowIfKeyValueChange?.(value);
                  }}
                  onOutsideClick={() => {
                    setIsUpdatingKey(false);
                  }}
                  onSelectOption={(value) => {
                    onShowIfKeyValueChange?.(value);
                    setIsUpdatingKey(false);
                  }}
                  autoCompleteOptions={autoCompleteOptions}
                  ref={inputRef}
                  aria-label={t('showPopover.showIf')}
                  aria-describedby={`${inputId}-hint`}
                  className="h-8 w-full"
                />
              </form>
            )}
            <FieldDescription id={`${inputId}-hint`} className="text-xs">
              {t('showPopover.showIfHint')}
            </FieldDescription>
          </Field>
        </PopoverContent>
      </Popover>
    </>
  );
}

export const ShowPopover = memo(ShowPopoverControl);
