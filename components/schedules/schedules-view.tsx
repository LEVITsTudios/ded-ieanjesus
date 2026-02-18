"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, BookOpen, User, Plus, Edit, Trash2 } from "lucide-react"
import type { UserRole } from "@/lib/types"

interface Schedule {
  id: string
  course_id: string
  day_of_week: number
  start_time: string
  end_time: string
  classroom: string
  created_at: string
  courses?: {
    id: string
    name: string
    teacher_id: string
    profiles?: {
      id: string
      full_name: string
    }
  }
}

interface Course {
  id: string
  name: string
  teacher_id: string
  profiles?: {
    id: string
    full_name: string
  }
}

interface SchedulesViewProps {
  userRole: UserRole
  schedules: Schedule[]
  courses: Course[]
}

const days = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]
const daysWeek = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"]
const dayIndices = [1, 2, 3, 4, 5]

const colorGradients = [
  "from-primary to-accent",
  "from-accent to-primary",
  "from-chart-1 to-primary",
  "from-chart-2 to-accent",
  "from-chart-3 to-primary",
  "from-chart-4 to-accent",
  "from-primary to-chart-1",
  "from-accent to-chart-2",
]

function getColor(index: number): string {
  return colorGradients[index % colorGradients.length]
}

function formatTime(time: string): string {
  // Convert "08:00:00" to "08:00"
  if (!time) return ""
  return time.split(":").slice(0, 2).join(":")
}

export function SchedulesView({ userRole, schedules, courses }: SchedulesViewProps) {
  const [selectedDay, setSelectedDay] = useState(1) // Start with Lunes
  const [showForm, setShowForm] = useState(false)

  const today = new Date().getDay()
  const todayIndex = today === 0 ? 6 : today - 1 // Convert Sunday=0 to our index

  // Group schedules by day
  const schedulesByDay = dayIndices.reduce((acc, dayIndex) => {
    acc[dayIndex] = schedules
      .filter(s => s.day_of_week === dayIndex)
      .sort((a, b) => {
        const timeA = a.start_time || "00:00"
        const timeB = b.start_time || "00:00"
        return timeA.localeCompare(timeB)
      })
    return acc
  }, {} as Record<number, Schedule[]>)

  const totalSchedules = schedules.length
  const todaySchedules = schedulesByDay[todayIndex] || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Horarios de Clases</h1>
          <p className="text-muted-foreground mt-2">Consulta tu horario de clases semanal</p>
        </div>
        {userRole === "admin" && (
          <Button onClick={() => setShowForm(!showForm)} className="self-start">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Horario
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Horarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSchedules}</div>
            <p className="text-xs text-muted-foreground mt-1">Registrados en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoy ({days[todayIndex]})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySchedules.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Clases programadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cursos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground mt-1">En sistema</p>
          </CardContent>
        </Card>
      </div>

      {/* Week View Tabs */}
      <Tabs
        value={selectedDay.toString()}
        onValueChange={(v) => setSelectedDay(parseInt(v))}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-5 bg-card/50 backdrop-blur-xl">
          {daysWeek.map((day, idx) => {
            const dayIndex = dayIndices[idx]
            const dayCount = (schedulesByDay[dayIndex] || []).length
            const isToday = dayIndex === todayIndex

            return (
              <TabsTrigger
                key={day}
                value={dayIndex.toString()}
                className={`data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground ${
                  isToday ? "ring-2 ring-primary/50" : ""
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="hidden sm:inline text-sm">{day}</span>
                  <span className="sm:hidden text-xs">{day.slice(0, 3)}</span>
                  <span className="text-xs text-muted-foreground">{dayCount}</span>
                </div>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {daysWeek.map((day, idx) => {
          const dayIndex = dayIndices[idx]
          const daySchedules = schedulesByDay[dayIndex] || []
          const isToday = dayIndex === todayIndex

          return (
            <TabsContent key={day} value={dayIndex.toString()} className="mt-6 space-y-4">
              <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{day}</CardTitle>
                      <CardDescription>
                        {daySchedules.length} clase{daySchedules.length !== 1 ? "s" : ""} programada{daySchedules.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </div>
                    {isToday && (
                      <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                        Hoy
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {daySchedules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="mb-4 rounded-full bg-muted p-4">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-center text-muted-foreground">No hay horarios programados</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {daySchedules.map((schedule, index) => {
                        const color = getColor(index)
                        const teacher = schedule.courses?.profiles?.full_name || "N/A"
                        const courseName = schedule.courses?.name || "Curso Desconocido"
                        const startTime = formatTime(schedule.start_time)
                        const endTime = formatTime(schedule.end_time)

                        return (
                          <div
                            key={schedule.id}
                            className="group relative overflow-hidden rounded-xl border border-border/50 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
                          >
                            <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${color}`} />
                            <div className="flex flex-col gap-4 pl-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-start gap-4">
                                <div className={`rounded-xl bg-gradient-to-br ${color} p-3 shadow-lg`}>
                                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-foreground leading-none">{courseName}</h3>
                                  <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                    <User className="h-3 w-3" />
                                    {teacher}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {startTime} - {endTime}
                                  </Badge>
                                  {schedule.classroom && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {schedule.classroom}
                                    </Badge>
                                  )}
                                </div>
                                {userRole === "admin" && (
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Weekly Overview */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Resumen Semanal</CardTitle>
          <CardDescription>Vista general de tus horarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            {daysWeek.map((day, idx) => {
              const dayIndex = dayIndices[idx]
              const dayCount = (schedulesByDay[dayIndex] || []).length
              const isToday = dayIndex === todayIndex

              return (
                <div
                  key={day}
                  className={`rounded-lg border p-4 transition-all cursor-pointer ${
                    isToday
                      ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
                      : "border-border/50 hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedDay(dayIndex)}
                >
                  <p className={`text-sm font-medium ${isToday ? "text-primary" : "text-foreground"}`}>
                    {day}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{dayCount}</p>
                  <p className="text-xs text-muted-foreground">horario{dayCount !== 1 ? "s" : ""}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Course Legend */}
      {courses && courses.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base">Cursos Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {courses.map((course, idx) => {
                const color = getColor(idx)
                return (
                  <div key={course.id} className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-4 h-4 rounded-full bg-gradient-to-br ${color}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{course.name}</p>
                      <p className="text-xs text-muted-foreground">{course.profiles?.full_name || "N/A"}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
