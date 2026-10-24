import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { Node } from '@tiptap/pm/model';
import { type ReactNode } from 'react';
import { Editor } from '@tiptap/core';
import {
  DragHandlePlugin,
  dragHandlePluginDefaultKey,
  type DragHandleFloatingOptions,
} from './drag-handle-plugin';

export type DragHandleProps = DragHandleFloatingOptions & {
  editor: Editor;
  pluginKey?: string;
  className?: string;
  onNodeChange?: (data: {
    node: Node | null;
    editor: Editor;
    pos: number;
  }) => void;
  children: ReactNode;
};

// The plugin reparents this element into its floating wrapper, so it is an
// imperatively owned DOM node: React renders only the portal's children into it.
function createHandleElement() {
  return typeof document === 'undefined' ? null : document.createElement('div');
}

export function DragHandle(props: DragHandleProps) {
  const {
    className = 'drag-handle',
    children,
    editor,
    pluginKey = dragHandlePluginDefaultKey,
    onNodeChange,
    placement,
    offset,
    zIndex,
  } = props;

  const [element] = useState(createHandleElement);
  const pluginRef = useRef<ReturnType<typeof DragHandlePlugin> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- the element is a DOM node owned by the ProseMirror plugin, not React state
    if (element) element.className = className;
  }, [element, className]);

  useEffect(() => {
    if (!element) {
      return () => {
        pluginRef.current = null;
      };
    }

    if (editor.isDestroyed) {
      return () => {
        pluginRef.current = null;
      };
    }

    if (!pluginRef.current) {
      pluginRef.current = DragHandlePlugin({
        editor,
        element,
        pluginKey,
        placement,
        offset,
        zIndex,
        onNodeChange,
      });

      editor.registerPlugin(pluginRef.current);
    }

    return () => {
      editor.unregisterPlugin(pluginKey);
      pluginRef.current = null;
    };
  }, [element, editor, onNodeChange, pluginKey, placement, offset, zIndex]);

  return element ? createPortal(children, element) : null;
}
