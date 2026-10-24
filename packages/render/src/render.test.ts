import { DEFAULT_FONT } from '@maily-to/shared';
import { describe, expect, it, vi } from 'vitest';
import { fontsourceFontFaceUrl, Maily, render } from './index';
import { Preheader } from './preheader';
import allBlocks from './__fixtures__/all-blocks.json';

describe('render', () => {
  it('should replace variables with values', async () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'variable',
              attrs: {
                id: 'name',
                fallback: 'Buddy',
              },
            },
          ],
        },
      ],
    };

    const maily = new Maily(content);
    maily.setVariableValue('name', 'John Doe');
    const result = await maily.render({
      plainText: true,
    });

    expect(result).toMatchInlineSnapshot(`"John Doe"`);
  });

  it('should replace variables with default formatted value', async () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'variable',
              attrs: {
                id: 'name',
                fallback: 'Buddy',
              },
            },
          ],
        },
      ],
    };
    const result = await render(content, {
      plainText: true,
    });
    expect(result).toMatchInlineSnapshot(`"{{name,fallback=Buddy}}"`);
  });

  it('should replace variables formatter with custom formatter', async () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'variable',
              attrs: {
                id: 'name',
                fallback: 'Buddy',
              },
            },
          ],
        },
      ],
    };

    const maily = new Maily(content);
    maily.setVariableFormatter((options) => {
      const { fallback, variable } = options;
      return `[${variable},fallback=${fallback}]`;
    });
    const result = await maily.render({
      plainText: true,
    });

    expect(result).toMatchInlineSnapshot(`"[name,fallback=Buddy]"`);
  });

  it('should replace variables with fallback value', async () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'variable',
              attrs: {
                id: 'name',
                fallback: 'Buddy',
              },
            },
          ],
        },
      ],
    };

    const maily = new Maily(content);
    maily.setShouldReplaceVariableValues(true);
    const result = await maily.render({
      plainText: true,
    });

    expect(result).toMatchInlineSnapshot(`"Buddy"`);
  });

  it('should replace links with setLinkValue value', async () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: {
            textAlign: 'left',
          },
          content: [
            {
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://maily.to',
                    target: '_blank',
                    rel: 'noopener noreferrer nofollow',
                    class: null,
                  },
                },
              ],
              text: 'maily.to',
            },
          ],
        },
      ],
    };

    const maily = new Maily(content);
    maily.setLinkValue('https://maily.to', 'https://maily.to/playground');
    const result = await maily.render({
      plainText: true,
    });

    expect(result).toMatchInlineSnapshot(
      `"maily.to https://maily.to/playground"`
    );
  });

  it("should replace unsubscribe_url in button's href", async () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'button',
          attrs: {
            mailyComponent: 'button',
            text: 'Unsubscribe',
            url: 'unsubscribe_url',
            isUrlVariable: true,
            alignment: 'left',
            variant: 'filled',
            borderRadius: 'smooth',
            buttonColor: 'rgb(0, 0, 0)',
            textColor: 'rgb(255, 255, 255)',
          },
        },
      ],
    };

    const maily = new Maily(content);
    maily.setVariableValue(
      'unsubscribe_url',
      'https://maily.to/unsubscribe_url'
    );
    const result = await maily.render({
      plainText: true,
    });

    expect(result).toMatchInlineSnapshot(
      `"Unsubscribe https://maily.to/unsubscribe_url"`
    );
  });

  it('renders button-specific font family and size', async () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'button',
          attrs: {
            text: 'Read more',
            url: 'https://maily.to',
            alignment: 'left',
            variant: 'filled',
            borderRadius: 'smooth',
            buttonColor: '#000000',
            textColor: '#ffffff',
            fontSize: '18px',
            fontFamily: 'Fraunces',
            fontId: 'fraunces',
            fontFallback: 'Georgia',
            fontSubset: 'latin',
            fontVersion: '5.2.8',
            fontRegularWeight: 400,
            fontBoldWeight: 700,
            fontHasItalic: true,
          },
        },
      ],
    };

    const result = await render(content, {
      fontFaceUrl: fontsourceFontFaceUrl,
    });

    expect(result).toContain('font-size:18px');
    expect(result).toContain('font-family:&#x27;Fraunces&#x27;, Georgia');
    expect(result).toContain(
      'fontsource/fonts/fraunces@5.2.8/latin-400-normal.woff2'
    );
  });

  it('renders link card-specific font family and size', async () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'linkCard',
          attrs: {
            title: 'Launch notes',
            description: 'Read the latest changes',
            linkTitle: 'Open changelog',
            link: 'https://maily.to/changelog',
            badgeText: 'New',
            image: '',
            subTitle: '',
            fontSize: '20px',
            fontFamily: 'Fraunces',
            fontId: 'fraunces',
            fontFallback: 'Georgia',
            fontSubset: 'latin',
            fontVersion: '5.2.8',
            fontRegularWeight: 400,
            fontBoldWeight: 700,
            fontHasItalic: true,
          },
        },
      ],
    };

    const result = await render(content, {
      fontFaceUrl: fontsourceFontFaceUrl,
    });

    expect(result).toContain('font-size:20px');
    expect(result).toContain('font-family:&#x27;Fraunces&#x27;, Georgia');
    expect(result).toContain(
      'fontsource/fonts/fraunces@5.2.8/latin-400-normal.woff2'
    );
  });

  it('renders section defaults consistently with the editor node', async () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'section',
          attrs: {},
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Inside section' }],
            },
          ],
        },
      ],
    };

    const result = await render(content);

    expect(result).toContain('background-color:transparent');
    expect(result).toContain('border-color:#e2e2e2');
    expect(result).toContain('border-width:2px');
  });

  it('should apply custom theme', async () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Custom Heading' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Custom Paragraph' }],
        },
      ],
    };

    const customTheme = {
      colors: {
        heading: 'rgb(255, 0, 0)',
        paragraph: 'rgb(0, 255, 0)',
      },
      fontSize: {
        paragraph: { size: '18px' },
      },
    };

    const maily = new Maily(content);
    maily.setTheme(customTheme);
    const result = await maily.render();

    expect(result).toContain('color:rgb(255, 0, 0)');
    expect(result).toContain('color:rgb(0, 255, 0)');
    expect(result).toContain('font-size:18px');
  });

  it('renders the default email font without loading anything', async () => {
    const result = await render({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
      ],
    });

    expect(result).toContain("font-family:'Arial', sans-serif");
    expect(result).not.toContain('@font-face');
    expect(result).not.toContain('url(');
  });

  it('renders granular Fontsource families with pinned faces and fallbacks', async () => {
    const fontAttrs = {
      color: '#123456',
      fontFamily: 'Fraunces',
      fontId: 'fraunces',
      fontFallback: 'Georgia',
      fontSubset: 'latin',
      fontVersion: '5.2.8',
      fontRegularWeight: 400,
      fontBoldWeight: 700,
      fontHasItalic: true,
    };
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Editorial type',
              marks: [{ type: 'textStyle', attrs: fontAttrs }],
            },
            {
              type: 'text',
              text: ' repeated',
              marks: [{ type: 'textStyle', attrs: fontAttrs }],
            },
          ],
        },
      ],
    };

    const result = await render(content, {
      fontFaceUrl: fontsourceFontFaceUrl,
    });

    expect(result).toContain('font-family:&#x27;Fraunces&#x27;, Georgia');
    expect(result).toContain(
      'fontsource/fonts/fraunces@5.2.8/latin-400-normal.woff2'
    );
    expect(result).toContain(
      'fontsource/fonts/fraunces@5.2.8/latin-700-italic.woff2'
    );
    expect(result.match(/latin-400-normal\.woff2/g)).toHaveLength(1);
  });

  it('renders granular font sizes on text style marks', async () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Small detail',
              marks: [{ type: 'textStyle', attrs: { fontSize: '12px' } }],
            },
          ],
        },
      ],
    };

    const result = await render(content);

    expect(result).toContain('font-size:12px');
  });

  it('should remove preview header from text', async () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Empty Content' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'You will see me with the preview text' },
          ],
        },
      ],
    };

    const maily = new Maily(content);
    maily.setPreviewText('You will not see me!');

    const html = await maily.render();
    const text = await maily.render({ plainText: true });

    expect(text).toBe('EMPTY CONTENT\n\nYou will see me with the preview text');
    expect(html).toContain('You will not see me!');
    expect(html).toContain('data-skip-in-text="true"');
  });

  describe('paragraph text direction', () => {
    it('should render paragraph with RTL direction', async () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: {
              textDirection: 'rtl',
            },
            content: [{ type: 'text', text: 'مرحبا بالعالم' }],
          },
        ],
      };

      const maily = new Maily(content);
      const result = await maily.render();

      expect(result).toContain('direction:rtl');
    });

    it('should render paragraph with LTR direction by default', async () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello World' }],
          },
        ],
      };

      const maily = new Maily(content);
      const result = await maily.render();

      expect(result).not.toContain('direction:rtl');
    });

    it('should not add direction style for explicit LTR', async () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: {
              textDirection: 'ltr',
            },
            content: [{ type: 'text', text: 'Hello World' }],
          },
        ],
      };

      const maily = new Maily(content);
      const result = await maily.render();

      expect(result).not.toContain('direction:rtl');
      expect(result).not.toContain('direction:ltr');
    });
  });

  describe('footer text direction', () => {
    it('should render footer with RTL direction', async () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'footer',
            attrs: {
              textDirection: 'rtl',
            },
            content: [{ type: 'text', text: 'تذييل الصفحة' }],
          },
        ],
      };

      const maily = new Maily(content);
      const result = await maily.render();

      expect(result).toContain('direction:rtl');
    });

    it('should render footer with LTR direction by default', async () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'footer',
            content: [{ type: 'text', text: 'Footer text' }],
          },
        ],
      };

      const maily = new Maily(content);
      const result = await maily.render();

      expect(result).not.toContain('direction:rtl');
    });
  });

  it('should resolve link URL variables from repeat item payload', async () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'repeat',
          attrs: {
            each: 'links',
          },
          content: [
            {
              type: 'paragraph',
              attrs: {
                textAlign: 'left',
              },
              content: [
                {
                  type: 'text',
                  marks: [
                    {
                      type: 'link',
                      attrs: {
                        href: 'https://url',
                        target: '_blank',
                        rel: 'noopener noreferrer nofollow',
                        isUrlVariable: true,
                      },
                    },
                  ],
                  text: 'Click here',
                },
              ],
            },
          ],
        },
      ],
    };

    const maily = new Maily(content);
    maily.setPayloadValue('links', [
      { url: 'https://example.com/first' },
      { url: 'https://example.com/second' },
    ]);
    const result = await maily.render({ plainText: true });

    expect(result).toContain('https://example.com/first');
    expect(result).toContain('https://example.com/second');
  });

  describe('preheader', () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Email content' }],
        },
      ],
    };

    it('should render preheader with string content', async () => {
      const preheaderText = 'This is a preview text';

      const maily = new Maily(content);
      const preheader = new Preheader(maily);
      const result = preheader.render(preheaderText);

      expect(result).toBe('This is a preview text');
    });

    it('should render preheader with JSONContent', async () => {
      const preheaderContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'JSON preview text' }],
          },
        ],
      };

      const maily = new Maily(content);
      const preheader = new Preheader(maily);
      const result = preheader.render(preheaderContent);

      expect(result).toBe('JSON preview text');
    });

    it('should render preheader with variables', async () => {
      const preheaderContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Hello ' },
              {
                type: 'variable',
                attrs: {
                  id: 'name',
                  fallback: 'there',
                },
              },
              { type: 'text', text: '!' },
            ],
          },
        ],
      };

      const maily = new Maily(content);
      const preheader = new Preheader(maily);
      maily.setVariableValue('name', 'John');
      const result = preheader.render(preheaderContent);

      expect(result).toBe('Hello John!');
    });

    it('should render preheader with variable fallback', async () => {
      const preheaderContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Welcome ' },
              {
                type: 'variable',
                attrs: {
                  id: 'username',
                  fallback: 'valued customer',
                },
              },
            ],
          },
        ],
      };

      const maily = new Maily(content);
      const preheader = new Preheader(maily);
      maily.setShouldReplaceVariableValues(true);
      const result = preheader.render(preheaderContent);

      expect(result).toBe('Welcome valued customer');
    });

    it('should not render preheader when preview is not set', async () => {
      const maily = new Maily(content);
      const preheader = new Preheader(maily);
      const result = preheader.render('');

      expect(result).toBe('');
    });

    it('should handle empty preheader content', async () => {
      const emptyPreheaderContent = {
        type: 'doc',
        content: [],
      };

      const maily = new Maily(content);
      const preheader = new Preheader(maily);
      const result = preheader.render(emptyPreheaderContent);

      expect(result).toBe('');
    });

    it('should handle complex nested preheader content', async () => {
      const complexPreheaderContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Order #' },
              {
                type: 'variable',
                attrs: {
                  id: 'order_id',
                  fallback: '12345',
                },
              },
              { type: 'text', text: ' for ' },
              {
                type: 'variable',
                attrs: {
                  id: 'customer_name',
                  fallback: 'customer',
                },
              },
            ],
          },
        ],
      };

      const maily = new Maily(content);
      const preheader = new Preheader(maily);
      maily.setVariableValue('order_id', 'ORD-789');
      maily.setVariableValue('customer_name', 'Alice Smith');
      const result = preheader.render(complexPreheaderContent);

      expect(result).toBe('Order #ORD-789 for Alice Smith');
    });
  });
});

