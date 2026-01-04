"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, BookOpen, GraduationCap, ClipboardList, Settings } from "lucide-react"

const mobileNavigation = [
  { name: "Home", href: "/", icon: LayoutDashboard },
  { name: "Courses", href: "/courses", icon: BookOpen },
  { name: "Grade", href: "/grading", icon: GraduationCap },
  { name: "Submissions", href: "/submissions", icon: ClipboardList },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {mobileNavigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                // Touch-optimized with min 44x44px tap target
                "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors touch-manipulation min-w-[60px]",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground active:bg-accent",
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
