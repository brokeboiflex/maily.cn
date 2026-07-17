import { InputAutocomplete } from '../../components/ui/input-autocomplete';
import { DEFAULT_VARIABLE_TRIGGER_CHAR } from '../variable/variable';
import { DEFAULT_PLACEHOLDER_URL, useMailyContext } from '../../provider';
import { useVariableOptions } from '../../utils/node-options';
import { processVariables } from '../../utils/variable';
import { Editor } from '@tiptap/core';
import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

type ButtonLabelInputProps = {
  value: string;
  onValueChange?: (value: string, isVariable?: boolean) => void;
  isVariable?: boolean;

  editor: Editor;
};

export function ButtonLabelInput(props: ButtonLabelInputProps) {
  const { value, onValueChange, isVariable, editor } = props;

  const linkInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(!isVariable);

  const { placeholderUrl = DEFAULT_PLACEHOLDER_URL } = useMailyContext();
  const otps = useVariableOptions(editor);
  const variables = otps?.variables;
  const variableTriggerCharacter =
    otps?.suggestion?.char ?? DEFAULT_VARIABLE_TRIGGER_CHAR;
  const renderVariable = otps?.renderVariable;

  const autoCompleteOptions = useMemo(() => {
    const withoutTrigger = value.replace(
      new RegExp(variableTriggerCharacter, 'g'),
      ''
    );

    return processVariables(variables, {
      query: withoutTrigger || '',
      from: 'bubble-variable',
      editor,
    }).map((variable) => variable.name);
  }, [variables, value, editor]);

  return (
    <div className="isolate flex rounded-lg">
      {!isEditing && (
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
              name: value,
              valid: true,
            },
            fallback: '',
            from: 'bubble-variable',
            editor,
          })}
        </Button>
      )}

      {isEditing && (
        <InputAutocomplete
          editor={editor}
          value={value}
          onValueChange={(value) => {
            onValueChange?.(value);
          }}
          autoCompleteOptions={autoCompleteOptions}
          ref={linkInputRef}
          placeholder={placeholderUrl}
          className="text-foreground hover:bg-muted focus:bg-muted h-7 w-40 rounded-md px-2 pr-6 text-sm focus:outline-hidden"
          triggerChar={variableTriggerCharacter}
          onSelectOption={(value) => {
            const isVariable = autoCompleteOptions.includes(value) ?? false;
            if (isVariable) {
              setIsEditing(false);
            }
            onValueChange?.(value, isVariable);
          }}
        />
      )}
    </div>
  );
}
