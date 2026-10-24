import { Extension } from '@tiptap/core';
import {
  resetSelectedAttributes,
  setSelectedNode,
  updateSelectedAttributes,
} from '../utils/update-attribute';

export const AttributeCommands = Extension.create({
  name: 'mailyAttributeCommands',
  addCommands() {
    return {
      setNode: setSelectedNode,
      updateAttributes: updateSelectedAttributes,
      resetAttributes: resetSelectedAttributes,
    };
  },
});
