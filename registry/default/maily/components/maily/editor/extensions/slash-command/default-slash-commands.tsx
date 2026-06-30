import { IconPlaceholder } from "@/components/icon-placeholder"
import { button, linkCard } from '../../../blocks/button';
import { htmlCodeBlock } from '../../../blocks/code';
import { image, inlineImage, logo } from '../../../blocks/image';
import { columns, divider, repeat, section, spacer } from '../../../blocks/layout';
import { bulletList, orderedList } from '../../../blocks/list';
import { BlockGroupItem } from '../../../blocks/types';
import {
  blockquote,
  clearLine,
  footer,
  hardBreak,
  heading1,
  heading2,
  heading3,
  text,
} from '../../../blocks/typography';
import {
  headerLogoWithCoverImage,
  headerLogoWithTextHorizontal,
  headerLogoWithTextVertical,
} from '../../../blocks/headers';
import {
  footerCopyrightText,
  footerCommunityFeedbackCta,
  footerCompanySignature,
} from '../../../blocks/footers';
import type { TranslateFn } from '../../i18n';

export function getDefaultBlocks(t: TranslateFn): BlockGroupItem[] {
  return [
    {
      title: t('slashCommand.group.blocks'),
      commands: [
        text(t),
        heading1(t),
        heading2(t),
        heading3(t),
        bulletList(t),
        orderedList(t),
        image(t),
        logo(t),
        inlineImage(t),
        columns(t),
        section(t),
        repeat(t),
        divider(t),
        spacer(t),
        button(t),
        linkCard(t),
        hardBreak(t),
        blockquote(t),
        footer(t),
        clearLine(t),
      ],
    },
    {
      title: t('slashCommand.group.components'),
      commands: [
        {
          id: 'headers',
          title: t('block.headers.title'),
          description: t('block.headers.description'),
          searchTerms: ['header', 'headers'],
          icon: <IconPlaceholder
  lucide="Heading1"
  tabler="IconH1"
  hugeicons="Heading01Icon"
  phosphor="TextHOne"
  remixicon="RiHeading"
  className="h-4 w-4"
/>,
          commands: [
            headerLogoWithTextVertical(t),
            headerLogoWithTextHorizontal(t),
            headerLogoWithCoverImage(t),
          ],
        },
        {
          id: 'footers',
          title: t('block.footers.title'),
          description: t('block.footers.description'),
          searchTerms: ['footers'],
          icon: <IconPlaceholder
  lucide="FootprintsIcon"
  tabler="IconWalk"
  hugeicons="FootprintsIcon"
  phosphor="Footprints"
  remixicon="RiFootprintLine"
  className="h-4 w-4"
/>,
          commands: [
            footerCopyrightText(t),
            footerCommunityFeedbackCta(t),
            footerCompanySignature(t),
          ],
        },
        htmlCodeBlock(t),
      ],
    },
  ];
}
