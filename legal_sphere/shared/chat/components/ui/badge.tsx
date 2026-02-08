import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {}

function Badge({ className, ...props }: BadgeProps) {
  // Using a simple string to prevent any class name merging issues.
  return (
    <div
      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-transparent bg-primary text-xs font-semibold text-primary-foreground"
      {...props}
    />
  )
}

export { Badge }
