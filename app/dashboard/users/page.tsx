import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UsersView } from "@/components/users/users-view"

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userRole = user?.user_metadata?.role || "student"

  // Only admins can access this page
  if (userRole !== "admin") {
    redirect("/dashboard")
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  return <UsersView users={profiles || []} />
}
