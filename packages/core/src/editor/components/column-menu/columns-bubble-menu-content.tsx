import { type EditorBubbleMenuProps } from '../text-menu/text-bubble-menu';
import { useColumnsState } from './use-columns-state';
import { Separator } from '@/editor/components/ui/divider';
import { TooltipProvider } from '@/editor/components/ui/tooltip';
import { VerticalAlignmentSwitch } from '../vertical-alignment-switch';
import { setColumnCount, updateColumnWidth } from '../../utils/columns';
import { ShowPopover } from '../show-popover';
import { ColumnsWidthConfig } from './columns-width-config';
import { Select } from '../ui/select';
import { BubbleMenuButton } from '../bubble-menu-button';
import { deleteNode } from '../../utils/delete-node';
import { spacing } from '../../utils/spacing';
import { useMailyContext } from '../../maily-context';
import type { LabelKey } from '../../i18n';
import { BUBBLE_MENU_CONTENT_CLASS } from '../ui/floating-menu';
import { Space, Trash2 } from 'lucide-react';

type ColumnsBubbleMenuProps = {
  editor: EditorBubbleMenuProps['editor'];
};

export function ColumnsBubbleMenuContent(props: ColumnsBubbleMenuProps) {
  const { editor } = props;

  const state = useColumnsState(editor);
  const { t } = useMailyContext();

  const currentColumnCount = state.columnsCount;

  return (
    <TooltipProvider>
      <div className={BUBBLE_MENU_CONTENT_CLASS}>
        {state.isColumnActive && (
          <>
            <ColumnsWidthConfig
              columnsCount={currentColumnCount}
              columnWidths={state.columnWidths}
              onColumnsCountChange={(count) => {
                setColumnCount(editor, count);
              }}
              onColumnWidthChange={(index, width) => {
                updateColumnWidth(editor, index, width);
              }}
            />

            <Separator orientation="vertical" />
          </>
        )}

        <VerticalAlignmentSwitch
          alignment={state.currentVerticalAlignment}
          onAlignmentChange={(value) => {
            editor.commands.updateColumn({
              verticalAlign: value,
            });
          }}
        />

        <Separator orientation="vertical" />

        <Select
          icon={<Space />}
          label={t('columnMenu.gap')}
          value={state.currentColumnsGap}
          options={[
            { value: '0', label: t('columnMenu.gap.none') },
            ...spacing.map((space) => ({
              label: t(`spacing.${space.short}` as LabelKey),
              value: String(space.value),
            })),
          ]}
          onValueChange={(value) => {
            editor.commands.updateColumns({
              gap: +value,
            });
          }}
        />

        <Separator orientation="vertical" />

        <BubbleMenuButton
          icon={<Trash2 />}
          tooltip={t('columnMenu.delete')}
          command={() => {
            deleteNode(editor, 'columns');
          }}
        />

        <Separator orientation="vertical" />

        <ShowPopover
          showIfKey={state.currentShowIfKey}
          onShowIfKeyValueChange={(value) => {
            editor.commands.updateColumns({
              showIfKey: value,
            });
          }}
          editor={editor}
        />
      </div>
    </TooltipProvider>
  );
}
