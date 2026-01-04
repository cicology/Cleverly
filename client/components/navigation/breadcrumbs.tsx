"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

const routeNames: Record<string, string> = {
  "": "Dashboard",
  courses: "Courses",
  graders: "Graders",
  grading: "Grading Queue",
  submissions: "Submissions",
  analytics: "Analytics",
  settings: "Settings",
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) {
    return <h2 className="text-lg font-semibold">Dashboard</h2>
  }

  return (
    <nav className="flex items-center gap-2 text-sm">
      <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
        Home
      </Link>

      {segments.map((segment, index) => {
        const path = `/${segments.slice(0, index + 1).join("/")}`
        const isLast = index === segments.length - 1
        const name = routeNames[segment] || segment

        return (
          <div key={path} className="flex items-center gap-2">
            <ChevronRight className="size-4 text-muted-foreground" />
            {isLast ? (
              <span className="font-medium text-foreground">{name}</span>
            ) : (
              <Link href={path} className="text-muted-foreground hover:text-foreground transition-colors">
                {name}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
