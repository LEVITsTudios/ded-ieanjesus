import React from "react"
import { createClient } from "@/lib/supabase/server"
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
  userId: string
}

export async function DashboardStats({ userRole, userId }: DashboardStatsProps) {
  const supabase = await createClient()

  let stats: any[] = []

  if (userRole === "admin") {
    const { count: studentCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student")

    const { count: courseCount } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true })

    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("status")
      .in("status", ["present", "absent", "late"])

    const presentCount = attendanceData?.filter(a => a.status === "present").length || 0
    const totalAttendance = attendanceData?.length || 1
    const attendancePercent = ((presentCount / totalAttendance) * 100).toFixed(1)

    const { count: eventCount } = await supabase
      .from("meetings")
      .select("*", { count: "exact", head: true })
      .gte("scheduled_at", new Date().toISOString().split("T")[0])

    stats = [
      {
        title: "Total Estudiantes",
        value: studentCount || 0,
        icon: Users,
        gradient: "bg-gradient-to-br from-primary to-accent",
      },
      {
        title: "Cursos Activos",
        value: courseCount || 0,
        icon: BookOpen,
        gradient: "bg-gradient-to-br from-accent to-primary",
      },
      {
        title: "Asistencia Promedio",
        value: `${attendancePercent}%`,
        icon: ClipboardCheck,
        gradient: "bg-gradient-to-br from-chart-3 to-primary",
      },
      {
        title: "Eventos Este Mes",
        value: eventCount || 0,
        icon: Calendar,
        gradient: "bg-gradient-to-br from-chart-4 to-accent",
      },
    ]
  } else if (userRole === "teacher") {
    const { count: courseCount } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true })
      .eq("teacher_id", userId)

    const { data: courses } = await supabase
      .from("courses")
      .select("id")
      .eq("teacher_id", userId)

    const courseIds = courses?.map(c => c.id) || []
    const { count: studentCount } = await supabase
      .from("course_enrollments")
      .select("*", { count: "exact", head: true })
      .in("course_id", courseIds.length > 0 ? courseIds : ["none"])

    stats = [
      {
        title: "Mis Cursos",
        value: courseCount || 0,
        icon: BookOpen,
        gradient: "bg-gradient-to-br from-primary to-accent",
      },
      {
        title: "Total Estudiantes",
        value: studentCount || 0,
        icon: Users,
        gradient: "bg-gradient-to-br from-accent to-primary",
      },
      {
        title: "Tareas Pendientes",
        value: "0",
        icon: FileText,
        gradient: "bg-gradient-to-br from-chart-3 to-primary",
      },
      {
        title: "Clases Hoy",
        value: "0",
        icon: Calendar,
        gradient: "bg-gradient-to-br from-chart-4 to-accent",
      },
    ]
  } else if (userRole === "student") {
    const { count: courseCount } = await supabase
      .from("course_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("student_id", userId)

    const { data: grades } = await supabase
      .from("grades")
      .select("grade")
      .eq("student_id", userId)

    const avgGrade = grades && grades.length > 0
      ? (grades.reduce((sum, g) => sum + (g.grade || 0), 0) / grades.length).toFixed(2)
      : "N/A"

    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("status")
      .eq("student_id", userId)

    const presentCount = attendanceData?.filter(a => a.status === "present").length || 0
    const totalAtt = attendanceData?.length || 1
    const attendancePercent = ((presentCount / totalAtt) * 100).toFixed(0)

    stats = [
      {
        title: "Mis Cursos",
        value: courseCount || 0,
        icon: BookOpen,
        gradient: "bg-gradient-to-br from-primary to-accent",
      },
      {
        title: "Promedio General",
        value: avgGrade,
        icon: GraduationCap,
        gradient: "bg-gradient-to-br from-accent to-primary",
      },
      {
        title: "Asistencia",
        value: `${attendancePercent}%`,
        icon: ClipboardCheck,
        gradient: "bg-gradient-to-br from-chart-3 to-primary",
      },
      {
        title: "Tareas Pendientes",
        value: "0",
        icon: FileText,
        gradient: "bg-gradient-to-br from-chart-4 to-accent",
      },
    ]
  } else if (userRole === "parent") {
    const { data: children } = await supabase
      .from("profiles")
      .select("id")
      .eq("parent_id", userId)

    const childIds = children?.map(c => c.id) || []
    const { data: grades } = await supabase
      .from("grades")
      .select("grade")
      .in("student_id", childIds.length > 0 ? childIds : ["none"])

    const avgGrade = grades && grades.length > 0
      ? (grades.reduce((sum, g) => sum + (g.grade || 0), 0) / grades.length).toFixed(2)
      : "N/A"

    stats = [
      {
        title: "Hijos Registrados",
        value: childIds.length,
        icon: Users,
        gradient: "bg-gradient-to-br from-primary to-accent",
      },
      {
        title: "Promedio Familiar",
        value: avgGrade,
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
        value: "0",
        icon: Calendar,
        gradient: "bg-gradient-to-br from-chart-4 to-accent",
      },
    ]
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}
