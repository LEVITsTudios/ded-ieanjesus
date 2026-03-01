import { createClient } from "@/lib/supabase/server"
import { EnrollmentsView } from "@/components/enrollments/enrollments-view"

export default async function EnrollmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userRole = (user?.user_metadata?.role as string) || "student"

  // Supabase RLS policies should restrict rows appropriately based on role.
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id,
      status,
      enrollment_date,
      student:profiles(id, full_name),
      course:courses(id, name, code)
    `)
    .order("created_at", { ascending: false })

  return (
    <EnrollmentsView
      enrollments={enrollments || []}
      userRole={userRole as any}
      userId={user?.id || ""}
    />
  )
}