describe('rendered email', () => {
  // Guards the complete HTML of every block. Review a snapshot diff as an
  // email change: dependency upgrades can alter markup that recipients see.
  it('matches the snapshot for every block type', async () => {
    const html = await render(allBlocks, { preview: 'Preview text' });
    await expect(html).toMatchFileSnapshot('__snapshots__/all-blocks.html');
  });
});

describe('images without a source', () => {
  it.each(['image', 'logo', 'inlineImage'])(
    'renders no %s element for an empty source',
    async (type) => {
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const node = { type, attrs: { src: '' } };
        const html = await render({
          type: 'doc',
          content:
            type === 'inlineImage'
              ? [{ type: 'paragraph', content: [node] }]
              : [node],
        });
        expect(html).not.toContain('<img');
        expect(errors).not.toHaveBeenCalled();
      } finally {
        errors.mockRestore();
      }
    }
  );
});

describe('image sources from payload variables', () => {
  it.each([
    ['a number', 42, 'src="42"'],
    [
      'a URL',
      new URL('https://example.com/a.png'),
      'src="https://example.com/a.png"',
    ],
  ])('renders %s as the source', async (_, value, expected) => {
    const maily = new Maily({
      type: 'doc',
      content: [
        {
          type: 'repeat',
          attrs: { each: 'items' },
          content: [
            { type: 'image', attrs: { src: 'img', isSrcVariable: true } },
            { type: 'logo', attrs: { src: 'img', isSrcVariable: true } },
            {
              type: 'paragraph',
              content: [
                {
                  type: 'inlineImage',
                  attrs: { src: 'img', isSrcVariable: true },
                },
              ],
            },
          ],
        },
      ],
    });
    maily.setPayloadValue('items', [{ img: value }]);
    const html = await maily.render();
    expect(html.split(expected)).toHaveLength(4);
  });

  it.each([
    ['false', false],
    ['an object', { url: 'https://example.com/a.png' }],
  ])('renders no image for %s', async (_, value) => {
    const maily = new Maily({
      type: 'doc',
      content: [
        {
          type: 'repeat',
          attrs: { each: 'items' },
          content: [
            { type: 'image', attrs: { src: 'img', isSrcVariable: true } },
            { type: 'logo', attrs: { src: 'img', isSrcVariable: true } },
          ],
        },
      ],
    });
    maily.setPayloadValue('items', [{ img: value }]);
    expect(await maily.render()).not.toContain('<img');
  });
});

