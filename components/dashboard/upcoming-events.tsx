"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin } from "lucide-react"

const events = [
  {
    title: "Reunion de Padres",
    date: "Hoy",
    time: "15:00",
    location: "Salon 101",
    type: "meeting",
  },
  {
    title: "Examen de Matematicas",
    date: "Manana",
    time: "09:00",
    location: "Salon 205",
    type: "exam",
  },
  {
    title: "Entrega de Proyecto",
    date: "Viernes",
    time: "23:59",
    location: "En linea",
    type: "assignment",
  },
  {
    title: "Festival Escolar",
    date: "Sabado",
    time: "10:00",
    location: "Patio Principal",
    type: "event",
  },
]

const typeColors = {
  meeting: "bg-primary/10 text-primary border-primary/20",
  exam: "bg-destructive/10 text-destructive border-destructive/20",
  assignment: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  event: "bg-accent/10 text-accent border-accent/20",
}

const typeLabels = {
  meeting: "Reunion",
  exam: "Examen",
  assignment: "Tarea",
  event: "Evento",
}

export function UpcomingEvents() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-foreground">Proximos Eventos</CardTitle>
        <CardDescription>Tu agenda para esta semana</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event, index) => (
          <div
            key={index}
            className="group flex gap-4 rounded-lg border border-border/50 p-3 transition-all duration-300 hover:bg-muted/50 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 text-center">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">{event.date}</span>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-foreground leading-tight">{event.title}</p>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${typeColors[event.type as keyof typeof typeColors]}`}
                >
                  {typeLabels[event.type as keyof typeof typeLabels]}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {event.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
