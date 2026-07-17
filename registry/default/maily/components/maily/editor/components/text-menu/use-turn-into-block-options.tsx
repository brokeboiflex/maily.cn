import { IconPlaceholder } from "@/components/icon-placeholder"
import { Editor, useEditorState } from '@tiptap/react';
import type { ReactNode } from 'react';
import { useMailyContext } from '../../provider';

export type TurnIntoBlockOptions = {
  label: string;
  id: string;
  type: 'option';
  disabled: () => boolean;
  isActive: () => boolean;
  onClick: () => void;
  icon: ReactNode;
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
        icon: <IconPlaceholder
  lucide="PilcrowIcon"
  tabler="IconPilcrow"
  hugeicons="ParagraphIcon"
  phosphor="Paragraph"
  remixicon="RiParagraph"
  className="size-[15px] shrink-0"
/>,
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
        icon: <IconPlaceholder
  lucide="Heading1Icon"
  tabler="IconH1"
  hugeicons="Heading01Icon"
  phosphor="TextHOne"
  remixicon="RiHeading"
  className="size-[15px] shrink-0"
/>,
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
        icon: <IconPlaceholder
  lucide="Heading2Icon"
  tabler="IconH2"
  hugeicons="Heading02Icon"
  phosphor="TextHTwo"
  remixicon="RiHeading"
  className="size-[15px] shrink-0"
/>,
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
        icon: <IconPlaceholder
  lucide="Heading3Icon"
  tabler="IconH3"
  hugeicons="Heading03Icon"
  phosphor="TextHThree"
  remixicon="RiHeading"
  className="size-[15px] shrink-0"
/>,
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
        icon: <IconPlaceholder
  lucide="FootprintsIcon"
  tabler="IconWalk"
  hugeicons="FootprintsIcon"
  phosphor="Footprints"
  remixicon="RiFootprintLine"
  className="size-[15px] shrink-0"
/>,
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
        icon: <IconPlaceholder
  lucide="ListIcon"
  tabler="IconList"
  hugeicons="LeftToRightListBulletIcon"
  phosphor="ListBullets"
  remixicon="RiListUnordered"
  className="size-[15px] shrink-0"
/>,
        onClick: () => editor.chain().focus().toggleBulletList().run(),
        id: 'bulletList',
        disabled: () => !editor.can().toggleBulletList(),
        isActive: () => editor.isActive('bulletList'),
        label: t('turnInto.bulletList'),
        type: 'option',
      },
      {
        icon: <IconPlaceholder
  lucide="ListOrderedIcon"
  tabler="IconListNumbers"
  hugeicons="LeftToRightListNumberIcon"
  phosphor="ListNumbers"
  remixicon="RiListOrdered"
  className="size-[15px] shrink-0"
/>,
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
