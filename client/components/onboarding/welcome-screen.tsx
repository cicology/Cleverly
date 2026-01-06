"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, FileText, GraduationCap, ArrowRight, CheckCircle2 } from "lucide-react"

interface WelcomeScreenProps {
  onComplete: () => void
}

const steps = [
  {
    icon: BookOpen,
    title: "Create a Course",
    description: "Upload course materials and let AI extract key topics automatically",
  },
  {
    icon: FileText,
    title: "Generate Rubric",
    description: "Create grading criteria from teacher memos with AI assistance",
  },
  {
    icon: GraduationCap,
    title: "Grade Submissions",
    description: "Upload handwritten tests and get AI-powered grading with confidence scores",
  },
]

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-[#0f0a1a] dark:via-[#1a1025] dark:to-[#0f0a1a] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image src="/cleverly-icon.svg" alt="Cleverly" width={80} height={80} />
          </div>
          <h1 className="text-5xl font-bold mb-4 text-balance">
            <span className="text-foreground">Welcome to </span>
            <span className="cleverly-gradient-text">Cleverly</span>
          </h1>
          <p className="text-xl text-muted-foreground text-pretty">
            AI-powered test grading that saves time and ensures consistency
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep

            return (
              <Card
                key={index}
                className={`transition-all duration-300 cursor-pointer ${
                  isActive ? "ring-2 ring-primary shadow-lg scale-105" : "opacity-70 hover:opacity-100"
                }`}
                onClick={() => setCurrentStep(index)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-3 rounded-lg ${
                        isActive
                          ? "bg-primary text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <Icon className="size-6" />
                    </div>
                    {isCompleted && <CheckCircle2 className="size-5 text-green-500" />}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <CardDescription className="text-pretty">{step.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>

        <div className="flex items-center justify-center gap-4">
          {currentStep < steps.length - 1 ? (
            <Button size="lg" onClick={() => setCurrentStep(currentStep + 1)} className="gap-2">
              Next Step
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button size="lg" onClick={onComplete} className="gap-2">
              Get Started
              <ArrowRight className="size-4" />
            </Button>
          )}

          <Button variant="ghost" size="lg" onClick={onComplete}>
            Skip Tutorial
          </Button>
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep ? "w-8 bg-primary" : "w-2 bg-gray-300 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
