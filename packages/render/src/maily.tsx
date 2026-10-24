import type { JSX } from 'react';
import { Fragment, type CSSProperties } from 'react';
import {
  Text,
  Html,
  Head,
  Body,
  Font,
  Container,
  Link,
  Heading,
  Hr,
  Button,
  Img,
  Preview,
  Row,
  Column,
  Section,
  render as reactEmailRender,
  type HtmlProps,
} from 'react-email';
import type { JSONContent } from '@tiptap/core';
import { deepMerge } from '@antfu/utils';
import { generateKey } from './utils';
import type { MetaDescriptors } from './meta';
import { meta } from './meta';
import { parse } from 'node-html-parser';
import juice from 'juice';
import type {
  FontProps,
  RendererThemeOptions as ThemeOptions,
} from '@maily-to/shared';
import {
  DEFAULT_RENDERER_THEME as DEFAULT_THEME,
  DEFAULT_FONT,
  DEFAULT_LINK_TEXT_COLOR,
} from '@maily-to/shared';
import { Preheader } from './preheader';
import { emailFontStack, fontFaceStyles, type FontFaceUrl } from './fontsource';

interface NodeOptions {
  parent?: JSONContent;
  prev?: JSONContent;
  next?: JSONContent;

  // Repeated items may be primitives, which then stand for themselves.
  payloadValue?: unknown;
}

export type MarkType = NonNullable<JSONContent['marks']>[number];

const antialiased: CSSProperties = {
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
};

type AllowedHeadings = 'h1' | 'h2' | 'h3';

const headings: Record<AllowedHeadings, CSSProperties> = {
  h1: {
    fontSize: '36px',
    lineHeight: '40px',
    fontWeight: 800,
  },
  h2: {
    fontSize: '30px',
    lineHeight: '36px',
    fontWeight: 700,
  },
  h3: {
    fontSize: '24px',
    lineHeight: '38px',
    fontWeight: 600,
  },
};

// Spacer heights are pixels. Documents from older editors stored named sizes
// from the editor's spacing scale (core `editor/utils/spacing.ts`).
const LEGACY_SPACER_HEIGHTS = new Map([
  ['xs', 4],
  ['sm', 8],
  ['md', 16],
  ['lg', 32],
  ['xl', 64],
]);
const DEFAULT_SPACER_HEIGHT = 8;

function spacerHeight(value: unknown): number {
  if (typeof value === 'number')
    return Number.isFinite(value) && value >= 0 ? value : DEFAULT_SPACER_HEIGHT;
  if (typeof value !== 'string' || !value.trim()) return DEFAULT_SPACER_HEIGHT;
  const named = LEGACY_SPACER_HEIGHTS.get(value);
  if (named !== undefined) return named;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : DEFAULT_SPACER_HEIGHT;
}
type AllowedLogoSizes = 'sm' | 'md' | 'lg';

const logoSizes: Record<AllowedLogoSizes, string> = {
  sm: '40px',
  md: '48px',
  lg: '64px',
};

/** Attributes of every link the email renders. */
export type LinkAttributes = {
  target?: string;
  rel?: string;
};

export const DEFAULT_LINK_ATTRIBUTES: LinkAttributes = {
  target: '_blank',
  rel: 'noopener noreferrer',
};

export interface MailyConfig {
  /**
   * The preview text is the snippet of text that is pulled into the inbox
   * preview of an email client, usually right after the subject line.
   *
   * Default: `undefined`
   */
  preview?: string | JSONContent;
  /**
   * Where the email loads granular fonts chosen in the editor. Without it,
   * those fonts render with their fallback stacks only. Pass
   * `fontsourceFontFaceUrl` to load Fontsource files from jsDelivr.
   */
  fontFaceUrl?: FontFaceUrl;
  /**
   * `target` and `rel` of every link. Default: `DEFAULT_LINK_ATTRIBUTES`.
   */
  linkAttributes?: LinkAttributes;
  /**
   * The theme object allows you to customize the colors and font sizes of the
   * rendered email.
   *
   * Default:
   * ```js
   * {
   *   colors: {
   *     heading: '#111827',
   *     paragraph: '#374151',
   *     horizontal: '#EAEAEA',
   *     footer: '#64748B',
   *   },
   *   fontSize: {
   *     paragraph: '15px',
   *     footer: {
   *       size: '14px',
   *       lineHeight: '24px',
   *     },
   *   },
   * }
   * ```
   *
   * @example
   * ```js
   * const maily = new Maily(content, {
   *   theme: {
   *     colors: {
   *       heading: '#111827',
   *     },
   *     fontSize: {
   *       footer: {
   *         size: '14px',
   *         lineHeight: '24px',
   *       },
   *     },
   *   },
   * });
   * ```
   */
  theme?: Partial<ThemeOptions>;
}

const CODE_FONT_FAMILY =
  'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
export const DEFAULT_SECTION_BACKGROUND_COLOR = 'transparent';
export const DEFAULT_SECTION_ALIGN = 'left';
export const DEFAULT_SECTION_BORDER_WIDTH = 2;
export const DEFAULT_SECTION_BORDER_COLOR = '#e2e2e2';

export const DEFAULT_SECTION_MARGIN_TOP = 0;
export const DEFAULT_SECTION_MARGIN_RIGHT = 0;
export const DEFAULT_SECTION_MARGIN_BOTTOM = 0;
export const DEFAULT_SECTION_MARGIN_LEFT = 0;

export const DEFAULT_SECTION_PADDING_TOP = 0;
export const DEFAULT_SECTION_PADDING_RIGHT = 0;
export const DEFAULT_SECTION_PADDING_BOTTOM = 0;
export const DEFAULT_SECTION_PADDING_LEFT = 0;

export const DEFAULT_COLUMNS_WIDTH = '100%';
export const DEFAULT_COLUMNS_GAP = 8;

export const DEFAULT_COLUMN_BACKGROUND_COLOR = 'transparent';
export const DEFAULT_COLUMN_BORDER_RADIUS = 0;
export const DEFAULT_COLUMN_BORDER_WIDTH = 0;
export const DEFAULT_COLUMN_BORDER_COLOR = 'transparent';

export const DEFAULT_COLUMN_PADDING_TOP = 0;
export const DEFAULT_COLUMN_PADDING_RIGHT = 0;
export const DEFAULT_COLUMN_PADDING_BOTTOM = 0;
export const DEFAULT_COLUMN_PADDING_LEFT = 0;

export const DEFAULT_INLINE_IMAGE_HEIGHT = 20;
export const DEFAULT_INLINE_IMAGE_WIDTH = 20;

export const LINK_PROTOCOL_REGEX = /https?:\/\//;

