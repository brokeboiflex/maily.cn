import {
  createContext,
  useContext,
  useEffect,
  useState,
  type RefObject,
} from 'react';
import type { Editor } from '@tiptap/core';

export const MobileEditorContext = createContext<{
  compact: boolean;
  nodeTarget: HTMLElement | null;
}>({ compact: false, nodeTarget: null });

export const useMobileEditor = () => useContext(MobileEditorContext);

// Container width also covers editors embedded in a narrow compose panel.
export function useCompactEditor(
  rootRef: RefObject<HTMLDivElement | null>,
  editor: Editor | null
) {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const element = rootRef.current;
    if (!element || !editor) return;
    const touch = window.matchMedia('(pointer: coarse)');
    const update = () => {
      const width = element.getBoundingClientRect().width;
      if (!width) return;
      const next = width < 640 || (touch.matches && width < 1024);
      element.dataset.mailyMobile = String(next);
      setCompact(next);
      // Recompute placeholders and close an already-open desktop suggestion.
      if (!editor.isDestroyed) editor.view.dispatch(editor.state.tr);
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    touch.addEventListener('change', update);
    update();
    return () => {
      observer.disconnect();
      touch.removeEventListener('change', update);
    };
  }, [editor, rootRef]);
  return compact;
}
