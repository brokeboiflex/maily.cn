import { useEffect, type RefObject } from 'react';
import { useLatestRef } from './state-hooks';

export function useOutsideClick(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  callback: () => void
) {
  // The document listener reads the latest refs and callback when it fires.
  const latest = useLatestRef({ refs, callback });

  useEffect(() => {
    const handleClick = (e: MouseEvent | TouchEvent) => {
      const { refs, callback } = latest.current;
      const refList = Array.isArray(refs) ? refs : [refs];
      const target = e.target as Node;
      if (refList.some((ref) => ref.current?.contains(target))) {
        return;
      }

      if (refList.some((ref) => ref.current)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [latest]);
}
