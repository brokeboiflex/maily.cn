<h1 align="center"><img height="150" src="../../assets/branding/maily-cn-avatar.png" alt="maily.cn avatar" /><br>maily.cn / @maily-to/core</h1>

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

The canonical editor source for [maily.cn](../../readme.md): a production-ready,
shadcn-installable fork of [maily.to](https://github.com/arikchakma/maily.to).
The workspace keeps the upstream `@maily-to/core` package name for package-build
compatibility, while the recommended distribution installs this source through the
fork's shadcn registry.

## Recommended installation: maily.cn source

Install the fork through shadcn by following the
[root maily.cn instructions](../../readme.md). That is the distribution path that
includes this repository's production hardening and copies the editor into the
consumer's codebase.

## Upstream-compatible package build

The commands below install the published `@maily-to/core` npm package. They are kept
for compatibility and workspace-package development; they do **not** install the
source-owned `maily.cn` registry block.

```bash
pnpm add @maily-to/core

# for types
pnpm add -D @tiptap/core
```

In either mode, the host supplies Tailwind v4 and shadcn theme tokens; the editor
ships no private stylesheet.

## Usage

```tsx
import { useState } from 'react';
import { Editor } from '@maily-to/core';
import type { Editor as TiptapEditor, JSONContent } from '@tiptap/core';

type AppProps = {
  contentJson: JSONContent;
};

function App(props: AppProps) {
  const { contentJson: defaultContentJson } = props;
  const [editor, setEditor] = useState<TiptapEditor>();

  return (
    <Editor
      contentJson={defaultContentJson}
      onCreate={setEditor}
      onUpdate={setEditor}
    />
  );
}
```

The package root intentionally exports the editor only. Optional mailbox
components live under `@maily-to/core/mailbox` so editor-only consumers do not
compile the mailbox entrypoint.

### Translating the editor

Every user-facing string in the editor (menus, tooltips, placeholders, and the
default block titles/descriptions) is overridable through a single `labels` prop.
The mechanism is framework-agnostic — you supply a plain object, no `next-intl` /
`react-i18next` dependency required.

`labels` must be a **complete** language: `MailyLabels` is `Record<LabelKey, string>`,
not a partial. Omit a key and TypeScript fails to compile, naming the missing key —
so you always know exactly what you must declare. Omit the whole prop and the editor
uses the shipped English defaults (`defaultLabels`) unchanged.

Registry consumers receive the host project's stock shadcn primitives for the
editor chrome, including Popover, DropdownMenu, Tabs, Toggle, ToggleGroup, Command,
InputGroup, Tooltip, Select, Separator, Kbd, and Badge. The local source versions
remain only as standalone package fallbacks.

Grouped formatting and alignment controls retain the host ToggleGroup's roving
keyboard focus. Compound Tooltip + Popover/Dropdown/Toggle controls keep each
primitive on a separate DOM element so their open/pressed state attributes do not
overwrite each other.

```tsx
import { Editor, defaultLabels, type MailyLabels } from '@maily-to/core';

// Copy defaultLabels, translate the values. Every key is required.
const frenchLabels: MailyLabels = {
  ...defaultLabels,
  'toolbar.bold': 'Gras',
  'toolbar.italic': 'Italique',
  'placeholder.heading': 'Titre {level}', // {level} is interpolated
  // …translate the rest
};

<Editor labels={frenchLabels} />; // full French
<Editor />; // English (defaultLabels)
```

- `defaultLabels` is **both** the runtime default **and** the authoring template — copy it, translate it, pass it back.
- `MailyLabels` is the type you annotate your object with to get the completeness check.
- Dynamic strings use `{token}` placeholders (e.g. `placeholder.heading` → `Heading {level}`); they are filled in by the editor at render time.
- `searchTerms` are **not** part of the dictionary (they are fuzzy-match keys, never displayed). Override them via the `blocks` prop if you need localized search keywords.

### Slash Commands

Slash commands let you interact with the editor by typing `/` followed by a command name. Commands are now organized into groups. Each group is an object with a `title` and a `commands` array. Every command within that array is a `BlockItem` that can either be a single command or a grouped command (with commands).

#### Basic Example

Suppose you have a couple of basic blocks, such as a text block or a heading block. You would organize them into a group like this:

```tsx
// omitting imports
import { text, heading1 } from '@maily-to/core/blocks';
import { createTranslator, defaultLabels } from '@maily-to/core';

// The built-in blocks are translator factories: call them with a translator so
// their title/description are localized. Use your own labels here if you have them.
const t = createTranslator(defaultLabels);

<Editor
  blocks={[
    {
      title: 'Basic Blocks',
      commands: [text(t), heading1(t)],
    },
  ]}
/>;
```

> **Note:** The order of the groups and the order of commands within each group determine how they are displayed in the editor.

> **Breaking change:** the block exports from `@maily-to/core/blocks` (`text`, `heading1`, `button`, …) and `PlaceholderExtension` from `@maily-to/core/extensions` are now **factory functions** that take a translator (`(t) => …`) instead of ready-made values. Call them with a translator (`createTranslator(defaultLabels)` for English) — or just write plain `BlockItem` objects inline, as the examples below do.

#### Grouped Command Blocks with Subcommands

Sometimes, you may want a single command to open a list of commands. For this, define a command with an `id` and a `commands` array. The `id` is used for the slash command query (for example, typing `/headers.` will show its subcommands).

```tsx
// omitting imports
<Editor
  blocks={[
    {
      title: 'Formatting',
      commands: [
        {
          title: 'Headers',
          // The id is used to filter commands; e.g. `/headers.` shows these subcommands.
          id: 'headers',
          searchTerms: ['header', 'title'],
          commands: [
            {
              title: 'Heading 1',
              searchTerms: ['h1', 'heading1'],
              command: ({ editor, range }) => {
                // Convert the current block to Heading 1.
              },
            },
            {
              title: 'Heading 2',
              searchTerms: ['h2', 'heading2'],
              command: ({ editor, range }) => {
                // Convert the current block to Heading 2.
              },
            },
            // Add more subcommands as needed.
          ],
        },
      ],
    },
  ]}
/>
```

In this setup, when the user types `/headers.`, the editor will display the available header subcommands.

> **Note:** Currently it only supports one level of depth for subcommands.

#### Custom Rendered Blocks

To render a custom block, you can pass a `render` function to the block object. The `render` function will receive the editor instance as an argument. You can return `null` if you don't want to render anything based on the editor's state.

```tsx
// omitting imports
<Editor
  blocks={[
    {
      title: 'Custom Blocks',
      commands: [
        {
          title: 'Custom Block',
          searchTerms: ['custom'],
          render: (editor) => {
            return <div>Custom Block</div>;
          },
        },
      ],
    },
  ]}
/>
```

### Variables

By default, variables are required. You can make them optional by setting the `required` property to `false`. When a variable is optional and not provided, a placeholder will be displayed in its place.

You can pass variables to the editor in two ways:

1. As an Array of Objects:

   For auto-suggestions of variables in the editor when you type `@`, pass the variables as an array of objects to the `variables` prop.

   ```tsx
   // (Omitted repeated imports)
   import {
     VariableExtension,
     getVariableSuggestions,
   } from '@maily-to/core/extensions';

   <Editor
     extensions={[
       VariableExtension.configure({
         suggestion: getVariableSuggestions('@'),
         variables: [
           {
             name: 'currentTime',
             required: false,
           },
         ],
       }),
     ]}
   />;
   ```

2. As a Function:

   If the variables are dynamic and need to be generated based on the editor's state or other inputs, you can provide a function to the `variables` prop.

   ```tsx
   // (Omitted repeated imports)
   import {
     VariableExtension,
     getVariableSuggestions,
   } from '@maily-to/core/extensions';

   <Editor
     extensions={[
       VariableExtension.configure({
         suggestion: getVariableSuggestions('@'),
         variables: ({ query, from, editor }) => {
           // magic goes here
           // query: the text after the trigger character
           // from: the context from where the variables are requested (repeat, variable)
           // editor: the editor instance
           if (from === 'repeat-variable') {
             // return variables for the Repeat block `each` key
             return [{ name: 'notifications' }, { name: 'comments' }];
           }

           return [
             { name: 'currentDate' },
             { name: 'currentTime', required: false },
             {
               name: 'first_name',
               required: false,
               // if you want to hide the default value
               // input in the popover
               hideDefaultValue: true,
             },
           ];
         },
       }),
     ]}
   />;
   ```

> Keep it in mind that if you pass an array of variable object Maily will take care of the filtering based on the query. But if you pass a function you have to take care of the filtering.

### Extensions

Extensions are a way to extend the editor's functionality. You can add custom blocks, marks, or extend the editor's functionality using extensions.

```tsx
// (Omitted repeated imports)
import {
  MailyKit,
  VariableExtension,
  getVariableSuggestions,
} from '@maily-to/core/extensions';

<Editor
  extensions={[
    MailyKit.configure({
      // do disable the link card node
      linkCard: false,
    }),
    // it will extend the variable extension
    // and provide suggestions for variables
    VariableExtension.extend({
      addNodeView() {
        // now you can replace the default
        // VariableView with your custom view
        return ReactNodeViewRenderer(VariableView, {
          className: 'relative inline-block',
          as: 'div',
        });
      },
    }).configure({
      suggestion: getVariableSuggestions(variableTriggerCharacter),
    }),
  ]}
/>;
```

Or, you can add your own custom extensions, like shown below:

```tsx
// (Omitted repeated imports)
import { CustomExtension } from './extensions/custom-extension';

<Editor
  extensions={[
    CustomExtension.configure({
      // your configuration
    }),
  ]}
/>;
```

### Image Upload

To enable image upload, you need to pass the `ImageUploadExtension` extension to the editor. The `onImageUpload` function will be called when an image is being uploaded. You can use this function to upload the image to your server and return the URL.

```tsx
// (Omitted repeated imports)
import { ImageUploadExtension } from '@maily-to/core/extensions';

<Editor
  extensions={[
    ImageUploadExtension.configure({
      onImageUpload: async (file) => {
        // upload the image to wherever you want
        const url = await uploadImage(file);
        return url;
      },
    }),
  ]}
/>;
```

See the [@maily-to/render](../render) package for more information on how to render the editor content to HTML.

<br/>

## Sponsors

If the fork saves you time or helps a paid product ship, I will very happily accept
[GitHub sponsorships](https://github.com/sponsors/brokeboiflex) xD. You can support
the original Maily project separately through
[Arik Chakma's sponsorship page](https://github.com/sponsors/arikchakma).

<br/>

## License

MIT. Original Maily copyright &copy; [Arik Chakma](https://github.com/arikchakma)
and contributors; maily.cn modifications are maintained by
[brokeboiflex](https://github.com/brokeboiflex).
