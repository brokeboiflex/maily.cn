"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover: React.FC<
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>
> = PopoverPrimitive.Root

type PopoverTriggerProps = React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Trigger
> & {
  /** Base UI's shadcn style rewrites `asChild` to a `render` element. */
  render?: React.ReactElement<{ children?: React.ReactNode }>
}

const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  PopoverTriggerProps
>(({ render, children, asChild, ...props }, ref) => {
  if (render) {
    // Use a spread so shadcn's Base UI migration does not rewrite this internal
    // Radix implementation detail while converting consumer-facing `asChild`.
    const radixSlotProps = { asChild: true }

    return (
      <PopoverPrimitive.Trigger ref={ref} {...radixSlotProps} {...props}>
        {React.cloneElement(
          render,
          undefined,
          children ?? render.props.children
        )}
      </PopoverPrimitive.Trigger>
    )
  }

  const radixSlotProps = {
    asChild: asChild ?? React.isValidElement(children),
  }

  return (
    <PopoverPrimitive.Trigger ref={ref} {...radixSlotProps} {...props}>
      {children}
    </PopoverPrimitive.Trigger>
  )
})

PopoverTrigger.displayName = PopoverPrimitive.Trigger.displayName

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    portal?: boolean
  }
>(
  (
    { className, align = "center", sideOffset = 4, portal = false, ...props },
    ref
  ) => {
    const content = (
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-9999 w-72 rounded-md border border-border bg-background p-4 text-foreground shadow-md outline-hidden",
          "mly-editor",
          className
        )}
        {...props}
      />
    )

    if (!portal) {
      return content
    }

    return <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal>
  }
)

PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
