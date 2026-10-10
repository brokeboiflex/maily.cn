import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react"
import { createPortal } from "react-dom"
import type { Editor } from "@tiptap/core"
import { useEditorState } from "@tiptap/react"
import { closeHistory } from "@tiptap/pm/history"
import { TextSelection } from "@tiptap/pm/state"
import type { BlockItem } from "../../blocks"
import { useMailyContext } from "../provider"
import { cn } from "@/lib/utils"
import { runMobileBlockAction } from "../utils/mobile-block-actions"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Toggle } from "@/components/ui/toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TextBubbleContent } from "./text-menu/text-bubble-content"
import { MobileEditorContext } from "./mobile-editor-context"
import {
  Plus,
  CaseSensitive,
  Undo2,
  Redo2,
  MoreVertical,
  X,
  ArrowLeft,
  ArrowUpIcon,
  ArrowDownIcon,
  Copy,
  Trash2,
} from "lucide-react"

type Panel = "insert" | "format" | "block"

// Local density adaptation of the existing Maily controls; host primitives stay untouched.
const TOUCH_CONTROLS =
  "[&_button]:min-h-11! [&_button]:min-w-11! [&_input]:min-h-11 [&_input]:text-base [&_[role=separator]]:hidden [&_[data-slot=toggle-group]]:flex-wrap [&_svg]:size-5"

