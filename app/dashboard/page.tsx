import { createClient } from "@/lib/supabase/server"
import { DashboardStats } from "@/components/dashboard/stats"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { UpcomingEvents } from "@/components/dashboard/upcoming-events"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const userRole = user?.user_metadata?.role || "student"
  const userId = user?.id || ""

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <DashboardStats userRole={userRole} userId={userId} />

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <QuickActions userRole={userRole} />
        </div>

        {/* Upcoming Events */}
        <div>
          <UpcomingEvents />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  )
}
