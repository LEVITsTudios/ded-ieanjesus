"use client"

import React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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

export default function NewCoursePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null)
  const [codeGenerating, setCodeGenerating] = useState(false)
  const [codeManual, setCodeManual] = useState(false)
  const [codeHadSuffix, setCodeHadSuffix] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    subject: "",
    grade_level: "",
    max_students: "",
  })

  // Load current user and verify they can create courses
  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        setError("Debes iniciar sesión")
        return
      }

      setCurrentUser(authUser)
      setSelectedTeacher(authUser.id)
      // New course: allow generator to run
      setCodeManual(false)

      // Fetch current user's profile to check role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, full_name")
        .eq("id", authUser.id)
        .single()

      if (profileError) {
        // Profile doesn't exist, create it
        const { error: createError } = await supabase.from("profiles").insert({
          id: authUser.id,
          email: authUser.email || "",
          full_name: (authUser.user_metadata as any)?.full_name || authUser.email || "Usuario",
          role: "teacher",
        })

        if (createError) {
          console.error("Error creating profile:", createError)
          setError(`Error al crear perfil: ${createError.message}`)
        } else {
          setIsAdmin(false)
        }
        return
      }

      const userIsAdmin = profile?.role === "admin"
      setIsAdmin(userIsAdmin)

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
    }

    loadUserData()
  }, [])

  // Auto-generate course code from name
  useEffect(() => {
    const generateCode = async () => {
      if (codeManual) return
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

      if (words.length === 1) {
        baseCode = words[0].substring(0, 5).toUpperCase()
      }

      let finalCode = baseCode
      let counter = 1

      while (true) {
        const { data: existingCourse } = await supabase
          .from("courses")
          .select("id")
          .eq("code", finalCode)
          .single()

        if (!existingCourse) break

        finalCode = `${baseCode}-${counter}`
        counter++

        if (counter > 100) {
          finalCode = `${baseCode}-${Date.now().toString().slice(-4)}`
          break
        }
      }

      // mark if we had to add a suffix (i.e., result differs from base)
      setCodeHadSuffix(finalCode !== baseCode)
      setFormData(prev => ({ ...prev, code: finalCode }))
      setCodeGenerating(false)
    }

    // Debounce the generation to avoid too many DB calls
    const timeoutId = setTimeout(generateCode, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.name, codeManual])

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
      // Determine which teacher ID to use (current user or selected if admin)
      const teacherId = selectedTeacher || currentUser.id

      if (!teacherId) {
        setError("Error: No se pudo determinar el ID del profesor")
        setLoading(false)
        return
      }

      // Validate that the selected teacher exists in profiles
      const { data: teacherProfile, error: teacherCheckError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", teacherId)
        .single()

      if (teacherCheckError || !teacherProfile) {
        console.error("Teacher validation error:", teacherCheckError)
        setError(
          `El profesor seleccionado no existe o no está disponible. Por favor, recarga la página e intenta de nuevo.`
        )
        setLoading(false)
        return
      }

      // Upsert current user profile (ensure it exists)
      const { error: profileUpsertError } = await supabase.from("profiles").upsert(
        {
          id: currentUser.id,
          email: currentUser.email || "",
          full_name: (currentUser.user_metadata as any)?.full_name || currentUser.email || "Usuario",
          role: isAdmin ? "admin" : "teacher",
        },
        { onConflict: "id" }
      )

      if (profileUpsertError) {
        console.error("Profile upsert error:", profileUpsertError)
        setError(`Error al actualizar tu perfil: ${profileUpsertError.message}`)
        setLoading(false)
        return
      }

      // Insert course
      const { data: courseData, error: courseError } = await supabase.from("courses").insert({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description || null,
        subject: formData.subject || null,
        grade_level: formData.grade_level || null,
        max_students: formData.max_students ? parseInt(formData.max_students) : 30,
        teacher_id: teacherId,
        status: "active",
      })

      if (courseError) {
        console.error("Course insert error:", courseError)
        setError(
          `Error al crear el curso: ${courseError.message || "Intenta de nuevo más tarde."}`
        )
        setLoading(false)
        return
      }

      // Success
      router.push("/dashboard/courses")
      router.refresh()
    } catch (err: any) {
      console.error("Unexpected error:", err)
      setError(`Error inesperado: ${err?.message || String(err)}`)
      setLoading(false)
    }
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
          <h1 className="text-2xl font-bold text-foreground">Nuevo Curso</h1>
          <p className="text-muted-foreground">Crea un nuevo curso para tu institucion</p>
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
              <CardDescription>Completa los datos del nuevo curso</CardDescription>
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
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
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
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subject">Materia</Label>
                <Select
                  value={formData.subject}
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
                  value={formData.grade_level}
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
                value={formData.max_students}
                onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                min={1}
              />
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
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Curso"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
