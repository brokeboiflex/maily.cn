import { AlignmentSwitch } from '@/editor/components/alignment-switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/editor/components/popover';
import { ShowPopover } from '@/editor/components/show-popover';
import { ColorPicker } from '@/editor/components/ui/color-picker';
import { Separator } from '@/editor/components/ui/divider';
import { BUBBLE_MENU_CONTENT_CLASS } from '@/editor/components/ui/floating-menu';
import { LinkInputPopover } from '@/editor/components/ui/link-input-popover';
import { Select } from '@/editor/components/ui/select';
import { TooltipProvider } from '@/editor/components/ui/tooltip';
import { FontFamilyPicker } from '@/editor/components/text-menu/font-family-picker';
import { FontSizePicker } from '@/editor/components/text-menu/font-size-picker';
import { FONT_ATTRIBUTE_KEYS } from '@/editor/extensions/font-family';
import { fontSelectionFromAttrs, fontStack } from '@/editor/fonts/fontsource';
import { useMailyContext } from '@/editor/provider';
import { cn } from '@/editor/utils/classname';
import { useVariableOptions } from '@/editor/utils/node-options';
import { type NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { type CSSProperties, useMemo } from 'react';
import {
  allowedButtonBorderRadius,
  type AllowedButtonVariant,
  allowedButtonVariant,
  type ButtonAttributes,
} from './button';
import { ButtonLabelInput } from './button-label-input';

export function ButtonView(props: NodeViewProps) {
  const { t } = useMailyContext();
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
    fontSize,
  } = node.attrs as ButtonAttributes;

  const opts = useVariableOptions(editor);
  const renderVariable = opts?.renderVariable;
  const currentFont = fontSelectionFromAttrs(node.attrs);
  const currentFontStack = currentFont ? fontStack(currentFont) : undefined;
  const popoverAlign =
    alignment === 'right' ? 'end' : alignment === 'center' ? 'center' : 'start';

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
    const currentPaddingRight = parsePaddingValue(paddingRight) ?? 32;
    const currentPaddingTop = parsePaddingValue(paddingTop) ?? 10;

    return Object.entries(sizes).find(
      ([, { paddingX, paddingY }]) =>
        currentPaddingRight === paddingX && currentPaddingTop === paddingY
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
          <div className="inline-flex">
            {/* shadcn-audit-ignore-next-line email content preview renders the actual message button */}
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
                  ...(fontSize ? { fontSize } : {}),
                  ...(currentFontStack ? { fontFamily: currentFontStack } : {}),
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
          align={popoverAlign}
          side="top"
          className="p-0.5! w-max rounded-lg"
          sideOffset={8}
        >
          <TooltipProvider>
            <div className={cn('text-foreground', BUBBLE_MENU_CONTENT_CLASS)}>
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

              <Separator orientation="vertical" />

              <div className="flex gap-x-0.5">
                <FontFamilyPicker
                  editor={editor}
                  currentFont={currentFont}
                  onFontChange={(font) => {
                    updateAttributes(font);
                  }}
                  onFontUnset={() => {
                    updateAttributes(
                      Object.fromEntries(
                        FONT_ATTRIBUTE_KEYS.map((key) => [
                          key,
                          key === 'fontHasItalic' ? false : null,
                        ])
                      ) as Partial<ButtonAttributes>
                    );
                  }}
                />

                <FontSizePicker
                  value={fontSize || ''}
                  onValueChange={(value) => {
                    updateAttributes({
                      fontSize: value || null,
                    });
                  }}
                />
              </div>

              <Separator orientation="vertical" />

              <div className="flex gap-x-0.5">
                <Select
                  label={t('buttonMenu.borderRadius')}
                  value={_radius}
                  options={allowedButtonBorderRadius.map((value) => ({
                    value,
                    label: {
                      sharp: t('buttonMenu.radius.sharp'),
                      smooth: t('buttonMenu.radius.smooth'),
                      round: t('buttonMenu.radius.round'),
                    }[value],
                  }))}
                  onValueChange={(value) => {
                    updateAttributes({
                      borderRadius: value,
                    });
                  }}
                  tooltip={t('buttonMenu.borderRadius')}
                />

                <Select
                  label={t('buttonMenu.style')}
                  value={variant}
                  options={allowedButtonVariant.map((value) => ({
                    value,
                    label: {
                      filled: t('buttonMenu.style.filled'),
                      outline: t('buttonMenu.style.outline'),
                    }[value],
                  }))}
                  onValueChange={(value) => {
                    updateAttributes({
                      variant: value,
                    });
                  }}
                  tooltip={t('buttonMenu.style')}
                />

                <Select
                  label={t('buttonMenu.size')}
                  value={size}
                  options={[
                    { value: 'small', label: t('buttonMenu.size.small') },
                    { value: 'medium', label: t('buttonMenu.size.medium') },
                    { value: 'large', label: t('buttonMenu.size.large') },
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
                  tooltip={t('buttonMenu.size')}
                  placeholder={t('buttonMenu.size')}
                />
              </div>

              <Separator orientation="vertical" />

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
                  tooltip={t('buttonMenu.updateExternalLink')}
                  editor={editor}
                  isVariable={isUrlVariable}
                />
              </div>

              <Separator orientation="vertical" />

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

              <Separator orientation="vertical" />

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

function parsePaddingValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

type ColorPickerProps = {
  variant?: AllowedButtonVariant;
  color: string;
  onChange: (color: string) => void;
};

function BackgroundColorPickerPopup(props: ColorPickerProps) {
  const { color, onChange, variant } = props;
  const { t } = useMailyContext();

  return (
    <ColorPicker
      color={color}
      onColorChange={onChange}
      tooltip={t('buttonMenu.backgroundColor')}
    >
      <div
        className="h-4 w-4 shrink-0 rounded-full shadow"
        style={{
          backgroundColor: variant === 'filled' ? color : 'transparent',
          borderStyle: 'solid',
          borderWidth: 2,
          borderColor: variant === 'filled' ? 'var(--background)' : color,
        }}
      />
    </ColorPicker>
  );
}

function TextColorPickerPopup(props: ColorPickerProps) {
  const { color, onChange } = props;
  const { t } = useMailyContext();

  return (
    <ColorPicker
      color={color}
      onColorChange={onChange}
      tooltip={t('buttonMenu.textColor')}
    >
      <div className="flex flex-col items-center justify-center gap-px">
        <span className="font-bolder text-foreground font-mono text-xs">A</span>
        <div
          className="h-[2px] w-3 shrink-0 rounded-md shadow"
          style={{ backgroundColor: color }}
        />
      </div>
    </ColorPicker>
  );
}
