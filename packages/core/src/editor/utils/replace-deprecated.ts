import { type JSONContent } from '@tiptap/core';
import { normalizeSpacerHeight } from './spacing';
import { DEFAULT_SPACER_HEIGHT } from '@/extensions';

/**
 * To replace deprecated node type or attributes
 * to avoid breaking changes, we can replace the deprecated node type or attributes
 * with the new one in the JSON content object.
 * @param json - previous JSON content object, which is left unchanged
 * @returns JSONContent - new JSON content object
 */
export function replaceDeprecatedNode(input: JSONContent) {
  const json = structuredClone(input);
  const stack = [json];

  while (stack.length) {
    const node = stack.pop();
    if (!node) {
      continue;
    }

    if (node.type === 'for') {
      node.type = 'repeat';
    }

    if (node.type === 'spacer') {
      node.attrs = {
        ...node.attrs,
        height: normalizeSpacerHeight(
          node.attrs?.height,
          DEFAULT_SPACER_HEIGHT
        ),
      };
    }

    if (node.content) {
      stack.push(...node.content);
    }
  }

  return json;
}
