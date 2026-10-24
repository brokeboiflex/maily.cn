import { shift } from '@floating-ui/dom';
import type { Editor } from '@tiptap/core';
import type { PluginKey } from '@tiptap/pm/state';
import { ReactRenderer } from '@tiptap/react';
import type {
  SuggestionKeyDownProps,
  SuggestionOptions,
  SuggestionProps,
} from '@tiptap/suggestion';
import type { ComponentType } from 'react';

type SuggestionListHandle = {
  onKeyDown?: (props: SuggestionKeyDownProps) => boolean;
};

/**
 * Renders a suggestion list through TipTap's Floating UI `mount`, which tracks
 * the live suggestion decoration across scrolling and layout changes.
 *
 * ProseMirror destroys and recreates plugin views whenever the plugin set
 * changes, and the suggestion plugin reports that as an exit while its state
 * stays active. The popup survives such a recreation; it closes only when the
 * suggestion actually ends or the editor is destroyed or unmounted. A recreated
 * view skips `onExit` until its next update, so the popup also closes on the
 * editor's own `destroy` and `unmount` events.
 */
export function createSuggestionPopup<Extra extends object>(
  component: ComponentType<SuggestionProps & Extra>,
  pluginKey: PluginKey,
  /** Props the list receives in addition to TipTap's suggestion props. */
  extraProps: Extra
): NonNullable<SuggestionOptions['render']> {
  return () => {
    let renderer: ReactRenderer<
      SuggestionListHandle,
      SuggestionProps & Extra
    > | null = null;
    let unmount: (() => void) | null = null;
    let owner: Editor | null = null;

    const isActive = ({ editor }: SuggestionProps) =>
      !editor.isDestroyed && !!pluginKey.getState(editor.state)?.active;
    const close = () => {
      owner?.off('destroy', close);
      owner?.off('unmount', close);
      owner = null;
      unmount?.();
      unmount = null;
      renderer?.destroy();
      renderer = null;
    };
    const open = (props: SuggestionProps) => {
      renderer = new ReactRenderer<
        SuggestionListHandle,
        SuggestionProps & Extra
      >(component, {
        props: { ...props, ...extraProps },
        editor: props.editor,
        className: 'z-50',
      });
      unmount = props.mount(renderer.element as HTMLElement);
      owner = props.editor;
      owner.on('destroy', close);
      owner.on('unmount', close);
    };

    return {
      onStart: (props) => {
        close();
        open(props);
      },
      onUpdate: (props) => {
        if (renderer) renderer.updateProps({ ...props, ...extraProps });
        else open(props);
      },
      onKeyDown: (props) => renderer?.ref?.onKeyDown?.(props) ?? false,
      onExit: (props) => {
        if (!isActive(props)) {
          close();
          return;
        }
        // A plugin-view recreation: the next view keeps updating this popup.
        queueMicrotask(() => {
          if (!isActive(props)) close();
        });
      },
    };
  };
}

/** Keeps a suggestion popup inside the viewport, as Tippy's preventOverflow did. */
export const SUGGESTION_FLOATING_UI = {
  middleware: [shift({ padding: 8 })],
} satisfies SuggestionOptions['floatingUi'];
