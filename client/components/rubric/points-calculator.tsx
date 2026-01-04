import { Card, CardContent } from "@/components/ui/card"
import { Calculator, Hash, Target } from "lucide-react"

interface PointsCalculatorProps {
  totalPoints: number
  questionCount: number
}

export function PointsCalculator({ totalPoints, questionCount }: PointsCalculatorProps) {
  const avgPointsPerQuestion = questionCount > 0 ? (totalPoints / questionCount).toFixed(1) : "0"

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Calculator className="size-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">{totalPoints}</div>
            <div className="text-xs text-muted-foreground">Total Points</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <Hash className="size-5 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">{questionCount}</div>
            <div className="text-xs text-muted-foreground">Questions</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <Target className="size-5 text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">{avgPointsPerQuestion}</div>
            <div className="text-xs text-muted-foreground">Avg per Question</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
