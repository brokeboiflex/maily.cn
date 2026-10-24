import { expect, it } from 'vitest';

import { replaceDeprecatedNode } from './replace-deprecated';

it("migrates deprecated nodes without changing the caller's JSON", () => {
  const input = {
    type: 'doc',
    content: [{ type: 'for', content: [{ type: 'spacer', attrs: {} }] }],
  };
  const before = JSON.stringify(input);
  const output = replaceDeprecatedNode(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(output.content?.[0].type).toBe('repeat');
  expect(output.content?.[0].content?.[0].attrs?.height).toBeDefined();
});
