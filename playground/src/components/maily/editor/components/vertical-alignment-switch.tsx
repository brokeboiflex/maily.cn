import { AlignVerticalDistributeCenter, AlignVerticalDistributeEnd, AlignVerticalDistributeStart } from "lucide-react"
import { BubbleMenuButton } from './bubble-menu-button';
import { AllowedColumnVerticalAlign } from '../nodes/columns/column';
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
      icon: AlignVerticalDistributeStart,
      tooltip: t('verticalAlignment.top'),
      onClick: () => {
        onAlignmentChange('middle');
      },
    },
    middle: {
      icon: AlignVerticalDistributeCenter,
      tooltip: t('verticalAlignment.center'),
      onClick: () => {
        onAlignmentChange('bottom');
      },
    },
    bottom: {
      icon: AlignVerticalDistributeEnd,
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
