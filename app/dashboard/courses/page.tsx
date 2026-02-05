import { createClient } from "@/lib/supabase/server"
import { CoursesView } from "@/components/courses/courses-view"

export default async function CoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userRole = user?.user_metadata?.role || "student"

  const { data: courses } = await supabase
    .from("courses")
    .select(`
      *,
      teacher:profiles!courses_teacher_id_fkey(id, full_name, email)
    `)
    .order("created_at", { ascending: false })

  return <CoursesView courses={courses || []} userRole={userRole} userId={user?.id || ""} />
}
