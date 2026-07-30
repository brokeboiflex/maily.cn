<div align="center"><img height="150" src="../../assets/branding/maily-cn-avatar.png" alt="maily.cn avatar" /></div>
<br>

<div align="center"><strong>maily.cn / @maily-to/render</strong></div>
<div align="center">Transform Maily editor content into email-safe HTML.</div>
<br />

<p align="center">
  <a href="https://github.com/brokeboiflex/maily.cn/blob/main/license">
    <img src="https://img.shields.io/badge/License-MIT-222222.svg" />
  </a>
  <a href="https://github.com/brokeboiflex/maily.cn">
    <img src="https://img.shields.io/badge/Repository-maily.cn-222222.svg" alt="maily.cn repository" />
  </a>
  <a href="https://github.com/sponsors/brokeboiflex">
    <img src="https://img.shields.io/badge/Sponsor-brokeboiflex-EA4AAA.svg?logo=githubsponsors&logoColor=white" alt="Sponsor brokeboiflex" />
  </a>
</p>

<br>

This workspace package is the renderer source used by the
[maily.cn shadcn block](../../readme.md). Its technical package name remains
`@maily-to/render` for compatibility with the upstream package graph.

## Recommended installation: maily.cn source

Install `@maily/maily-render` through shadcn using the
[root maily.cn instructions](../../README.md). The granular item copies only the
renderer source and its runtime dependencies to `lib/maily-render/**`; install
`@maily/maily-editor` separately when the application also needs the editor.

## Upstream-compatible package build

The command below installs the published `@maily-to/render` npm package. It is kept
for compatibility and package development; it does **not** install the source-owned
`maily.cn` registry block.

```sh
pnpm add @maily-to/render
```

<br>

## Getting started

Convert React components into a HTML string.

```ts
import { render } from '@maily-to/render';

const html = await render({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Hello World!',
        },
      ],
    },
  ],
});
```

### Variables

You can replace variables in the content.

```ts
import { Maily } from '@maily-to/render';

const maily = new Maily({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      attrs: { textAlign: 'left' },
      content: [
        {
          type: 'variable',
          attrs: {
            id: 'currentDate',
            fallback: 'now',
            showIfKey: null,
          },
        },
      ],
    },
  ],
});

maily.setVariableValue('currentDate', new Date().toISOString());
const html = await maily.render();
```

### Payloads

Payload values are used for the `Repeat` and `Show If` blocks.

```ts
// (Omitted repeated imports)

const maily = new Maily({
  type: 'doc',
  content: [
    {
      type: 'repeat',
      attrs: { each: 'items', showIfKey: null },
      content: [
        {
          type: 'paragraph',
          attrs: { textAlign: 'left' },
          content: [{ type: 'text', text: 'Hello' }],
        },
      ],
    },
  ],
});

maily.setPayloadValue('items', ['Alice', 'Bob', 'Charlie']);
const html = await maily.render();
```

## Contributions

Feel free to submit pull requests, create issues, or spread the word through the
[maily.cn repository](https://github.com/brokeboiflex/maily.cn).

## Sponsors

If this renderer helps you ship, sponsorships are very welcome through
[GitHub Sponsors](https://github.com/sponsors/brokeboiflex).

## License

MIT. Original Maily copyright &copy; [Arik Chakma](https://github.com/arikchakma)
and contributors; maily.cn modifications are maintained by
[brokeboiflex](https://github.com/brokeboiflex).
