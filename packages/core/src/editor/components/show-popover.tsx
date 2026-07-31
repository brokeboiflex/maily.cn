import { Editor } from '@tiptap/core';
import { Eye, InfoIcon } from 'lucide-react';
import { memo, useMemo, useRef, useState } from 'react';
import { cn } from '../utils/classname';
import { useVariableOptions } from '../utils/node-options';
import { processVariables } from '../utils/variable';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { InputAutocomplete } from './ui/input-autocomplete';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useMailyContext } from '../provider';
import { Button } from './base-button';
import { BOTTOM_FLOATING_CONTENT_PROPS } from './ui/floating-placement';

type ShowPopoverProps = {
  showIfKey?: string;
  onShowIfKeyValueChange?: (when: string) => void;

  editor: Editor;
};

function _ShowPopover(props: ShowPopoverProps) {
  const { showIfKey = '', onShowIfKeyValueChange, editor } = props;
  const { t } = useMailyContext();

  const opts = useVariableOptions(editor);
  const variables = opts?.variables;
  const renderVariable = opts?.renderVariable;
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const autoCompleteOptions = useMemo(() => {
    return processVariables(variables, {
      query: showIfKey || '',
      from: 'bubble-variable',
      editor,
    }).map((variable) => variable.name);
  }, [variables, showIfKey, editor]);

  const isValidWhenKey = showIfKey || autoCompleteOptions.includes(showIfKey);

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) {
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
        className="p-0.5! flex w-max max-w-[calc(100vw-1rem)] flex-wrap rounded-lg"
        sideOffset={8}
        align="end"
      >
        <div className="flex items-center gap-1.5 px-1.5 text-sm leading-none">
          {t('showPopover.showIf')}
          <Tooltip>
            <TooltipTrigger
              type="button"
              aria-label={t('showPopover.showIfHint')}
            >
              <InfoIcon
                className={cn('text-muted-foreground size-3 stroke-[2.5]')}
              />
            </TooltipTrigger>
            <TooltipContent
              sideOffset={14}
              className="max-w-[285px]"
              align="start"
            >
              {t('showPopover.showIfHint')}
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
                name: showIfKey,
                valid: !!isValidWhenKey,
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
            />
          </form>
        )}
      </PopoverContent>
    </Popover>
  );
}

export const ShowPopover = memo(_ShowPopover);
