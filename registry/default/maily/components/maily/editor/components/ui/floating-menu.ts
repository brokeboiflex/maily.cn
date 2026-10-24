import type { BubbleMenuProps } from '@tiptap/react/menus';
import deepEql from 'fast-deep-equal';
import { useCallback, useState } from 'react';
import { useLatestRef } from '../../utils/state-hooks';

export const FLOATING_MENU_CLASS =
  'bg-popover text-popover-foreground ring-foreground/10 rounded-lg p-1 shadow-md ring-1 transition-[opacity,transform] duration-100';

export const BUBBLE_MENU_CONTENT_CLASS = 'flex items-stretch gap-1';

export const FLOATING_BUBBLE_MENU_CLASS = `${FLOATING_MENU_CLASS} ${BUBBLE_MENU_CONTENT_CLASS}`;

export const FLOATING_MENU_TRIGGER_CLASS =
  'h-7! min-h-7! rounded-md border-0 bg-transparent px-2 text-xs font-medium shadow-none';

export function useStableBubbleMenuProps(
  props: BubbleMenuProps
): BubbleMenuProps {
  // The callbacks below read the latest props at call time.
  const latestRef = useLatestRef(props);
  // Keep the previous options object while its contents are unchanged.
  const [stableOptions, setStableOptions] = useState(props.options);
  let options = stableOptions;
  if (!deepEql(stableOptions, props.options)) {
    setStableOptions(props.options);
    options = props.options;
  }

  const shouldShow = useCallback<NonNullable<BubbleMenuProps['shouldShow']>>(
    (context) => latestRef.current.shouldShow?.(context) ?? false,
    [latestRef]
  );
  const appendTo = useCallback<
    Extract<NonNullable<BubbleMenuProps['appendTo']>, () => HTMLElement>
  >(() => {
    const currentAppendTo = latestRef.current.appendTo;
    return typeof currentAppendTo === 'function'
      ? currentAppendTo()
      : (currentAppendTo ?? document.body);
  }, [latestRef]);
  const getReferencedVirtualElement = useCallback<
    NonNullable<BubbleMenuProps['getReferencedVirtualElement']>
  >(
    () => latestRef.current.getReferencedVirtualElement?.() ?? null,
    [latestRef]
  );

  return {
    ...props,
    shouldShow: props.shouldShow ? shouldShow : props.shouldShow,
    appendTo: typeof props.appendTo === 'function' ? appendTo : props.appendTo,
    getReferencedVirtualElement: props.getReferencedVirtualElement
      ? getReferencedVirtualElement
      : props.getReferencedVirtualElement,
    options,
  };
}
