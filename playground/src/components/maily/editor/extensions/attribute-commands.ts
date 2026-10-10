import { Extension } from "@tiptap/core"
import {
  resetSelectedAttributes,
  updateSelectedAttributes,
} from "../utils/update-attribute"

export const AttributeCommands = Extension.create({
  name: "mailyAttributeCommands",
  addCommands() {
    return {
      updateAttributes: updateSelectedAttributes,
      resetAttributes: resetSelectedAttributes,
    }
  },
})
