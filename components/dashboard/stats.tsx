"use client"

import React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Users, BookOpen, ClipboardCheck, Calendar, TrendingUp, TrendingDown, GraduationCap, FileText } from "lucide-react"
import type { UserRole } from "@/lib/types"

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  trend?: "up" | "down"
  icon: React.ElementType
  gradient: string
}

function StatCard({ title, value, change, trend, icon: Icon, gradient }: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
      <div className={`absolute inset-0 opacity-5 ${gradient}`} />
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {change && (
              <div className="flex items-center gap-1 text-sm">
                {trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-accent" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className={trend === "up" ? "text-accent" : "text-destructive"}>
                  {change}
                </span>
                <span className="text-muted-foreground">vs mes anterior</span>
              </div>
            )}
          </div>
          <div className={`rounded-xl p-3 ${gradient} shadow-lg`}>
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface DashboardStatsProps {
  userRole: UserRole
}

export function DashboardStats({ userRole }: DashboardStatsProps) {
  const adminStats = [
    {
      title: "Total Estudiantes",
      value: "1,234",
      change: "+12%",
      trend: "up" as const,
      icon: Users,
      gradient: "bg-gradient-to-br from-primary to-accent",
    },
    {
      title: "Cursos Activos",
      value: "48",
      change: "+5%",
      trend: "up" as const,
      icon: BookOpen,
      gradient: "bg-gradient-to-br from-accent to-primary",
    },
    {
      title: "Asistencia Promedio",
      value: "94.5%",
      change: "+2.3%",
      trend: "up" as const,
      icon: ClipboardCheck,
      gradient: "bg-gradient-to-br from-chart-3 to-primary",
    },
    {
      title: "Eventos Este Mes",
      value: "12",
      change: "-3",
      trend: "down" as const,
      icon: Calendar,
      gradient: "bg-gradient-to-br from-chart-4 to-accent",
    },
  ]

  const teacherStats = [
    {
      title: "Mis Cursos",
      value: "6",
      icon: BookOpen,
      gradient: "bg-gradient-to-br from-primary to-accent",
    },
    {
      title: "Total Estudiantes",
      value: "156",
      change: "+8",
      trend: "up" as const,
      icon: Users,
      gradient: "bg-gradient-to-br from-accent to-primary",
    },
    {
      title: "Tareas Pendientes",
      value: "23",
      icon: FileText,
      gradient: "bg-gradient-to-br from-chart-3 to-primary",
    },
    {
      title: "Clases Hoy",
      value: "4",
      icon: Calendar,
      gradient: "bg-gradient-to-br from-chart-4 to-accent",
    },
  ]

  const studentStats = [
    {
      title: "Mis Cursos",
      value: "8",
      icon: BookOpen,
      gradient: "bg-gradient-to-br from-primary to-accent",
    },
    {
      title: "Promedio General",
      value: "8.7",
      change: "+0.3",
      trend: "up" as const,
      icon: GraduationCap,
      gradient: "bg-gradient-to-br from-accent to-primary",
    },
    {
      title: "Asistencia",
      value: "96%",
      change: "+1%",
      trend: "up" as const,
      icon: ClipboardCheck,
      gradient: "bg-gradient-to-br from-chart-3 to-primary",
    },
    {
      title: "Tareas Pendientes",
      value: "5",
      icon: FileText,
      gradient: "bg-gradient-to-br from-chart-4 to-accent",
    },
  ]

  const parentStats = [
    {
      title: "Hijos Registrados",
      value: "2",
      icon: Users,
      gradient: "bg-gradient-to-br from-primary to-accent",
    },
    {
      title: "Promedio Familiar",
      value: "8.9",
      icon: GraduationCap,
      gradient: "bg-gradient-to-br from-accent to-primary",
    },
    {
      title: "Asistencia",
      value: "95%",
      icon: ClipboardCheck,
      gradient: "bg-gradient-to-br from-chart-3 to-primary",
    },
    {
      title: "Reuniones Pendientes",
      value: "1",
      icon: Calendar,
      gradient: "bg-gradient-to-br from-chart-4 to-accent",
    },
  ]

  const stats = {
    admin: adminStats,
    teacher: teacherStats,
    student: studentStats,
    parent: parentStats,
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats[userRole].map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}
