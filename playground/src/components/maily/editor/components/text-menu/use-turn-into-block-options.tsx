import { FootprintsIcon, Heading1Icon, Heading2Icon, Heading3Icon, ListIcon, ListOrderedIcon, LucideIcon, PilcrowIcon } from "lucide-react"
import { Editor, useEditorState } from '@tiptap/react';
import { useMailyContext } from '../../provider';

export type TurnIntoBlockOptions = {
  label: string;
  id: string;
  type: 'option';
  disabled: () => boolean;
  isActive: () => boolean;
  onClick: () => void;
  icon: LucideIcon;
};

export type TurnIntoBlockCategory = {
  label: string;
  id: string;
  type: 'category';
};

export type TurnIntoOptions = Array<
  TurnIntoBlockOptions | TurnIntoBlockCategory
>;

export function useTurnIntoBlockOptions(editor: Editor) {
  const { t } = useMailyContext();
  return useEditorState({
    editor,
    selector: ({ editor }): TurnIntoOptions => [
      {
        type: 'category',
        label: t('turnInto.hierarchy'),
        id: 'hierarchy',
      },
      {
        icon: PilcrowIcon,
        onClick: () =>
          editor.chain().focus().liftListItem('listItem').setParagraph().run(),
        id: 'paragraph',
        disabled: () => !editor.can().setParagraph(),
        isActive: () =>
          editor.isActive('paragraph') &&
          !editor.isActive('orderedList') &&
          !editor.isActive('bulletList') &&
          !editor.isActive('taskList'),
        label: t('turnInto.paragraph'),
        type: 'option',
      },
      {
        icon: Heading1Icon,
        onClick: () =>
          editor
            .chain()
            .focus()
            .liftListItem('listItem')
            .setHeading({ level: 1 })
            .run(),
        id: 'heading1',
        disabled: () => !editor.can().setHeading({ level: 1 }),
        isActive: () => editor.isActive('heading', { level: 1 }),
        label: t('turnInto.heading1'),
        type: 'option',
      },
      {
        icon: Heading2Icon,
        onClick: () =>
          editor
            .chain()
            .focus()
            .liftListItem('listItem')
            .setHeading({ level: 2 })
            .run(),
        id: 'heading2',
        disabled: () => !editor.can().setHeading({ level: 2 }),
        isActive: () => editor.isActive('heading', { level: 2 }),
        label: t('turnInto.heading2'),
        type: 'option',
      },
      {
        icon: Heading3Icon,
        onClick: () =>
          editor
            .chain()
            .focus()
            .liftListItem('listItem')
            .setHeading({ level: 3 })
            .run(),
        id: 'heading3',
        disabled: () => !editor.can().setHeading({ level: 3 }),
        isActive: () => editor.isActive('heading', { level: 3 }),
        label: t('turnInto.heading3'),
        type: 'option',
      },
      {
        id: 'footer',
        type: 'option',
        label: t('turnInto.footer'),
        icon: FootprintsIcon,
        onClick: () => {
          editor.chain().focus().liftListItem('listItem').setFooter().run();
        },
        disabled: () => !editor.can().setFooter(),
        isActive: () => editor.isActive('footer'),
      },
      {
        type: 'category',
        label: t('turnInto.lists'),
        id: 'lists',
      },
      {
        icon: ListIcon,
        onClick: () => editor.chain().focus().toggleBulletList().run(),
        id: 'bulletList',
        disabled: () => !editor.can().toggleBulletList(),
        isActive: () => editor.isActive('bulletList'),
        label: t('turnInto.bulletList'),
        type: 'option',
      },
      {
        icon: ListOrderedIcon,
        onClick: () => editor.chain().focus().toggleOrderedList().run(),
        id: 'orderedList',
        disabled: () => !editor.can().toggleOrderedList(),
        isActive: () => editor.isActive('orderedList'),
        label: t('turnInto.numberedList'),
        type: 'option',
      },
    ],
  });
}
