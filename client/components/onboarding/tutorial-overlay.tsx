"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, ArrowRight, ArrowLeft } from "lucide-react"

interface TutorialStep {
  title: string
  description: string
  target?: string
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Navigation Sidebar",
    description: "Access all main features from the sidebar. Click any item to navigate between sections.",
    target: "sidebar",
  },
  {
    title: "Quick Actions",
    description: "Use the dashboard for quick access to common tasks like creating courses or grading submissions.",
    target: "dashboard",
  },
  {
    title: "Search & Notifications",
    description: "Search for anything using the search bar, and stay updated with the notification bell.",
    target: "topnav",
  },
]

interface TutorialOverlayProps {
  onComplete: () => void
}

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [visible, setVisible] = useState(true)

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setVisible(false)
    setTimeout(onComplete, 300)
  }

  if (!visible) return null

  const step = tutorialSteps[currentStep]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="relative">
          <Button variant="ghost" size="icon-sm" onClick={handleComplete} className="absolute top-4 right-4">
            <X className="size-4" />
          </Button>
          <div className="pr-8">
            <div className="text-sm text-muted-foreground mb-2">
              Step {currentStep + 1} of {tutorialSteps.length}
            </div>
            <CardTitle>{step.title}</CardTitle>
            <CardDescription className="text-pretty">{step.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0} className="gap-2">
              <ArrowLeft className="size-4" />
              Back
            </Button>

            <div className="flex gap-1">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    index === currentStep ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              ))}
            </div>

            <Button onClick={handleNext} className="gap-2">
              {currentStep < tutorialSteps.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="size-4" />
                </>
              ) : (
                "Finish"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
