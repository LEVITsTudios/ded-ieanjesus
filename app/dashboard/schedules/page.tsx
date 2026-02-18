import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SchedulesView } from "@/components/schedules/schedules-view"

export default async function SchedulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const userRole = user.user_metadata?.role || "student"

  // Fetch schedules with related course and teacher info
  const { data: schedules } = await supabase
    .from("schedules")
    .select(`
      id,
      course_id,
      day_of_week,
      start_time,
      end_time,
      classroom,
      created_at,
      courses:course_id (
        id,
        name,
        teacher_id,
        profiles:teacher_id (
          id,
          full_name
        )
      )
    `)
    .order("day_of_week")
    .order("start_time")

  // Filter schedules based on user role
  let filteredSchedules = schedules || []

  if (userRole === "student") {
    // Students only see schedules for courses they're enrolled in
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("student_id", user.id)

    const enrolledCourseIds = enrollments?.map(e => e.course_id) || []
    filteredSchedules = filteredSchedules.filter(s => enrolledCourseIds.includes(s.course_id))
  } else if (userRole === "teacher") {
    // Teachers only see schedules for their courses
    filteredSchedules = filteredSchedules.filter(s => 
      s.courses?.teacher_id === user.id
    )
  }
  // Admins see all schedules

  return (
    <SchedulesView 
      userRole={userRole}
      schedules={filteredSchedules || []}
      courses={schedules?.map(s => s.courses).filter(Boolean) || []}
    />
  )
}
