"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  MessageSquare,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  ExternalLink,
} from "lucide-react"

const meetings = [
  {
    id: 1,
    title: "Reunion de Padres - 3ro A",
    description: "Revision de avances del primer bimestre",
    type: "parent_teacher",
    date: "2026-02-10",
    time: "15:00",
    duration: 60,
    location: "Salon 101",
    meetingUrl: null,
    organizer: "Prof. Garcia",
    participants: 25,
  },
  {
    id: 2,
    title: "Junta de Maestros",
    description: "Planeacion del segundo semestre",
    type: "staff",
    date: "2026-02-08",
    time: "14:00",
    duration: 90,
    location: null,
    meetingUrl: "https://meet.example.com/xyz",
    organizer: "Direccion",
    participants: 15,
  },
  {
    id: 3,
    title: "Tutoria - Carlos Lopez",
    description: "Seguimiento academico",
    type: "class",
    date: "2026-02-07",
    time: "16:00",
    duration: 30,
    location: "Oficina Orientacion",
    meetingUrl: null,
    organizer: "Prof. Martinez",
    participants: 3,
  },
  {
    id: 4,
    title: "Asamblea General",
    description: "Informes y avisos importantes para la comunidad escolar",
    type: "general",
    date: "2026-02-15",
    time: "10:00",
    duration: 120,
    location: "Auditorio Principal",
    meetingUrl: null,
    organizer: "Direccion",
    participants: 200,
  },
]

const typeConfig = {
  parent_teacher: { label: "Padres-Maestros", color: "bg-primary/10 text-primary border-primary/20" },
  staff: { label: "Personal", color: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
  class: { label: "Clase", color: "bg-accent/10 text-accent border-accent/20" },
  general: { label: "General", color: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
}

export default function MeetingsPage() {
  const [search, setSearch] = useState("")

  const filteredMeetings = meetings.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase())
  )

  const upcomingMeetings = filteredMeetings.filter(
    (m) => new Date(m.date) >= new Date()
  )
  const pastMeetings = filteredMeetings.filter(
    (m) => new Date(m.date) < new Date()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reuniones</h1>
          <p className="text-muted-foreground">Programa y gestiona tus reuniones</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
          <Link href="/dashboard/meetings/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Reunion
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar reuniones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Upcoming Meetings */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Proximas Reuniones</h2>
        {upcomingMeetings.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 rounded-full bg-muted p-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-center text-muted-foreground">No hay reuniones programadas</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingMeetings.map((meeting) => {
              const type = typeConfig[meeting.type as keyof typeof typeConfig]

              return (
                <Card
                  key={meeting.id}
                  className="border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                          <MessageSquare className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-base text-foreground">{meeting.title}</CardTitle>
                          <Badge variant="outline" className={`mt-1 text-xs ${type.color}`}>
                            {type.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription>{meeting.description}</CardDescription>

                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(meeting.date).toLocaleDateString("es-MX", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {meeting.time} ({meeting.duration} min)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {meeting.meetingUrl ? (
                        <span className="flex items-center gap-1">
                          <Video className="h-4 w-4" />
                          Virtual
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {meeting.location}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-[10px]">
                            {meeting.organizer[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{meeting.organizer}</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {meeting.participants} participantes
                      </span>
                    </div>

                    {meeting.meetingUrl && (
                      <Button size="sm" className="w-full bg-transparent" variant="outline">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Unirse a la reunion
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Reuniones Pasadas</h2>
          <div className="space-y-2">
            {pastMeetings.map((meeting) => (
              <Card key={meeting.id} className="border-border/50 bg-card/30">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">{meeting.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(meeting.date).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
