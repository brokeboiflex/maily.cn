import * as React from 'react';

/** A controlled value is authoritative; requests never update its local mirror. */
export function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [local, setLocal] = React.useState(defaultValue);
  const current = value === undefined ? local : value;
  const ref = React.useRef({
    current,
    controlled: value !== undefined,
    onChange,
  });
  React.useLayoutEffect(() => {
    ref.current = { current, controlled: value !== undefined, onChange };
  });
  const set = React.useCallback((update: React.SetStateAction<T>) => {
    const snapshot = ref.current;
    const next =
      typeof update === 'function'
        ? (update as (previous: T) => T)(snapshot.current)
        : update;
    if (Object.is(next, snapshot.current)) return;
    if (!snapshot.controlled) {
      snapshot.current = next;
      setLocal(next);
    }
    snapshot.onChange?.(next);
  }, []);
  return [current, set];
}
