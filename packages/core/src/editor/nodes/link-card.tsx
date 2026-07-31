import { type NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { Input } from '../components/input';
import { Popover, PopoverContent, PopoverTrigger } from '../components/popover';
import { Textarea } from '../components/textarea';
import { useMailyContext } from '../provider';
import { cn } from '../utils/classname';
import { AUTOCOMPLETE_PASSWORD_MANAGERS_OFF } from '../utils/constants';
import { Badge } from '../components/ui/badge';
import { FontFamilyPicker } from '../components/text-menu/font-family-picker';
import { FontSizePicker } from '../components/text-menu/font-size-picker';
import { FONT_ATTRIBUTE_KEYS } from '../extensions/font-family';
import type { LinkCardAttributes } from '../extensions/link-card';
import { fontSelectionFromAttrs, fontStack } from '../fonts/fontsource';
import type { CSSProperties } from 'react';

export function LinkCardComponent(props: NodeViewProps) {
  const { t } = useMailyContext();
  const {
    title,
    description,
    link,
    linkTitle,
    image,
    badgeText,
    subTitle,
    fontSize,
  } = props.node.attrs as LinkCardAttributes;
  const { getPos, editor } = props;
  const currentFont = fontSelectionFromAttrs(props.node.attrs);
  const currentFontStack = currentFont ? fontStack(currentFont) : undefined;
  const typographyStyle = {
    ...(currentFontStack ? { fontFamily: currentFontStack } : {}),
  } satisfies CSSProperties;
  const titleStyle = {
    ...typographyStyle,
    fontSize: fontSize || '18px',
  } satisfies CSSProperties;
  const descriptionStyle = {
    ...typographyStyle,
    fontSize: fontSize || '16px',
  } satisfies CSSProperties;
  const compactTextStyle = {
    ...typographyStyle,
    ...(fontSize ? { fontSize } : {}),
  } satisfies CSSProperties;

  return (
    <NodeViewWrapper
      className={`react-component ${
        props.selected && 'ProseMirror-selectednode'
      }`}
      draggable={editor.isEditable}
      data-drag-handle={editor.isEditable}
    >
      <Popover open={props.selected}>
        <PopoverTrigger asChild>
          <div
            tabIndex={-1}
            onClick={(e) => {
              e.preventDefault();
              const pos = getPos();
              editor.commands.setNodeSelection(pos);
            }}
          >
            <div className="no-prose border-border flex flex-col rounded-lg border">
              {image && (
                <div className="relative mb-1.5 w-full shrink-0">
                  <img
                    src={image}
                    alt={t('linkCard.imageAlt')}
                    className="no-prose mb-0! h-full w-full rounded-t-lg"
                    draggable={editor.isEditable}
                  />
                </div>
              )}
              <div className="flex items-stretch p-3">
                <div className={cn('flex flex-col')}>
                  <div className="!mb-1.5 flex items-center gap-1.5">
                    <h2 className="!mb-0 font-semibold" style={titleStyle}>
                      {title}
                    </h2>
                    {badgeText && (
                      <Badge
                        variant="secondary"
                        className="!font-base"
                        style={compactTextStyle}
                      >
                        {badgeText}
                      </Badge>
                    )}{' '}
                    {subTitle && !badgeText && (
                      <Badge
                        variant="outline"
                        className="!font-base"
                        style={compactTextStyle}
                      >
                        {subTitle}
                      </Badge>
                    )}
                  </div>
                  <p
                    className="text-muted-foreground !my-0"
                    style={descriptionStyle}
                  >
                    {description}{' '}
                    {linkTitle ? (
                      <a
                        href={link}
                        className="font-semibold"
                        style={descriptionStyle}
                      >
                        {linkTitle}
                      </a>
                    ) : null}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="flex max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-96 flex-col gap-2 overflow-y-auto"
          sideOffset={10}
        >
          <div className="flex items-center gap-1">
            <FontFamilyPicker
              editor={editor}
              currentFont={currentFont}
              onFontChange={(font) => {
                props.updateAttributes(font);
              }}
              onFontUnset={() => {
                props.updateAttributes(
                  Object.fromEntries(
                    FONT_ATTRIBUTE_KEYS.map((key) => [
                      key,
                      key === 'fontHasItalic' ? false : null,
                    ])
                  ) as Partial<LinkCardAttributes>
                );
              }}
            />

            <FontSizePicker
              value={fontSize || ''}
              onValueChange={(value) => {
                props.updateAttributes({
                  fontSize: value || null,
                });
              }}
            />
          </div>

          <label className="w-full space-y-1">
            <span className="text-muted-foreground text-xs font-normal">
              {t('linkCard.image')}
            </span>
            <Input
              {...AUTOCOMPLETE_PASSWORD_MANAGERS_OFF}
              placeholder={t('linkCard.imagePlaceholder')}
              type="url"
              value={image}
              onChange={(e) => {
                props.updateAttributes({
                  image: e.target.value,
                });
              }}
            />
          </label>

          <label className="w-full space-y-1">
            <span className="text-muted-foreground text-xs font-normal">
              {t('linkCard.title')}
            </span>
            <Input
              {...AUTOCOMPLETE_PASSWORD_MANAGERS_OFF}
              placeholder={t('linkCard.titlePlaceholder')}
              value={title}
              onChange={(e) => {
                props.updateAttributes({
                  title: e.target.value,
                });
              }}
            />
          </label>

          <label className="w-full space-y-1">
            <span className="text-muted-foreground text-xs font-normal">
              {t('linkCard.description')}
            </span>
            <Textarea
              placeholder={t('linkCard.descriptionPlaceholder')}
              value={description}
              onChange={(e) => {
                props.updateAttributes({
                  description: e.target.value,
                });
              }}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="w-full space-y-1">
              <span className="text-muted-foreground text-xs font-normal">
                {t('linkCard.linkTitle')}
              </span>
              <Input
                {...AUTOCOMPLETE_PASSWORD_MANAGERS_OFF}
                placeholder={t('linkCard.linkTitlePlaceholder')}
                value={linkTitle}
                onChange={(e) => {
                  props.updateAttributes({
                    linkTitle: e.target.value,
                  });
                }}
              />
            </label>

            <label className="w-full space-y-1">
              <span className="text-muted-foreground text-xs font-normal">
                {t('linkCard.link')}
              </span>
              <Input
                {...AUTOCOMPLETE_PASSWORD_MANAGERS_OFF}
                placeholder={t('linkCard.linkPlaceholder')}
                value={link}
                onChange={(e) => {
                  props.updateAttributes({
                    link: e.target.value,
                  });
                }}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="w-full space-y-1">
              <span className="text-muted-foreground text-xs font-normal">
                {t('linkCard.badgeText')}
              </span>
              <Input
                {...AUTOCOMPLETE_PASSWORD_MANAGERS_OFF}
                placeholder={t('linkCard.badgeTextPlaceholder')}
                value={badgeText}
                onChange={(e) => {
                  props.updateAttributes({
                    badgeText: e.target.value,
                  });
                }}
              />
            </label>

            <label className="w-full space-y-1">
              <span className="text-muted-foreground text-xs font-normal">
                {t('linkCard.subTitle')}
              </span>
              <Input
                {...AUTOCOMPLETE_PASSWORD_MANAGERS_OFF}
                placeholder={t('linkCard.subTitlePlaceholder')}
                value={subTitle}
                onChange={(e) => {
                  props.updateAttributes({
                    subTitle: e.target.value,
                  });
                }}
              />
            </label>
          </div>
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  );
}
