import { useCallback } from 'react';
import { useEffect } from 'react';
import { type RefObject } from 'react';

export function useOutsideClick(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  callback: () => void
) {
  const refList = Array.isArray(refs) ? refs : [refs];
  const handleClick = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (refList.some((ref) => ref.current?.contains(target))) {
        return;
      }

      if (refList.some((ref) => ref.current)) {
        callback();
      }
    },
    [refList, callback]
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [handleClick]);
}
