import { type VariableSuggestionsPopoverRef } from '../../nodes/variable/variable-suggestions-popover';
import { cn } from '@/lib/utils';
import { AUTOCOMPLETE_PASSWORD_MANAGERS_OFF } from '../../utils/constants';
import { useVariableOptions } from '../../utils/node-options';
import { useOutsideClick } from '../../utils/use-outside-click';
import type { Editor } from '@tiptap/core';
import {
  forwardRef,
  type CSSProperties,
  type InputHTMLAttributes,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useMailyContext } from '../../provider';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { CornerDownLeft } from "lucide-react";

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
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<VariableSuggestionsPopoverRef>(null);
  const listboxId = `mly-autocomplete-${useId()}`;
  const [popupStyle, setPopupStyle] = useState<CSSProperties>();
  const VariableSuggestionPopoverComponent =
    useVariableOptions(editor)?.variableSuggestionsPopover;

  useOutsideClick([containerRef, suggestionsRef], () => {
    onOutsideClick?.();
  });

  const isTriggeringVariable =
    triggerChar.length > 0 && value.startsWith(triggerChar);

  useLayoutEffect(() => {
    if (!isTriggeringVariable) {
      setPopupStyle(undefined);
      return;
    }

    const updatePosition = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportPadding = 8;
      const gap = 4;
      const width = Math.min(256, window.innerWidth - viewportPadding * 2);
      const left = Math.min(
        Math.max(rect.left, viewportPadding),
        window.innerWidth - width - viewportPadding
      );
      const availableBelow = window.innerHeight - rect.bottom - viewportPadding;
      const availableAbove = rect.top - viewportPadding;
      const placeAbove =
        availableBelow < 220 && availableAbove > availableBelow;

      setPopupStyle({
        position: 'fixed',
        left,
        width,
        maxHeight: Math.max(120, placeAbove ? availableAbove : availableBelow),
        ...(placeAbove
          ? { bottom: window.innerHeight - rect.top + gap }
          : { top: rect.bottom + gap }),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isTriggeringVariable]);

  return (
    <div className={cn('relative')} ref={containerRef}>
      <InputGroup className={cn('h-7 w-40', className)}>
        <InputGroupInput
          {...AUTOCOMPLETE_PASSWORD_MANAGERS_OFF}
          placeholder={t('inputAutocomplete.placeholder')}
          type="text"
          {...inputProps}
          ref={ref}
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value);
          }}
          className="h-full min-w-0 px-2 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Escape' && isTriggeringVariable) {
              e.preventDefault();
              onOutsideClick?.();
              return;
            }

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
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isTriggeringVariable}
          aria-controls={isTriggeringVariable ? listboxId : undefined}
          aria-haspopup="listbox"
        />
        <InputGroupAddon align="inline-end" className="pr-1.5">
          <CornerDownLeft className="size-3 stroke-[2.5]" />
        </InputGroupAddon>
      </InputGroup>

      {isTriggeringVariable && popupStyle && typeof document !== 'undefined'
        ? createPortal(
            <div
              id={listboxId}
              ref={suggestionsRef}
              className="z-[100] overflow-y-auto"
              style={popupStyle}
            >
              <VariableSuggestionPopoverComponent
                items={autoCompleteOptions.map((option) => ({ name: option }))}
                onSelectItem={(item) => {
                  onSelectOption?.(item.name);
                }}
                ref={popoverRef}
              />
            </div>,
            document.body
          )
        : null}
    </div>
  );
});

InputAutocomplete.displayName = 'InputAutocomplete';
