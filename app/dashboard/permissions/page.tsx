"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
} from "lucide-react"

const permissions = [
  {
    id: 1,
    student: "Maria Garcia",
    type: "absence",
    startDate: "2026-02-10",
    endDate: "2026-02-11",
    reason: "Cita medica programada",
    status: "pending",
    requestedBy: "Laura Garcia (Madre)",
    createdAt: "2026-02-05",
  },
  {
    id: 2,
    student: "Carlos Lopez",
    type: "early_leave",
    startDate: "2026-02-06",
    endDate: "2026-02-06",
    reason: "Evento familiar importante",
    status: "approved",
    requestedBy: "Pedro Lopez (Padre)",
    createdAt: "2026-02-04",
  },
  {
    id: 3,
    student: "Ana Martinez",
    type: "late_arrival",
    startDate: "2026-02-07",
    endDate: "2026-02-07",
    reason: "Cita con dentista por la manana",
    status: "approved",
    requestedBy: "Sofia Martinez (Madre)",
    createdAt: "2026-02-03",
  },
  {
    id: 4,
    student: "Roberto Sanchez",
    type: "absence",
    startDate: "2026-02-08",
    endDate: "2026-02-12",
    reason: "Viaje familiar",
    status: "denied",
    requestedBy: "Miguel Sanchez (Padre)",
    createdAt: "2026-02-02",
  },
]

const typeConfig = {
  absence: { label: "Ausencia", color: "bg-destructive/10 text-destructive border-destructive/20" },
  early_leave: { label: "Salida Temprana", color: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  late_arrival: { label: "Llegada Tarde", color: "bg-primary/10 text-primary border-primary/20" },
  other: { label: "Otro", color: "bg-muted text-muted-foreground border-border" },
}

const statusConfig = {
  pending: { label: "Pendiente", icon: AlertCircle, color: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  approved: { label: "Aprobado", icon: CheckCircle, color: "bg-accent/10 text-accent border-accent/20" },
  denied: { label: "Denegado", icon: XCircle, color: "bg-destructive/10 text-destructive border-destructive/20" },
}

export default function PermissionsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredPermissions = permissions.filter((p) => {
    const matchesSearch = p.student.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    pending: permissions.filter((p) => p.status === "pending").length,
    approved: permissions.filter((p) => p.status === "approved").length,
    denied: permissions.filter((p) => p.status === "denied").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Permisos</h1>
          <p className="text-muted-foreground">Solicitudes de ausencias y permisos</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
          <Link href="/dashboard/permissions/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Solicitud
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-xl bg-chart-4/10 p-3">
              <AlertCircle className="h-6 w-6 text-chart-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-xl bg-accent/10 p-3">
              <CheckCircle className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
              <p className="text-sm text-muted-foreground">Aprobados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-xl bg-destructive/10 p-3">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.denied}</p>
              <p className="text-sm text-muted-foreground">Denegados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por estudiante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" onValueChange={setStatusFilter}>
        <TabsList className="bg-card/50 backdrop-blur-xl">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="approved">Aprobados</TabsTrigger>
          <TabsTrigger value="denied">Denegados</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          <div className="space-y-4">
            {filteredPermissions.length === 0 ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <Shield className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-center text-muted-foreground">No hay permisos en esta categoria</p>
                </CardContent>
              </Card>
            ) : (
              filteredPermissions.map((permission) => {
                const type = typeConfig[permission.type as keyof typeof typeConfig]
                const status = statusConfig[permission.status as keyof typeof statusConfig]
                const StatusIcon = status.icon

                return (
                  <Card
                    key={permission.id}
                    className="border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300 hover:shadow-lg"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                            <User className="h-6 w-6 text-foreground" />
                          </div>
                          <div className="space-y-2">
                            <div>
                              <h3 className="font-semibold text-foreground">{permission.student}</h3>
                              <p className="text-sm text-muted-foreground">{permission.requestedBy}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className={type.color}>
                                {type.label}
                              </Badge>
                              <Badge variant="outline" className={`flex items-center gap-1 ${status.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {permission.startDate === permission.endDate
                              ? new Date(permission.startDate).toLocaleDateString("es-MX")
                              : `${new Date(permission.startDate).toLocaleDateString("es-MX")} - ${new Date(permission.endDate).toLocaleDateString("es-MX")}`}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 rounded-lg bg-muted/50 p-3">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Razon:</span> {permission.reason}
                        </p>
                      </div>
                      {permission.status === "pending" && (
                        <div className="mt-4 flex gap-2">
                          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Aprobar
                          </Button>
                          <Button size="sm" variant="destructive">
                            <XCircle className="mr-1 h-4 w-4" />
                            Denegar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
