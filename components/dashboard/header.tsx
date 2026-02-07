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
import { LogOut, User, Settings, Search } from "lucide-react"
import type { UserRole } from "@/lib/types"
import { NavbarUser } from "@/components/navbar/user-menu"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface DashboardHeaderProps {
  user: {
    email: string
    fullName: string
    role: UserRole
  }
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
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow">
          <span className="text-primary-foreground font-bold">LA</span>
        </div>
        <div className="hidden md:block">
          <h1 className="text-lg font-semibold text-foreground">LVTsAcademic</h1>
          <p className="text-sm text-muted-foreground">Panel de Control</p>
        </div>
      </div>

      <div className="flex-1 px-4">
        <label htmlFor="global-search" className="sr-only">Buscar</label>
        <div className="relative max-w-xl mx-auto">
          <input
            id="global-search"
            name="q"
            type="search"
            placeholder="Buscar cursos, usuarios, anuncios..."
            aria-label="Buscar en el sistema"
            className="w-full rounded-md border border-border/50 bg-transparent py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NavbarUser />
      </div>
    </header>
  )
}
