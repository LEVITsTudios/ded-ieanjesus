"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, Plus, Search, Calendar, User, Megaphone } from "lucide-react"

const announcements = [
  {
    id: 1,
    title: "Suspension de clases por dia festivo",
    content: "Se informa a toda la comunidad estudiantil que el proximo lunes no habra clases debido al dia festivo nacional. Las actividades se reanudan el martes.",
    author: "Direccion",
    date: "2026-02-05",
    target: "all",
    priority: "high",
  },
  {
    id: 2,
    title: "Convocatoria para concurso de matematicas",
    content: "Se invita a todos los estudiantes interesados en participar en el concurso regional de matematicas a inscribirse antes del viernes.",
    author: "Prof. Garcia",
    date: "2026-02-04",
    target: "students",
    priority: "normal",
  },
  {
    id: 3,
    title: "Reunion de padres de familia",
    content: "Se convoca a todos los padres de familia a la junta informativa que se llevara a cabo el sabado a las 10:00 hrs en el auditorio principal.",
    author: "Direccion",
    date: "2026-02-03",
    target: "parents",
    priority: "high",
  },
  {
    id: 4,
    title: "Actualizacion del sistema de calificaciones",
    content: "Se informa a los docentes que el sistema de calificaciones estara en mantenimiento el domingo de 8:00 a 12:00 hrs.",
    author: "Sistemas",
    date: "2026-02-02",
    target: "teachers",
    priority: "normal",
  },
]

const targetLabels = {
  all: "Todos",
  students: "Estudiantes",
  teachers: "Maestros",
  parents: "Padres",
}

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  normal: "bg-primary/10 text-primary border-primary/20",
}

export default function AnnouncementsPage() {
  const [search, setSearch] = useState("")

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Anuncios</h1>
          <p className="text-muted-foreground">Comunicados importantes de la institucion</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
          <Link href="/dashboard/announcements/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Anuncio
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar anuncios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-center text-muted-foreground">No hay anuncios</p>
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <Card
              key={announcement.id}
              className="border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                      <Megaphone className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground">{announcement.title}</CardTitle>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={priorityColors[announcement.priority as keyof typeof priorityColors]}>
                          {announcement.priority === "high" ? "Importante" : "Normal"}
                        </Badge>
                        <Badge variant="secondary">
                          {targetLabels[announcement.target as keyof typeof targetLabels]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{announcement.content}</p>
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-[10px]">
                        {announcement.author[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{announcement.author}</span>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(announcement.date).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
