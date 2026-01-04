"use client"

import { QuickActions } from "@/components/dashboard/quick-actions"
import { MetricsCards } from "@/components/dashboard/metrics-cards"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { RecentSubmissions } from "@/components/dashboard/recent-submissions"

export function Dashboard() {
  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground hidden sm:block">
          Welcome back! Here's what's happening with your grading.
        </p>
      </div>

      <QuickActions />

      <MetricsCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <ActivityFeed />
        <RecentSubmissions />
      </div>
    </div>
  )
}
