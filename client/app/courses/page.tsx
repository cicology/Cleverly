"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Grid3x3, List, Filter } from "lucide-react"
import { CourseCard } from "@/components/courses/course-card"
import { EmptyCoursesState } from "@/components/onboarding/empty-states"
import { useCourses } from "@/hooks/useApi"

const formatDate = (value: string | undefined) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

export default function CoursesPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const coursesQuery = useCourses()
  const courses = coursesQuery.data ?? []

  const mappedCourses = useMemo(
    () =>
      courses.map((course) => ({
        id: course.id,
        name: course.title,
        subject: course.topics?.[0] ?? "General",
        description: course.description ?? "No description provided.",
        topics: course.topics?.length ?? 0,
        materials: 0,
        graders: 0,
        lastModified: formatDate(course.updated_at),
        status: "active" as const,
      })),
    [courses],
  )

  const filteredCourses = mappedCourses.filter((course) =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (coursesQuery.isLoading) {
    return (
      <AppLayout>
        <div className="text-sm text-muted-foreground">Loading courses...</div>
      </AppLayout>
    )
  }

  if (coursesQuery.isError) {
    return (
      <AppLayout>
        <div className="text-sm text-destructive">Failed to load courses.</div>
      </AppLayout>
    )
  }

  if (mappedCourses.length === 0) {
    return (
      <AppLayout>
        <EmptyCoursesState onCreateCourse={() => router.push("/courses/create")} />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6 pb-20 md:pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">Courses</h1>
            <p className="text-sm md:text-base text-muted-foreground hidden sm:block">
              Manage your courses and learning materials.
            </p>
          </div>
          <Button onClick={() => router.push("/courses/create")} className="gap-2 touch-manipulation w-full sm:w-auto">
            <Plus className="size-4" />
            <span className="sm:inline">Create Course</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="touch-manipulation shrink-0 bg-transparent">
              <Filter className="size-4" />
            </Button>

            <div className="hidden sm:flex gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("grid")}
                className="touch-manipulation"
              >
                <Grid3x3 className="size-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("list")}
                className="touch-manipulation"
              >
                <List className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <div
          className={
            viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6" : "space-y-4"
          }
        >
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} viewMode={viewMode} />
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
