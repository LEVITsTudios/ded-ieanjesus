"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  ClipboardCheck,
  CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { UserRole } from "@/lib/types"

interface AttendanceViewProps {
  userRole: UserRole
  userId: string
}

const attendanceData = [
  { id: 1, student: "Maria Garcia", course: "Matematicas", date: "2026-02-05", status: "present" },
  { id: 2, student: "Carlos Lopez", course: "Matematicas", date: "2026-02-05", status: "present" },
  { id: 3, student: "Ana Martinez", course: "Matematicas", date: "2026-02-05", status: "absent" },
  { id: 4, student: "Roberto Sanchez", course: "Matematicas", date: "2026-02-05", status: "late" },
  { id: 5, student: "Laura Fernandez", course: "Matematicas", date: "2026-02-05", status: "excused" },
  { id: 6, student: "Pedro Ramirez", course: "Matematicas", date: "2026-02-05", status: "present" },
]

const statusConfig = {
  present: {
    label: "Presente",
    icon: CheckCircle,
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
  },
  absent: {
    label: "Ausente",
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/20",
  },
  late: {
    label: "Tarde",
    icon: Clock,
    color: "text-chart-4",
    bg: "bg-chart-4/10",
    border: "border-chart-4/20",
  },
  excused: {
    label: "Justificado",
    icon: AlertCircle,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
}

export function AttendanceView({ userRole, userId }: AttendanceViewProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [selectedCourse, setSelectedCourse] = useState<string>("all")

  const stats = {
    present: attendanceData.filter((a) => a.status === "present").length,
    absent: attendanceData.filter((a) => a.status === "absent").length,
    late: attendanceData.filter((a) => a.status === "late").length,
    excused: attendanceData.filter((a) => a.status === "excused").length,
  }

  const totalStudents = attendanceData.length
  const attendanceRate = ((stats.present + stats.excused) / totalStudents) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Asistencias</h1>
          <p className="text-muted-foreground">
            {userRole === "teacher" || userRole === "admin"
              ? "Registra y consulta la asistencia de los estudiantes"
              : "Consulta tu historial de asistencia"}
          </p>
        </div>
        {(userRole === "teacher" || userRole === "admin") && (
          <Button asChild className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
            <Link href="/dashboard/attendance/take">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Pasar Lista
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-xl bg-accent/10 p-3">
              <CheckCircle className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.present}</p>
              <p className="text-sm text-muted-foreground">Presentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-xl bg-destructive/10 p-3">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.absent}</p>
              <p className="text-sm text-muted-foreground">Ausentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-xl bg-chart-4/10 p-3">
              <Clock className="h-6 w-6 text-chart-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.late}</p>
              <p className="text-sm text-muted-foreground">Retardos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{attendanceRate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Asistencia</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecciona fecha y curso para ver la asistencia</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal bg-transparent">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP", { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los cursos</SelectItem>
              <SelectItem value="matematicas">Matematicas</SelectItem>
              <SelectItem value="espanol">Espanol</SelectItem>
              <SelectItem value="ciencias">Ciencias</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Attendance List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Asistencia</CardTitle>
              <CardDescription>
                {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {totalStudents} estudiantes
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendanceData.map((record) => {
              const status = statusConfig[record.status as keyof typeof statusConfig]
              const StatusIcon = status.icon
              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                      <span className="text-sm font-medium text-foreground">
                        {record.student
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{record.student}</p>
                      <p className="text-sm text-muted-foreground">{record.course}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1 ${status.bg} ${status.color} ${status.border}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
