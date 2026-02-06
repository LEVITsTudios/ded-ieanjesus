import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin } from "lucide-react"

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) return "Hoy"
  if (date.toDateString() === tomorrow.toDateString()) return "Mañana"

  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
  return dayNames[date.getDay()]
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })
}

const typeColors = {
  meeting: "bg-primary/10 text-primary border-primary/20",
  schedule: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  assignment: "bg-accent/10 text-accent border-accent/20",
}

const typeLabels = {
  meeting: "Reunión",
  schedule: "Clase",
  assignment: "Tarea",
}

export async function UpcomingEvents() {
  const supabase = await createClient()

  const today = new Date().toISOString()

  // Fetch upcoming meetings
  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, scheduled_at, location")
    .gte("scheduled_at", today)
    .order("scheduled_at", { ascending: true })
    .limit(2)

  // Fetch upcoming schedules
  const { data: schedules } = await supabase
    .from("schedules")
    .select("id, course_id, start_time, location, courses(name)")
    .gte("start_time", today)
    .order("start_time", { ascending: true })
    .limit(2)

  const events = [
    ...(meetings || []).map(m => ({
      title: m.title,
      date: formatDate(m.scheduled_at),
      time: formatTime(m.scheduled_at),
      location: m.location || "Por confirmar",
      type: "meeting" as const,
    })),
    ...(schedules || []).map(s => ({
      title: (s.courses as any)?.name || "Clase",
      date: formatDate(s.start_time),
      time: formatTime(s.start_time),
      location: s.location || "Por confirmar",
      type: "schedule" as const,
    })),
  ]
    .sort((a, b) => {
      const dateOrder = ["Hoy", "Mañana", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
      return dateOrder.indexOf(a.date) - dateOrder.indexOf(b.date)
    })
    .slice(0, 4)

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-foreground">Próximos Eventos</CardTitle>
        <CardDescription>Tu agenda próxima</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.length > 0 ? events.map((event, index) => (
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
                  className={`text-[10px] px-1.5 py-0 ${typeColors[event.type]}`}
                >
                  {typeLabels[event.type]}
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
        )) : (
          <p className="text-sm text-muted-foreground text-center py-4">Sin eventos próximos</p>
        )}
      </CardContent>
    </Card>
  )
}
