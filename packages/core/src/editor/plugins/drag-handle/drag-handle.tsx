import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { Node } from '@tiptap/pm/model';
import { type ReactNode } from 'react';
import { Editor } from '@tiptap/core';
import { type Props as TippyProps } from 'tippy.js';
import {
  DragHandlePlugin,
  dragHandlePluginDefaultKey,
} from './drag-handle-plugin';

export type DragHandleProps = {
  editor: Editor;
  pluginKey?: string;
  className?: string;
  tippyOptions?: Partial<TippyProps>;
  onNodeChange?: (data: {
    node: Node | null;
    editor: Editor;
    pos: number;
  }) => void;
  children: ReactNode;
};

export function DragHandle(props: DragHandleProps) {
  const {
    className = 'drag-handle',
    children,
    editor,
    pluginKey = dragHandlePluginDefaultKey,
    onNodeChange,
    tippyOptions = {},
  } = props;

  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const pluginRef = useRef<ReturnType<typeof DragHandlePlugin> | null>(null);

  // The plugin reparents its element into Tippy's container. React must own
  // only the portal's children, not a host div that the plugin moves elsewhere.
  useEffect(() => {
    setElement(document.createElement('div'));
  }, []);
  useEffect(() => {
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
        tippyOptions,
        onNodeChange,
      });

      editor.registerPlugin(pluginRef.current);
    }

    return () => {
      editor.unregisterPlugin(pluginKey);
      pluginRef.current = null;
    };
  }, [element, editor, onNodeChange, pluginKey]);

  return element ? createPortal(children, element) : null;
}
