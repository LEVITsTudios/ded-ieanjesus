import { createClient } from "@/lib/supabase/server"
import { AttendanceView } from "@/components/attendance/attendance-view"

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userRole = user?.user_metadata?.role || "student"

  return <AttendanceView userRole={userRole} userId={user?.id || ""} />
}
