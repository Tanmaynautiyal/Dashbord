import * as React from "react"
import { cn } from "../utils/cn"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "glass" | "gradient"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
      {
        "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]": variant === "default" || variant === "gradient",
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:-translate-y-0.5 active:translate-y-0": variant === "destructive",
        "border border-border/80 bg-background hover:bg-secondary/60 hover:text-foreground hover:border-primary/40 hover:shadow-sm": variant === "outline",
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:-translate-y-0.5 active:translate-y-0": variant === "secondary",
        "hover:bg-secondary/60 hover:text-foreground": variant === "ghost",
        "text-primary underline-offset-4 hover:underline": variant === "link",
        "glass text-foreground hover:bg-white/90 dark:hover:bg-slate-900/90 shadow-glass hover:shadow-lg hover:-translate-y-0.5": variant === "glass",
        "h-10 px-4 py-2": size === "default",
        "h-9 px-3 text-xs": size === "sm",
        "h-12 px-7 text-base rounded-2xl": size === "lg",
        "h-10 w-10": size === "icon",
      },
      className
    )

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(classes, (children as React.ReactElement<any>).props?.className),
        ...props,
      })
    }

    return (
      <button
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export default Button
