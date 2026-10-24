import {
  getVariableOptions,
  useVariableOptions,
} from '../../utils/node-options';
import {
  type SuggestionOptions,
  type SuggestionProps,
} from '@tiptap/suggestion';
import {
  createSuggestionPopup,
  SUGGESTION_FLOATING_UI,
} from '../../utils/suggestion-popup';
import { processVariables } from '../../utils/variable';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  DEFAULT_VARIABLE_TRIGGER_CHAR,
  VariablePluginKey,
  type Variable as VariableType,
} from './variable';
import { type VariableSuggestionsPopoverRef } from './variable-suggestions-popover';

export type VariableListProps = {
  command: (params: {
    id: string;
    required: boolean;
    hideDefaultValue: boolean;
    label?: string;
  }) => void;
  items: VariableType[];
} & Pick<SuggestionProps, 'editor'>;

export const VariableList = forwardRef((props: VariableListProps, ref) => {
  const { items = [], editor } = props;

  const popoverRef = useRef<VariableSuggestionsPopoverRef>(null);
  const VariableSuggestionPopoverComponent =
    useVariableOptions(editor)?.variableSuggestionsPopover;

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (!popoverRef.current) {
        return false;
      }

      const { moveUp, moveDown, select } = popoverRef.current || {};
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveUp();
        return true;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveDown();
        return true;
      }

      if (event.key === 'Enter') {
        select();
        return true;
      }

      return false;
    },
  }));

  return (
    <VariableSuggestionPopoverComponent
      items={items}
      onSelectItem={(value) => {
        props.command({
          id: value.name,
          required: value.required ?? true,
          hideDefaultValue: value?.hideDefaultValue ?? false,
          label: value?.label,
        });
      }}
      ref={popoverRef}
    />
  );
});

VariableList.displayName = 'VariableList';

export function getVariableSuggestions(
  char: string = DEFAULT_VARIABLE_TRIGGER_CHAR
): Omit<SuggestionOptions, 'editor'> {
  return {
    char,
    items: ({ query, editor }) => {
      const variables = getVariableOptions(editor)?.variables;

      return processVariables(variables, {
        query,
        editor,
        from: 'content-variable',
      });
    },

    placement: 'bottom-start',
    floatingUi: SUGGESTION_FLOATING_UI,
    render: createSuggestionPopup(VariableList, VariablePluginKey, {}),
  };
}
