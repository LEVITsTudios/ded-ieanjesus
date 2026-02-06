import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BookOpen, ClipboardCheck, FileText, Bell, Users, MessageSquare } from "lucide-react"

function getTimeAgo(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Ahora"
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? "s" : ""}`
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? "s" : ""}`
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? "s" : ""}`
  return then.toLocaleDateString("es-EC")
}

const iconMap = {
  material: FileText,
  attendance: ClipboardCheck,
  announcement: Bell,
  enrollment: BookOpen,
  meeting: MessageSquare,
  grade: Users,
}

const colorMap: Record<string, { color: string; bgColor: string }> = {
  material: { color: "text-primary", bgColor: "bg-primary/10" },
  attendance: { color: "text-accent", bgColor: "bg-accent/10" },
  announcement: { color: "text-chart-4", bgColor: "bg-chart-4/10" },
  enrollment: { color: "text-chart-3", bgColor: "bg-chart-3/10" },
  meeting: { color: "text-primary", bgColor: "bg-primary/10" },
  grade: { color: "text-accent", bgColor: "bg-accent/10" },
}

const actionText = {
  material: "subio un material",
  attendance: "registro asistencia para",
  announcement: "publico un anuncio",
  enrollment: "se inscribio en",
  meeting: "programo una reunion",
  grade: "calificar tarea en",
}

export async function RecentActivity() {
  const supabase = await createClient()

  // Fetch recent materials
  const { data: materials } = await supabase
    .from("materials")
    .select("id, title, created_at, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(2)

  // Fetch recent announcements
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, created_at, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(2)

  // Fetch recent meetings
  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, created_at, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(1)

  const activities = [
    ...(materials || []).map(m => ({
      user: (m.profiles as any)?.full_name || "Usuario",
      action: "subio un material",
      target: m.title,
      time: getTimeAgo(m.created_at),
      type: "material" as const,
    })),
    ...(announcements || []).map(a => ({
      user: (a.profiles as any)?.full_name || "Usuario",
      action: "publico un anuncio",
      target: a.title,
      time: getTimeAgo(a.created_at),
      type: "announcement" as const,
    })),
    ...(meetings || []).map(m => ({
      user: (m.profiles as any)?.full_name || "Usuario",
      action: "programo una reunion",
      target: m.title,
      time: getTimeAgo(m.created_at),
      type: "meeting" as const,
    })),
  ].sort((a, b) => {
    const timeA = parseInt(a.time.match(/\d+/)?.[0] || "999999")
    const timeB = parseInt(b.time.match(/\d+/)?.[0] || "999999")
    return timeA - timeB
  }).slice(0, 5)

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-foreground">Actividad Reciente</CardTitle>
        <CardDescription>Ultimas acciones en el sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? activities.map((activity, index) => {
            const Icon = iconMap[activity.type] || FileText
            const { color, bgColor } = colorMap[activity.type]
            return (
              <div
                key={index}
                className="flex items-start gap-4 rounded-lg p-2 transition-colors hover:bg-muted/50"
              >
                <Avatar className="h-10 w-10 border border-border/50">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground text-sm">
                    {activity.user
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.user}</span>{" "}
                    <span className="text-muted-foreground">{activity.action}</span>{" "}
                    <span className="font-medium text-primary">{activity.target}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
                <div className={`rounded-lg p-2 ${bgColor}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </div>
            )
          }) : (
            <p className="text-sm text-muted-foreground text-center py-4">Sin actividad reciente</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
