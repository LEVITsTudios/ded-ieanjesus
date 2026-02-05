"use client"

import React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Users,
  Calendar,
  ClipboardCheck,
  FileText,
  Bell,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  BarChart3,
  FolderOpen,
  Brain,
  BellRing,
  Menu,
  X,
} from "lucide-react"
import type { UserRole } from "@/lib/types"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  roles: UserRole[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "teacher", "student", "parent"],
  },
  {
    title: "Cursos",
    href: "/dashboard/courses",
    icon: BookOpen,
    roles: ["admin", "teacher", "student"],
  },
  {
    title: "Usuarios",
    href: "/dashboard/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "Horarios",
    href: "/dashboard/schedules",
    icon: Calendar,
    roles: ["admin", "teacher", "student", "parent"],
  },
  {
    title: "Asistencias",
    href: "/dashboard/attendance",
    icon: ClipboardCheck,
    roles: ["admin", "teacher", "student", "parent"],
  },
  {
    title: "Materiales",
    href: "/dashboard/materials",
    icon: FolderOpen,
    roles: ["admin", "teacher", "student"],
  },
  {
    title: "Recursos",
    href: "/dashboard/resources",
    icon: FolderOpen,
    roles: ["admin", "teacher", "student"],
  },
  {
    title: "Quizzes",
    href: "/dashboard/quizzes",
    icon: Brain,
    roles: ["admin", "teacher", "student"],
  },
  {
    title: "Calificaciones",
    href: "/dashboard/grades",
    icon: FileText,
    roles: ["admin", "teacher", "student", "parent"],
  },
  {
    title: "Reuniones",
    href: "/dashboard/meetings",
    icon: MessageSquare,
    roles: ["admin", "teacher", "parent"],
  },
  {
    title: "Permisos",
    href: "/dashboard/permissions",
    icon: Shield,
    roles: ["admin", "teacher", "student", "parent"],
  },
  {
    title: "Anuncios",
    href: "/dashboard/announcements",
    icon: Bell,
    roles: ["admin", "teacher", "student", "parent"],
  },
  {
    title: "Notificaciones",
    href: "/dashboard/notifications",
    icon: BellRing,
    roles: ["admin", "teacher", "student", "parent"],
  },
  {
    title: "Reportes",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["admin", "teacher"],
  },
  {
    title: "Configuracion",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["admin"],
  },
]

interface DashboardSidebarProps {
  userRole: UserRole
}

export function DashboardSidebar({ userRole }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setMobileOpen(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole))

  // Mobile menu overlay
  if (isMobile && mobileOpen) {
    return (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
        
        {/* Mobile sidebar */}
        <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-border/50 bg-card/95 backdrop-blur-xl md:hidden">
          {/* Close button */}
          <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">LEVITsAcademic</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="flex flex-col gap-1">
              {filteredItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon
                        className={cn("h-5 w-5 shrink-0", isActive && "text-primary")}
                      />
                      <span>{item.title}</span>
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>
        </aside>
      </>
    )
  }

  // Desktop sidebar
  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-6 right-6 z-40 md:hidden p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex relative flex-col border-r border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border/50 px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-foreground">LEVITsAcademic</span>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 transition-all duration-200",
                      collapsed && "justify-center px-2",
                      isActive
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon
                      className={cn("h-5 w-5 shrink-0", isActive && "text-primary")}
                    />
                    {!collapsed && <span>{item.title}</span>}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Collapse Button */}
        <div className="border-t border-border/50 p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Colapsar</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  )
}
