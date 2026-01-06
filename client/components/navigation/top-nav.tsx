"use client"

import Image from "next/image"
import Link from "next/link"
import { Menu, Bell, User, Search, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Breadcrumbs } from "@/components/navigation/breadcrumbs"

interface TopNavProps {
  onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  return (
    <header className="bg-card border-b border-border px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2 md:gap-4 min-h-[64px]">
      {mobileSearchOpen && (
        <div className="absolute inset-0 bg-card z-50 flex items-center gap-2 px-4 md:hidden">
          <Search className="size-5 text-muted-foreground shrink-0" />
          <Input type="search" placeholder="Search..." autoFocus className="flex-1 border-none focus-visible:ring-0" />
          <Button variant="ghost" size="icon-sm" onClick={() => setMobileSearchOpen(false)}>
            <X className="size-5" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        <Button variant="ghost" size="icon-sm" onClick={onMenuClick} className="shrink-0 md:hidden touch-manipulation">
          <Menu className="size-5" />
        </Button>

        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <Image src="/cleverly-icon.svg" alt="Cleverly" width={28} height={28} />
          <span className="font-bold cleverly-gradient-text">Cleverly</span>
        </Link>

        <div className="hidden sm:block min-w-0">
          <Breadcrumbs />
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input type="search" placeholder="Search..." className="pl-9 w-48 lg:w-64" />
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden touch-manipulation"
          onClick={() => setMobileSearchOpen(true)}
        >
          <Search className="size-5" />
        </Button>

        <Button variant="ghost" size="icon-sm" className="relative touch-manipulation">
          <Bell className="size-5" />
          <span className="absolute top-1.5 right-1.5 size-2 bg-error rounded-full" />
        </Button>

        <Button variant="ghost" size="icon-sm" className="touch-manipulation">
          <User className="size-5" />
        </Button>
      </div>
    </header>
  )
}
