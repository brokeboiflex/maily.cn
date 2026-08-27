import TiptapColor, { type ColorOptions } from "@tiptap/extension-color"

type ColorStorage = {
  /**
   * Last 5 used colors
   */
  colors: Set<string>
}

declare module "@tiptap/core" {
  interface Storage {
    color: ColorStorage
  }
}

export const Color = TiptapColor.extend<ColorOptions, ColorStorage>({
  addStorage() {
    return {
      colors: new Set(),
    }
  },
})
