import { AlignmentSwitch } from '../../components/alignment-switch';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/popover';
import { ShowPopover } from '../../components/show-popover';
import { ColorPicker } from '../../components/ui/color-picker';
import { Divider } from '../../components/ui/divider';
import { LinkInputPopover } from '../../components/ui/link-input-popover';
import { Select } from '../../components/ui/select';
import { TooltipProvider } from '../../components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useVariableOptions } from '../../utils/node-options';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { CSSProperties, useMemo } from 'react';
import {
  allowedButtonBorderRadius,
  AllowedButtonVariant,
  allowedButtonVariant,
  ButtonAttributes,
} from './button';
import { ButtonLabelInput } from './button-label-input';

export function ButtonView(props: NodeViewProps) {
  const { node, editor, getPos, updateAttributes } = props;
  const {
    text,
    isTextVariable,
    alignment,
    variant,
    borderRadius: _radius,
    buttonColor,
    textColor,
    url: externalLink,
    showIfKey = '',
    isUrlVariable,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
  } = node.attrs as ButtonAttributes;

  const opts = useVariableOptions(editor);
  const renderVariable = opts?.renderVariable;

  const sizes = useMemo(
    () => ({
      small: {
        paddingX: 24,
        paddingY: 6,
      },
      medium: {
        paddingX: 32,
        paddingY: 10,
      },
      large: {
        paddingX: 40,
        paddingY: 14,
      },
    }),
    []
  );

  const size = useMemo(() => {
    return Object.entries(sizes).find(
      ([, { paddingX, paddingY }]) =>
        paddingRight === paddingX && paddingTop === paddingY
    )?.[0] as 'small' | 'medium' | 'large';
  }, [paddingRight, paddingTop, sizes]);

  return (
    <NodeViewWrapper
      draggable={editor.isEditable}
      data-drag-handle={editor.isEditable}
      data-type="button"
      style={{
        textAlign: alignment,
      }}
    >
      <Popover open={props.selected && editor.isEditable}>
        <PopoverTrigger asChild>
          <div>
            <button
              className={cn(
                'ring-offset-background inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
                'font-semibold no-underline',
                {
                  'rounded-full!': _radius === 'round',
                  'rounded-md!': _radius === 'smooth',
                  'rounded-none!': _radius === 'sharp',
                }
              )}
              tabIndex={-1}
              style={
                {
                  backgroundColor:
                    variant === 'filled'
                      ? buttonColor || '#000000'
                      : 'transparent',
                  color: textColor || '#ffffff',

                  borderWidth: 2,
                  borderStyle: 'solid',
                  borderColor: buttonColor || '#000000',
                  // decrease the border color opacity to 80%
                  // so that it's not too prominent
                  '--button-var-border-color': textColor
                    ? `${textColor}80`
                    : 'color-mix(in srgb, #ffffff 80%, transparent)',

                  paddingTop: paddingTop || '10px',
                  paddingRight: paddingRight || '32px',
                  paddingBottom: paddingBottom || '10px',
                  paddingLeft: paddingLeft || '32px',
                } as CSSProperties
              }
              onClick={(e) => {
                e.preventDefault();
                if (!editor.isEditable) {
                  return;
                }

                const pos = getPos();
                editor.commands.setNodeSelection(pos);
              }}
            >
              {isTextVariable
                ? renderVariable({
                    variable: { name: text, valid: true },
                    fallback: text,
                    from: 'button-variable',
                    editor,
                  })
                : text}
            </button>
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="top"
          className="w-max rounded-lg p-0.5!"
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <TooltipProvider>
            <div className="text-foreground flex items-stretch">
              <ButtonLabelInput
                value={text}
                onValueChange={(value, isVariable) => {
                  updateAttributes({
                    text: value,
                    isTextVariable: isVariable ?? false,
                  });
                }}
                isVariable={isTextVariable}
                editor={editor}
              />

              <Divider />

              <div className="flex gap-x-0.5">
                <Select
                  label="Border Radius"
                  value={_radius}
                  options={allowedButtonBorderRadius.map((value) => ({
                    value,
                    label: value,
                  }))}
                  onValueChange={(value) => {
                    updateAttributes({
                      borderRadius: value,
                    });
                  }}
                  tooltip="Border Radius"
                  className="capitalize"
                />

                <Select
                  label="Style"
                  value={variant}
                  options={allowedButtonVariant.map((value) => ({
                    value,
                    label: value,
                  }))}
                  onValueChange={(value) => {
                    updateAttributes({
                      variant: value,
                    });
                  }}
                  tooltip="Style"
                  className="capitalize"
                />

                <Select
                  label="Size"
                  value={size}
                  options={[
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                  ]}
                  onValueChange={(value) => {
                    const { paddingX, paddingY } =
                      sizes[value as 'small' | 'medium' | 'large'];

                    updateAttributes({
                      paddingTop: paddingY,
                      paddingRight: paddingX,
                      paddingBottom: paddingY,
                      paddingLeft: paddingX,
                    });
                  }}
                  tooltip="Size"
                  placeholder="Size"
                />
              </div>

              <Divider />

              <div className="flex gap-x-0.5">
                <AlignmentSwitch
                  alignment={alignment}
                  onAlignmentChange={(alignment) => {
                    updateAttributes({
                      alignment,
                    });
                  }}
                />

                <LinkInputPopover
                  defaultValue={externalLink || ''}
                  onValueChange={(value, isVariable) => {
                    updateAttributes({
                      url: value,
                      isUrlVariable: isVariable ?? false,
                    });
                  }}
                  tooltip="Update External Link"
                  editor={editor}
                  isVariable={isUrlVariable}
                />
              </div>

              <Divider />

              <div className="flex gap-x-0.5">
                <BackgroundColorPickerPopup
                  variant={variant}
                  color={buttonColor || 'transparent'}
                  onChange={(color) => {
                    updateAttributes({
                      buttonColor: color,
                    });
                  }}
                />

                <TextColorPickerPopup
                  color={textColor || 'transparent'}
                  onChange={(color) => {
                    updateAttributes({
                      textColor: color,
                    });
                  }}
                />
              </div>

              <Divider />

              <ShowPopover
                showIfKey={showIfKey}
                onShowIfKeyValueChange={(value) => {
                  updateAttributes({
                    showIfKey: value,
                  });
                }}
                editor={editor}
              />
            </div>
          </TooltipProvider>
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  );
}

