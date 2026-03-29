"use client"

import * as React from "react"
import * as AvatarPrimitive from "@base-ui/react/avatar"

import { cn } from "A/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root,
  React.ComponentProps<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("h-9 w-9 rounded-full order", className)}
    {...props}
  />
))

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image,
  React.ComponentProps<typeof AvatarPrimitive.Image>
>)(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("h-full w-full object-cover", className)}
    {...props}
   />
))