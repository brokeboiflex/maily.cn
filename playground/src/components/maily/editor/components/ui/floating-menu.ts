import type { BubbleMenuProps } from "@tiptap/react/menus"
import deepEql from "fast-deep-equal"
import { useCallback, useRef } from "react"

export const FLOATING_MENU_CLASS =
  "bg-popover text-popover-foreground ring-foreground/10 rounded-lg p-1 shadow-md ring-1 transition-[opacity,transform] duration-100"

export const BUBBLE_MENU_CONTENT_CLASS = "flex items-stretch gap-1"

export const FLOATING_BUBBLE_MENU_CLASS = `${FLOATING_MENU_CLASS} ${BUBBLE_MENU_CONTENT_CLASS}`

export const FLOATING_MENU_TRIGGER_CLASS =
  "h-7! min-h-7! rounded-md border-0 bg-transparent px-2 text-xs font-medium shadow-none"

export function useStableBubbleMenuProps(
  props: BubbleMenuProps
): BubbleMenuProps {
  const shouldShowRef = useRef(props.shouldShow)
  const appendToRef = useRef(props.appendTo)
  const getReferencedVirtualElementRef = useRef(
    props.getReferencedVirtualElement
  )
  const optionsRef = useRef(props.options)

  shouldShowRef.current = props.shouldShow
  appendToRef.current = props.appendTo
  getReferencedVirtualElementRef.current = props.getReferencedVirtualElement
  if (!deepEql(optionsRef.current, props.options)) {
    optionsRef.current = props.options
  }

  const shouldShow = useCallback<NonNullable<BubbleMenuProps["shouldShow"]>>(
    (context) => shouldShowRef.current?.(context) ?? false,
    []
  )
  const appendTo = useCallback<
    Extract<NonNullable<BubbleMenuProps["appendTo"]>, () => HTMLElement>
  >(() => {
    const currentAppendTo = appendToRef.current
    return typeof currentAppendTo === "function"
      ? currentAppendTo()
      : (currentAppendTo ?? document.body)
  }, [])
  const getReferencedVirtualElement = useCallback<
    NonNullable<BubbleMenuProps["getReferencedVirtualElement"]>
  >(() => getReferencedVirtualElementRef.current?.() ?? null, [])

  return {
    ...props,
    shouldShow: props.shouldShow ? shouldShow : props.shouldShow,
    appendTo: typeof props.appendTo === "function" ? appendTo : props.appendTo,
    getReferencedVirtualElement: props.getReferencedVirtualElement
      ? getReferencedVirtualElement
      : props.getReferencedVirtualElement,
    options: optionsRef.current,
  }
}
