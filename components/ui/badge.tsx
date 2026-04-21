import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-slate-800 text-[#8E939D] hover:bg-slate-700",
        destructive: "border-transparent bg-red-500/20 text-red-400 hover:bg-red-500/30",
        outline: "text-slate-400 border-slate-700",
        success: "border-transparent bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30",
        warning: "border-transparent bg-amber-500/20 text-amber-400 hover:bg-amber-500/30",
        info: "border-transparent bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }