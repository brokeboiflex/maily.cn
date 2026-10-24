// React-free on purpose: vite.config.ts imports it to inline the theme init
// script into index.html, and main.tsx passes the same options to the provider.
import type { ThemeOptions } from "shadcn-theme-provider/script"

const palettes = [
  "default",
  "corporate",
  "marshmallow",
  "neo-brutalism",
  "paper",
  "shadcn",
] as const

/** Theme options for an app served from `base` (Vite's resolved base URL). */
export function createThemeOptions(base: string) {
  return {
    themes: Object.fromEntries(
      palettes.map((palette) => [palette, `${base}themes/${palette}.css`])
    ),
    defaultMode: "system",
    defaultPalette: "default",
  } satisfies ThemeOptions
}
