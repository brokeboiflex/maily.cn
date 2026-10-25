import { IconPlaceholder } from "@/components/icon-placeholder"
import { updateNodeViewAttributes } from '../../utils/update-attribute';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Select } from '../../components/ui/select';
import { useMailyContext } from '../../maily-context';
import { cn } from 'cn';
import { AUTOCOMPLETE_PASSWORD_MANAGERS_OFF } from '../../utils/constants';
import { getNodeOptions } from '../../utils/node-options';
import { processVariables } from '../../utils/variable';
import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import { type Attrs } from '@tiptap/pm/model';
import { useMemo } from 'react';
import {
  DEFAULT_RENDER_VARIABLE_FUNCTION,
  type VariableOptions,
  type RenderVariableFunction,
} from './variable';

export function VariableView(props: NodeViewProps) {
  const { t } = useMailyContext();
  const { node, editor } = props;
  const updateAttributes = (attrs: Attrs) =>
    updateNodeViewAttributes(props, attrs);
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
  const editable = editor.isEditable;
  const chip = renderVariable({
    variable: {
      name: id,
      required: required,
      valid: true,
      label,
    },
    fallback,
    editor,
    from: 'content-variable',
  });
  // A read-only editor shows the variable without its settings.
  if (!editable)
    return (
      <NodeViewWrapper
        className="react-component inline-block leading-none"
        draggable="false"
      >
        {chip}
      </NodeViewWrapper>
    );

  return (
    <NodeViewWrapper
      className="react-component inline-block leading-none"
      draggable="false"
    >
      <Popover
        onOpenChange={(open) => {
          // eslint-disable-next-line react-hooks/immutability -- TipTap storage is mutable editor state; the bubble menu reads this flag from it
          editor.storage.variable.popover = open;
        }}
      >
        <PopoverTrigger
          type="button"
          className="focus-visible:ring-ring/50 inline-flex items-center rounded-md bg-transparent p-0 text-inherit outline-none select-none focus-visible:ring-3"
        >
          {chip}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          className={cn(
            'max-w-[calc(100vw-2rem)]',
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
                    className="border-border bg-background hover:bg-muted/50 focus-visible:ring-ring/50 h-8! min-h-8! w-full max-w-none justify-between rounded-lg border px-2.5 text-sm font-normal shadow-none focus-visible:ring-3 [&>span]:text-sm [&>span]:font-normal"
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
                  aria-label={t('variableMenu.variable')}
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
      <div className="bg-muted/50 text-foreground inline-flex max-w-xs items-center gap-1.5 rounded-md border border-(--button-var-border-color) px-2 py-0.5 text-xs leading-none font-medium select-none">
        <IconPlaceholder
  lucide="Braces"
  tabler="IconBraces"
  hugeicons="BracesIcon"
  phosphor="BracketsCurly"
  remixicon="RiBracesLine"
  className="text-muted-foreground size-3 shrink-0 stroke-[2.5]"
/>
        <span className="min-w-0 truncate text-left">{variableLabel}</span>
      </div>
    );
  }

  if (from === 'bubble-variable') {
    return (
      <div
        className={cn(
          'border-border/70 bg-muted/60 text-foreground hover:bg-muted inline-flex h-8 max-w-xs min-w-28 items-center gap-1.5 rounded-md border px-2 text-sm font-medium transition-colors select-none',
          !valid &&
            'border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/15'
        )}
      >
        <IconPlaceholder
  lucide="Braces"
  tabler="IconBraces"
  hugeicons="BracesIcon"
  phosphor="BracketsCurly"
  remixicon="RiBracesLine"
  className="text-muted-foreground size-3 shrink-0 stroke-[2.5]"
/>
        <span className="min-w-0 truncate text-left">{variableLabel}</span>
      </div>
    );
  }

  return (
    <span
      tabIndex={-1}
      className="not-prose border-border/70 bg-muted/60 text-foreground hover:bg-muted inline-flex max-w-[14rem] items-center gap-(--variable-icon-gap) rounded-md border px-1.5 py-0.5 align-baseline text-[0.78em] leading-[1.25] font-medium shadow-sm transition-colors select-none"
    >
      <IconPlaceholder
  lucide="Braces"
  tabler="IconBraces"
  hugeicons="BracesIcon"
  phosphor="BracketsCurly"
  remixicon="RiBracesLine"
  className="text-muted-foreground size-[var(--variable-icon-size)] shrink-0 stroke-[2.5]"
/>
      <span className="min-w-0 truncate">{variableLabel}</span>
      {required && !fallback && (
        <IconPlaceholder
  lucide="AlertTriangle"
  tabler="IconAlertTriangle"
  hugeicons="AlertCircleIcon"
  phosphor="Warning"
  remixicon="RiAlertLine"
  className="text-destructive size-[var(--variable-icon-size)] shrink-0 stroke-[2.5]"
/>
      )}
    </span>
  );
};
