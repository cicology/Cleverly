import { getConfidenceColor, formatConfidence } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface ConfidenceIndicatorProps {
  score: number
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ConfidenceIndicator({ score, showLabel = true, size = "md", className }: ConfidenceIndicatorProps) {
  const variant = getConfidenceColor(score) as "success" | "warning" | "error"

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && (
        <Badge variant={variant} className="font-mono text-xs">
          {formatConfidence(score)}
        </Badge>
      )}
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden min-w-20">
        <div
          className={cn("transition-all duration-300", sizeClasses[size], {
            "bg-green-500": score >= 85,
            "bg-yellow-500": score >= 70 && score < 85,
            "bg-red-500": score < 70,
          })}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  )
}
