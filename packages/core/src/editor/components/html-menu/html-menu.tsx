import { BubbleMenu } from '@tiptap/react';
import { CodeXmlIcon, ViewIcon } from 'lucide-react';
import { useCallback } from 'react';
import { sticky } from 'tippy.js';
import { getRenderContainer } from '../../utils/get-render-container';
import { ShowPopover } from '../show-popover';
import { type EditorBubbleMenuProps } from '../text-menu/text-bubble-menu';
import { Separator } from '../ui/divider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { useHtmlState } from './use-html-state';
import { useMailyContext } from '../../provider';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { FLOATING_BUBBLE_MENU_CLASS } from '../ui/floating-menu';

export function HTMLBubbleMenu(props: EditorBubbleMenuProps) {
  const { appendTo, editor } = props;
  if (!editor) {
    return null;
  }

  const state = useHtmlState(editor);
  const { t } = useMailyContext();

  const getReferenceClientRect = useCallback(() => {
    const renderContainer = getRenderContainer(editor!, 'htmlCodeBlock');
    const rect =
      renderContainer?.getBoundingClientRect() ||
      new DOMRect(-1000, -1000, 0, 0);

    return rect;
  }, [editor]);

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    ...(appendTo ? { appendTo: appendTo.current } : {}),
    shouldShow: ({ editor }) => {
      return editor.isActive('htmlCodeBlock');
    },
    tippyOptions: {
      offset: [0, 8],
      popperOptions: {
        modifiers: [{ name: 'flip', enabled: false }],
      },
      getReferenceClientRect,
      appendTo: () => appendTo?.current,
      plugins: [sticky],
      sticky: 'popper',
      maxWidth: 'auto',
    },
    pluginKey: 'htmlCodeBlockBubbleMenu',
  };

  const { activeTab = 'code' } = state;

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      className={FLOATING_BUBBLE_MENU_CLASS}
    >
      <TooltipProvider>
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            editor.commands.updateHtmlCodeBlock({
              activeTab: value as 'code' | 'preview',
            });
          }}
          className="gap-0"
        >
          <TabsList className="h-7">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <TabsTrigger
                    value="code"
                    type="button"
                    className="size-6 shrink-0 px-0"
                    aria-label={t('htmlMenu.htmlCode')}
                  >
                    <CodeXmlIcon className="size-3 shrink-0 stroke-[2.5]" />
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>
                {t('htmlMenu.htmlCode')}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <TabsTrigger
                    value="preview"
                    type="button"
                    className="size-6 shrink-0 px-0"
                    aria-label={t('htmlMenu.preview')}
                  >
                    <ViewIcon className="size-3 shrink-0 stroke-[2.5]" />
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>
                {t('htmlMenu.preview')}
              </TooltipContent>
            </Tooltip>
          </TabsList>
        </Tabs>
        <Separator orientation="vertical" />
        <ShowPopover
          showIfKey={state.currentShowIfKey}
          onShowIfKeyValueChange={(value) => {
            editor.commands.updateHtmlCodeBlock({
              showIfKey: value,
            });
          }}
          editor={editor}
        />
      </TooltipProvider>
    </BubbleMenu>
  );
}
