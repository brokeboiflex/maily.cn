import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { Input } from '../components/input';
import { Popover, PopoverContent, PopoverTrigger } from '../components/popover';
import { Textarea } from '../components/textarea';
import { cn } from '@/lib/utils';

export function LinkCardComponent(props: NodeViewProps) {
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
                    alt="link-card"
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
              Image
            </span>
            <Input
              placeholder="Add Image"
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
              Title
            </span>
            <Input
              placeholder="Add title"
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
              Description
            </span>
            <Textarea
              placeholder="Add description here"
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
                Link Title
              </span>
              <Input
                placeholder="Add link title here"
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
                Link
              </span>
              <Input
                placeholder="Add link here"
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
                Badge Text
              </span>
              <Input
                placeholder="Add badge text here"
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
                Sub Title
              </span>
              <Input
                placeholder="Add sub title here"
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
