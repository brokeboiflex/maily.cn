import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/editor/components/popover';
import { Input } from '@/editor/components/input';
import { Select } from '@/editor/components/ui/select';
import { useMailyContext } from '@/editor/provider';
import { cn } from '@/editor/utils/classname';
import { AUTOCOMPLETE_PASSWORD_MANAGERS_OFF } from '@/editor/utils/constants';
import { getNodeOptions } from '@/editor/utils/node-options';
import { processVariables } from '@/editor/utils/variable';
import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import { AlertTriangle, Braces } from 'lucide-react';
import { useMemo } from 'react';
import {
  DEFAULT_RENDER_VARIABLE_FUNCTION,
  type VariableOptions,
  type RenderVariableFunction,
} from './variable';

export function VariableView(props: NodeViewProps) {
  const { t } = useMailyContext();
  const { node, updateAttributes, editor } = props;
  const {
    id,
    fallback,
    required,
    hideDefaultValue = false,
    label,
  } = node.attrs;

  const variableOptions = useMemo(() => {
    return getNodeOptions<VariableOptions>(editor, 'variable');
  }, [editor]);
  const renderVariable =
    variableOptions?.renderVariable ?? DEFAULT_RENDER_VARIABLE_FUNCTION;
  const variableChoices = useMemo(() => {
    const choices = processVariables(variableOptions?.variables ?? [], {
      query: '',
      from: 'bubble-variable',
      editor,
    });
    const current = id
      ? (choices.find((variable) => variable.name === id) ?? {
          name: id,
          label,
          required,
          hideDefaultValue,
        })
      : null;
    const remainingChoices = current
      ? choices.filter((variable) => variable.name !== current.name)
      : choices;

    return current ? [current, ...remainingChoices] : remainingChoices;
  }, [
    editor,
    hideDefaultValue,
    id,
    label,
    required,
    variableOptions?.variables,
  ]);
  const hasVariableChoices = variableChoices.length > 0;

  return (
    <NodeViewWrapper
      className="react-component inline-block leading-none"
      draggable="false"
    >
      <Popover
        onOpenChange={(open) => {
          editor.storage.variable.popover = open;
        }}
      >
        <PopoverTrigger
          type="button"
          className="focus-visible:ring-ring/50 focus-visible:ring-3 inline-flex select-none items-center rounded-md bg-transparent p-0 text-inherit outline-none"
        >
          {renderVariable({
            variable: {
              name: id,
              required: required,
              valid: true,
              label,
            },
            fallback,
            editor,
            from: 'content-variable',
          })}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          className={cn(
            'max-w-[calc(100vw-2rem)] p-3',
            hasVariableChoices ? 'w-[28rem]' : 'w-80'
          )}
          sideOffset={8}
        >
          <div
            className={cn(
              'text-foreground grid gap-3',
              !hideDefaultValue &&
                hasVariableChoices &&
                'sm:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]',
              !hideDefaultValue &&
                !hasVariableChoices &&
                'sm:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]'
            )}
          >
            <div className="grid gap-1.5">
              <span className="text-muted-foreground text-xs font-medium">
                {t('variableMenu.variable')}
              </span>
              {hasVariableChoices ? (
                <div className="[&>div]:w-full">
                  <Select
                    label={t('variableMenu.variable')}
                    value={id ?? ''}
                    options={variableChoices.map((variable) => ({
                      value: variable.name,
                      label: variable.label || variable.name,
                    }))}
                    placeholder={t('variableMenu.variablePlaceholder')}
                    className="h-8! min-h-8! border-border bg-background hover:bg-muted/50 focus-visible:ring-ring/50 focus-visible:ring-3 w-full max-w-none justify-between rounded-lg border px-2.5 text-sm font-normal shadow-none [&>span]:text-sm [&>span]:font-normal"
                    onValueChange={(value) => {
                      const variable = variableChoices.find(
                        (variable) => variable.name === value
                      );
                      if (variable) {
                        updateAttributes({
                          id: variable.name,
                          label: variable.label,
                          required: variable.required ?? true,
                          hideDefaultValue: variable.hideDefaultValue ?? false,
                        });
                      }
                    }}
                  />
                </div>
              ) : (
                <Input
                  {...AUTOCOMPLETE_PASSWORD_MANAGERS_OFF}
                  value={id ?? ''}
                  onChange={(e) => {
                    updateAttributes({
                      id: e.target.value,
                    });
                  }}
                  placeholder={t('variableMenu.variablePlaceholder')}
                  className="font-mono text-sm"
                />
              )}
            </div>

            {!hideDefaultValue && (
              <label className="grid gap-1.5">
                <span className="text-muted-foreground text-xs font-medium">
                  {t('variableMenu.default')}
                </span>
                <Input
                  {...AUTOCOMPLETE_PASSWORD_MANAGERS_OFF}
                  value={fallback ?? ''}
                  onChange={(e) => {
                    updateAttributes({
                      fallback: e.target.value,
                    });
                  }}
                  placeholder={t('variableMenu.defaultPlaceholder')}
                  className="text-sm"
                />
              </label>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  );
}

export const DefaultRenderVariable: RenderVariableFunction = (props) => {
  const { variable, fallback, from } = props;
  const { name, required, valid, label } = variable;
  const variableLabel = label || name;

  if (from === 'button-variable') {
    return (
      <div className="border-(--button-var-border-color) bg-muted/50 text-foreground inline-flex max-w-xs select-none items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium leading-none">
        <Braces className="text-muted-foreground size-3 shrink-0 stroke-[2.5]" />
        <span className="min-w-0 truncate text-left">{variableLabel}</span>
      </div>
    );
  }

  if (from === 'bubble-variable') {
    return (
      <div
        className={cn(
          'border-border/70 bg-muted/60 text-foreground hover:bg-muted inline-flex h-8 min-w-28 max-w-xs select-none items-center gap-1.5 rounded-md border px-2 text-sm font-medium transition-colors',
          !valid &&
            'border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/15'
        )}
      >
        <Braces className="text-muted-foreground size-3 shrink-0 stroke-[2.5]" />
        <span className="min-w-0 truncate text-left">{variableLabel}</span>
      </div>
    );
  }

  return (
    <span
      tabIndex={-1}
      className="not-prose gap-(--variable-icon-gap) border-border/70 bg-muted/60 text-foreground hover:bg-muted inline-flex max-w-[14rem] select-none items-center rounded-md border px-1.5 py-0.5 align-baseline text-[0.78em] font-medium leading-[1.25] shadow-sm transition-colors"
    >
      <Braces className="text-muted-foreground size-[var(--variable-icon-size)] shrink-0 stroke-[2.5]" />
      <span className="min-w-0 truncate">{variableLabel}</span>
      {required && !fallback && (
        <AlertTriangle className="text-destructive size-[var(--variable-icon-size)] shrink-0 stroke-[2.5]" />
      )}
    </span>
  );
};
