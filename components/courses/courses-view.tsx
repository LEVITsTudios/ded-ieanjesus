"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  BookOpen,
  Plus,
  Search,
  Users,
  Clock,
  GraduationCap,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { UserRole } from "@/lib/types"

interface Course {
  id: string
  name: string
  description?: string
  code: string
  grade_level?: string
  subject?: string
  max_students?: number
  status: string
  teacher?: {
    id: string
    full_name: string
    email: string
  }
}

interface CoursesViewProps {
  courses: Course[]
  userRole: UserRole
  userId: string
}

const statusColors = {
  active: "bg-accent/10 text-accent border-accent/20",
  inactive: "bg-muted text-muted-foreground border-border",
  archived: "bg-destructive/10 text-destructive border-destructive/20",
}

const statusLabels = {
  active: "Activo",
  inactive: "Inactivo",
  archived: "Archivado",
}

export function CoursesView({ courses: initialCourses, userRole, userId }: CoursesViewProps) {
  const [search, setSearch] = useState("")
  const [courses, setCourses] = useState(initialCourses)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(search.toLowerCase()) ||
      course.code.toLowerCase().includes(search.toLowerCase()) ||
      course.subject?.toLowerCase().includes(search.toLowerCase())
  )

  const canEdit = userRole === "admin" || userRole === "teacher"

  const handleDeleteClick = (course: Course) => {
    // Only allow deletion if user is admin or is the course teacher
    if (userRole === "admin" || course.teacher?.id === userId) {
      setSelectedCourse(course)
      setShowDeleteDialog(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCourse) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/courses/${selectedCourse.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error deleting course")
      }

      // Remove course from local state
      setCourses(courses.filter(c => c.id !== selectedCourse.id))
      setShowDeleteDialog(false)
      setSelectedCourse(null)
      router.refresh()
    } catch (err: any) {
      console.error("Delete error:", err)
      setError(`Error: ${err?.message || "No se pudo eliminar el curso."}`)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cursos</h1>
          <p className="text-muted-foreground">
            {userRole === "admin" || userRole === "teacher"
              ? "Gestiona los cursos de la institucion"
              : "Explora los cursos disponibles"}
          </p>
        </div>
        {canEdit && (
          <Button asChild className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
            <Link href="/dashboard/courses/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Curso
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, codigo o materia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-muted p-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-foreground">No hay cursos</h3>
            <p className="text-center text-muted-foreground">
              {search ? "No se encontraron cursos con esa busqueda" : "Aun no hay cursos registrados"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-accent" />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                      <GraduationCap className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground">{course.name}</CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {course.code}
                      </Badge>
                    </div>
                  </div>
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/courses/${course.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </Link>
                        </DropdownMenuItem>
                        {(userRole === "admin" || course.teacher?.id === userId) && (
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/courses/${course.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(userRole === "admin" || course.teacher?.id === userId) && (
                          <DropdownMenuItem 
                            className="text-destructive cursor-pointer"
                            onClick={() => handleDeleteClick(course)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.description && (
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                )}

                <div className="flex flex-wrap gap-2">
                  {course.subject && (
                    <Badge variant="secondary" className="text-xs">
                      {course.subject}
                    </Badge>
                  )}
                  {course.grade_level && (
                    <Badge variant="secondary" className="text-xs">
                      {course.grade_level}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={statusColors[course.status as keyof typeof statusColors]}
                  >
                    {statusLabels[course.status as keyof typeof statusLabels]}
                  </Badge>
                </div>

                {course.teacher && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-xs">
                        {course.teacher.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {course.teacher.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">Profesor</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {course.max_students || "Sin limite"} estudiantes
                  </span>
                  <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                    <Link href={`/dashboard/courses/${course.id}`}>
                      Ver mas
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Curso</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que deseas eliminar el curso "<strong>{selectedCourse?.name}</strong>"? 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