export const DEFAULT_META_TAGS: MetaDescriptors = [
  {
    name: 'viewport',
    content: 'width=device-width',
  },
  {
    httpEquiv: 'X-UA-Compatible',
    content: 'IE=edge',
  },
  {
    // http://www.html-5.com/metatags/format-detection-meta-tag.html
    // It will prevent iOS from automatically detecting possible phone numbers in a block of text
    name: 'format-detection',
    content: 'telephone=no,address=no,email=no,date=no,url=no',
  },
  {
    name: 'color-scheme',
    content: 'light',
  },
  {
    name: 'supported-color-schemes',
    content: 'light',
  },
];

export const DEFAULT_HTML_PROPS: HtmlProps = {
  lang: 'en',
  dir: 'ltr',
};

const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  pretty: false,
  plainText: false,
};

export interface RenderOptions {
  /**
   * The options object allows you to customize the output of the rendered
   * email.
   * - `pretty` - If `true`, the output will be formatted with indentation and
   *  line breaks.
   * - `plainText` - If `true`, the output will be plain text instead of HTML.
   * This is useful for testing purposes.
   *
   * Default: `pretty` - `false`, `plainText` - `false`
   */
  pretty?: boolean;
  plainText?: boolean;
}

export type VariableFormatter = (options: {
  variable: string;
  fallback?: string;
}) => string;
export type VariableValues = Map<string, string>;
export type LinkValues = Map<string, string>;

/** Caller data addressed by variables, `repeat` blocks and `showIfKey`. */
export type PayloadValue = object | boolean;
export type PayloadValues = Map<string, PayloadValue>;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Themes merge into a copy: neither the shared defaults nor the caller's theme
// is mutated. A font replaces the current one as a whole (or `null` removes
// it), so a host font never inherits the default's web font.
function mergeTheme(
  base: ThemeOptions,
  theme: Partial<ThemeOptions>
): ThemeOptions {
  const { font, ...rest } = theme;
  const merged = deepMerge(structuredClone(base), rest) as ThemeOptions;
  if ('font' in theme) merged.font = font ? { ...font } : font;
  return merged;
}

// Meta tags with the same identity replace each other.
function metaKey(tag: MetaDescriptors[number]): string | null {
  for (const key of ['name', 'httpEquiv', 'property', 'charSet', 'title'])
    if (key in tag)
      return `${key}:${String((tag as Record<string, unknown>)[key]).toLowerCase()}`;
  return null;
}

// Repeat items may be objects, primitives, `null` or `undefined`. A null item
// has no fields, so it renders with an empty item scope like `undefined`.
function isPayloadRecord(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === 'object' && payload !== null;
}

// An image renders only a usable source: a non-blank string, a number or a
// URL (payload variables may hold any of these). Anything else, such as an
// unset source, a boolean or a plain object, renders no image.
function imageSource(src: unknown): string | null {
  const value =
    typeof src === 'string'
      ? src
      : typeof src === 'number' || src instanceof URL
        ? String(src)
        : '';
  return value.trim() ? value : null;
}

// A variable reads a key of an object payload; any other payload is the value.
function payloadVariable(payload: unknown, key: string): unknown {
  return isPayloadRecord(payload) ? payload[key] : payload;
}

// `repeat` and `showIfKey` read a key of an object payload, else of `{}`.
function payloadField(payload: unknown, key: string): unknown {
  const scope: Record<string, unknown> = isPayloadRecord(payload)
    ? payload
    : {};
  return scope[key];
}

export class Maily {
  readonly preheader = new Preheader(this);

  private readonly content: JSONContent;
  private config: MailyConfig = {
    theme: DEFAULT_THEME,
  };

  private variableFormatter: VariableFormatter = ({ variable, fallback }) => {
    return fallback
      ? `{{${variable},fallback=${fallback}}}`
      : `{{${variable}}}`;
  };

  private shouldReplaceVariableValues = false;
  private variableValues: VariableValues = new Map();
  private linkValues: LinkValues = new Map();
  private openTrackingPixel: string | undefined;
  private payloadValues: PayloadValues = new Map();
  private marksOrder = ['underline', 'bold', 'italic', 'textStyle', 'link'];
  private meta: MetaDescriptors = DEFAULT_META_TAGS.map((tag) => ({ ...tag }));
  private htmlProps: HtmlProps = { ...DEFAULT_HTML_PROPS };

  private get linkAttributes(): LinkAttributes {
    return this.config.linkAttributes ?? DEFAULT_LINK_ATTRIBUTES;
  }

  constructor(content: JSONContent = { type: 'doc', content: [] }) {
    this.content = content;
  }

  setPreviewText(preview?: string | JSONContent) {
    this.config.preview = preview;
  }

  setTheme(theme: Partial<ThemeOptions>) {
    this.config.theme = mergeTheme(this.config.theme || DEFAULT_THEME, theme);
  }

  /** See `MailyConfig.fontFaceUrl`. */
  setFontFaceUrl(fontFaceUrl?: FontFaceUrl) {
    this.config.fontFaceUrl = fontFaceUrl;
  }

  /** See `MailyConfig.linkAttributes`. */
  setLinkAttributes(attributes?: LinkAttributes) {
    this.config.linkAttributes = attributes && { ...attributes };
  }

  setVariableFormatter(formatter: VariableFormatter) {
    this.variableFormatter = formatter;
  }

  /**
   * `setVariableValue` will set the variable value.
   * It will also set `shouldReplaceVariableValues` to `true`.
   *
   * @param variable - The variable name
   * @param value - The variable value
   */
  setVariableValue(variable: string, value: string) {
    if (!this.shouldReplaceVariableValues) {
      this.shouldReplaceVariableValues = true;
    }

    this.variableValues.set(variable, value);
  }

  /**
   * `setVariableValues` will set the variable values.
   * It will also set `shouldReplaceVariableValues` to `true`.
   *
   * @param values - The variable values
   *
   * @example
   * ```js
   * const maily = new Maily(content);
   * maily.setVariableValues({
   *  name: 'John Doe',
   *  email: 'john@doe.com',
   * });
   * ```
   */
  setVariableValues(values: Record<string, string>) {
    if (!this.shouldReplaceVariableValues) {
      this.shouldReplaceVariableValues = true;
    }

    Object.entries(values).forEach(([variable, value]) => {
      this.setVariableValue(variable, value);
    });
  }

  setLinkValue(link: string, value: string) {
    this.linkValues.set(link, value);
  }

  setLinkValues(values: Record<string, string>) {
    Object.entries(values).forEach(([link, value]) => {
      this.setLinkValue(link, value);
    });
  }

  setPayloadValue(key: string, value: PayloadValue) {
    if (!this.shouldReplaceVariableValues) {
      this.shouldReplaceVariableValues = true;
    }

    this.payloadValues.set(key, value);
  }

  setPayloadValues(values: Record<string, PayloadValue>) {
    Object.entries(values).forEach(([key, value]) => {
      this.setPayloadValue(key, value);
    });
  }

