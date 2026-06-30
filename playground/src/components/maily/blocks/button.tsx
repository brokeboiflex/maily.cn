import type { BlockItem } from "./types"
import type { TranslateFn } from "../editor/i18n"
import { MousePointer, ArrowUpRightSquare } from "lucide-react"

export const button = (t: TranslateFn): BlockItem => ({
  title: t("block.button.title"),
  description: t("block.button.description"),
  searchTerms: ["link", "button", "cta"],
  icon: <MousePointer className="h-4 w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).setButton().run()
  },
})

export const linkCard = (t: TranslateFn): BlockItem => ({
  title: t("block.linkCard.title"),
  description: t("block.linkCard.description"),
  searchTerms: ["link", "button", "image"],
  icon: <ArrowUpRightSquare className="h-4 w-4" />,
  command: ({ editor, range }) => {
    // @ts-ignore
    editor.chain().focus().deleteRange(range).setLinkCard().run()
  },
  render: (editor) => {
    return editor.extensionManager.extensions.findIndex(
      (ext) => ext.name === "linkCard"
    ) === -1
      ? null
      : true
  },
})
