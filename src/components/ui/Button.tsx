import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-base font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-camp-orange/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transform active:scale-97 shadow-md hover:shadow-xl",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-camp-orange via-warm-2 to-warm-1 text-white hover:shadow-xl hover:shadow-camp-orange/30 hover:scale-105",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border-2 border-camp-orange text-camp-orange bg-transparent hover:bg-camp-orange hover:text-white hover:shadow-md",
        secondary: "bg-cool-3 text-cool-1 hover:bg-cool-2",
        ghost: "hover:bg-cool-3/20 hover:text-camp-dark",
        link: "text-camp-orange underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-camp-orange via-warm-2 to-warm-1 text-white hover:shadow-2xl hover:scale-105",
      },
      size: {
        default: "h-12 px-6 py-2.5",
        sm: "h-10 rounded-lg px-4",
        lg: "h-14 rounded-xl px-10 text-lg",
        xl: "h-16 rounded-2xl px-12 text-xl",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
