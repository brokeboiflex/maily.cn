// @vitest-environment happy-dom

import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';

import { TooltipProvider } from './tooltip';
import { Select } from './select';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// Floating editor surfaces can detach Tooltip content from its trigger, so the
// select names its trigger with an accessible label instead.
it('renders its trigger without a Tooltip', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () =>
      root.render(
        <TooltipProvider>
          <Select
            label="Size"
            value="md"
            options={[
              { value: 'sm', label: 'Small' },
              { value: 'md', label: 'Medium' },
            ]}
            onValueChange={() => {}}
          />
        </TooltipProvider>
      )
    );
    const trigger = container.querySelector('button[aria-label="Size"]');
    expect(trigger?.textContent).toContain('Medium');
    expect(container.querySelector('[data-slot="tooltip-trigger"]')).toBeNull();
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
