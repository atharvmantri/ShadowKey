import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border-indigo-500/30 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]",
        secondary:
          "bg-white/[0.04] border-white/[0.06] text-[#a5b4fc] backdrop-blur-xl",
        destructive:
          "bg-destructive/20 border-destructive/40 text-destructive-foreground",
        outline:
          "border-white/[0.08] text-[#a5b4fc] backdrop-blur-xl",
        ghost:
          "text-[#6b7a9e] hover:text-white",
        link:
          "text-indigo-400 underline-offset-4 hover:underline",
        success:
          "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.15)]",
        warning:
          "bg-amber-500/15 border-amber-500/30 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.15)]",
        error:
          "bg-rose-500/15 border-rose-500/30 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.15)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"
  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
