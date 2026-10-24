import * as React from 'react';

function sameKeys(previous: readonly unknown[], next: readonly unknown[]) {
  return (
    previous.length === next.length &&
    previous.every((key, index) => Object.is(key, next[index]))
  );
}

/**
 * Returns `create()`, recreated in the same render whenever a key changes.
 * Unlike `useMemo`, the value is state rather than a cache: React never
 * discards it, so it can own locks and identity tokens.
 */
export function useKeyedValue<T>(create: () => T, keys: readonly unknown[]): T {
  const [slot, setSlot] = React.useState(() => ({ keys, value: create() }));
  if (sameKeys(slot.keys, keys)) return slot.value;
  // Render-phase reset: React re-renders this component with the new slot
  // before committing, so no child or effect observes the previous value.
  const next = { keys, value: create() };
  setSlot(next);
  return next.value;
}

/**
 * A ref whose box belongs to `owner`. A new owner gets a fresh box, so async
 * work that captured the previous box cannot read or release the new one.
 */
export function useOwnedRef<T>(owner: unknown, initial: T): { current: T } {
  return useKeyedValue(() => ({ current: initial }), [owner]);
}

/**
 * State that returns to `initial()` during render whenever a key changes, so
 * a request keyed on those values never renders the previous key's result.
 * Async work must still check that it is current before calling the setter.
 */
export function useResettableState<T>(
  initial: () => T,
  keys: readonly unknown[]
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [slot, setSlot] = React.useState(() => ({ keys, value: initial() }));
  let current = slot;
  if (!sameKeys(slot.keys, keys)) {
    current = { keys, value: initial() };
    setSlot(current);
  }
  const setValue = React.useCallback(
    (update: React.SetStateAction<T>) =>
      setSlot((previous) => ({
        keys: previous.keys,
        value:
          typeof update === 'function'
            ? (update as (value: T) => T)(previous.value)
            : update,
      })),
    []
  );
  return [current.value, setValue];
}

/** The latest committed value, for callbacks that must not restart effects. */
export function useLatestRef<T>(value: T): { readonly current: T } {
  const ref = React.useRef(value);
  React.useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
