"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Trash2, Search, Plus } from "lucide-react"
import type { UserRole } from "@/lib/types"

interface Enrollment {
  id: string
  status: string
  enrollment_date?: string
  student?: { id: string; full_name: string }
  course?: { id: string; name: string; code?: string }
}

interface EnrollmentsViewProps {
  enrollments: Enrollment[]
  userRole: UserRole
  userId: string
}

const statusColors: Record<string, string> = {
  active: "bg-accent/10 text-accent border-accent/20",
  completed: "bg-green-100 text-green-800 border-green-200",
  dropped: "bg-destructive/10 text-destructive border-destructive/20",
  pending: "bg-muted text-muted-foreground border-border",
}

const statusLabels: Record<string, string> = {
  active: "Activo",
  completed: "Completado",
  dropped: "Abandonado",
  pending: "Pendiente",
}

export function EnrollmentsView({
  enrollments: initial,
  userRole,
  userId,
}: EnrollmentsViewProps) {
  const [search, setSearch] = useState("")
  const [records, setRecords] = useState<Enrollment[]>(initial)
  const [selectedCourse, setSelectedCourse] = useState<string>("all")

  // compute unique courses for filter select
  const courseOptions = Array.from(
    new Map(
      records
        .map((r) => r.course)
        .filter(Boolean)
        .map((c) => [c!.id, c!])
    ).values()
  )

  const filtered = records.filter((r) => {
    const studentName = r.student?.full_name || ""
    const courseName = r.course?.name || ""
    const matchesSearch =
      studentName.toLowerCase().includes(search.toLowerCase()) ||
      courseName.toLowerCase().includes(search.toLowerCase())
    const matchesCourse =
      selectedCourse === "all" || r.course?.id === selectedCourse
    return matchesSearch && matchesCourse
  })

  const canModify = userRole === "admin" || userRole === "teacher"
  const canDelete = userRole === "admin" // RLS only allows admins to delete

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar inscripción?")) return
    try {
      const res = await fetch(`/api/enrollments/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Error al eliminar")
      }
      setRecords((prev) => prev.filter((r) => r.id !== id))
    } catch (err: any) {
      console.error("Eliminar inscripción error:", err)
      alert(err.message || "No se pudo eliminar la inscripción")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inscripciones</h1>
          <p className="text-muted-foreground">
            {canModify
              ? "Gestiona las inscripciones de los estudiantes"
              : "Consulta tus inscripciones"}
          </p>
        </div>
        {canModify && (
          <Button
            asChild
            className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg"
          >
            <Link href="/dashboard/enrollments/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Inscripción
            </Link>
          </Button>
        )}
      </div>

      {/* Search & filter */}
      <div className="flex flex-wrap gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por estudiante o curso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {courseOptions.length > 0 && (
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los cursos</SelectItem>
              {courseOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* List or empty state */}
      {filtered.length === 0 ? (
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-foreground">
              No hay inscripciones
            </h3>
            <p className="text-center text-muted-foreground">
              {search
                ? "Ninguna inscripción coincide con la búsqueda"
                : "Aún no se han registrado inscripciones"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <Card
              key={r.id}
              className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-accent" />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                      <Users className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground">
                        {r.student?.full_name || "-"}
                      </CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {r.course?.code || ""}
                      </Badge>
                    </div>
                  </div>
                  {canDelete && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(r.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {r.course?.name && (
                    <Badge variant="secondary" className="text-xs">
                      {r.course.name}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={
                      statusColors[r.status as keyof typeof statusColors] || ""
                    }
                  >
                    {statusLabels[r.status as keyof typeof statusLabels] || r.status}
                  </Badge>
                </div>
                {r.enrollment_date && (
                  <p className="text-xs text-muted-foreground">
                    Inscrito: {new Date(r.enrollment_date).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
