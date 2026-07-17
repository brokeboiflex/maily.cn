import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/editor/components/popover';
import { Separator } from '@/editor/components/ui/divider';
import { TooltipProvider } from '@/editor/components/ui/tooltip';
import { Input } from '@/editor/components/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/editor/components/ui/input-group';
import { useMailyContext } from '@/editor/provider';
import { cn } from '@/editor/utils/classname';
import { AUTOCOMPLETE_PASSWORD_MANAGERS_OFF } from '@/editor/utils/constants';
import { getNodeOptions } from '@/editor/utils/node-options';
import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import { AlertTriangle, Braces, Pencil } from 'lucide-react';
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

  const renderVariable = useMemo(() => {
    const variableRender =
      getNodeOptions<VariableOptions>(editor, 'variable')?.renderVariable ??
      DEFAULT_RENDER_VARIABLE_FUNCTION;

    return variableRender;
  }, [editor]);

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
        <PopoverTrigger>
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
          className="p-0.5! w-max rounded-lg"
          sideOffset={8}
        >
          <TooltipProvider>
            <div className="text-foreground flex items-stretch">
              <label className="relative">
                <span className="text-foreground inline-block px-2 text-xs">
                  {t('variableMenu.variable')}
                </span>
                <Input
                  {...AUTOCOMPLETE_PASSWORD_MANAGERS_OFF}
                  value={id ?? ''}
                  onChange={(e) => {
                    updateAttributes({
                      id: e.target.value,
                    });
                  }}
                  placeholder={t('variableMenu.variablePlaceholder')}
                  className="h-7 w-36"
                />
              </label>

              {!hideDefaultValue && (
                <>
                  <Separator orientation="vertical" className="mx-1.5" />

                  <label>
                    <span className="text-foreground inline-block px-2 pl-1 text-xs">
                      {t('variableMenu.default')}
                    </span>
                    <InputGroup className="h-7 w-32">
                      <InputGroupInput
                        {...AUTOCOMPLETE_PASSWORD_MANAGERS_OFF}
                        value={fallback ?? ''}
                        onChange={(e) => {
                          updateAttributes({
                            fallback: e.target.value,
                          });
                        }}
                        placeholder={t('variableMenu.defaultPlaceholder')}
                        className="h-full min-w-0 px-2 text-sm"
                      />
                      <InputGroupAddon align="inline-end" className="pr-1.5">
                        <Pencil className="size-3 stroke-[2.5]" />
                      </InputGroupAddon>
                    </InputGroup>
                  </label>
                </>
              )}
            </div>
          </TooltipProvider>
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
      <div className="border-(--button-var-border-color) inline-grid max-w-xs grid-cols-[12px_1fr] items-center gap-1.5 rounded-md border px-2 py-px font-mono text-xs">
        <Braces className="h-3 w-3 shrink-0 stroke-[2.5]" />
        <span className="min-w-0 truncate text-left">{variableLabel}</span>
      </div>
    );
  }

  if (from === 'bubble-variable') {
    return (
      <div
        className={cn(
          'border-border hover:bg-accent hover:text-accent-foreground inline-grid h-7 min-w-28 max-w-xs grid-cols-[12px_1fr] items-center gap-1.5 rounded-md border px-2 font-mono text-sm',
          !valid && 'border-rose-400 bg-rose-50 text-rose-600 hover:bg-rose-100'
        )}
      >
        <Braces className="h-3 w-3 shrink-0 stroke-[2.5] text-rose-600" />
        <span className="min-w-0 truncate text-left">{variableLabel}</span>
      </div>
    );
  }

  return (
    <span
      tabIndex={-1}
      className="border-border gap-(--variable-icon-gap) inline-flex items-center rounded-full border px-1.5 py-0.5 leading-none"
    >
      <Braces className="size-[var(--variable-icon-size)] shrink-0 stroke-[2.5] text-rose-600" />
      {variableLabel}
      {required && !fallback && (
        <AlertTriangle className="size-[var(--variable-icon-size)] shrink-0 stroke-[2.5]" />
      )}
    </span>
  );
};
