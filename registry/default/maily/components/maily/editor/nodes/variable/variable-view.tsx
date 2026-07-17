import { IconPlaceholder } from "@/components/icon-placeholder"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/popover';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { useMailyContext } from '../../provider';
import { cn } from '@/lib/utils';
import { AUTOCOMPLETE_PASSWORD_MANAGERS_OFF } from '../../utils/constants';
import { getNodeOptions } from '../../utils/node-options';
import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
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
          className="w-max rounded-lg p-0.5!"
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
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
                  className="bg-muted text-foreground focus:bg-muted h-7 w-36 rounded-md px-2 text-sm focus:outline-hidden disabled:cursor-not-allowed"
                />
              </label>

              {!hideDefaultValue && (
                <>
                  <Separator orientation="vertical" className="mx-1.5" />

                  <label className="relative">
                    <span className="text-foreground inline-block px-2 pl-1 text-xs">
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
                      className="bg-muted text-foreground focus:bg-muted h-7 w-32 rounded-md px-2 pr-6 text-sm focus:outline-none"
                    />
                    <div className="absolute inset-y-0 right-1 flex items-center">
                      <IconPlaceholder
  lucide="Pencil"
  tabler="IconPencil"
  hugeicons="PencilIcon"
  phosphor="Pencil"
  remixicon="RiPencilLine"
  className="text-foreground h-3 w-3 stroke-[2.5]"
/>
                    </div>
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
      <div className="inline-grid max-w-xs grid-cols-[12px_1fr] items-center gap-1.5 rounded-md border border-(--button-var-border-color) px-2 py-px font-mono text-xs">
        <IconPlaceholder
  lucide="Braces"
  tabler="IconBraces"
  hugeicons="BracesIcon"
  phosphor="BracketsCurly"
  remixicon="RiBracesLine"
  className="h-3 w-3 shrink-0 stroke-[2.5]"
/>
        <span className="min-w-0 truncate text-left">{variableLabel}</span>
      </div>
    );
  }

  if (from === 'bubble-variable') {
    return (
      <div
        className={cn(
          'border-border hover:bg-accent hover:text-accent-foreground inline-grid h-7 max-w-xs min-w-28 grid-cols-[12px_1fr] items-center gap-1.5 rounded-md border px-2 font-mono text-sm',
          !valid && 'border-rose-400 bg-rose-50 text-rose-600 hover:bg-rose-100'
        )}
      >
        <IconPlaceholder
  lucide="Braces"
  tabler="IconBraces"
  hugeicons="BracesIcon"
  phosphor="BracketsCurly"
  remixicon="RiBracesLine"
  className="h-3 w-3 shrink-0 stroke-[2.5] text-rose-600"
/>
        <span className="min-w-0 truncate text-left">{variableLabel}</span>
      </div>
    );
  }

  return (
    <span
      tabIndex={-1}
      className="border-border inline-flex items-center gap-(--variable-icon-gap) rounded-full border px-1.5 py-0.5 leading-none"
    >
      <IconPlaceholder
  lucide="Braces"
  tabler="IconBraces"
  hugeicons="BracesIcon"
  phosphor="BracketsCurly"
  remixicon="RiBracesLine"
  className="size-[var(--variable-icon-size)] shrink-0 stroke-[2.5] text-rose-600"
/>
      {variableLabel}
      {required && !fallback && (
        <IconPlaceholder
  lucide="AlertTriangle"
  tabler="IconAlertTriangle"
  hugeicons="AlertCircleIcon"
  phosphor="Warning"
  remixicon="RiAlertLine"
  className="size-[var(--variable-icon-size)] shrink-0 stroke-[2.5]"
/>
      )}
    </span>
  );
};
