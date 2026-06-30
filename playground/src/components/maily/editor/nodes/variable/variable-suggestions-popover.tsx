import { cn } from "@/lib/utils"
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { Variable } from "./variable"
import {
  Braces,
  ArrowDownIcon,
  ArrowUpIcon,
  CornerDownLeftIcon,
} from "lucide-react"

export type VariableSuggestionsPopoverProps = {
  items: Variable[]
  onSelectItem: (item: Variable) => void
}

export type VariableSuggestionsPopoverRef = {
  moveUp: () => void
  moveDown: () => void
  select: () => void
}

export type VariableSuggestionsPopoverType = React.ForwardRefExoticComponent<
  VariableSuggestionsPopoverProps &
    React.RefAttributes<VariableSuggestionsPopoverRef>
>

export const VariableSuggestionsPopover: VariableSuggestionsPopoverType =
  forwardRef((props, ref) => {
    const { items, onSelectItem } = props

    const [selectedIndex, setSelectedIndex] = useState(0)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

    const scrollSelectedIntoView = (index: number) => {
      const container = scrollContainerRef.current
      const selectedItem = itemRefs.current[index]

      if (!container || !selectedItem) {
        return
      }

      const containerRect = container.getBoundingClientRect()
      const itemRect = selectedItem.getBoundingClientRect()

      const padding = 4
      if (itemRect.bottom > containerRect.bottom) {
        container.scrollTop += itemRect.bottom - containerRect.bottom + padding
      } else if (itemRect.top < containerRect.top) {
        container.scrollTop += itemRect.top - containerRect.top - padding
      }
    }

    useEffect(() => {
      setSelectedIndex(0)
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0
      }
      itemRefs.current = items.map(() => null)
    }, [items])

    useEffect(() => {
      scrollSelectedIntoView(selectedIndex)
    }, [selectedIndex])

    useImperativeHandle(ref, () => ({
      moveUp: () => {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length)
      },
      moveDown: () => {
        setSelectedIndex((selectedIndex + 1) % items.length)
      },
      select: () => {
        const item = items[selectedIndex]
        if (!item) {
          return
        }

        onSelectItem(item)
      },
    }))

    return (
      <div className="z-50 w-64 rounded-lg border border-border bg-background shadow-md transition-all">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-1 py-1.5 text-muted-foreground">
          <span className="text-xs uppercase">Variables</span>
          <VariableIcon>
            <Braces className="size-3 stroke-[2.5]" />
          </VariableIcon>
        </div>

        <div ref={scrollContainerRef} className="max-h-52 overflow-y-auto">
          <div className="flex w-fit min-w-full flex-col gap-0.5 p-1">
            {items?.length ? (
              items?.map((item, index: number) => (
                <button
                  key={index}
                  ref={(el) => {
                    itemRefs.current[index] = el
                  }}
                  onClick={() => onSelectItem(item)}
                  className={cn(
                    "flex w-fit min-w-full items-center gap-2 rounded-md px-2 py-1 text-left font-mono text-sm text-foreground hover:bg-muted",
                    index === selectedIndex ? "bg-muted" : "bg-background"
                  )}
                >
                  <Braces className="size-3 stroke-[2.5] text-rose-600" />
                  {item?.label || item.name}
                </button>
              ))
            ) : (
              <div className="flex h-7 w-full items-center gap-2 rounded-md px-2 py-1 text-left font-mono text-[13px] text-foreground hover:bg-muted">
                No result
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border px-1 py-1.5 text-muted-foreground">
          <div className="flex items-center gap-1">
            <VariableIcon>
              <ArrowDownIcon className="size-3 stroke-[2.5]" />
            </VariableIcon>
            <VariableIcon>
              <ArrowUpIcon className="size-3 stroke-[2.5]" />
            </VariableIcon>
            <span className="text-xs text-muted-foreground">Navigate</span>
          </div>
          <VariableIcon>
            <CornerDownLeftIcon className="size-3 stroke-[2.5]" />
          </VariableIcon>
        </div>
      </div>
    )
  })

type VariableIconProps = {
  className?: string
  children: React.ReactNode
}

function VariableIcon(props: VariableIconProps) {
  const { className, children } = props

  return (
    <div
      className={cn(
        "flex size-5 items-center justify-center rounded-md border border-border",
        className
      )}
    >
      {children}
    </div>
  )
}
