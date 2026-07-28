import { type AnyExtension, Extension } from '@tiptap/core';

import StarterKit from '@tiptap/starter-kit';
import ListItem from '@tiptap/extension-list-item';
import Paragraph from '@tiptap/extension-paragraph';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Heading from '@tiptap/extension-heading';
import Underline from '@tiptap/extension-underline';
import Document from '@tiptap/extension-document';
import Focus from '@tiptap/extension-focus';
import Dropcursor from '@tiptap/extension-dropcursor';

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

export type MailyKitOptions = {
  linkCard?: Partial<LinkCardOptions> | false;
  repeat?: Partial<{}> | false;
  section?: Partial<{}> | false;
  columns?: Partial<{}> | false;
  column?: Partial<{}> | false;
  button?: Partial<{}> | false;
  spacer?: Partial<{}> | false;
  logo?: Partial<{}> | false;
  image?: Partial<{}> | false;
  link?: Partial<LinkOptions> | false;
};

export const MailyKit = Extension.create<MailyKitOptions>({
  name: 'maily-kit',

  addOptions() {
    return {
      link: {
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
          class: 'no-underline',
        },
        openOnClick: false,
      },
    };
  },

  addExtensions() {
    const extensions: AnyExtension[] = [
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
      extensions.push(RepeatExtension);
    }

    if (this.options.section !== false) {
      extensions.push(SectionExtension);
    }

    if (this.options.columns !== false) {
      extensions.push(ColumnsExtension);
    }

    if (this.options.column !== false) {
      extensions.push(ColumnExtension);
    }

    if (this.options.button !== false) {
      extensions.push(ButtonExtension);
    }

    if (this.options.spacer !== false) {
      extensions.push(Spacer);
    }

    if (this.options.logo !== false) {
      extensions.push(LogoExtension);
    }

    if (this.options.image !== false) {
      extensions.push(ImageExtension);
    }

    if (this.options.link !== false) {
      extensions.push(LinkExtension.configure(this.options.link));
    }

    return extensions;
  },
});
