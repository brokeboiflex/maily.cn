import { defaultLabels, type LabelKey, type MailyLabels } from './default-labels';

export type TranslateFn = (
  key: LabelKey,
  vars?: Record<string, string | number>
) => string;

/** Replace `{token}` occurrences with values from `vars`. Leaves unknown tokens intact. */
function interpolate(
  str: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) {
    return str;
  }
  return str.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`
  );
}

export function createTranslator(labels: MailyLabels): TranslateFn {
  return (key, vars) => interpolate(labels[key], vars);
}

/** Stable English translator for default params and out-of-provider fallbacks. */
export const englishTranslator: TranslateFn = createTranslator(defaultLabels);