describe('spacer heights', () => {
  it.each([
    [24, '24px'],
    ['sm', '8px'],
    ['xl', '64px'],
    ['12', '12px'],
    ['bogus', '8px'],
    ['constructor', '8px'],
    [-4, '8px'],
  ])('renders %j as %s', async (height, expected) => {
    const html = await render({
      type: 'doc',
      content: [{ type: 'spacer', attrs: { height } }],
    });
    expect(html).toContain(`height:${expected}`);
    expect(html).not.toMatch(/height:[a-z-]+px/);
  });
});

describe('repeat payload items', () => {
  // An item without fields (null, undefined) renders its children with an
  // empty item scope, like primitive items do for field lookups.
  it('renders null and undefined items with the global values and fallbacks', async () => {
    const maily = new Maily({
      type: 'doc',
      content: [
        {
          type: 'repeat',
          attrs: { each: 'people' },
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Hi ' },
                { type: 'variable', attrs: { id: 'name', fallback: 'friend' } },
                { type: 'text', text: ' ' },
                {
                  type: 'text',
                  text: 'profile',
                  marks: [
                    {
                      type: 'link',
                      attrs: { href: 'https://url', isUrlVariable: true },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    maily.setVariableValue('url', 'https://example.com/default');
    maily.setPayloadValue('people', [
      { name: 'Ada', url: 'https://example.com/ada' },
      null,
      'Grace',
      undefined,
    ]);

    const text = await maily.render({ plainText: true });

    expect(text.match(/Hi /g)).toHaveLength(4);
    expect(text).toMatch(
      /Hi Ada[\s\S]*Hi friend[\s\S]*Hi Grace[\s\S]*Hi friend/
    );
    expect(text).toContain('https://example.com/ada');
    expect(text.match(/https:\/\/example\.com\/default/g)).toHaveLength(2);
  });

  it('treats showIfKey and nested lists of a null item as missing', async () => {
    const maily = new Maily({
      type: 'doc',
      content: [
        {
          type: 'repeat',
          attrs: { each: 'groups' },
          content: [
            {
              type: 'paragraph',
              attrs: { showIfKey: 'visible' },
              content: [{ type: 'text', text: 'Shown' }],
            },
            {
              type: 'repeat',
              attrs: { each: 'members' },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Member' }],
                },
              ],
            },
          ],
        },
      ],
    });
    maily.setPayloadValue('groups', [null, { visible: true, members: [1, 2] }]);

    const text = await maily.render({ plainText: true });

    expect(text.match(/Shown/g)).toHaveLength(1);
    expect(text.match(/Member/g)).toHaveLength(2);
  });
});

const paragraphDoc = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
};

describe('renderer state', () => {
  it("keeps one render's theme out of later renders", async () => {
    const theme = { container: { backgroundColor: '#ff0000' } };
    const first = new Maily(paragraphDoc);
    first.setTheme(theme);
    expect(await first.render()).toContain('#ff0000');
    expect(await render(paragraphDoc)).not.toContain('#ff0000');
    expect(theme).toEqual({ container: { backgroundColor: '#ff0000' } });
  });

  it("does not reorder the caller's marks", async () => {
    const marks = [
      { type: 'link', attrs: { href: 'https://example.com' } },
      { type: 'bold' },
    ];
    const before = JSON.stringify(marks);
    const html = await render({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'x', marks }] },
      ],
    });
    expect(JSON.stringify(marks)).toBe(before);
    expect(html).toMatch(/<a [^>]*><strong>x<\/strong><\/a>/);
  });
});