  /**
   * `setOpenTrackingPixel` will set the open tracking pixel.
   *
   * @param pixel - The open tracking pixel
   */
  setOpenTrackingPixel(pixel?: string) {
    this.openTrackingPixel = pixel;
  }

  /**
   * `setShouldReplaceVariableValues` will determine whether to replace the
   * variable values or not. Otherwise, it will just return the formatted variable.
   *
   * Default: `false`
   */
  setShouldReplaceVariableValues(shouldReplace: boolean) {
    this.shouldReplaceVariableValues = shouldReplace;
  }

  /**
   * `setMetaTags` adds meta tags. A tag with the same `name`, `httpEquiv`,
   * `property`, `charSet` or `title` as an existing one replaces it.
   *
   * @param meta - The meta tags
   */
  setMetaTags(meta: MetaDescriptors) {
    for (const tag of meta) {
      const key = metaKey(tag);
      const fingerprint = JSON.stringify(
        Object.keys(tag)
          .sort()
          .map((name) => [name, tag[name as keyof typeof tag]])
      );
      const index = this.meta.findIndex((existing) =>
        key
          ? metaKey(existing) === key
          : JSON.stringify(
              Object.keys(existing)
                .sort()
                .map((name) => [name, existing[name as keyof typeof existing]])
            ) === fingerprint
      );
      if (index >= 0) this.meta[index] = { ...tag };
      else this.meta.push({ ...tag });
    }
  }

  /**
   * `setHtmlProps` will set the HTML props.
   *
   * @param props - The HTML props
   */
  setHtmlProps(props: HtmlProps) {
    this.htmlProps = {
      ...this.htmlProps,
      ...props,
    };
  }

  /**
   * Every literal link in the document: link marks, buttons, image and inline
   * image links and link cards, at any depth. Variable links are skipped.
   */
  getAllLinks() {
    const links = new Set<string>();

    const add = (href: unknown) => {
      if (
        typeof href === 'string' &&
        href &&
        this.isValidUrl(href) &&
        !href.startsWith('#') &&
        !href.startsWith('mailto:') &&
        !href.startsWith('tel:')
      )
        links.add(href);
    };

    const visit = (node: JSONContent) => {
      const attrs = node.attrs ?? {};
      if (node.type === 'button' && !attrs.isUrlVariable) add(attrs.url);
      if (
        (node.type === 'image' || node.type === 'inlineImage') &&
        !attrs.isExternalLinkVariable
      )
        add(attrs.externalLink);
      if (node.type === 'linkCard') add(attrs.link);
      for (const mark of node.marks ?? [])
        if (mark.type === 'link' && !mark.attrs?.isUrlVariable)
          add(mark.attrs?.href);
      node.content?.forEach(visit);
    };

    this.content.content?.forEach(visit);
    return links;
  }

  private isValidUrl(href: string) {
    try {
      new URL(href);
      return true;
    } catch {
      return false;
    }
  }

  async render(
    options: RenderOptions = DEFAULT_RENDER_OPTIONS
  ): Promise<string> {
    const markup = this.markup();

    // react-email's options are a union discriminated by `plainText`.
    return reactEmailRender(
      markup,
      options.plainText
        ? { pretty: options.pretty, plainText: true }
        : { pretty: options.pretty, plainText: false }
    );
  }

  /**
   * `children` will return the children of the content.
   * this is useful for rendering the content in a custom component.
   *
   * @returns The children of the content as JSX elements
   */
  children() {
    const nodes = this.content.content || [];
    const jsxNodes = nodes.map((node, index) => {
      const nodeOptions: NodeOptions = {
        prev: nodes[index - 1],
        next: nodes[index + 1],
        parent: node,
      };

      const component = this.renderNode(node, nodeOptions);
      if (!component) {
        return null;
      }

      return <Fragment key={generateKey()}>{component}</Fragment>;
    });

    return jsxNodes;
  }

  /**
   * `markup` will render the JSON content into React Email markup.
   * and return the raw React Tree.
   */
  markup() {
    const jsxNodes = this.children();

    const { preview } = this.config;
    const tags = meta(this.meta);
    const htmlProps = this.htmlProps;
    const containerStyles = this.config.theme?.container;
    // `null` removes the default font; a web font is loaded only when given.
    const configuredFont =
      this.config.theme?.font === null
        ? null
        : (this.config.theme?.font ?? DEFAULT_FONT);
    const fontOptions: FontProps | null = configuredFont && {
      ...configuredFont,
      fontStyle: configuredFont.fontStyle ?? 'normal',
      fontWeight: configuredFont.fontWeight ?? 400,
    };
    const selectedFontStyles = fontFaceStyles(
      this.content,
      this.config.fontFaceUrl
    );

    const bodyStyles: CSSProperties = {
      margin: '0px',
      ...this.config.theme?.body,
    };

    const preheader = preview ? this.preheader.render(preview) : null;

    const markup = (
      <Html {...htmlProps}>
        <Head>
          {fontOptions?.webFont ? (
            <Font {...fontOptions} />
          ) : fontOptions ? (
            <style
              dangerouslySetInnerHTML={{
                __html: `*{font-family:${emailFontStack(fontOptions.fontFamily, fontOptions.fallbackFontFamily)}}`,
              }}
            />
          ) : null}

          {selectedFontStyles ? (
            <style
              data-maily-fonts=""
              dangerouslySetInnerHTML={{ __html: selectedFontStyles }}
            />
          ) : null}

          <style
            dangerouslySetInnerHTML={{
              __html: /* css */ `blockquote,h1,h2,h3,img,li,ol,p,ul{margin-top:0;margin-bottom:0}@media only screen and (max-width:425px){.tab-row-full{width:100%!important}.tab-col-full{display:block!important;width:100%!important}.tab-pad{padding:0!important}}`,
            }}
          />
          {tags}
        </Head>
        <Body style={bodyStyles}>
          {preheader ? <Preview>{preheader}</Preview> : null}
          <Container
            style={{
              width: '100%',
              marginLeft: 'auto',
              marginRight: 'auto',
              borderStyle: 'solid',
              ...containerStyles,
            }}
          >
            {jsxNodes}
          </Container>
          {this.openTrackingPixel ? (
            <Img
              alt=""
              src={this.openTrackingPixel}
              style={{
                display: 'none',
                width: '1px',
                height: '1px',
              }}
            />
          ) : null}
        </Body>
      </Html>
    );

    return markup;
  }

