export type { MailyLabels, LabelKey, TranslateFn } from './i18n';
// Public entry for the editor. It keeps the index.tsx name of earlier
// releases, so `shadcn add --overwrite` replaces it in place instead of leaving
// a stale module beside a renamed one. The client boundary is editor.tsx;
// client modules cannot use `export *`. (shadcn add strips a file's leading
// comments, so this note follows the first export.)
export * from './editor';
export { defaultLabels, createTranslator } from './i18n';
export type {
  FontsourceCategory,
  FontsourceFont,
  MailyFontSelection,
} from './fonts/fontsource';
export type {
  MailyFontCategory,
  MailyFontFamily,
  MailyFontProvider,
} from './fonts/font-provider';
export { fontsourceFontProvider } from './fonts/fontsource';
