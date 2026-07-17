import { IconPlaceholder } from "@/components/icon-placeholder"
import { type VariableSuggestionsPopoverRef } from '../../nodes/variable/variable-suggestions-popover';
import { cn } from '@/lib/utils';
import { AUTOCOMPLETE_PASSWORD_MANAGERS_OFF } from '../../utils/constants';
import { useVariableOptions } from '../../utils/node-options';
import { useOutsideClick } from '../../utils/use-outside-click';
import { Input } from '@/components/ui/input';
import type { Editor } from '@tiptap/core';
import { forwardRef, type InputHTMLAttributes, useRef } from 'react';
import { useMailyContext } from '../../provider';

type InputAutocompleteProps = InputHTMLAttributes<HTMLInputElement> & {
  value: string;
  onValueChange: (value: string) => void;

  autoCompleteOptions?: string[];
  onSelectOption?: (option: string) => void;

  onOutsideClick?: () => void;
  triggerChar?: string;
  placeholder?: string;

  editor: Editor;
};

export const InputAutocomplete = forwardRef<
  HTMLInputElement,
  InputAutocompleteProps
>((props, ref) => {
  const {
    value = '',
    onValueChange,
    className,
    onOutsideClick,
    onSelectOption,
    autoCompleteOptions = [],
    triggerChar = '',
    editor,
    ...inputProps
  } = props;
  const { t } = useMailyContext();

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<VariableSuggestionsPopoverRef>(null);
  const VariableSuggestionPopoverComponent =
    useVariableOptions(editor)?.variableSuggestionsPopover;

  useOutsideClick(containerRef, () => {
    onOutsideClick?.();
  });

  const isTriggeringVariable = value.startsWith(triggerChar);

  return (
    <div className={cn('relative')} ref={containerRef}>
      <label className="relative">
        <Input
          {...AUTOCOMPLETE_PASSWORD_MANAGERS_OFF}
          placeholder={t('inputAutocomplete.placeholder')}
          type="text"
          {...inputProps}
          ref={ref}
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value);
          }}
          className={cn(
            'bg-background text-foreground hover:bg-muted focus:bg-muted h-7 w-40 rounded-md px-2 pr-6 text-sm focus:outline-hidden',
            className
          )}
          onKeyDown={(e) => {
            if (!popoverRef.current || !isTriggeringVariable) {
              return;
            }
            const { moveUp, moveDown, select } = popoverRef.current;

            if (e.key === 'ArrowDown') {
              e.preventDefault();
              moveDown();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              moveUp();
            } else if (e.key === 'Enter') {
              e.preventDefault();
              select();
            }
          }}
          spellCheck={false}
        />
        <div className="absolute inset-y-0 right-1 flex items-center">
          <IconPlaceholder
  lucide="CornerDownLeft"
  tabler="IconCornerDownLeft"
  hugeicons="CornerDownLeftIcon"
  phosphor="ArrowBendDownLeft"
  remixicon="RiCornerDownLeftLine"
  className="text-foreground h-3 w-3 stroke-[2.5]"
/>
        </div>
      </label>

      {isTriggeringVariable && (
        <div className="absolute top-8 left-0">
          <VariableSuggestionPopoverComponent
            items={autoCompleteOptions.map((option) => {
              return {
                name: option,
              };
            })}
            onSelectItem={(item) => {
              onSelectOption?.(item.name);
            }}
            ref={popoverRef}
          />
        </div>
      )}
    </div>
  );
});

InputAutocomplete.displayName = 'InputAutocomplete';
