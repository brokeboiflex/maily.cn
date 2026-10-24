import { useCallback } from 'react';
import { useLatestRef } from './state-hooks';

/** A stable function that always calls the latest committed `handler`. */
export const useEvent = <T extends (...args: never[]) => unknown>(
  handler: T
): T => {
  const handlerRef = useLatestRef(handler);
  return useCallback(
    (...args: Parameters<T>) => handlerRef.current(...args),
    [handlerRef]
  ) as T;
};
