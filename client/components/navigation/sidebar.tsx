"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  GraduationCap,
  ClipboardList,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface SidebarProps {
  open: boolean
  onToggle: () => void
  isMobile: boolean
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Courses", href: "/courses", icon: BookOpen },
  { name: "Graders", href: "/graders", icon: FileText },
  { name: "Grading Queue", href: "/grading", icon: GraduationCap },
  { name: "Submissions", href: "/submissions", icon: ClipboardList },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar({ open, onToggle, isMobile }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col relative",
        // Mobile - fixed position with z-index, Desktop - static position
        isMobile ? "fixed inset-y-0 left-0 z-40" : "relative",
        // Mobile - full width when open or hidden when closed, Desktop - collapsible width
        isMobile ? (open ? "w-64" : "-translate-x-full") : open ? "w-64" : "w-20",
      )}
    >
      {/* Responsive header with logo */}
      <div className="p-4 md:p-6 flex items-center justify-between border-b border-sidebar-border min-h-[64px] md:min-h-[72px]">
        {open ? (
          <Link href="/" className="flex items-center gap-2">
            <Image src="/cleverly-icon.svg" alt="Cleverly" width={32} height={32} />
            <span className="text-lg md:text-xl font-bold cleverly-gradient-text">Cleverly</span>
          </Link>
        ) : (
          !isMobile && (
            <Link href="/" className="mx-auto">
              <Image src="/cleverly-icon.svg" alt="Cleverly" width={32} height={32} />
            </Link>
          )
        )}
        {/* Hide toggle on mobile (controlled by hamburger menu) */}
        {!isMobile && open && (
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors touch-manipulation"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}
        {!isMobile && !open && (
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors touch-manipulation absolute right-2 top-4"
          >
            <ChevronRight className="size-4" />
          </button>
        )}
      </div>

      {/* Touch-optimized navigation with larger tap targets */}
      <nav className="flex-1 px-2 md:px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                // Larger padding on mobile for touch targets (min 44x44px)
                "flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-colors touch-manipulation",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent active:bg-sidebar-accent",
                !open && !isMobile && "justify-center",
              )}
              title={!open && !isMobile ? item.name : undefined}
            >
              <Icon className="size-5 shrink-0" />
              {(open || isMobile) && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className={cn("text-xs text-sidebar-foreground/60", !open && !isMobile && "text-center")}>
          {open || isMobile ? "v1.0.0" : "v1"}
        </div>
      </div>
    </aside>
  )
}