describe('HTML block variables', () => {
  it('inserts variable values as text, not markup', async () => {
    const maily = new Maily({
      type: 'doc',
      content: [
        {
          type: 'htmlCodeBlock',
          content: [
            { type: 'text', text: '<p>Hi ' },
            { type: 'variable', attrs: { id: 'name' } },
            { type: 'text', text: '</p>' },
          ],
        },
      ],
    });
    maily.setVariableValue('name', '<img src=x onerror=alert(1)>');
    const html = await maily.render();
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});

describe('links', () => {
  const doc = {
    type: 'doc',
    content: [
      {
        type: 'section',
        content: [
          {
            type: 'button',
            attrs: { text: 'Go', url: 'https://example.com/button' },
          },
        ],
      },
      {
        type: 'columns',
        content: [
          {
            type: 'column',
            content: [
              {
                type: 'image',
                attrs: {
                  src: 'https://example.com/a.png',
                  externalLink: 'https://example.com/image',
                },
              },
            ],
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'inlineImage',
            attrs: {
              src: 'https://example.com/i.png',
              externalLink: 'https://example.com/inline',
            },
          },
          {
            type: 'text',
            text: 'saved link',
            marks: [
              {
                type: 'link',
                attrs: {
                  href: 'https://example.com/text',
                  rel: 'noopener noreferrer nofollow',
                },
              },
            ],
          },
        ],
      },
      {
        type: 'linkCard',
        attrs: { title: 'Card', link: 'https://example.com/card' },
      },
    ],
  };

  it('finds every literal link at any depth', () => {
    expect([...new Maily(doc).getAllLinks()].sort()).toEqual([
      'https://example.com/button',
      'https://example.com/card',
      'https://example.com/image',
      'https://example.com/inline',
      'https://example.com/text',
    ]);
  });

  it('replaces image and inline image links with link values', async () => {
    const maily = new Maily(doc);
    maily.setLinkValues({
      'https://example.com/image': 'https://t.example/image',
      'https://example.com/inline': 'https://t.example/inline',
    });
    const html = await maily.render();
    expect(html).toContain('href="https://t.example/image"');
    expect(html).toContain('href="https://t.example/inline"');
  });

  it('uses the configured link attributes, without nofollow by default', async () => {
    const html = await render(doc);
    expect(html).not.toContain('nofollow');
    expect(html).toContain('rel="noopener noreferrer"');

    const custom = await render(doc, {
      linkAttributes: { target: '_self', rel: 'noopener' },
    });
    expect(custom).not.toContain('target="_blank"');
    expect(custom).toContain('target="_self"');
    expect(custom).not.toContain('noreferrer');
  });
});

describe('rendered defaults', () => {
  it('leaves unset alt text empty instead of English words', async () => {
    const html = await render({
      type: 'doc',
      content: [
        { type: 'image', attrs: { src: 'https://example.com/a.png' } },
        { type: 'logo', attrs: { src: 'https://example.com/l.png' } },
        {
          type: 'linkCard',
          attrs: {
            link: 'https://example.com',
            image: 'https://example.com/c.png',
          },
        },
      ],
    });
    expect(html).not.toMatch(/alt="(Image|Logo|Link Card)"/);
    expect(html).toContain('alt=""');
    expect(html).not.toMatch(/ title="/);
  });

  it('gives a host font no default web font', async () => {
    const html = await render(paragraphDoc, {
      theme: { font: { fontFamily: 'Georgia', fallbackFontFamily: 'serif' } },
    });
    expect(html).toContain("font-family:'Georgia', serif");
    expect(html).not.toContain('@font-face');
    expect(DEFAULT_FONT.webFont).toBeUndefined();

    // A later font replaces an earlier one rather than keeping its web font.
    const maily = new Maily(paragraphDoc);
    maily.setTheme({
      font: {
        fontFamily: 'Brand',
        fallbackFontFamily: 'sans-serif',
        webFont: { url: 'https://fonts.example/brand.woff2', format: 'woff2' },
      },
    });
    maily.setTheme({
      font: { fontFamily: 'Georgia', fallbackFontFamily: 'serif' },
    });
    expect(await maily.render()).not.toContain('brand.woff2');
  });

  it('loads a web font only when the host gives one', async () => {
    const html = await render(paragraphDoc, {
      theme: {
        font: {
          fontFamily: 'Brand',
          fallbackFontFamily: 'sans-serif',
          webFont: {
            url: 'https://fonts.example/brand.woff2',
            format: 'woff2',
          },
        },
      },
    });
    expect(html).toContain('https://fonts.example/brand.woff2');
  });

  it('omits the font rule for a null font', async () => {
    const html = await render(paragraphDoc, { theme: { font: null } });
    expect(html).not.toContain("font-family:'Arial'");
    expect(html).not.toContain('@font-face');
  });

  it('emits no granular @font-face without fontFaceUrl', async () => {
    const html = await render({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [
                {
                  type: 'textStyle',
                  attrs: {
                    fontFamily: 'Fraunces',
                    fontId: 'fraunces',
                    fontFallback: 'Georgia',
                    fontSubset: 'latin',
                    fontVersion: '5.2.8',
                    fontRegularWeight: 400,
                    fontBoldWeight: 700,
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    expect(html).toContain('font-family:&#x27;Fraunces&#x27;, Georgia');
    expect(html).not.toContain('@font-face');
  });

  it('replaces a default meta tag with the same name', async () => {
    const html = await render(paragraphDoc, {
      meta: [{ name: 'color-scheme', content: 'light dark' }],
      htmlProps: { lang: 'pl' },
    });
    expect(html.match(/name="color-scheme"/g)).toHaveLength(1);
    expect(html).toContain('content="light dark"');
    expect(html.match(/x-apple-disable-message-reformatting/g)).toHaveLength(1);
    expect(html).toContain('lang="pl"');
  });
});