  private getMarginOverrideConditions(
    _node: JSONContent,
    options?: NodeOptions
  ) {
    const { parent, prev, next } = options || {};

    const isNextSpacer = next?.type === 'spacer';
    const isPrevSpacer = prev?.type === 'spacer';

    const isParentListItem = parent?.type === 'listItem';

    const isLastSectionElement = parent?.type === 'section' && !next;
    const isFirstSectionElement = parent?.type === 'section' && !prev;

    const isLastColumnElement = parent?.type === 'column' && !next;
    const isFirstColumnElement = parent?.type === 'column' && !prev;

    const isFirstRepeatElement = parent?.type === 'repeat' && !prev;
    const isLastRepeatElement = parent?.type === 'repeat' && !next;

    const isFirstShowElement = parent?.type === 'show' && !prev;
    const isLastShowElement = parent?.type === 'show' && !next;

    return {
      isNextSpacer,
      isPrevSpacer,
      isLastSectionElement,
      isFirstSectionElement,
      isParentListItem,
      isLastColumnElement,
      isFirstColumnElement,
      isFirstRepeatElement,
      isLastRepeatElement,
      isFirstShowElement,
      isLastShowElement,

      shouldRemoveTopMargin:
        isPrevSpacer ||
        isFirstSectionElement ||
        isFirstColumnElement ||
        isFirstRepeatElement ||
        isFirstShowElement,
      shouldRemoveBottomMargin:
        isNextSpacer ||
        isLastSectionElement ||
        isLastColumnElement ||
        isLastRepeatElement ||
        isLastShowElement,
    };
  }

  // `getMappedContent` will call corresponding node type
  // and return text content
  private getMappedContent(
    node: JSONContent,
    options?: NodeOptions
  ): JSX.Element[] {
    const allNodes = node.content || [];
    return allNodes
      .map((childNode, index) => {
        const component = this.renderNode(childNode, {
          ...options,
          next: allNodes[index + 1],
          prev: allNodes[index - 1],
        });
        if (!component) {
          return null;
        }

        return <Fragment key={generateKey()}>{component}</Fragment>;
      })
      .filter((n) => n !== null) as JSX.Element[];
  }

  // `renderNode` will call the method of the corresponding node type
  private renderNode(
    node: JSONContent,
    options: NodeOptions = {}
  ): JSX.Element | null {
    const type = node.type || '';

    if (type in this) {
      // @ts-expect-error - `this` is not assignable to type 'never'
      return this[type]?.(node, options) as JSX.Element;
    }

    throw new Error(`Node type "${type}" is not supported.`);
  }

  // `renderMark` will call the method of the corresponding mark type
  private renderMark(node: JSONContent, options?: NodeOptions): JSX.Element {
    // It will wrap the text with the corresponding mark type
    const text = node?.text || <>&nbsp;</>;
    // Wrap in underline, bold, italic, textStyle, link order, without
    // reordering the caller's marks.
    const marks = [...(node?.marks || [])].sort((a, b) => {
      return this.marksOrder.indexOf(a.type) - this.marksOrder.indexOf(b.type);
    });

    return marks.reduce(
      (acc, mark) => {
        const type = mark.type;
        if (type in this) {
          // @ts-expect-error - `this` is not assignable to type 'never'
          return this[type]?.(mark, acc, options) as JSX.Element;
        }

        throw new Error(`Mark type "${type}" is not supported.`);
      },
      <>{text}</>
    );
  }

  protected paragraph(node: JSONContent, options?: NodeOptions): JSX.Element {
    const { attrs } = node;
    const alignment = attrs?.textAlign || 'left';
    const textDirection = attrs?.textDirection || 'ltr';
    const { isParentListItem, shouldRemoveBottomMargin } =
      this.getMarginOverrideConditions(node, options);

    const show = this.shouldShow(node, options);
    if (!show) {
      return <></>;
    }

    const marginBottom = isParentListItem || shouldRemoveBottomMargin ? 0 : 20;

    return (
      <Text
        style={{
          ...(alignment !== 'left' ? { textAlign: alignment } : {}),
          ...(textDirection !== 'ltr' ? { direction: textDirection } : {}),
          ...antialiased,
          fontSize: this.config.theme?.fontSize?.paragraph?.size,
          lineHeight: this.config.theme?.fontSize?.paragraph?.lineHeight,
          color: this.config.theme?.colors?.paragraph,
          margin: `0 0 ${marginBottom}px 0`,
        }}
      >
        {node.content ? (
          this.getMappedContent(node, {
            ...options,
            parent: node,
          })
        ) : (
          <>&nbsp;</>
        )}
      </Text>
    );
  }

  protected text(node: JSONContent, options?: NodeOptions): JSX.Element {
    if (node.marks) {
      return this.renderMark(node, options);
    }

    const text = node.text;
    // if it's all empty, return an invisible space length
    // of the text so that it doesn't look empty for inline-images
    const spaces = text?.match(/\s/g);
    if (spaces && spaces.length === text?.length) {
      return (
        <>
          {spaces.map((_, index) => (
            <Fragment key={index}>&nbsp;</Fragment>
          ))}
        </>
      );
    }

    return text ? <>{text}</> : <>&nbsp;</>;
  }

  protected bold(_: MarkType, text: JSX.Element): JSX.Element {
    return <strong>{text}</strong>;
  }

  protected italic(_: MarkType, text: JSX.Element): JSX.Element {
    return <em>{text}</em>;
  }

  protected underline(_: MarkType, text: JSX.Element): JSX.Element {
    return <u>{text}</u>;
  }

  protected strike(_: MarkType, text: JSX.Element): JSX.Element {
    return <s style={{ textDecoration: 'line-through' }}>{text}</s>;
  }

  protected textStyle(mark: MarkType, text: JSX.Element): JSX.Element {
    const { attrs } = mark;
    const {
      color = this.config.theme?.colors?.paragraph,
      fontSize,
      fontFamily,
      fontFallback,
    } = attrs || {};
    const selectedFontStack = emailFontStack(
      fontFamily,
      fontFallback,
      this.config.theme?.font?.fallbackFontFamily
    );

    return (
      <span
        style={{
          color,
          ...(typeof fontSize === 'string' && fontSize ? { fontSize } : {}),
          ...(selectedFontStack ? { fontFamily: selectedFontStack } : {}),
        }}
      >
        {text}
      </span>
    );
  }

  protected link(
    mark: MarkType,
    text: JSX.Element,
    options?: NodeOptions
  ): JSX.Element {
    const { attrs } = mark;

    const linkTheme = this.config.theme?.link;

    let href = attrs?.href || '#';
    const { target, rel } = this.linkAttributes;
    const isUrlVariable = attrs?.isUrlVariable ?? false;

    if (isUrlVariable) {
      const linkWithoutProtocol = this.removeLinkProtocol(href);
      href = this.variableUrlValue(linkWithoutProtocol, options);
    } else {
      href = this.linkValues.get(href) || href;
    }

    return (
      <Link
        href={href}
        rel={rel}
        style={{
          fontWeight: 500,
          textDecoration: 'none',
          color: linkTheme?.color || DEFAULT_LINK_TEXT_COLOR,
        }}
        target={target}
      >
        {text}
      </Link>
    );
  }

