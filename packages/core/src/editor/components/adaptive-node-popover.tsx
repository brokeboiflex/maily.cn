import type { ComponentProps } from 'react';
import { createPortal } from 'react-dom';
import { PopoverContent } from './popover';
import { useMobileEditor } from './mobile-editor-context';

export function AdaptiveNodePopover({
  active,
  children,
  ...props
}: ComponentProps<typeof PopoverContent> & { active: boolean }) {
  const { compact, nodeTarget } = useMobileEditor();
  if (!compact) return <PopoverContent {...props}>{children}</PopoverContent>;
  if (!active || !nodeTarget) return null;
  return createPortal(
    <div className="space-y-3 border-b pb-4 [&>div]:flex-wrap">{children}</div>,
    nodeTarget
  );
}
