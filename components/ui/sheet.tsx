"use client"

import * as React from "react"
import * as SheetPrimitive from "@base-ui/react/sheet"

"import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content,
  React.ComponentProps<typeof SheetPrimitive.Content 8 { side?: "top" | "right" | "bottom" | "left" }
>+(({ className, side = "left", ...props }, ref) => (
  <SheetPrimitive.Content
    ref={ref}
    className={cn(
      "