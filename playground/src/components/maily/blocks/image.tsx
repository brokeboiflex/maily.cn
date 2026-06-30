import { TextSelection } from "@tiptap/pm/state"
import type { BlockItem } from "./types"
import type { TranslateFn } from "../editor/i18n"
import { ImageIcon } from "lucide-react"

export const image = (t: TranslateFn): BlockItem => ({
  title: t("block.image.title"),
  description: t("block.image.description"),
  searchTerms: ["image"],
  icon: <ImageIcon className="h-4 w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).setImage({ src: "" }).run()
  },
})

export const logo = (t: TranslateFn): BlockItem => ({
  title: t("block.logo.title"),
  description: t("block.logo.description"),
  searchTerms: ["image", "logo"],
  icon: <ImageIcon className="h-4 w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).setLogoImage({ src: "" }).run()
  },
})

export const inlineImage = (t: TranslateFn): BlockItem => ({
  title: t("block.inlineImage.title"),
  description: t("block.inlineImage.description"),
  searchTerms: ["image", "inline"],
  icon: <ImageIcon className="h-4 w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor
      .chain()
      .focus()
      .deleteRange(range)
      // @ts-ignore
      .setInlineImage({
        src: "https://maily.to/brand/logo.png",
      })
      // @ts-ignore
      .command((props) => {
        const { tr, state, view, editor } = props
        const { from } = range

        const node = state.doc.nodeAt(from)
        if (!node) {
          return false
        }

        const selection = TextSelection.create(
          tr.doc,
          from,
          from + node.nodeSize
        )
        tr.setSelection(selection)
        return true
      })
      .run()
  },
})
