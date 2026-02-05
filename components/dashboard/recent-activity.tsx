"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BookOpen, ClipboardCheck, FileText, Bell, Users, MessageSquare } from "lucide-react"

const activities = [
  {
    user: "Maria Garcia",
    action: "subio un nuevo material",
    target: "Matematicas Avanzadas",
    time: "Hace 5 minutos",
    icon: FileText,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    user: "Carlos Lopez",
    action: "registro asistencia para",
    target: "3ro A - Fisica",
    time: "Hace 15 minutos",
    icon: ClipboardCheck,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    user: "Ana Martinez",
    action: "publico un anuncio en",
    target: "Informatica Basica",
    time: "Hace 30 minutos",
    icon: Bell,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
  {
    user: "Roberto Sanchez",
    action: "se inscribio en",
    target: "Ingles Intermedio",
    time: "Hace 1 hora",
    icon: BookOpen,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  {
    user: "Laura Fernandez",
    action: "programo una reunion con",
    target: "Padres de 2do B",
    time: "Hace 2 horas",
    icon: MessageSquare,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
]

export function RecentActivity() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-foreground">Actividad Reciente</CardTitle>
        <CardDescription>Ultimas acciones en el sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex items-start gap-4 rounded-lg p-2 transition-colors hover:bg-muted/50"
            >
              <Avatar className="h-10 w-10 border border-border/50">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground text-sm">
                  {activity.user
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
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
              <div className={`rounded-lg p-2 ${activity.bgColor}`}>
                <activity.icon className={`h-4 w-4 ${activity.color}`} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
