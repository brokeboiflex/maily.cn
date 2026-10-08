import { describe, it, expect } from 'vitest';
import { Maily } from './maily';

describe('renderer metadata ownership', () => {
  it('keeps repeated metadata configuration idempotent and isolates instances', async () => {
    const one = new Maily({ type: 'doc', content: [] });
    const tag = { name: 'private-render-marker', content: 'owner-a' };
    one.setMetaTags([tag]);
    one.setMetaTags([{ content: 'owner-a', name: 'private-render-marker' }]);
    tag.content = 'changed-after-submit';
    const html = await one.render();
    expect(html).toContain('owner-a');
    expect(html).not.toContain('changed-after-submit');
    expect(html.match(/private-render-marker/g)).toHaveLength(1);
    const two = new Maily({ type: 'doc', content: [] });
    expect(await two.render()).not.toContain('private-render-marker');
  });
});
