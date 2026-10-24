import { useCallback, useEffect, useRef } from 'react';

/** A deferred UI action belongs to one mounted editor surface. */
export function useOwnedTimeout() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancel = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => cancel, [cancel]);
  const schedule = useCallback(
    (callback: () => void, delay: number) => {
      cancel();
      timer.current = setTimeout(() => {
        timer.current = null;
        callback();
      }, delay);
    },
    [cancel]
  );
  return { schedule, cancel };
}
