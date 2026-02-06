import React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { MobileNavigation } from "@/components/mobile/navigation"
import { OfflineIndicator } from "@/components/pwa/offline-indicator"
import { PWAInstallPrompt } from "@/components/pwa/pwa-install-prompt"
import { NotificationSetup } from "@/components/pwa/notification-setup"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const userRole = user.user_metadata?.role || "student"
  const fullName = user.user_metadata?.full_name || user.email

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      {/* Mobile sidebar será manejada por componente responsivo */}
      <DashboardSidebar userRole={userRole} />
      
      <div className="flex flex-1 flex-col w-full">
        <DashboardHeader user={{ email: user.email!, fullName, role: userRole }} />
        
        {/* Indicadores PWA */}
        <div className="px-4 md:px-6 lg:px-8 pt-4 space-y-2">
          <OfflineIndicator />
          <NotificationSetup />
        </div>

        {/* Main content - con padding inferior para footer nav móvil */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* Componentes PWA flotantes */}
      <PWAInstallPrompt />
      
      {/* Navegación móvil (footer bar) */}
      <MobileNavigation />
    </div>
  )
}
