import { createClient } from "@/lib/supabase/server"
import { AttendanceView } from "@/components/attendance/attendance-view"
import type { UserRole } from "@/lib/types"

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userRole = user?.user_metadata?.role || "student"

  // fetch attendance records with related student and course info
  const { data: attendances } = await supabase
    .from("attendances")
    .select(`
      *,
      student:profiles!attendances_student_id_fkey(id, full_name),
      course:courses!attendances_course_id_fkey(id, name),
      meeting:meetings!attendances_meeting_id_fkey(id,title,meeting_date,type,course_id),
      recorder:profiles!attendances_recorded_by_fkey(id, full_name)
    `)
    .order("date", { ascending: false })

  return (
    <AttendanceView
      userRole={userRole as UserRole}
      userId={user?.id || ""}
      attendances={attendances || []}
    />
  )
}
