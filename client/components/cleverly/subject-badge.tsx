import { getSubjectColor } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"

interface SubjectBadgeProps {
  subject: string
  className?: string
}

export function SubjectBadge({ subject, className }: SubjectBadgeProps) {
  const color = getSubjectColor(subject)

  return (
    <span
      className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold", className)}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        borderColor: `${color}30`,
        borderWidth: "1px",
      }}
    >
      {subject}
    </span>
  )
}
