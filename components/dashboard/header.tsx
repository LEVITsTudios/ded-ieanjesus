"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Bell, LogOut, User, Settings } from "lucide-react"
import type { UserRole } from "@/lib/types"
import { NavbarUser } from "@/components/navbar/user-menu"

interface DashboardHeaderProps {
  user: {
    email: string
    fullName: string
    role: UserRole
  }
}

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  teacher: "Maestro",
  student: "Estudiante",
  parent: "Padre de Familia",
}

const roleColors: Record<UserRole, string> = {
  admin: "bg-chart-3 text-chart-3-foreground",
  teacher: "bg-primary text-primary-foreground",
  student: "bg-accent text-accent-foreground",
  parent: "bg-chart-4 text-chart-4-foreground",
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/50 bg-card/50 px-4 backdrop-blur-xl md:px-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Bienvenido, {user.fullName.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          Panel de control de Escuela Dominical
        </p>
      </div>

      <div className="flex items-center gap-4">
        <NavbarUser />
      </div>
    </header>
  )
}
