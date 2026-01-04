"use client"

import { useRouter } from "next/navigation"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SubjectBadge } from "@/components/cleverly/subject-badge"
import { MoreVertical, BookOpen, FileText, GraduationCap } from "lucide-react"

interface Course {
  id: string
  name: string
  subject: string
  description: string
  topics: number
  materials: number
  graders: number
  lastModified: string
  status: "active" | "draft" | "archived"
}

interface CourseCardProps {
  course: Course
  viewMode: "grid" | "list"
}

export function CourseCard({ course, viewMode }: CourseCardProps) {
  const router = useRouter()

  if (viewMode === "list") {
    return (
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer touch-manipulation active:scale-[0.98]"
        onClick={() => router.push(`/courses/${course.id}`)}
      >
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="p-3 bg-primary/10 rounded-lg shrink-0">
              <BookOpen className="size-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-semibold text-base md:text-lg">{course.name}</h3>
                <SubjectBadge subject={course.subject} />
                <Badge variant={course.status === "active" ? "success" : "outline"}>{course.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">{course.description}</p>
            </div>
            <div className="hidden md:flex items-center gap-4 lg:gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="size-4" />
                {course.topics}
              </div>
              <div className="flex items-center gap-1">
                <FileText className="size-4" />
                {course.materials}
              </div>
              <div className="flex items-center gap-1">
                <GraduationCap className="size-4" />
                {course.graders}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => e.stopPropagation()}
              className="touch-manipulation shrink-0"
            >
              <MoreVertical className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer touch-manipulation active:scale-[0.98]"
      onClick={() => router.push(`/courses/${course.id}`)}
    >
      <CardHeader>
        <CardAction>
          <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} className="touch-manipulation">
            <MoreVertical className="size-4" />
          </Button>
        </CardAction>
        <div className="flex items-start gap-2 mb-2">
          <SubjectBadge subject={course.subject} />
          <Badge variant={course.status === "active" ? "success" : "outline"} className="text-xs">
            {course.status}
          </Badge>
        </div>
        <CardTitle className="text-lg md:text-xl">{course.name}</CardTitle>
        <CardDescription className="text-sm line-clamp-2">{course.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 md:gap-4 text-sm">
          <div>
            <div className="text-xl md:text-2xl font-bold text-primary">{course.topics}</div>
            <div className="text-xs text-muted-foreground">Topics</div>
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold text-primary">{course.materials}</div>
            <div className="text-xs text-muted-foreground">Materials</div>
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold text-primary">{course.graders}</div>
            <div className="text-xs text-muted-foreground">Graders</div>
          </div>
        </div>
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t text-xs text-muted-foreground">
          Last modified {course.lastModified}
        </div>
      </CardContent>
    </Card>
  )
}
