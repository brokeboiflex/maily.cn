import { useOwnedTimeout } from '../../utils/use-owned-timeout';
import { InputAutocomplete } from '../../components/ui/input-autocomplete';
import { DEFAULT_VARIABLE_TRIGGER_CHAR } from '../variable/variable';
import { useMailyContext } from '../../maily-context';
import { useVariableOptions } from '../../utils/node-options';
import { processVariables } from '../../utils/variable';
import { Editor } from '@tiptap/core';
import { useMemo, useRef, useState } from 'react';
import { Button } from '@/editor/components/base-button';

type ButtonLabelInputProps = {
  value: string;
  onValueChange?: (value: string, isVariable?: boolean) => void;
  isVariable?: boolean;

  editor: Editor;
};

export function ButtonLabelInput(props: ButtonLabelInputProps) {
  const { value, onValueChange, isVariable, editor } = props;

  const { schedule: scheduleTimeout } = useOwnedTimeout();
  const linkInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(!isVariable);

  const { t } = useMailyContext();
  const otps = useVariableOptions(editor);
  const variables = otps?.variables;
  const variableTriggerCharacter =
    otps?.suggestion?.char ?? DEFAULT_VARIABLE_TRIGGER_CHAR;
  const renderVariable = otps?.renderVariable;

  const autoCompleteOptions = useMemo(() => {
    const withoutTrigger = value.replaceAll(variableTriggerCharacter, '');

    return processVariables(variables, {
      query: withoutTrigger || '',
      from: 'bubble-variable',
      editor,
    }).map((variable) => variable.name);
  }, [variables, value, editor, variableTriggerCharacter]);

  return (
    <div className="isolate flex rounded-lg">
      {!isEditing && (
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
          aria-label={t('buttonMenu.text')}
          placeholder={t('buttonMenu.text')}
          className="h-7 w-40"
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
