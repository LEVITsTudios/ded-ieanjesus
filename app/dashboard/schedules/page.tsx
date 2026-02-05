import { createClient } from "@/lib/supabase/server"
import { SchedulesView } from "@/components/schedules/schedules-view"

export default async function SchedulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userRole = user?.user_metadata?.role || "student"

  return <SchedulesView userRole={userRole} />
}
