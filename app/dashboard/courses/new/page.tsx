"use client"

import React from "react"

import { useState } from "react"
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

export default function NewCoursePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    subject: "",
    grade_level: "",
    max_students: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError("Debes iniciar sesion")
      setLoading(false)
      return
    }

    const { error } = await supabase.from("courses").insert({
      name: formData.name,
      code: formData.code,
      description: formData.description || null,
      subject: formData.subject || null,
      grade_level: formData.grade_level || null,
      max_students: formData.max_students ? parseInt(formData.max_students) : null,
      teacher_id: user.id,
      status: "active",
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/dashboard/courses")
    router.refresh()
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
                <Input
                  id="code"
                  placeholder="MAT-301"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
            </div>

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
