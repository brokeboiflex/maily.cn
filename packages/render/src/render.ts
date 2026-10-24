import type { JSONContent } from '@tiptap/core';
import type { HtmlProps } from 'react-email';
import { Maily } from './maily';
import type { MailyConfig, RenderOptions } from './maily';
import type { MetaDescriptors } from './meta';

export type RenderConfig = MailyConfig &
  RenderOptions & {
    /** Meta tags; a tag with the same name replaces the default one. */
    meta?: MetaDescriptors;
    /** Attributes of the `<html>` element, merged over the defaults. */
    htmlProps?: HtmlProps;
  };

export async function render(
  content: JSONContent,
  config?: RenderConfig
): Promise<string> {
  const {
    theme,
    preview,
    fontFaceUrl,
    linkAttributes,
    meta,
    htmlProps,
    ...rest
  } = config || {};

  const maily = new Maily(content);
  maily.setPreviewText(preview);
  maily.setTheme(theme || {});
  maily.setFontFaceUrl(fontFaceUrl);
  maily.setLinkAttributes(linkAttributes);
  if (meta) maily.setMetaTags(meta);
  if (htmlProps) maily.setHtmlProps(htmlProps);

  return maily.render(rest);
}
