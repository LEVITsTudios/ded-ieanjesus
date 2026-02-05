"use client"

import React from "react"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  ClipboardCheck,
  Calendar,
  Users,
  FileText,
  Bell,
  Shield,
  Plus,
  Eye,
  Download,
} from "lucide-react"
import type { UserRole } from "@/lib/types"

interface QuickAction {
  title: string
  description: string
  href: string
  icon: React.ElementType
  variant: "primary" | "secondary" | "accent"
}

interface QuickActionsProps {
  userRole: UserRole
}

export function QuickActions({ userRole }: QuickActionsProps) {
  const adminActions: QuickAction[] = [
    {
      title: "Agregar Usuario",
      description: "Registrar nuevo estudiante o maestro",
      href: "/dashboard/users/new",
      icon: Plus,
      variant: "primary",
    },
    {
      title: "Crear Curso",
      description: "Configurar un nuevo curso",
      href: "/dashboard/courses/new",
      icon: BookOpen,
      variant: "secondary",
    },
    {
      title: "Ver Reportes",
      description: "Analisis y estadisticas",
      href: "/dashboard/reports",
      icon: Download,
      variant: "accent",
    },
    {
      title: "Publicar Anuncio",
      description: "Comunicar a la comunidad",
      href: "/dashboard/announcements/new",
      icon: Bell,
      variant: "primary",
    },
  ]

  const teacherActions: QuickAction[] = [
    {
      title: "Pasar Lista",
      description: "Registrar asistencia de hoy",
      href: "/dashboard/attendance/take",
      icon: ClipboardCheck,
      variant: "primary",
    },
    {
      title: "Subir Material",
      description: "Agregar recursos al curso",
      href: "/dashboard/materials/new",
      icon: FileText,
      variant: "secondary",
    },
    {
      title: "Calificar Tareas",
      description: "Revisar entregas pendientes",
      href: "/dashboard/grades",
      icon: Eye,
      variant: "accent",
    },
    {
      title: "Agendar Reunion",
      description: "Programar con padres",
      href: "/dashboard/meetings/new",
      icon: Calendar,
      variant: "primary",
    },
  ]

  const studentActions: QuickAction[] = [
    {
      title: "Ver Horario",
      description: "Consultar clases del dia",
      href: "/dashboard/schedules",
      icon: Calendar,
      variant: "primary",
    },
    {
      title: "Mis Calificaciones",
      description: "Revisar notas y promedios",
      href: "/dashboard/grades",
      icon: FileText,
      variant: "secondary",
    },
    {
      title: "Solicitar Permiso",
      description: "Pedir ausencia o permiso",
      href: "/dashboard/permissions/new",
      icon: Shield,
      variant: "accent",
    },
    {
      title: "Ver Materiales",
      description: "Acceder a recursos",
      href: "/dashboard/materials",
      icon: BookOpen,
      variant: "primary",
    },
  ]

  const parentActions: QuickAction[] = [
    {
      title: "Ver Calificaciones",
      description: "Notas de mis hijos",
      href: "/dashboard/grades",
      icon: FileText,
      variant: "primary",
    },
    {
      title: "Consultar Asistencia",
      description: "Historial de asistencias",
      href: "/dashboard/attendance",
      icon: ClipboardCheck,
      variant: "secondary",
    },
    {
      title: "Agendar Reunion",
      description: "Hablar con maestros",
      href: "/dashboard/meetings/new",
      icon: Users,
      variant: "accent",
    },
    {
      title: "Solicitar Permiso",
      description: "Para mis hijos",
      href: "/dashboard/permissions/new",
      icon: Shield,
      variant: "primary",
    },
  ]

  const actions = {
    admin: adminActions,
    teacher: teacherActions,
    student: studentActions,
    parent: parentActions,
  }

  const variantStyles = {
    primary: "bg-gradient-to-br from-primary to-accent hover:shadow-primary/20",
    secondary: "bg-gradient-to-br from-accent to-primary hover:shadow-accent/20",
    accent: "bg-gradient-to-br from-chart-3 to-primary hover:shadow-chart-3/20",
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-foreground">Acciones Rapidas</CardTitle>
        <CardDescription>Accede a las funciones mas utilizadas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {actions[userRole].map((action, index) => (
            <Link key={index} href={action.href}>
              <Button
                variant="ghost"
                className="group h-auto w-full flex-col items-start gap-2 p-4 hover:bg-muted/50 border border-border/50 transition-all duration-300 hover:shadow-lg"
              >
                <div
                  className={`rounded-lg p-2 ${variantStyles[action.variant]} shadow-lg transition-all duration-300 group-hover:shadow-xl`}
                >
                  <action.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
