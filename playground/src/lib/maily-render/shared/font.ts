import type { FontProps } from './theme';

type Font = Pick<
  FontProps,
  'fontFamily' | 'fallbackFontFamily' | 'webFont' | 'fontStyle' | 'fontWeight'
>;

export function loadFont(font: Font): void {
  const style = fontStyle(font);

  const styleElement = document.createElement('style');
  styleElement.textContent = style;
  document.head.appendChild(styleElement);
}

export function fontStyle(font: Font): string {
  const {
    fontFamily,
    fallbackFontFamily,
    webFont,
    fontStyle = 'normal',
    fontWeight = 400,
  } = font;

  const src = webFont
    ? `src: url(${webFont.url}) format('${webFont.format}');`
    : '';

  const style = `
  @font-face {
    font-family: '${fontFamily}';
    font-style: ${fontStyle};
    font-weight: ${fontWeight};
    mso-font-alt: '${fallbackFontFamily}';
    ${src}
  }`;

  return style;
}
