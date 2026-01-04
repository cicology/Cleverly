"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { WelcomeScreen } from "@/components/onboarding/welcome-screen"
import { TutorialOverlay } from "@/components/onboarding/tutorial-overlay"
import { useOnboarding } from "@/hooks/use-onboarding"
import { Dashboard } from "@/components/dashboard/dashboard"

export default function HomePage() {
  const { showWelcome, showTutorial, isOnboardingComplete, completeWelcome, completeTutorial } = useOnboarding()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  if (showWelcome) {
    return <WelcomeScreen onComplete={completeWelcome} />
  }

  return (
    <AppLayout>
      {showTutorial && <TutorialOverlay onComplete={completeTutorial} />}
      <Dashboard />
    </AppLayout>
  )
}
