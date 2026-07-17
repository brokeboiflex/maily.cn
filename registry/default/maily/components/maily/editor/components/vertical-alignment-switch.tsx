import { IconPlaceholder } from "@/components/icon-placeholder"
import { BubbleMenuButton } from './bubble-menu-button';
import { type AllowedColumnVerticalAlign } from '../nodes/columns/column';
import { useMailyContext } from '../provider';

type VerticalAlignmentSwitchProps = {
  alignment: AllowedColumnVerticalAlign;
  onAlignmentChange: (alignment: AllowedColumnVerticalAlign) => void;
};

export function VerticalAlignmentSwitch(props: VerticalAlignmentSwitchProps) {
  const { alignment = 'top', onAlignmentChange } = props;
  const { t } = useMailyContext();

  const activeAlignment = {
    top: {
      icon: <IconPlaceholder
  lucide="AlignVerticalDistributeStart"
  tabler="IconAlignBoxTopCenter"
  hugeicons="AlignBoxTopCenterIcon"
  phosphor="AlignTop"
  remixicon="RiAlignTop"
/>,
      tooltip: t('verticalAlignment.top'),
      onClick: () => {
        onAlignmentChange('middle');
      },
    },
    middle: {
      icon: <IconPlaceholder
  lucide="AlignVerticalDistributeCenter"
  tabler="IconAlignBoxCenterMiddle"
  hugeicons="AlignBoxMiddleCenterIcon"
  phosphor="AlignCenterVertical"
  remixicon="RiAlignVertically"
/>,
      tooltip: t('verticalAlignment.center'),
      onClick: () => {
        onAlignmentChange('bottom');
      },
    },
    bottom: {
      icon: <IconPlaceholder
  lucide="AlignVerticalDistributeEnd"
  tabler="IconAlignBoxBottomCenter"
  hugeicons="AlignBoxBottomCenterIcon"
  phosphor="AlignBottom"
  remixicon="RiAlignBottom"
/>,
      tooltip: t('verticalAlignment.bottom'),
      onClick: () => {
        onAlignmentChange('top');
      },
    },
  }[alignment];

  return (
    <BubbleMenuButton
      icon={activeAlignment.icon}
      tooltip={activeAlignment.tooltip}
      command={activeAlignment.onClick}
    />
  );
}
