import { type NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../components/popover';
import { Textarea } from '@/components/ui/textarea';
import { useMailyContext } from '../provider';
import { cn } from '@/lib/utils';
import { AUTOCOMPLETE_PASSWORD_MANAGERS_OFF } from '../utils/constants';

export function LinkCardComponent(props: NodeViewProps) {
  const { t } = useMailyContext();
  const { title, description, link, linkTitle, image, badgeText, subTitle } =
    props.node.attrs;
  const { getPos, editor } = props;

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
                    <h2 className="!mb-0 text-lg! font-semibold">{title}</h2>
                    {badgeText && (
                      <span className="!font-base rounded-md bg-yellow-200 px-2 py-1 text-xs leading-none font-semibold">
                        {badgeText}
                      </span>
                    )}{' '}
                    {subTitle && !badgeText && (
                      <span className="!font-base font-regular text-muted-foreground rounded-md text-xs leading-none">
                        {subTitle}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground !my-0 text-base!">
                    {description}{' '}
                    {linkTitle ? (
                      <a href={link} className="font-semibold">
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
          className="flex w-96 flex-col gap-2"
          sideOffset={10}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
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
