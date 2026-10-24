export const spacing = [
  {
    name: 'Extra Small',
    short: 'xs',
    value: 4,
  },
  {
    name: 'Small',
    short: 'sm',
    value: 8,
  },
  {
    name: 'Medium',
    short: 'md',
    value: 16,
  },
  {
    name: 'Large',
    short: 'lg',
    value: 32,
  },
  {
    name: 'Extra Large',
    short: 'xl',
    value: 64,
  },
];

/** Spacer heights are pixel numbers; older documents stored named sizes. */
export function normalizeSpacerHeight(
  value: unknown,
  fallback: number
): number {
  if (typeof value === 'number')
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const named = spacing.find((size) => size.short === value);
  if (named) return named.value;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
