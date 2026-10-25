import type {
  VariableFunctionOptions,
  Variables,
  Variable,
} from '@/extensions';

export function hasVariables(variables: Variables | undefined): boolean {
  return typeof variables === 'function' || (variables?.length ?? 0) > 0;
}

export function processVariables(
  variables: Variables,
  options: VariableFunctionOptions
): Array<Variable> {
  const { query } = options;
  const queryLower = query.toLowerCase();

  if (Array.isArray(variables)) {
    if (!hasVariables(variables)) return [];

    const filteredVariables = variables.filter((variable) =>
      variable.name.toLowerCase().startsWith(queryLower)
    );

    if (
      query.length > 0 &&
      !filteredVariables.some((variable) => variable.name === query)
    ) {
      filteredVariables.push({ name: query, required: true });
    }

    return filteredVariables;
  } else if (typeof variables === 'function') {
    return variables(options);
  } else {
    throw new Error(`Invalid variables type. Expected 'Array' or 'Function', but received '${typeof variables}'.

You can check out the documentation for more information: https://github.com/arikchakma/maily.to/blob/main/packages/core/readme.md`);
  }
}