  private removeLinkProtocol(href: string) {
    return href.replace(LINK_PROTOCOL_REGEX, '');
  }

  private variableUrlValue(href: string, options?: NodeOptions) {
    const { payloadValue } = options || {};
    const linkWithoutProtocol = this.removeLinkProtocol(href);

    if (!this.shouldReplaceVariableValues) {
      return this.variableFormatter({
        variable: linkWithoutProtocol,
      });
    }

    // Payload values are rendered as the caller provided them.
    return (payloadVariable(payloadValue, linkWithoutProtocol) ??
      this.variableValues.get(linkWithoutProtocol) ??
      href) as string;
  }

  protected heading(node: JSONContent, options?: NodeOptions): JSX.Element {
    const { attrs } = node;

    const level = `h${Number(attrs?.level) || 1}`;
    const textDirection = attrs?.textDirection || 'ltr';
    const isRtl = textDirection === 'rtl';
    const defaultAlignment = isRtl ? 'right' : 'left';
    const alignment = attrs?.textAlign || defaultAlignment;
    const { shouldRemoveBottomMargin } = this.getMarginOverrideConditions(
      node,
      options
    );
    const { fontSize, lineHeight, fontWeight } =
      headings[level as AllowedHeadings];

    const show = this.shouldShow(node, options);
    if (!show) {
      return <></>;
    }

    return (
      <Heading
        // @ts-expect-error - `this` is not assignable to type 'never'
        as={level}
        style={{
          ...(alignment !== 'left' ? { textAlign: alignment } : {}),
          ...(isRtl ? { direction: textDirection } : {}),
          color: this.config.theme?.colors?.heading,
          fontSize,
          lineHeight,
          fontWeight,
        }}
        mb={shouldRemoveBottomMargin ? 0 : 12}
        mt={0}
        mx={0}
      >
        {this.getMappedContent(node, {
          ...options,
          parent: node,
        })}
      </Heading>
    );
  }

  protected variable(node: JSONContent, options?: NodeOptions): JSX.Element {
    const { id: variable, fallback } = node.attrs || {};

    const shouldShow = this.shouldShow(node, options);
    if (!shouldShow || !variable) {
      return <></>;
    }

    const formattedVariable = this.getVariableValue(
      variable,
      fallback,
      options
    );

    if (node?.marks) {
      return this.renderMark(
        {
          text: formattedVariable,
          marks: node.marks,
        },
        options
      );
    }

    return <>{formattedVariable}</>;
  }

  getVariableValue(variable: string, fallback?: string, options?: NodeOptions) {
    const { payloadValue } = options || {};

    let formattedVariable = this.variableFormatter({
      variable,
      fallback,
    });

    // If `shouldReplaceVariableValues` is true, replace the variable values
    // Otherwise, just return the formatted variable
    if (this.shouldReplaceVariableValues) {
      // Payload values are rendered as the caller provided them.
      formattedVariable = (payloadVariable(payloadValue, variable) ??
        this.variableValues.get(variable) ??
        fallback ??
        formattedVariable) as string;
    }

    return formattedVariable;
  }

  // Renderers share the dispatcher's signature so subclasses can override
  // them; these two ignore their inputs.
  protected horizontalRule(
    node: JSONContent,
    options?: NodeOptions
  ): JSX.Element;
  protected horizontalRule(): JSX.Element {
    return (
      <Hr
        style={{
          marginTop: '32px',
          marginBottom: '32px',
        }}
      />
    );
  }

  protected orderedList(node: JSONContent, options?: NodeOptions): JSX.Element {
    const { shouldRemoveBottomMargin } = this.getMarginOverrideConditions(
      node,
      options
    );

    return (
      <Container
        style={{
          marginTop: '0px',
          marginBottom: shouldRemoveBottomMargin ? '0' : '20px',
        }}
      >
        <ol
          style={{
            paddingLeft: '26px',
            listStyleType: 'decimal',
          }}
        >
          {this.getMappedContent(node, {
            ...options,
            parent: node,
          })}
        </ol>
      </Container>
    );
  }

  protected bulletList(node: JSONContent, options?: NodeOptions): JSX.Element {
    const { parent, next } = options || {};
    const { shouldRemoveBottomMargin } = this.getMarginOverrideConditions(
      node,
      {
        parent,
        next,
      }
    );

    return (
      <Container
        style={{
          maxWidth: '100%',
          marginTop: '0px',
          marginBottom: shouldRemoveBottomMargin ? '0' : '20px',
        }}
      >
        <ul
          style={{
            paddingLeft: '26px',
            listStyleType: 'disc',
          }}
        >
          {this.getMappedContent(node, {
            ...options,
            parent: node,
          })}
        </ul>
      </Container>
    );
  }

  protected listItem(node: JSONContent, options?: NodeOptions): JSX.Element {
    return (
      <li
        style={{
          marginBottom: '8px',
          marginTop: '8px',
          paddingLeft: '6px',
          ...antialiased,
        }}
      >
        {this.getMappedContent(node, { ...options, parent: node })}
      </li>
    );
  }

