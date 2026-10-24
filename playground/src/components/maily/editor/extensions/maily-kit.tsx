import { type AnyExtension, Extension } from '@tiptap/core';

import { StarterKit } from '@tiptap/starter-kit';
import { ListItem } from '@tiptap/extension-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Heading } from '@tiptap/extension-heading';
import { Underline } from '@tiptap/extension-underline';
import { Document } from '@tiptap/extension-document';
import { Dropcursor, Focus } from '@tiptap/extensions';

import { Color } from './color';
import { FontFamilyExtension } from './font-family';
import { FontSizeExtension } from './font-size';
import { HorizontalRule } from './horizontal-rule';
import { Footer } from '../nodes/footer';
import { Spacer } from '../nodes/spacer';
import { LinkCardExtension, type LinkCardOptions } from './link-card';
import { ColumnsExtension } from '../nodes/columns/columns';
import { ColumnExtension } from '../nodes/columns/column';
import { SectionExtension } from '../nodes/section/section';
import { ButtonExtension } from '../nodes/button/button';
import { LogoExtension } from '../nodes/logo/logo';
import { ImageExtension } from '../nodes/image/image';
import { LinkExtension } from '../nodes/link';
import { type LinkOptions } from '@tiptap/extension-link';
import { HeadingExtension } from '../nodes/heading/heading';
import { ParagraphExtension } from '../nodes/paragraph/paragraph';
import { RepeatExtension } from '../nodes/repeat/repeat';
import { AttributeCommands } from './attribute-commands';

export type MailyKitOptions = {
  linkCard?: Partial<LinkCardOptions> | false;
  repeat?: Partial<(typeof RepeatExtension)['options']> | false;
  section?: Partial<(typeof SectionExtension)['options']> | false;
  columns?: Partial<(typeof ColumnsExtension)['options']> | false;
  column?: Partial<(typeof ColumnExtension)['options']> | false;
  button?: Partial<(typeof ButtonExtension)['options']> | false;
  spacer?: Partial<(typeof Spacer)['options']> | false;
  logo?: Partial<(typeof LogoExtension)['options']> | false;
  image?: Partial<(typeof ImageExtension)['options']> | false;
  link?: Partial<LinkOptions> | false;
};

export const MailyKit = Extension.create<MailyKitOptions>({
  name: 'maily-kit',

  addOptions() {
    return {
      link: {
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'no-underline',
        },
        openOnClick: false,
      },
    };
  },

  addExtensions() {
    const extensions: AnyExtension[] = [
      AttributeCommands,
      Document.extend({
        content: '(block|columns)+',
      }),
      StarterKit.configure({
        code: {
          HTMLAttributes: {
            class:
              'px-1 relative py-0.5 bg-muted text-sm rounded-md tracking-normal font-normal',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'not-prose border-l-4 border-border pl-4 mt-4 mb-4 relative',
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: 'relative',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'relative',
          },
        },
        heading: false,
        paragraph: false,
        horizontalRule: false,
        dropcursor: false,
        document: false,
        link: false,
        underline: false,
      }) as AnyExtension,
      Underline,
      Color.configure({ types: [TextStyle.name, ListItem.name] }),
      TextStyle.configure(),
      FontFamilyExtension,
      FontSizeExtension,
      TextAlign.configure({
        types: [Paragraph.name, Heading.name, Footer.name],
      }),
      HorizontalRule,
      Footer,
      Focus,
      Dropcursor.configure({
        color: 'var(--foreground)',
        width: 3,
        class: 'ProseMirror-dropcursor',
      }),
      HeadingExtension.configure({
        levels: [1, 2, 3],
        HTMLAttributes: {
          class: 'relative',
        },
      }),
      ParagraphExtension.configure({
        HTMLAttributes: {
          class: 'relative',
        },
      }),
    ];

    if (this.options.linkCard !== false) {
      extensions.push(LinkCardExtension.configure(this.options.linkCard));
    }

    if (this.options.repeat !== false) {
      extensions.push(RepeatExtension.configure(this.options.repeat));
    }

    if (this.options.section !== false) {
      extensions.push(SectionExtension.configure(this.options.section));
    }

    if (this.options.columns !== false) {
      extensions.push(ColumnsExtension.configure(this.options.columns));
    }

    if (this.options.column !== false) {
      extensions.push(ColumnExtension.configure(this.options.column));
    }

    if (this.options.button !== false) {
      extensions.push(ButtonExtension.configure(this.options.button));
    }

    if (this.options.spacer !== false) {
      extensions.push(Spacer.configure(this.options.spacer));
    }

    if (this.options.logo !== false) {
      extensions.push(LogoExtension.configure(this.options.logo));
    }

    if (this.options.image !== false) {
      extensions.push(ImageExtension.configure(this.options.image));
    }

    if (this.options.link !== false) {
      extensions.push(LinkExtension.configure(this.options.link));
    }

    return extensions;
  },
});
