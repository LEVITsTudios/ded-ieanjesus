"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, BookOpen, User } from "lucide-react"
import type { UserRole } from "@/lib/types"

interface SchedulesViewProps {
  userRole: UserRole
}

const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"]

const scheduleData = [
  {
    id: 1,
    day: 0,
    course: "Matematicas",
    teacher: "Prof. Garcia",
    startTime: "08:00",
    endTime: "09:30",
    room: "Salon 101",
    color: "from-primary to-accent",
  },
  {
    id: 2,
    day: 0,
    course: "Espanol",
    teacher: "Prof. Martinez",
    startTime: "09:45",
    endTime: "11:15",
    room: "Salon 102",
    color: "from-accent to-primary",
  },
  {
    id: 3,
    day: 0,
    course: "Ciencias",
    teacher: "Prof. Lopez",
    startTime: "11:30",
    endTime: "13:00",
    room: "Laboratorio",
    color: "from-chart-3 to-primary",
  },
  {
    id: 4,
    day: 1,
    course: "Historia",
    teacher: "Prof. Sanchez",
    startTime: "08:00",
    endTime: "09:30",
    room: "Salon 103",
    color: "from-chart-4 to-accent",
  },
  {
    id: 5,
    day: 1,
    course: "Ingles",
    teacher: "Prof. Rodriguez",
    startTime: "09:45",
    endTime: "11:15",
    room: "Salon 104",
    color: "from-primary to-chart-3",
  },
  {
    id: 6,
    day: 1,
    course: "Fisica",
    teacher: "Prof. Hernandez",
    startTime: "11:30",
    endTime: "13:00",
    room: "Laboratorio",
    color: "from-accent to-chart-4",
  },
  {
    id: 7,
    day: 2,
    course: "Matematicas",
    teacher: "Prof. Garcia",
    startTime: "08:00",
    endTime: "09:30",
    room: "Salon 101",
    color: "from-primary to-accent",
  },
  {
    id: 8,
    day: 2,
    course: "Quimica",
    teacher: "Prof. Flores",
    startTime: "09:45",
    endTime: "11:15",
    room: "Laboratorio",
    color: "from-chart-3 to-accent",
  },
  {
    id: 9,
    day: 3,
    course: "Informatica",
    teacher: "Prof. Ramirez",
    startTime: "08:00",
    endTime: "09:30",
    room: "Sala Computo",
    color: "from-primary to-chart-3",
  },
  {
    id: 10,
    day: 3,
    course: "Arte",
    teacher: "Prof. Morales",
    startTime: "09:45",
    endTime: "11:15",
    room: "Taller Arte",
    color: "from-chart-4 to-primary",
  },
  {
    id: 11,
    day: 4,
    course: "Educacion Fisica",
    teacher: "Prof. Castro",
    startTime: "08:00",
    endTime: "09:30",
    room: "Gimnasio",
    color: "from-accent to-chart-4",
  },
  {
    id: 12,
    day: 4,
    course: "Musica",
    teacher: "Prof. Vega",
    startTime: "09:45",
    endTime: "11:15",
    room: "Auditorio",
    color: "from-chart-3 to-primary",
  },
]

const todayIndex = new Date().getDay() - 1

export function SchedulesView({ userRole }: SchedulesViewProps) {
  const [selectedDay, setSelectedDay] = useState(todayIndex >= 0 && todayIndex < 5 ? todayIndex : 0)

  const todaySchedule = scheduleData.filter((s) => s.day === selectedDay)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Horarios</h1>
          <p className="text-muted-foreground">Consulta tu horario de clases semanal</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2 self-start">
          <Calendar className="h-4 w-4" />
          Semana Actual
        </Badge>
      </div>

      {/* Week View Tabs */}
      <Tabs defaultValue={selectedDay.toString()} onValueChange={(v) => setSelectedDay(parseInt(v))}>
        <TabsList className="grid w-full grid-cols-5 bg-card/50 backdrop-blur-xl">
          {days.map((day, index) => (
            <TabsTrigger
              key={day}
              value={index.toString()}
              className={`data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground ${
                index === todayIndex ? "ring-2 ring-primary/50" : ""
              }`}
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 3)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {days.map((day, dayIndex) => (
          <TabsContent key={day} value={dayIndex.toString()} className="mt-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">{day}</CardTitle>
                    <CardDescription>
                      {scheduleData.filter((s) => s.day === dayIndex).length} clases programadas
                    </CardDescription>
                  </div>
                  {dayIndex === todayIndex && (
                    <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                      Hoy
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {scheduleData.filter((s) => s.day === dayIndex).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="mb-4 rounded-full bg-muted p-4">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-center text-muted-foreground">No hay clases programadas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduleData
                      .filter((s) => s.day === dayIndex)
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((schedule) => (
                        <div
                          key={schedule.id}
                          className="group relative overflow-hidden rounded-xl border border-border/50 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
                        >
                          <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${schedule.color}`} />
                          <div className="flex flex-col gap-4 pl-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                              <div className={`rounded-xl bg-gradient-to-br ${schedule.color} p-3 shadow-lg`}>
                                <BookOpen className="h-5 w-5 text-primary-foreground" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">{schedule.course}</h3>
                                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  {schedule.teacher}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm">
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {schedule.startTime} - {schedule.endTime}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {schedule.room}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Overview */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Resumen Semanal</CardTitle>
          <CardDescription>Vista general de tus clases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {days.map((day, index) => {
              const dayClasses = scheduleData.filter((s) => s.day === index)
              return (
                <div
                  key={day}
                  className={`rounded-lg border p-4 transition-colors ${
                    index === todayIndex
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/50 hover:bg-muted/50"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">{day}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{dayClasses.length}</p>
                  <p className="text-xs text-muted-foreground">clases</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
