import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ReportsView } from "@/components/reports/reports-view"

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  const userRole = user.user_metadata?.role || "student"

  // Only admins and teachers can access this page
  if (userRole !== "admin" && userRole !== "teacher") {
    redirect("/dashboard")
  }

  // Fetch data for reports
  const [coursesResult, enrollmentsResult, gradesResult, attendanceResult] = await Promise.all([
    supabase.from("courses").select("*").order("created_at", { ascending: false }),
    supabase.from("enrollments").select("*").order("enrollment_date", { ascending: false }),
    supabase.from("grades").select("*").order("created_at", { ascending: false }),
    supabase.from("attendances").select("*").order("date", { ascending: false }),
  ])

  return (
    <ReportsView
      courses={coursesResult.data || []}
      enrollments={enrollmentsResult.data || []}
      grades={gradesResult.data || []}
      attendances={attendanceResult.data || []}
      userRole={userRole}
      userId={user.id}
    />
  )
}
