import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BoldIcon,
  EraserIcon,
  ItalicIcon,
  LinkIcon,
  SeparatorHorizontal,
  StrikethroughIcon,
  UnderlineIcon,
} from "lucide-react"
import { useMemo } from "react"
import { Editor as EditorType } from "@tiptap/core"
import { EditorProps } from ".."
import { cn } from "@/lib/utils"
import { BubbleMenuButton } from "./bubble-menu-button"
import { BubbleMenuItem } from "./text-menu/text-bubble-menu"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface EditorMenuItem extends BubbleMenuItem {
  group: "alignment" | "image" | "mark" | "custom" | "email"
}

type EditorMenuBarProps = {
  config: EditorProps["config"]
  editor: EditorType
}

// Items in the `mark` group that are real on/off toggles (the rest, e.g. the
// eraser, are one-shot actions and stay plain buttons).
const MARK_TOGGLE_NAMES = new Set(["bold", "italic", "underline", "strike"])

function ToggleItem(item: EditorMenuItem) {
  return (
    <ToggleGroupItem
      value={item.name!}
      aria-label={item.name}
      onClick={item.command}
      disabled={item.disbabled}
      className="size-7! px-2.5 disabled:cursor-not-allowed"
    >
      {item.icon ? (
        <item.icon className="h-3 w-3 shrink-0 stroke-[2.5]" />
      ) : (
        <span className="text-sm font-medium text-muted-foreground">
          {item.name}
        </span>
      )}
    </ToggleGroupItem>
  )
}

export const EditorMenuBar = (props: EditorMenuBarProps) => {
  const { editor, config } = props

  const items: EditorMenuItem[] = useMemo(
    () => [
      {
        name: "bold",
        command: () => editor.chain().focus().toggleBold().run(),
        isActive: () => editor.isActive("bold"),
        group: "mark",
        icon: BoldIcon,
      },
      {
        name: "italic",
        command: () => editor.chain().focus().toggleItalic().run(),
        isActive: () => editor.isActive("italic"),
        group: "mark",
        icon: ItalicIcon,
      },
      {
        name: "underline",
        command: () => editor.chain().focus().toggleUnderline().run(),
        isActive: () => editor.isActive("underline"),
        group: "mark",
        icon: UnderlineIcon,
      },
      {
        name: "strike",
        command: () => editor.chain().focus().toggleStrike().run(),
        isActive: () => editor.isActive("strike"),
        group: "mark",
        icon: StrikethroughIcon,
      },
      {
        name: "delete-line",
        command: () =>
          editor.chain().focus().selectParentNode().deleteSelection().run(),
        isActive: () => false,
        group: "mark",
        icon: EraserIcon,
      },
      {
        name: "divider",
        command: () => editor.chain().focus().setHorizontalRule().run(),
        isActive: () => editor.isActive("horizontalRule"),
        group: "custom",
        icon: SeparatorHorizontal,
      },
      {
        name: "link",
        command: () => {
          const previousUrl = editor.getAttributes("link").href
          const url = window.prompt("URL", previousUrl)
          // If the user cancels the prompt, we don't want to toggle the link
          if (url === null) return
          // If the user deletes the URL entirely, we'll unlink the selected text
          if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run()
            return
          }

          // Otherwise, we set the link to the given URL
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run()
        },
        isActive: () => editor.isActive("link"),
        group: "custom",
        icon: LinkIcon,
      },
      {
        name: "left",
        command: () => editor.chain().focus().setTextAlign("left").run(),
        isActive: () => editor.isActive({ textAlign: "left" }),
        group: "alignment",
        icon: AlignLeft,
      },
      {
        name: "center",
        command: () => editor.chain().focus().setTextAlign("center").run(),
        isActive: () => editor.isActive({ textAlign: "center" }),
        group: "alignment",
        icon: AlignCenter,
      },
      {
        name: "right",
        command: () => editor.chain().focus().setTextAlign("right").run(),
        isActive: () => editor.isActive({ textAlign: "right" }),
        group: "alignment",
        icon: AlignRight,
      },
    ],
    [editor]
  )

  const groups = useMemo(
    () =>
      items.reduce((acc, item) => {
        if (!acc.includes(item.group)) {
          acc.push(item.group)
        }
        return acc
      }, [] as string[]),
    [items]
  )

  if (!editor) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-3", config?.toolbarClassName)}>
      {groups.map((group) => {
        const groupItems = items.filter((item) => item.group === group)

        return (
          <div
            key={group}
            className="flex items-center gap-1 rounded-md border border-border bg-background p-1"
          >
            {renderGroup(group, groupItems)}
          </div>
        )
      })}
    </div>
  )
}

function renderGroup(group: string, groupItems: EditorMenuItem[]) {
  // Single-select alignment toggle (left / center / right).
  if (group === "alignment") {
    const activeAlignment =
      groupItems.find((item) => item.isActive?.())?.name ?? ""

    return (
      <ToggleGroup type="single" value={activeAlignment}>
        {groupItems.map((item) => (
          <ToggleItem key={item.name} {...item} />
        ))}
      </ToggleGroup>
    )
  }

  // Multi-select text marks (bold / italic / underline / strike); any
  // non-toggle items in the group (the eraser) render as plain buttons.
  if (group === "mark") {
    const toggleItems = groupItems.filter((item) =>
      MARK_TOGGLE_NAMES.has(item.name!)
    )
    const actionItems = groupItems.filter(
      (item) => !MARK_TOGGLE_NAMES.has(item.name!)
    )
    const activeMarks = toggleItems
      .filter((item) => item.isActive?.())
      .map((item) => item.name!)

    return (
      <>
        <ToggleGroup type="multiple" value={activeMarks}>
          {toggleItems.map((item) => (
            <ToggleItem key={item.name} {...item} />
          ))}
        </ToggleGroup>
        {actionItems.map((item) => (
          <BubbleMenuButton key={item.name} {...item} />
        ))}
      </>
    )
  }

  // Everything else (divider, link, …) stays a plain action button.
  return groupItems.map((item) => (
    <BubbleMenuButton key={item.name} {...item} />
  ))
}