type ColorPickerProps = {
  variant?: AllowedButtonVariant;
  color: string;
  onChange: (color: string) => void;
};

function BackgroundColorPickerPopup(props: ColorPickerProps) {
  const { color, onChange, variant } = props;

  return (
    <ColorPicker
      color={color}
      onColorChange={onChange}
      tooltip="Background Color"
    >
      <Button variant="ghost" size="sm" type="button" className="size-7">
        <div
          className="h-4 w-4 shrink-0 rounded-full shadow"
          style={{
            backgroundColor: variant === 'filled' ? color : 'transparent',
            borderStyle: 'solid',
            borderWidth: 2,
            borderColor: variant === 'filled' ? 'white' : color,
          }}
        />
      </Button>
    </ColorPicker>
  );
}

function TextColorPickerPopup(props: ColorPickerProps) {
  const { color, onChange } = props;

  return (
    <ColorPicker color={color} onColorChange={onChange} tooltip="Text Color">
      <Button variant="ghost" size="sm" type="button" className="size-7">
        <div className="flex flex-col items-center justify-center gap-px">
          <span className="font-bolder text-foreground font-mono text-xs">
            A
          </span>
          <div
            className="h-[2px] w-3 shrink-0 rounded-md shadow"
            style={{ backgroundColor: color }}
          />
        </div>
      </Button>
    </ColorPicker>
  );
}
