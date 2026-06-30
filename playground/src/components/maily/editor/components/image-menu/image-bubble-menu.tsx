import { ImageDown, LockIcon, LockOpenIcon } from "lucide-react"
import { AllowedLogoSize, allowedLogoSize } from '../../nodes/logo/logo';
import { getNewHeight, getNewWidth } from '../../utils/aspect-ratio';
import { borderRadius } from '../../utils/border-radius';
import { BubbleMenu } from '@tiptap/react';
import { sticky } from 'tippy.js';
import { AlignmentSwitch } from '../alignment-switch';
import { BubbleMenuButton } from '../bubble-menu-button';
import { ShowPopover } from '../show-popover';
import { EditorBubbleMenuProps } from '../text-menu/text-bubble-menu';
import { Divider } from '../ui/divider';
import { LinkInputPopover } from '../ui/link-input-popover';
import { Select } from '../ui/select';
import { TooltipProvider } from '../ui/tooltip';
import { ImageSize } from './image-size';
import { useImageState } from './use-image-state';
import {
  IMAGE_MAX_HEIGHT,
  IMAGE_MAX_WIDTH,
} from '../../nodes/image/image-view';
import { useMailyContext } from '../../provider';
import type { LabelKey } from '../../i18n';

const RADIUS_LABEL_KEY: Record<string, LabelKey> = {
  Sharp: 'imageMenu.radius.sharp',
  Smooth: 'imageMenu.radius.smooth',
  Smoother: 'imageMenu.radius.smoother',
  Rounded: 'imageMenu.radius.rounded',
  Circle: 'imageMenu.radius.circle',
};