export function MobileEditor({
  editor,
  compact,
  enabled,
  allowBlockActions,
  root,
  children,
}: {
  editor: Editor
  compact: boolean
  enabled: boolean
  allowBlockActions: boolean
  root: RefObject<HTMLDivElement | null>
  children: ReactNode
}) {
  const { t, blocks = [], editorActions } = useMailyContext()
  const [active, setActive] = useState(false)
  const [panel, setPanel] = useState<Panel | null>(null)
  const [contentPanel, setContentPanel] = useState<Panel>("insert")
  const panelRef = useRef<Panel | null>(null)
  const panelId = useId()
  const [path, setPath] = useState<BlockItem[]>([])
  const [nodeTarget, setNodeTarget] = useState<HTMLDivElement | null>(null)
  const [viewport, setViewport] = useState({ bottom: 0, height: 0 })
  const channel = useId()
  const pending = useRef<
    ReturnType<NonNullable<typeof editorActions>["capture"]> | undefined
  >(undefined)
  const dock = useRef<HTMLDivElement>(null)

  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      undo: typeof editor.commands.undo === "function" && editor.can().undo(),
      redo: typeof editor.commands.redo === "function" && editor.can().redo(),
      up: runMobileBlockAction(editor, "up", false),
      down: runMobileBlockAction(editor, "down", false),
      duplicate: runMobileBlockAction(editor, "duplicate", false),
      textFormatting: editor.state.selection instanceof TextSelection,
      doc: editor.state.doc,
      selection: editor.state.selection,
    }),
  })

  useLayoutEffect(
    () => () => {
      editorActions?.cancel(channel)
    },
    [editorActions, channel]
  )

  useEffect(() => {
    if (!compact || !enabled) {
      editorActions?.cancel(channel)
      setActive(false)
      panelRef.current = null
      setPanel(null)
      return
    }
    const element = root.current
    const onFocus = () => setActive(true)
    const onEditorPointer = () => {
      if (panelRef.current) {
        panelRef.current = null
        setPanel(null)
        editorActions?.cancel(channel)
      }
      setActive(true)
    }
    const outside = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        !element?.contains(target) &&
        !dock.current?.contains(target) &&
        !panel
      )
        setActive(false)
    }
    editor.on("focus", onFocus)
    element?.addEventListener("pointerdown", onEditorPointer)
    document.addEventListener("pointerdown", outside)
    if (editor.isFocused) setActive(true)
    return () => {
      editor.off("focus", onFocus)
      element?.removeEventListener("pointerdown", onEditorPointer)
      document.removeEventListener("pointerdown", outside)
    }
  }, [compact, enabled, editor, root, panel, editorActions, channel])

  useEffect(() => {
    if (!compact) return
    const visual = window.visualViewport
    const update = () => {
      const next = {
        bottom: visual
          ? Math.max(0, window.innerHeight - visual.height - visual.offsetTop)
          : 0,
        height: visual?.height ?? window.innerHeight,
      }
      setViewport((current) =>
        current.bottom === next.bottom && current.height === next.height
          ? current
          : next
      )
    }
    update()
    visual?.addEventListener("resize", update)
    visual?.addEventListener("scroll", update)
    window.addEventListener("resize", update)
    return () => {
      visual?.removeEventListener("resize", update)
      visual?.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [compact])

  useEffect(() => {
    if (!compact || !active || !enabled) return
    const frame = requestAnimationFrame(() => {
      if (editor.isDestroyed) return
      if (panelRef.current) return
      const chrome = dock.current
      if (!chrome) return
      const caret = editor.view.coordsAtPos(editor.state.selection.from)
      let remaining = caret.bottom - chrome.getBoundingClientRect().top + 16
      // Scroll the actual embedding scroller first, then the page. Merely
      // padding the document does not keep a caret above a portalled keyboard panel.
      for (
        let parent = editor.view.dom.parentElement;
        parent && remaining > 0;
        parent = parent.parentElement
      ) {
        if (!/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) continue
        const before = parent.scrollTop
        parent.scrollTop += remaining
        remaining -= parent.scrollTop - before
      }
      if (remaining > 0)
        window.scrollBy({ top: remaining, behavior: "instant" })
    })
    return () => cancelAnimationFrame(frame)
  }, [active, compact, enabled, editor, viewport])

  const close = useCallback(
    (focus = false) => {
      if (!panelRef.current) return
      panelRef.current = null
      setPanel(null)
      editorActions?.cancel(channel)
      if (focus && !editor.isDestroyed) editor.view.focus()
    },
    [channel, editor, editorActions]
  )

  useEffect(() => {
    if (!panel) return
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return
      event.preventDefault()
      close(true)
    }
    document.addEventListener("keydown", onEscape)
    return () => document.removeEventListener("keydown", onEscape)
  }, [panel, close])

  const open = (next: Panel) => {
    if (panelRef.current === next) return
    panelRef.current = next
    setContentPanel(next)
    // A toolbar action is a separate undo step from the text typed before it.
    editor.view.dispatch(closeHistory(editor.state.tr))
    pending.current = editorActions?.capture(channel)
    setPath([])
    setPanel(next)
    // The picker replaces the software keyboard, as in the supplied reference.
    editor.view.dom.blur()
    const selection = editor.view.dom.ownerDocument.getSelection()
    if (
      selection?.anchorNode &&
      editor.view.dom.contains(selection.anchorNode)
    ) {
      selection.removeAllRanges()
    }
    dock.current
      ?.querySelector<HTMLElement>(`[data-maily-panel="${next}"]`)
      ?.focus({ preventScroll: true })
  }
  const insert = (item: BlockItem) => {
    if (item.commands) {
      setPath([...path, item])
      return
    }
    pending.current?.run(() => {
      const from = editor.state.selection.from
      item.command({ editor, range: { from, to: from } })
    })
    close(true)
  }
  const icon = (
    label: string,
    content: ReactNode,
    onClick: () => void,
    disabled = false
  ) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11! shrink-0 p-0"
            aria-label={label}
            disabled={disabled}
            onPointerDown={(event) => event.preventDefault()}
            onClick={onClick}
          >
            {content}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
  const toolbar = (
    <div
      role="toolbar"
      aria-label={t("mobile.toolbar")}
      className="flex min-w-0 shrink-0 items-center overflow-x-auto rounded-lg border bg-background p-2"
    >
      <Toggle
        data-maily-panel="insert"
        pressed={panel === "insert"}
        aria-label={t("mobile.insert")}
        aria-controls={panelId}
        aria-expanded={panel === "insert"}
        className="size-11! shrink-0 p-0"
        onPointerDown={(event) => event.preventDefault()}
        onPressedChange={() => open("insert")}
      >
        <Plus className="size-6" />
      </Toggle>
      <Toggle
        data-maily-panel="format"
        pressed={panel === "format"}
        aria-label={t("mobile.format")}
        aria-controls={panelId}
        aria-expanded={panel === "format"}
        className="size-11! shrink-0 p-0"
        onPointerDown={(event) => event.preventDefault()}
        onPressedChange={() => open("format")}
      >
        <CaseSensitive className="size-6" />
      </Toggle>
      {icon(
        t("mobile.undo"),
        <Undo2 className="size-6" />,
        () => editor.commands.undo(),
        !state.undo
      )}
      {icon(
        t("mobile.redo"),
        <Redo2 className="size-6" />,
        () => editor.commands.redo(),
        !state.redo
      )}
      {allowBlockActions && (
        <Toggle
          data-maily-panel="block"
          pressed={panel === "block"}
          aria-label={t("contentMenu.nodeActions")}
          aria-controls={panelId}
          aria-expanded={panel === "block"}
          className="size-11! shrink-0 p-0"
          onPointerDown={(event) => event.preventDefault()}
          onPressedChange={() => open("block")}
        >
          <MoreVertical className="size-6" />
        </Toggle>
      )}
      <div className="ml-auto border-l pl-1">
        {icon(t("mobile.close"), <X className="size-6" />, () => {
          if (panelRef.current) {
            close(true)
            return
          }
          setActive(false)
          editor.view.dom.blur()
        })}
      </div>
    </div>
  )
  const current = path.at(-1)
  const groups = current?.commands
    ? [{ title: current.title, commands: current.commands }]
    : blocks

  const panelHeight = Math.max(
    0,
    (viewport.height
      ? Math.min(480, viewport.height * (viewport.height < 500 ? 0.7 : 0.48))
      : 360) - 80
  )
  const panelLabel =
    contentPanel === "insert"
      ? t("mobile.insert")
      : contentPanel === "format"
        ? t("mobile.format")
        : t("contentMenu.nodeActions")

  return (
    <MobileEditorContext.Provider value={{ compact, nodeTarget }}>
      {children}
      {compact &&
        enabled &&
        active &&
        createPortal(
          <div
            ref={dock}
            data-maily-mobile-toolbar=""
            className="fixed inset-x-0 z-50 mx-auto max-w-lg bg-background px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-transform duration-200 ease-out motion-reduce:transition-none"
            style={{
              bottom: viewport.bottom,
              transform: `translateY(${panel ? 0 : panelHeight}px)`,
            }}
            onKeyDown={(event) => {
              if (
                !event.defaultPrevented &&
                event.key === "Escape" &&
                panelRef.current
              ) {
                event.preventDefault()
                close(true)
              }
            }}
          >
            <Collapsible open={!!panel}>
              {toolbar}
              <div
                style={{ height: panelHeight }}
                ref={(element) => {
                  if (element) element.inert = !panel
                }}
                aria-hidden={!panel || undefined}
              >
                <CollapsibleContent
                  id={panelId}
                  role="region"
                  aria-label={panelLabel}
                  className="h-full [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] overflow-y-auto overscroll-contain duration-200 motion-reduce:animate-none data-closed:animate-out data-closed:fade-out-0"
                >
                  <div className="pt-5 pb-2">
                    {contentPanel === "insert" && (
                      <>
                        {current && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="mb-3 min-h-11"
                            onClick={() => setPath(path.slice(0, -1))}
                          >
                            <ArrowLeft className="size-5" />
                            {t("mobile.back")}
                          </Button>
                        )}
                        {groups.map((group, groupIndex) => (
                          <section key={groupIndex} className="mb-5 last:mb-0">
                            <h3 className="mb-3 px-2 text-sm font-medium text-muted-foreground">
                              {group.title}
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                              {group.commands.map((item, index) => {
                                const custom = item.render?.(editor)
                                if (custom === null) return null
                                if (custom && custom !== true)
                                  return (
                                    <div
                                      key={index}
                                      className="col-span-2 min-w-0"
                                    >
                                      {custom}
                                    </div>
                                  )
                                return (
                                  <Button
                                    key={index}
                                    type="button"
                                    variant="outline"
                                    className="h-auto min-h-14 min-w-0 justify-start gap-2 px-2.5 py-3 text-left text-sm font-medium whitespace-normal shadow-none"
                                    onClick={() => insert(item)}
                                  >
                                    <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-5">
                                      {item.icon}
                                    </span>
                                    <span className="min-w-0 break-words">
                                      {item.title}
                                    </span>
                                  </Button>
                                )
                              })}
                            </div>
                          </section>
                        ))}
                      </>
                    )}
                    {contentPanel === "format" && (
                      <div className={cn("space-y-4", TOUCH_CONTROLS)}>
                        <div
                          ref={setNodeTarget}
                          className="space-y-4 empty:hidden"
                        />
                        {state.textFormatting && (
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <TextBubbleContent editor={editor} />
                          </div>
                        )}
                      </div>
                    )}
                    {contentPanel === "block" && (
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            [
                              "up",
                              t("mobile.moveUp"),
                              <ArrowUpIcon />,
                              !state.up,
                            ],
                            [
                              "down",
                              t("mobile.moveDown"),
                              <ArrowDownIcon />,
                              !state.down,
                            ],
                            [
                              "duplicate",
                              t("contentMenu.duplicate"),
                              <Copy />,
                              !state.duplicate,
                            ],
                            [
                              "delete",
                              t("contentMenu.delete"),
                              <Trash2 />,
                              false,
                            ],
                          ] as const
                        ).map(([action, label, glyph, disabled]) => (
                          <Button
                            key={action}
                            type="button"
                            variant="outline"
                            className="min-h-14 justify-start gap-3 whitespace-normal"
                            disabled={disabled}
                            onClick={() => {
                              pending.current?.run(() =>
                                runMobileBlockAction(editor, action)
                              )
                              close(true)
                            }}
                          >
                            {glyph}
                            {label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>,
          document.body
        )}
    </MobileEditorContext.Provider>
  )
}
