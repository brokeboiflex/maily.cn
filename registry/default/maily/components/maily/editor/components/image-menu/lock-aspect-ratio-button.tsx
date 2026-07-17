import { IconPlaceholder } from "@/components/icon-placeholder"
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMailyContext } from '../../provider';

type LockAspectRatioButtonProps = {
  onClick: () => void;
  isLocked: boolean;
};

export function LockAspectRatioButton(props: LockAspectRatioButtonProps) {
  const { onClick, isLocked } = props;
  const { t } = useMailyContext();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          className="size-7"
          pressed={isLocked}
          onPressedChange={onClick}
        >
          {isLocked ? (
            <IconPlaceholder
  lucide="LockIcon"
  tabler="IconLock"
  hugeicons="LockIcon"
  phosphor="Lock"
  remixicon="RiLockLine"
  className="text-foreground h-3 w-3 shrink-0 stroke-[2.5]"
/>
          ) : (
            <IconPlaceholder
  lucide="LockOpenIcon"
  tabler="IconLockOpen"
  hugeicons="SquareUnlock01Icon"
  phosphor="LockOpen"
  remixicon="RiLockUnlockLine"
  className="text-foreground h-3 w-3 shrink-0 stroke-[2.5]"
/>
          )}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent sideOffset={8}>
        {isLocked
          ? t('imageMenu.lockAspectRatioUnlock')
          : t('imageMenu.lockAspectRatioLock')}
      </TooltipContent>
    </Tooltip>
  );
}