  protected button(node: JSONContent, options?: NodeOptions): JSX.Element {
    const { attrs } = node;

    const buttonTheme = this.config.theme?.button;

    const {
      text: _text,
      isTextVariable,
      url,
      isUrlVariable,
      variant,
      buttonColor: _buttonColor,
      textColor: _textColor,
      borderRadius,
      // @TODO: Update the attribute to `textAlign`
      alignment = 'left',

      paddingTop: _paddingTop,
      paddingRight: _paddingRight,
      paddingBottom: _paddingBottom,
      paddingLeft: _paddingLeft,
      fontSize,
      fontFamily,
      fontFallback,
    } = attrs || {};

    const buttonColor = _buttonColor || buttonTheme?.backgroundColor;
    const textColor = _textColor || buttonTheme?.color;
    const selectedFontStack = emailFontStack(fontFamily, fontFallback);

    let paddingTop =
      parseInt(String(_paddingTop || buttonTheme?.paddingTop)) || 0;
    const paddingRight =
      parseInt(String(_paddingRight || buttonTheme?.paddingRight)) || 0;
    let paddingBottom =
      parseInt(String(_paddingBottom || buttonTheme?.paddingBottom)) || 0;
    const paddingLeft =
      parseInt(String(_paddingLeft || buttonTheme?.paddingLeft)) || 0;

    const shouldShow = this.shouldShow(node, options);
    if (!shouldShow) {
      return <></>;
    }

    let radius: string | undefined = '0px';
    if (borderRadius === 'round') {
      radius = '9999px';
    } else if (borderRadius === 'smooth') {
      radius = '6px';
    }

    const { shouldRemoveBottomMargin } = this.getMarginOverrideConditions(
      node,
      options
    );

    const href = isUrlVariable
      ? this.variableUrlValue(url, options)
      : this.linkValues.get(url) || url;
    const text = isTextVariable ? this.variableUrlValue(_text, options) : _text;

    paddingTop += 2;
    paddingBottom += 2;

    return (
      <Container
        style={{
          textAlign: alignment,
          maxWidth: '100%',
          marginBottom: shouldRemoveBottomMargin ? '0px' : '20px',
        }}
      >
        <Button
          href={href}
          target={this.linkAttributes.target}
          rel={this.linkAttributes.rel}
          style={{
            color: String(textColor),
            backgroundColor:
              variant === 'filled' ? String(buttonColor) : 'transparent',
            borderColor: String(buttonColor),
            borderWidth: '2px',
            borderStyle: 'solid',
            textDecoration: 'none',
            fontSize:
              typeof fontSize === 'string' && fontSize ? fontSize : '14px',
            fontWeight: 500,
            ...(selectedFontStack ? { fontFamily: selectedFontStack } : {}),
            borderRadius: radius,
            padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`,
          }}
        >
          {text}
        </Button>
      </Container>
    );
  }

  protected spacer(node: JSONContent, options?: NodeOptions): JSX.Element {
    const height = spacerHeight(node.attrs?.height);

    const shouldShow = this.shouldShow(node, options);
    if (!shouldShow) {
      return <></>;
    }

    return (
      <Container
        style={{
          height: `${height}px`,
        }}
      />
    );
  }

  protected hardBreak(node: JSONContent, options?: NodeOptions): JSX.Element;
  protected hardBreak(): JSX.Element {
    return <br />;
  }

  protected logo(node: JSONContent, options?: NodeOptions): JSX.Element {
    const { attrs } = node;
    const {
      src: rawSrc,
      isSrcVariable,
      alt,
      title,
      size,
      // @TODO: Update the attribute to `textAlign`
      alignment = 'left',
    } = attrs || {};

    const shouldShow = this.shouldShow(node, options);
    if (!shouldShow) {
      return <></>;
    }

    const src = imageSource(
      isSrcVariable ? this.variableUrlValue(rawSrc, options) : rawSrc
    );
    if (!src) return <></>;

    const { shouldRemoveBottomMargin } = this.getMarginOverrideConditions(
      node,
      options
    );

    return (
      <Row
        style={{
          marginTop: '0px',
          marginBottom: shouldRemoveBottomMargin ? '0px' : '32px',
        }}
      >
        <Column align={alignment}>
          <Img
            alt={alt || title || ''}
            src={src}
            style={{
              width: logoSizes[size as AllowedLogoSizes] || size,
              height: logoSizes[size as AllowedLogoSizes] || size,
            }}
            title={title || undefined}
          />
        </Column>
      </Row>
    );
  }

  protected image(node: JSONContent, options?: NodeOptions): JSX.Element {
    const { attrs } = node;
    const {
      src: rawSrc,
      isSrcVariable,
      alt,
      title,
      width = 'auto',
      height = 'auto',
      alignment = 'center',
      externalLink: rawExternalLink = '',
      isExternalLinkVariable,
      borderRadius = 0,
    } = attrs || {};

    const shouldShow = this.shouldShow(node, options);
    if (!shouldShow) {
      return <></>;
    }

    const { shouldRemoveBottomMargin } = this.getMarginOverrideConditions(
      node,
      options
    );

    const src = imageSource(
      isSrcVariable ? this.variableUrlValue(rawSrc, options) : rawSrc
    );
    if (!src) return <></>;
    const externalLink = isExternalLinkVariable
      ? this.variableUrlValue(rawExternalLink, options)
      : this.linkValues.get(rawExternalLink) || rawExternalLink;

    // Handle width value
    const imageWidth = width === 'auto' ? 'auto' : Number(width);
    const widthStyle = imageWidth === 'auto' ? 'auto' : `${imageWidth}px`;

    // Handle height value
    const imageHeight = height === 'auto' ? 'auto' : Number(height);
    const heightStyle = imageHeight === 'auto' ? 'auto' : `${imageHeight}px`;

    const mainImage = (
      <Img
        alt={alt || title || ''}
        src={src}
        style={{
          width: widthStyle, // Use the calculated width
          height: heightStyle, // Use the calculated height
          maxWidth: '100%', // Ensure image doesn't overflow container
          outline: 'none',
          border: 'none',
          textDecoration: 'none',
          display: 'block', // Prevent unwanted spacing
          borderRadius,
        }}
        title={title || undefined}
      />
    );

    return (
      <Row
        style={{
          marginTop: '0px',
          marginBottom: shouldRemoveBottomMargin ? '0px' : '32px',
        }}
      >
        <Column align={alignment}>
          {externalLink ? (
            <a
              href={externalLink}
              rel={this.linkAttributes.rel}
              style={{
                display: 'block',
                maxWidth: '100%',
                textDecoration: 'none',
              }}
              target={this.linkAttributes.target}
            >
              {mainImage}
            </a>
          ) : (
            mainImage
          )}
        </Column>
      </Row>
    );
  }

  protected footer(node: JSONContent, options?: NodeOptions): JSX.Element {
    const { attrs } = node;
    const { textAlign = 'left', textDirection = 'ltr' } = attrs || {};

    const { shouldRemoveBottomMargin } = this.getMarginOverrideConditions(
      node,
      options
    );

    return (
      <Text
        style={{
          fontSize: this.config.theme?.fontSize?.footer?.size,
          lineHeight: this.config.theme?.fontSize?.footer?.lineHeight,
          color: this.config.theme?.colors?.footer,
          marginTop: '0px',
          marginBottom: shouldRemoveBottomMargin ? '0px' : '20px',
          textAlign,
          ...(textDirection !== 'ltr' ? { direction: textDirection } : {}),
          ...antialiased,
        }}
      >
        {this.getMappedContent(node, {
          ...options,
          parent: node,
        })}
      </Text>
    );
  }

  protected blockquote(node: JSONContent, options?: NodeOptions): JSX.Element {
    const { isPrevSpacer, shouldRemoveBottomMargin } =
      this.getMarginOverrideConditions(node, options);

    return (
      <blockquote
        style={{
          borderLeftWidth: '4px',
          borderLeftStyle: 'solid',
          borderLeftColor: this.config.theme?.colors?.blockquoteBorder,
          paddingLeft: '16px',
          marginLeft: '0px',
          marginRight: '0px',
          marginTop: isPrevSpacer ? '0px' : '20px',
          marginBottom: shouldRemoveBottomMargin ? '0px' : '20px',
        }}
      >
        {this.getMappedContent(node, {
          ...options,
          parent: node,
        })}
      </blockquote>
    );
  }
  protected code(_: MarkType, text: JSX.Element): JSX.Element {
    return (
      <code
        style={{
          backgroundColor: this.config.theme?.colors?.codeBackground,
          color: this.config.theme?.colors?.codeText,
          padding: '2px 4px',
          borderRadius: '6px',
          fontFamily: CODE_FONT_FAMILY,
          fontWeight: 400,
          letterSpacing: 0,
        }}
      >
        {text}
      </code>
    );
  }
  protected linkCard(node: JSONContent, options?: NodeOptions): JSX.Element {
    const { attrs } = node;
    const { shouldRemoveBottomMargin } = this.getMarginOverrideConditions(
      node,
      options
    );

    const {
      title,
      description,
      link,
      linkTitle,
      image,
      badgeText,
      subTitle,
      fontSize,
      fontFamily,
      fontFallback,
    } = attrs || {};
    const href =
      this.linkValues.get(link) || this.variableValues.get(link) || link || '#';
    const selectedFontStack = emailFontStack(fontFamily, fontFallback);
    const typographyStyle = {
      ...(typeof fontSize === 'string' && fontSize ? { fontSize } : {}),
      ...(selectedFontStack ? { fontFamily: selectedFontStack } : {}),
    };

    return (
      <a
        href={href}
        rel={this.linkAttributes.rel}
        style={{
          border: '1px solid #eaeaea',
          borderRadius: '10px',
          textDecoration: 'none',
          color: 'inherit',
          display: 'block',
          marginBottom: shouldRemoveBottomMargin ? '0px' : '20px',
        }}
        target={this.linkAttributes.target}
      >
        {image ? (
          <Row
            style={{
              marginBottom: '6px',
            }}
          >
            <Column
              style={{
                width: '100%',
                height: '100%',
              }}
            >
              <Img
                alt={title || ''}
                src={image}
                style={{
                  borderRadius: '10px 10px 0 0',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                title={title || undefined}
              />
            </Column>
          </Row>
        ) : null}

        <Row
          style={{
            padding: '15px',
            marginTop: 0,
            marginBottom: 0,
          }}
        >
          <Column
            style={{
              verticalAlign: 'top',
            }}
          >
            <Row
              align={undefined}
              style={{
                marginBottom: '8px',
                marginTop: '0px',
              }}
              width="auto"
            >
              <Column>
                <Text
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: this.config.theme?.colors?.linkCardTitle,
                    margin: '0px',
                    ...antialiased,
                    ...typographyStyle,
                  }}
                >
                  {title}
                </Text>
              </Column>
              {badgeText || subTitle ? (
                <Column
                  style={{
                    paddingLeft: '6px',
                    verticalAlign: 'middle',
                  }}
                >
                  {badgeText ? (
                    <span
                      style={{
                        fontWeight: 600,
                        color: this.config.theme?.colors?.linkCardBadgeText,
                        padding: '4px 8px',
                        borderRadius: '8px',
                        backgroundColor:
                          this.config.theme?.colors?.linkCardBadgeBackground,
                        fontSize: '12px',
                        lineHeight: '12px',
                        ...typographyStyle,
                      }}
                    >
                      {badgeText}
                    </span>
                  ) : null}{' '}
                  {subTitle && !badgeText ? (
                    <span
                      style={{
                        fontWeight: 'normal',
                        color: this.config.theme?.colors?.linkCardSubTitle,
                        fontSize: '12px',
                        lineHeight: '12px',
                        ...typographyStyle,
                      }}
                    >
                      {subTitle}
                    </span>
                  ) : null}
                </Column>
              ) : null}
            </Row>
            <Text
              style={{
                fontSize: '16px',
                color: this.config.theme?.colors?.linkCardDescription,
                marginTop: '0px',
                marginBottom: '0px',
                ...antialiased,
                ...typographyStyle,
              }}
            >
              {description}{' '}
              {linkTitle ? (
                <a
                  href={href}
                  rel={this.linkAttributes.rel}
                  target={this.linkAttributes.target}
                  style={{
                    color: this.config.theme?.colors?.linkCardTitle,
                    fontSize: '14px',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    ...typographyStyle,
                  }}
                >
                  {linkTitle}
                </a>
              ) : null}
            </Text>
          </Column>
        </Row>
      </a>
    );
  }

  protected section(node: JSONContent, options?: NodeOptions): JSX.Element {
    const { attrs } = node;
    const {
      borderRadius = 0,
      backgroundColor = DEFAULT_SECTION_BACKGROUND_COLOR,
      align = DEFAULT_SECTION_ALIGN,
      borderWidth = DEFAULT_SECTION_BORDER_WIDTH,
      borderColor = DEFAULT_SECTION_BORDER_COLOR,

      marginTop = DEFAULT_SECTION_MARGIN_TOP,
      marginRight = DEFAULT_SECTION_MARGIN_RIGHT,
      marginBottom = DEFAULT_SECTION_MARGIN_BOTTOM,
      marginLeft = DEFAULT_SECTION_MARGIN_LEFT,

      paddingTop = DEFAULT_SECTION_PADDING_TOP,
      paddingRight = DEFAULT_SECTION_PADDING_RIGHT,
      paddingBottom = DEFAULT_SECTION_PADDING_BOTTOM,
      paddingLeft = DEFAULT_SECTION_PADDING_LEFT,
    } = attrs || {};

    const shouldShow = this.shouldShow(node, options);
    if (!shouldShow) {
      return <></>;
    }

    return (
      <Row
        style={{
          marginTop,
          marginRight,
          marginBottom,
          marginLeft,
        }}
      >
        <Column
          align={align}
          style={{
            borderColor,
            borderWidth,
            borderStyle: 'solid',
            backgroundColor,
            borderRadius,

            paddingTop,
            paddingRight,
            paddingBottom,
            paddingLeft,
          }}
        >
          {this.getMappedContent(node, {
            ...options,
            parent: node,
          })}
        </Column>
      </Row>
    );
  }

  protected columns(node: JSONContent, options?: NodeOptions): JSX.Element {
    const shouldShow = this.shouldShow(node, options);
    if (!shouldShow) {
      return <></>;
    }

    const [newNode, totalWidth] = this.adjustColumnsContent(node);

    return (
      <Row
        width={`${totalWidth}%`}
        style={{
          margin: 0,
          padding: 0,
          width: `${totalWidth}%`,
        }}
        className="tab-row-full"
      >
        {this.getMappedContent(newNode, {
          ...options,
          parent: newNode,
        })}
      </Row>
    );
  }

  private adjustColumnsContent(node: JSONContent): [JSONContent, number] {
    const { content = [] } = node;
    const totalWidth = 100;
    const columnsWithWidth = content.filter(
      (c) => c.type === 'column' && Boolean(Number(c.attrs?.width || 0))
    );
    const autoWidthColumns = content.filter(
      (c) =>
        c.type === 'column' && (c.attrs?.width === 'auto' || !c.attrs?.width)
    );

    const totalWidthUsed = columnsWithWidth.reduce(
      (acc, c) => acc + Number(c.attrs?.width),
      0
    );

    const remainingWidth = totalWidth - totalWidthUsed;
    const measuredWidth = Math.round(remainingWidth / autoWidthColumns.length);

    const columnCount = content.filter((c) => c.type === 'column').length;
    const gap = node.attrs?.gap ?? DEFAULT_COLUMNS_GAP;

    return [
      {
        ...node,
        content: content.map((c, index) => {
          const isAutoWidthColumn =
            c.type === 'column' &&
            (c.attrs?.width === 'auto' || !c.attrs?.width);
          const isFirstColumn = index === 0;
          const isMiddleColumn = index > 0 && index < columnCount - 1;
          const isLastColumn = index === content.length - 1;

          let paddingLeft: number;
          let paddingRight: number;

          // For 2 columns, apply a simple gap logic
          if (columnCount < 3) {
            paddingLeft = isFirstColumn ? 0 : gap / 2;
            paddingRight = isLastColumn ? 0 : gap / 2;
          } else {
            // For more than 2 columns, apply more gap in the first and last columns
            // and less gap in the middle columns to make it look more balanced
            // because the first and last columns have more space to fill
            const leftAndRightPadding = (gap / 2) * 1.5;
            const middleColumnPadding = leftAndRightPadding / 2;

            paddingLeft = isFirstColumn
              ? 0
              : isMiddleColumn
                ? middleColumnPadding
                : leftAndRightPadding;
            paddingRight = isLastColumn
              ? 0
              : isMiddleColumn
                ? middleColumnPadding
                : leftAndRightPadding;
          }

          paddingLeft = Math.round(paddingLeft * 100) / 100;
          paddingRight = Math.round(paddingRight * 100) / 100;

          return {
            ...c,
            attrs: {
              ...c.attrs,
              width: isAutoWidthColumn ? measuredWidth : c.attrs?.width,

              isFirstColumn,
              isLastColumn,
              index,

              paddingLeft,
              paddingRight,
            },
          };
        }),
      },
      autoWidthColumns.length === 0
        ? Math.min(totalWidth, totalWidthUsed)
        : totalWidth,
    ];
  }

  protected column(node: JSONContent, options?: NodeOptions): JSX.Element {
    const { attrs } = node;
    const {
      width,
      verticalAlign = 'top',
      paddingLeft = 0,
      paddingRight = 0,
    } = attrs || {};

    return (
      <Column
        width={`${Number(width)}%`}
        style={{
          width: `${Number(width)}%`,
          margin: 0,
          verticalAlign,
        }}
        className="tab-col-full"
      >
        <Section
          style={{
            margin: 0,
            paddingLeft,
            paddingRight,
          }}
          className="tab-pad"
        >
          {this.getMappedContent(node, {
            ...options,
            parent: node,
          })}
        </Section>
      </Column>
    );
  }

  private repeat(node: JSONContent, options?: NodeOptions): JSX.Element {
    const { attrs } = node;
    const { each = '' } = attrs || {};

    const shouldShow = this.shouldShow(node, options);
    if (!shouldShow) {
      return <></>;
    }

    const values =
      this.payloadValues.get(each) ??
      payloadField(options?.payloadValue, each) ??
      [];
    if (!Array.isArray(values)) {
      throw new Error(`Payload value for each "${each}" is not an array`);
    }

    return (
      <>
        {values.map((value) => {
          return (
            <Fragment key={generateKey()}>
              {this.getMappedContent(node, {
                ...options,
                parent: node,
                payloadValue: value,
              })}
            </Fragment>
          );
        })}
      </>
    );
  }

  /**
   * @deprecated
   * This for node is an alias for the repeat node
   * we will remove this in the future
   * @param node
   * @param options
   * @returns JSX.Element
   */
  protected for(node: JSONContent, options?: NodeOptions): JSX.Element {
    return this.repeat(node, options);
  }

  private shouldShow(node: JSONContent, options?: NodeOptions): boolean {
    const showIfKey = node?.attrs?.showIfKey ?? '';
    if (!showIfKey) {
      return true;
    }

    return !!(
      this.payloadValues.get(showIfKey) ??
      payloadField(options?.payloadValue, showIfKey)
    );
  }

  htmlCodeBlock(node: JSONContent, options?: NodeOptions): JSX.Element {
    const show = this.shouldShow(node, options);
    if (!show) {
      return <></>;
    }

    // the text can be a proper html code block
    // or only the body of the html
    // so we need to wrap it in a proper html tag
    const text =
      node.content?.reduce((acc, n) => {
        if (n?.type === 'text') {
          return acc + n?.text;
        } else if (n?.type === 'variable') {
          // Values are text inside the authored markup, not markup.
          const value = this.getVariableValue(
            n?.attrs?.id,
            n?.attrs?.fallback,
            options
          );
          return acc + escapeHtml(String(value ?? ''));
        }

        return acc;
      }, '') || '';

    // we will inline the css in the html
    // so that it can be rendered properly
    const inlineCssHtml = juice(text);
    const doc = parse(inlineCssHtml);
    const head = doc?.querySelector('head');
    head?.remove();
    const html = doc.toString();

    return (
      <table
        align="left"
        width="100%"
        border={0}
        cellPadding="0"
        cellSpacing="0"
        role="presentation"
      >
        <tbody>
          <tr style={{ width: '100%' }}>
            <td
              style={{ width: '100%' }}
              dangerouslySetInnerHTML={{
                __html: html,
              }}
            />
          </tr>
        </tbody>
      </table>
    );
  }

  protected inlineImage(node: JSONContent, options?: NodeOptions): JSX.Element {
    const { attrs } = node;
    const {
      src: rawSrc,
      isSrcVariable,
      alt = '',
      title = '',
      height = DEFAULT_INLINE_IMAGE_HEIGHT,
      width = DEFAULT_INLINE_IMAGE_WIDTH,
      externalLink: rawExternalLink = '',
      isExternalLinkVariable,
    } = attrs || {};

    const src = imageSource(
      isSrcVariable ? this.variableUrlValue(rawSrc, options) : rawSrc
    );
    if (!src) return <></>;
    const externalLink = isExternalLinkVariable
      ? this.variableUrlValue(rawExternalLink, options)
      : this.linkValues.get(rawExternalLink) || rawExternalLink;

    const image = (
      <img
        src={src}
        alt={alt}
        title={title || undefined}
        width={width}
        height={height}
        style={{
          display: 'inline',
          verticalAlign: 'middle',
          width: `${width}px`,
          height: `${height}px`,
          outline: 'none',
          border: 'none',
          textDecoration: 'none',
        }}
      />
    );

    if (!externalLink) {
      return image;
    }

    return (
      <a
        href={externalLink}
        rel={this.linkAttributes.rel}
        style={{
          display: 'inline',
          textDecoration: 'none',
        }}
        target={this.linkAttributes.target}
      >
        {image}
      </a>
    );
  }
}
