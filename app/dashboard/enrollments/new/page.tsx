"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Users } from "lucide-react"

interface CourseOption {
  id: string
  name: string
}
interface StudentOption {
  id: string
  full_name: string
}

// Helper to decode and log JWT payload for debugging
function decodeTokenForDebug(token: string) {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const decoded = JSON.parse(atob(parts[1]))
    return decoded
  } catch (e) {
    return null
  }
}

export default function NewEnrollmentPage() {
  const router = useRouter()
  const supabase = createClient()
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("Debe iniciar sesión para continuar")
        return
      }
      const role = user.user_metadata?.role || "student"

      // fetch courses: if teacher, only their courses; if admin, all
      let courseQuery = supabase.from("courses").select("id, name")
      if (role === "teacher") {
        courseQuery = courseQuery.eq("teacher_id", user.id)
      }
      const { data: courseData, error: courseErr } = await courseQuery
      if (courseErr) {
        console.error(courseErr)
        setError("Error cargando cursos")
      } else {
        setCourses(courseData || [])
      }

      // fetch students list (profiles.role = student)
      const { data: studentData, error: studentErr } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "student")
        .order("full_name", { ascending: true })

      if (studentErr) {
        console.error(studentErr)
        setError("Error cargando estudiantes")
      } else {
        setStudents(studentData || [])
      }
    }
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!selectedCourse || !selectedStudent) {
      setError("Selecciona estudiante y curso")
      return
    }
    setLoading(true)
    try {
      // double-check we still have a valid session before attempting
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("No hay sesión activa. Por favor inicia sesión nuevamente.")
      }

      const payload = {
        student_id: selectedStudent,
        course_id: selectedCourse,
      }
      const token = session.access_token
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include", // ensure cookies (Supabase auth) accompany request
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        if (res.status === 401) {
          throw new Error(
            json.error ||
              "No autenticado. Tu sesión puede haber expirado, por favor inicia sesión de nuevo."
          )
        }
        throw new Error(json.error || "Error creando inscripción")
      }
      router.push("/dashboard/enrollments")
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/enrollments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nueva Inscripción</h1>
          <p className="text-muted-foreground">Asignar un estudiante a un curso</p>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>Detalles de Inscripción</CardTitle>
              <CardDescription>Selecciona los datos para proceder</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="student">Estudiante *</Label>
                <Select
                  onValueChange={setSelectedStudent}
                  value={selectedStudent}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Curso *</Label>
                <Select onValueChange={setSelectedCourse} value={selectedCourse}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground"
              >
                {loading ? "Guardando..." : "Inscribir"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
