import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

// Định nghĩa các kiểu hiển thị của nút
const buttonVariants = {
  variant: {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-transparent hover:bg-secondary text-slate-900",
    ghost: "hover:bg-secondary text-slate-900",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3 text-xs",
    icon: "h-10 w-10",
  },
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant
  size?: keyof typeof buttonVariants.size
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className
        )}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"
export { Button }