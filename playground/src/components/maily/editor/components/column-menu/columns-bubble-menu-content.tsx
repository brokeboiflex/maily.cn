import { Space, Trash } from "lucide-react"
import { EditorBubbleMenuProps } from '../text-menu/text-bubble-menu';
import { useColumnsState } from './use-columns-state';
import { Divider } from '../ui/divider';
import { TooltipProvider } from '../ui/tooltip';
import { VerticalAlignmentSwitch } from '../vertical-alignment-switch';
import {
  addColumnByIndex,
  removeColumnByIndex,
  updateColumnWidth,
} from '../../utils/columns';
import { ShowPopover } from '../show-popover';
import { ColumnsWidthConfig } from './columns-width-config';
import { Select } from '../ui/select';
import { BubbleMenuButton } from '../bubble-menu-button';
import { deleteNode } from '../../utils/delete-node';
import { spacing } from '../../utils/spacing';
import { useMailyContext } from '../../provider';
import type { LabelKey } from '../../i18n';

type ColumnsBubbleMenuProps = {
  editor: EditorBubbleMenuProps['editor'];
};

export function ColumnsBubbleMenuContent(props: ColumnsBubbleMenuProps) {
  const { editor } = props;
  if (!editor) {
    return null;
  }

  const state = useColumnsState(editor);
  const { t } = useMailyContext();

  const currentColumnCount = state.columnsCount;

  return (
    <TooltipProvider>
      <div className="flex items-stretch">
        {state.isColumnActive && (
          <>
            <ColumnsWidthConfig
              columnsCount={currentColumnCount}
              columnWidths={state.columnWidths}
              onColumnsCountChange={(count) => {
                if (count > currentColumnCount) {
                  addColumnByIndex(editor);
                } else {
                  removeColumnByIndex(editor);
                }
              }}
              onColumnWidthChange={(index, width) => {
                updateColumnWidth(editor, index, width);
              }}
            />

            <Divider />
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

        <Divider />

        <Select
          icon={Space}
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
          tooltip={t('columnMenu.gap')}
        />

        <Divider />

        <BubbleMenuButton
          icon={Trash}
          tooltip={t('columnMenu.delete')}
          command={() => {
            deleteNode(editor, 'columns');
          }}
        />

        <Divider />

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
