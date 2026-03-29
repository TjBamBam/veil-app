"use client"


import * as React from "react"
import * as SeparatorPrimitive from "@base-ui/react/separator"

import { cn } from "A/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root, React.ComponentProps<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={true}
    className={cn(
      "flex shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "w-[px] h-full",
      className
    )}
    {...props}
   />
));

export { Separator }
