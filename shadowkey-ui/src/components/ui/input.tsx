import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-xl border bg-white/[0.03] px-3 py-1 text-base shadow-xs transition-all duration-200 outline-none selection:bg-indigo-500/30 selection:text-white file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "border-white/[0.06] text-white backdrop-blur-xl",
        "focus-visible:border-indigo-500/50 focus-visible:ring-[3px] focus-visible:ring-indigo-500/20",
        "aria-invalid:border-rose-500/50 aria-invalid:ring-rose-500/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
