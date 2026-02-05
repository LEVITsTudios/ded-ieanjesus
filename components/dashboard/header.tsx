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
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            3
          </span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 px-2">
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-sm font-medium text-foreground">{user.fullName}</span>
                <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${roleColors[user.role]}`}>
                  {roleLabels[user.role]}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Configuracion
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} disabled={loading} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {loading ? "Cerrando sesion..." : "Cerrar Sesion"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
