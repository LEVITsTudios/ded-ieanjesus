"use client"

import React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, BookOpen } from "lucide-react"

interface TeacherOption {
  id: string
  full_name: string
}

interface CourseData {
  id: string
  name: string
  code: string
  description?: string
  subject?: string
  grade_level?: string
  max_students?: number
  teacher_id: string
  status: string
}

export default function EditCoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [codeGenerating, setCodeGenerating] = useState(false)
  const [codeManual, setCodeManual] = useState(false)
  const [codeHadSuffix, setCodeHadSuffix] = useState(false)

  const [formData, setFormData] = useState<CourseData>({
    id: "",
    name: "",
    code: "",
    description: "",
    subject: "",
    grade_level: "",
    max_students: 30,
    teacher_id: "",
    status: "active",
  })

  // Load current user and course data
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        setError("Debes iniciar sesión")
        setLoadingCourse(false)
        return
      }

      setCurrentUser(authUser)

      // Fetch current user's profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, full_name")
        .eq("id", authUser.id)
        .single()

      if (profileError) {
        setError("No pudimos cargar tu perfil")
        setLoadingCourse(false)
        return
      }

      const userIsAdmin = profile?.role === "admin"
      setIsAdmin(userIsAdmin)

      // Fetch course data
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single()

      if (courseError) {
        setError("Curso no encontrado")
        setLoadingCourse(false)
        return
      }

      // Check authorization: Only admin or course teacher can edit
      if (!userIsAdmin && course.teacher_id !== authUser.id) {
        setError("No tienes permiso para editar este curso")
        setLoadingCourse(false)
        return
      }

      setFormData(course)
      // Mark code as manual for existing courses to avoid overwriting by generator
      setCodeManual(true)
      setLoadingCourse(false)

      // If admin, fetch list of teachers
      if (userIsAdmin) {
        const { data: teachersList, error: teachersError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("role", ["teacher", "admin"])
          .order("full_name", { ascending: true })

        if (teachersError) {
          console.error("Error fetching teachers:", teachersError)
        } else {
          setTeachers(teachersList || [])
        }
      }

      setLoadingCourse(false)
    }

    loadData()
  }, [courseId])

  // Auto-generate course code from name (only when user hasn't edited code)
  useEffect(() => {
    const generateCode = async () => {
      if (codeManual) return // Do not overwrite manual edits
      if (!formData.name || formData.name.trim().length === 0) {
        setFormData(prev => ({ ...prev, code: "" }))
        return
      }

      setCodeGenerating(true)
      const supabase = createClient()

      // Generate base code from name: take first 3 letters of each word
      const words = formData.name.trim().split(" ").filter(w => w.length > 0)
      let baseCode = words
        .slice(0, 3)
        .map(word => word.substring(0, 3).toUpperCase())
        .join("-")

      // If only one word, use up to 5 letters
      if (words.length === 1) {
        baseCode = words[0].substring(0, 5).toUpperCase()
      }

      let finalCode = baseCode
      let counter = 1

      // Check if code already exists (excluding current course)
      while (true) {
        const { data: existingCourse } = await supabase
          .from("courses")
          .select("id")
          .eq("code", finalCode)
          .neq("id", courseId)
          .single()

        if (!existingCourse) {
          // Code is unique
          break
        }

        // Add suffix to make it unique
        finalCode = `${baseCode}-${counter}`
        counter++

        // Safety limit to prevent infinite loop
        if (counter > 100) {
          finalCode = `${baseCode}-${Date.now().toString().slice(-4)}`
          break
        }
      }

      // mark if we had to add a suffix
      setCodeHadSuffix(finalCode !== baseCode)
      setFormData(prev => ({ ...prev, code: finalCode }))
      setCodeGenerating(false)
    }

    // Debounce the generation to avoid too many DB calls
    const timeoutId = setTimeout(generateCode, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.name, courseId, codeManual])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.name || !formData.code) {
      setError("Nombre y Código son requeridos")
      setLoading(false)
      return
    }

    const supabase = createClient()

    if (!currentUser) {
      setError("Debes iniciar sesión")
      setLoading(false)
      return
    }

    try {
      // Use teacher_id from formData (already set when course loaded)
      const teacherId = formData.teacher_id
      if (!teacherId) {
        setError("Error: No se pudo determinar el ID del profesor del curso")
        setLoading(false)
        return
      }

      // Update course via API
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description || null,
          subject: formData.subject || null,
          grade_level: formData.grade_level || null,
          max_students: formData.max_students ? parseInt(String(formData.max_students)) : 30,
          teacher_id: teacherId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error updating course")
      }

      // Success
      router.push("/dashboard/courses")
      router.refresh()
    } catch (err: any) {
      console.error("Update error:", err)
      setError(`Error: ${err?.message || "Intenta de nuevo más tarde."}`)
      setLoading(false)
    }
  }

  if (loadingCourse) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/courses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editar Curso</h1>
          <p className="text-muted-foreground">Modifica los datos del curso</p>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>Informacion del Curso</CardTitle>
              <CardDescription>Actualiza los datos del curso</CardDescription>
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
                <Label htmlFor="name">Nombre del Curso *</Label>
                <Input
                  id="name"
                  placeholder="Matematicas Avanzadas"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Codigo *</Label>
                <div className="relative">
                  <Input
                    id="code"
                    placeholder="MAT-301"
                    value={formData.code}
                    onChange={(e) => {
                      setCodeManual(true)
                      setCodeHadSuffix(false)
                      setFormData({ ...formData, code: e.target.value })
                    }}
                    required
                    aria-describedby={codeGenerating ? 'code-gen-status' : codeHadSuffix ? 'code-suffix-note' : undefined}
                  />

                  {codeGenerating && (
                    <div id="code-gen-status" role="status" aria-live="polite" className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground text-xs">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span>Generando...</span>
                    </div>
                  )}

                  {!codeGenerating && codeHadSuffix && (
                    <div id="code-suffix-note" className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-amber-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z"/></svg>
                      <span>Sugerido</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isAdmin && teachers.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="teacher">Profesor Asignado</Label>
                <Select value={formData.teacher_id || ""} onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona profesor" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                placeholder="Describe el contenido y objetivos del curso..."
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subject">Materia</Label>
                <Select
                  value={formData.subject || ""}
                  onValueChange={(value) => setFormData({ ...formData, subject: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona materia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matematicas">Matematicas</SelectItem>
                    <SelectItem value="espanol">Espanol</SelectItem>
                    <SelectItem value="ciencias">Ciencias</SelectItem>
                    <SelectItem value="historia">Historia</SelectItem>
                    <SelectItem value="ingles">Ingles</SelectItem>
                    <SelectItem value="fisica">Fisica</SelectItem>
                    <SelectItem value="quimica">Quimica</SelectItem>
                    <SelectItem value="biologia">Biologia</SelectItem>
                    <SelectItem value="informatica">Informatica</SelectItem>
                    <SelectItem value="arte">Arte</SelectItem>
                    <SelectItem value="musica">Musica</SelectItem>
                    <SelectItem value="educacion_fisica">Educacion Fisica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade_level">Nivel/Grado</Label>
                <Select
                  value={formData.grade_level || ""}
                  onValueChange={(value) => setFormData({ ...formData, grade_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preescolar">Preescolar</SelectItem>
                    <SelectItem value="1ro_primaria">1ro Primaria</SelectItem>
                    <SelectItem value="2do_primaria">2do Primaria</SelectItem>
                    <SelectItem value="3ro_primaria">3ro Primaria</SelectItem>
                    <SelectItem value="4to_primaria">4to Primaria</SelectItem>
                    <SelectItem value="5to_primaria">5to Primaria</SelectItem>
                    <SelectItem value="6to_primaria">6to Primaria</SelectItem>
                    <SelectItem value="1ro_secundaria">1ro Secundaria</SelectItem>
                    <SelectItem value="2do_secundaria">2do Secundaria</SelectItem>
                    <SelectItem value="3ro_secundaria">3ro Secundaria</SelectItem>
                    <SelectItem value="preparatoria">Preparatoria</SelectItem>
                    <SelectItem value="universidad">Universidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_students">Maximo de Estudiantes</Label>
              <Input
                id="max_students"
                type="number"
                placeholder="30"
                value={formData.max_students || 30}
                onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                min={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="archived">Archivado</SelectItem>
                </SelectContent>
              </Select>
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
                disabled={loading || !formData.teacher_id}
                className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
