import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "primary" | "outline" | "ghost" | "link" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0066cc] disabled:pointer-events-none disabled:opacity-50"
    
    let variantStyles = ""
    switch (variant) {
      case "default": // Apple Blue
        variantStyles = "bg-[#0066cc] text-white hover:bg-[#0071e3]"
        break
      case "primary": // Also Apple Blue for legacy usage
        variantStyles = "bg-[#0066cc] text-white hover:bg-[#0071e3]"
        break
      case "outline":
        variantStyles = "border border-[#0066cc] bg-transparent text-[#0066cc] hover:bg-[#0066cc] hover:text-white"
        break
      case "ghost":
        variantStyles = "hover:bg-[#f5f5f7] text-[#1d1d1f]"
        break
      case "link":
        variantStyles = "text-[#0066cc] hover:underline"
        break
      case "secondary": // Gray pill
        variantStyles = "bg-[#e8e8ed] text-[#1d1d1f] hover:bg-[#d2d2d7]"
        break
    }

    let sizeStyles = ""
    switch (size) {
      case "default":
        sizeStyles = "h-10 px-4 py-2"
        break
      case "sm":
        sizeStyles = "h-8 px-3 text-xs"
        break
      case "lg":
        sizeStyles = "h-12 px-6 text-base"
        break
      case "icon":
        sizeStyles = "h-10 w-10"
        break
    }

    return (
      <Comp
        className={cn(baseStyles, variantStyles, sizeStyles, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }

