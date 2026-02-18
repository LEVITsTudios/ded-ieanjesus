import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsView } from "@/components/settings/settings-view"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  const userRole = user.user_metadata?.role || "student"

  // Only admins can access this page
  if (userRole !== "admin") {
    redirect("/dashboard")
  }

  // Fetch institutions if multi-tenancy script was run
  let institutionsData = []
  try {
    const { data } = await supabase.from("institutions").select("*").order("name")
    institutionsData = data || []
  } catch (e) {
    // Table might not exist yet - graceful fallback
    console.warn("Institutions table not found")
  }

  return <SettingsView institutions={institutionsData} userId={user.id} />
}
