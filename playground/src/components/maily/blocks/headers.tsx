import { LogoWithCoverImageIcon } from '../editor/components/icons/logo-with-cover-image';
import { BlockItem } from './types';
import type { TranslateFn } from '../editor/i18n';
import { LogoWithTextHorizonIcon } from '../editor/components/icons/logo-with-text-horizon';
import { LogoWithTextVerticalIcon } from '../editor/components/icons/logo-with-text-vertical';

export const headerLogoWithTextHorizontal = (t: TranslateFn): BlockItem => ({
  title: t('block.headerLogoWithTextHorizontal.title'),
  description: t('block.headerLogoWithTextHorizontal.description'),
  searchTerms: ['logo', 'text'],
  icon: <LogoWithTextHorizonIcon className="h-4 w-4" />,
  command: ({ editor, range }) => {
    editor
      .chain()
      .deleteRange(range)
      .insertContent({
        type: 'columns',
        attrs: { showIfKey: null, gap: 8 },
        content: [
          {
            type: 'column',
            attrs: {
              columnId: '36de3eda-0677-47c3-a8b7-e071dec9ce30',
              width: 'auto',
              verticalAlign: 'middle',
            },
            content: [
              {
                type: 'image',
                attrs: {
                  src: 'https://maily.to/brand/logo.png',
                  alt: null,
                  title: null,
                  width: '32',
                  height: '32',
                  alignment: 'left',
                  externalLink: null,
                  isExternalLinkVariable: false,
                  isSrcVariable: false,
                  showIfKey: null,
                },
              },
            ],
          },
          {
            type: 'column',
            attrs: {
              columnId: '6feb593e-374a-4479-a1c7-872c60c2f4e0',
              width: 'auto',
              verticalAlign: 'bottom',
            },
            content: [
              {
                type: 'heading',
                attrs: {
                  textAlign: 'right',
                  level: 3,
                  showIfKey: null,
                },
                content: [
                  {
                    type: 'text',
                    marks: [{ type: 'bold' }],
                    text: 'Weekly Newsletter',
                  },
                ],
              },
            ],
          },
        ],
      })
      .run();
  },
});

export const headerLogoWithTextVertical = (t: TranslateFn): BlockItem => ({
  title: t('block.headerLogoWithTextVertical.title'),
  description: t('block.headerLogoWithTextVertical.description'),
  searchTerms: ['logo', 'text'],
  icon: <LogoWithTextVerticalIcon className="h-4 w-4" />,
  command: ({ editor, range }) => {
    editor
      .chain()
      .deleteRange(range)
      .insertContent([
        {
          type: 'image',
          attrs: {
            src: 'https://maily.to/brand/logo.png',
            alt: null,
            title: null,
            width: '48',
            height: '48',
            alignment: 'center',
            externalLink: null,
            isExternalLinkVariable: false,
            isSrcVariable: false,
            showIfKey: null,
          },
        },
        { type: 'spacer', attrs: { height: 8, showIfKey: null } },
        {
          type: 'heading',
          attrs: { textAlign: 'center', level: 2, showIfKey: null },
          content: [{ type: 'text', text: 'Maily' }],
        },
      ])
      .run();
  },
});

export const headerLogoWithCoverImage = (t: TranslateFn): BlockItem => ({
  title: t('block.headerLogoWithCoverImage.title'),
  description: t('block.headerLogoWithCoverImage.description'),
  searchTerms: ['logo', 'cover', 'image'],
  icon: <LogoWithCoverImageIcon className="h-4 w-4" />,
  command: ({ editor, range }) => {
    const todayFormatted = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    editor
      .chain()
      .deleteRange(range)
      .insertContent([
        {
          type: 'image',
          attrs: {
            src: 'https://maily.to/og-image.png',
            alt: null,
            title: null,
            width: 600,
            height: 314,
            alignment: 'center',
            externalLink: null,
            isExternalLinkVariable: false,
            isSrcVariable: false,
            showIfKey: null,
          },
        },
        {
          type: 'columns',
          attrs: { showIfKey: null, gap: 8 },
          content: [
            {
              type: 'column',
              attrs: {
                columnId: '36de3eda-0677-47c3-a8b7-e071dec9ce30',
                width: 'auto',
                verticalAlign: 'middle',
              },
              content: [
                {
                  type: 'image',
                  attrs: {
                    src: 'https://maily.to/brand/logo.png',
                    alt: null,
                    title: null,
                    width: '48',
                    height: '48',
                    alignment: 'left',
                    externalLink: null,
                    isExternalLinkVariable: false,
                    isSrcVariable: false,
                    showIfKey: null,
                  },
                },
              ],
            },
            {
              type: 'column',
              attrs: {
                columnId: '6feb593e-374a-4479-a1c7-872c60c2f4e0',
                width: 'auto',
                verticalAlign: 'middle',
              },
              content: [
                {
                  type: 'paragraph',
                  attrs: { textAlign: 'right', showIfKey: null },
                  content: [
                    {
                      type: 'text',
                      marks: [{ type: 'bold' }],
                      text: 'Weekly Newsletter',
                    },
                    { type: 'hardBreak' },
                    {
                      type: 'text',
                      marks: [
                        { type: 'textStyle', attrs: { color: '#929292' } },
                      ],
                      text: todayFormatted,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ])
      .run();
  },
});
