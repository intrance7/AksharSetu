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

    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-900 disabled:pointer-events-none disabled:opacity-50"
    
    let variantStyles = ""
    switch (variant) {
      case "default": // Navy
        variantStyles = "bg-[#0b1b3d] text-white hover:bg-[#0b1b3d]/90 shadow-md hover:shadow-lg"
        break
      case "primary": // Orange
        variantStyles = "bg-[#f97316] text-white hover:bg-[#ea580c] shadow-md hover:shadow-lg hover:-translate-y-0.5"
        break
      case "outline":
        variantStyles = "border-2 border-[#0b1b3d] bg-transparent text-[#0b1b3d] hover:bg-[#0b1b3d] hover:text-white shadow-sm"
        break
      case "ghost":
        variantStyles = "hover:bg-[#f3f4f6] text-[#4b5563] hover:text-[#0b1b3d]"
        break
      case "link":
        variantStyles = "text-[#f97316] underline-offset-4 hover:underline"
        break
      case "secondary":
        variantStyles = "bg-white text-[#0b1b3d] border border-gray-200 hover:bg-gray-50 shadow-sm"
        break
    }

    let sizeStyles = ""
    switch (size) {
      case "default":
        sizeStyles = "h-11 px-6 py-2"
        break
      case "sm":
        sizeStyles = "h-9 px-4 text-xs"
        break
      case "lg":
        sizeStyles = "h-12 px-8 text-base"
        break
      case "icon":
        sizeStyles = "h-11 w-11"
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