export function ImageBubbleMenu(props: EditorBubbleMenuProps) {
  const { editor, appendTo } = props;
  if (!editor) {
    return null;
  }

  const state = useImageState(editor);
  const { t } = useMailyContext();

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    ...(appendTo ? { appendTo: appendTo.current } : {}),
    shouldShow: ({ editor }) => {
      if (!editor.isEditable) {
        return false;
      }

      return editor.isActive('logo') || editor.isActive('image');
    },
    tippyOptions: {
      popperOptions: {
        modifiers: [{ name: 'flip', enabled: false }],
      },
      plugins: [sticky],
      sticky: 'popper',
      maxWidth: '100%',
    },
  };

  const { lockAspectRatio } = state;

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      className="border-border bg-background flex rounded-lg border p-0.5 shadow-md"
    >
      <TooltipProvider>
        {state.isLogoActive && state.imageSrc && (
          <>
            <Select
              label={t('imageMenu.size')}
              tooltip={t('imageMenu.size')}
              value={state.logoSize}
              options={allowedLogoSize.map((size) => ({
                value: size,
                label: size,
              }))}
              onValueChange={(value) => {
                editor
                  ?.chain()
                  .focus()
                  .setLogoAttributes({ size: value as AllowedLogoSize })
                  .run();
              }}
            />

            <Divider />
          </>
        )}

        <div className="flex gap-x-0.5">
          <AlignmentSwitch
            alignment={state.alignment}
            onAlignmentChange={(alignment) => {
              const isCurrentNodeImage = state.isImageActive;
              if (!isCurrentNodeImage) {
                editor?.chain().focus().setLogoAttributes({ alignment }).run();
              } else {
                editor
                  ?.chain()
                  .focus()
                  .updateAttributes('image', { alignment })
                  .run();
              }
            }}
          />

          <LinkInputPopover
            defaultValue={state?.imageSrc ?? ''}
            onValueChange={(value, isVariable) => {
              if (state.isLogoActive) {
                editor
                  ?.chain()
                  .setLogoAttributes({
                    src: value,
                    isSrcVariable: isVariable ?? false,
                  })
                  .run();
              } else {
                editor
                  ?.chain()
                  .updateAttributes('image', {
                    src: value,
                    isSrcVariable: isVariable ?? false,
                  })
                  .run();
              }
            }}
            tooltip={t('imageMenu.sourceUrl')}
            icon={ImageDown}
            editor={editor}
            isVariable={state.isSrcVariable}
          />

          {state.isImageActive && (
            <LinkInputPopover
              defaultValue={state?.imageExternalLink ?? ''}
              onValueChange={(value, isVariable) => {
                editor
                  ?.chain()
                  .updateAttributes('image', {
                    externalLink: value,
                    isExternalLinkVariable: isVariable ?? false,
                  })
                  .run();
              }}
              tooltip={t('imageMenu.externalUrl')}
              editor={editor}
              isVariable={state.isExternalLinkVariable}
            />
          )}
        </div>

        {state.isImageActive && state.imageSrc && (
          <>
            <Divider />

            <Select
              label={t('imageMenu.borderRadius')}
              value={state?.borderRadius}
              options={borderRadius.map((value) => ({
                value: String(value.value),
                label: t(RADIUS_LABEL_KEY[value.name]),
              }))}
              onValueChange={(value) => {
                editor
                  ?.chain()
                  .updateAttributes('image', {
                    borderRadius: Number(value),
                  })
                  .run();
              }}
              tooltip={t('imageMenu.borderRadius')}
              className="capitalize"
            />

            <div className="flex gap-x-0.5">
              <ImageSize
                dimension="width"
                value={state?.width ?? ''}
                onValueChange={(value) => {
                  const width = Math.min(Number(value) || 0, IMAGE_MAX_WIDTH);
                  const currentHeight = Number(state.height) || 0;
                  const currentWidth = Number(state.width) || 0;
                  const hasValidAspectRatio =
                    state.aspectRatio &&
                    isFinite(state.aspectRatio) &&
                    state.aspectRatio > 0;
                  const currentAspectRatio = hasValidAspectRatio
                    ? state.aspectRatio
                    : currentHeight > 0
                      ? currentWidth / currentHeight
                      : 1;
                  const isHeightAuto = !state.height || state.height === 'auto';
                  const shouldUpdateHeight =
                    (lockAspectRatio || isHeightAuto) &&
                    value &&
                    (hasValidAspectRatio || currentHeight > 0);

                  editor
                    ?.chain()
                    .updateAttributes('image', {
                      width: String(width),
                      ...(shouldUpdateHeight
                        ? {
                            height: String(
                              getNewHeight(width, currentAspectRatio)
                            ),
                          }
                        : {}),
                    })
                    .run();
                }}
              />
              <ImageSize
                dimension="height"
                value={state?.height ?? ''}
                onValueChange={(value) => {
                  const height = Number(value) || 0;
                  const currentHeight = Number(state.height) || 0;
                  const currentWidth = Number(state.width) || 0;
                  const hasValidAspectRatio =
                    state.aspectRatio &&
                    isFinite(state.aspectRatio) &&
                    state.aspectRatio > 0;
                  const currentAspectRatio = hasValidAspectRatio
                    ? state.aspectRatio
                    : currentHeight > 0
                      ? currentWidth / currentHeight
                      : 1;
                  const isWidthAuto = !state.width || state.width === 'auto';
                  const shouldUpdateWidth =
                    (lockAspectRatio || isWidthAuto) &&
                    value &&
                    (hasValidAspectRatio || currentWidth > 0);

                  editor
                    ?.chain()
                    .updateAttributes('image', {
                      height: String(height),
                      ...(shouldUpdateWidth
                        ? {
                            width: String(
                              getNewWidth(height, currentAspectRatio)
                            ),
                          }
                        : {}),
                    })
                    .run();
                }}
              />

              <BubbleMenuButton
                isActive={() => lockAspectRatio}
                command={() => {
                  const width = Number(state.width) || 0;
                  const height = Number(state.height) || 0;
                  const aspectRatio = width / height;

                  editor
                    ?.chain()
                    .updateAttributes('image', {
                      lockAspectRatio: !lockAspectRatio,
                      aspectRatio,
                    })
                    .run();
                }}
                icon={lockAspectRatio ? LockIcon : LockOpenIcon}
                tooltip={t('imageMenu.lockAspectRatio')}
              />
            </div>
          </>
        )}

        <Divider />
        <ShowPopover
          showIfKey={state.currentShowIfKey}
          onShowIfKeyValueChange={(value) => {
            editor
              ?.chain()
              .updateAttributes(state.isLogoActive ? 'logo' : 'image', {
                showIfKey: value,
              })
              .run();
          }}
          editor={editor}
        />
      </TooltipProvider>
    </BubbleMenu>
  );
}
