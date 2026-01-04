"use client"

import { useState, useEffect } from "react"

export function useOnboarding() {
  const [showWelcome, setShowWelcome] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(true)

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("cleverly-onboarding-complete")

    if (!hasCompletedOnboarding) {
      setIsOnboardingComplete(false)
      setShowWelcome(true)
    }
  }, [])

  const completeWelcome = () => {
    setShowWelcome(false)
    setShowTutorial(true)
  }

  const completeTutorial = () => {
    setShowTutorial(false)
    setIsOnboardingComplete(true)
    localStorage.setItem("cleverly-onboarding-complete", "true")
  }

  const resetOnboarding = () => {
    localStorage.removeItem("cleverly-onboarding-complete")
    setIsOnboardingComplete(false)
    setShowWelcome(true)
  }

  return {
    showWelcome,
    showTutorial,
    isOnboardingComplete,
    completeWelcome,
    completeTutorial,
    resetOnboarding,
  }
}
