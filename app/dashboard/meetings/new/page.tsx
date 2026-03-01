"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"

interface CourseOption {
  id: string
  name: string
}

export default function NewMeetingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [courses, setCourses] = useState<CourseOption[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [meetingDate, setMeetingDate] = useState("")
  const [duration, setDuration] = useState<number>(60)
  const [location, setLocation] = useState("")
  const [meetingUrl, setMeetingUrl] = useState("")
  const [participants, setParticipants] = useState<number | undefined>()
  const [meetingType, setMeetingType] = useState("general")
  const [courseId, setCourseId] = useState("")
  const [topic, setTopic] = useState("")
  const [materialsUrl, setMaterialsUrl] = useState("")
  const [teacherAttended, setTeacherAttended] = useState(true)
  const [feedback, setFeedback] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError("Debe iniciar sesión para continuar")
        return
      }
      const role = session.user.user_metadata?.role || "student"

      // fetch courses if admin or teacher
      let query = supabase.from("courses").select("id, name")
      if (role === "teacher") {
        query = query.eq("teacher_id", session.user.id)
      }
      const { data: courseData, error: courseErr } = await query
      if (courseErr) {
        console.error(courseErr)
        return
      }
      setCourses(courseData || [])
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title || !meetingDate) {
      setError("Completa al menos título y fecha")
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("No hay sesión activa")

      const payload: any = {
        title,
        description,
        meeting_date: meetingDate,
        duration_minutes: duration,
        location,
        meeting_url: meetingUrl,
        participants,
        meeting_type: meetingType,
        course_id: courseId || undefined,
        topic,
        materials_url: materialsUrl,
        teacher_attended: teacherAttended,
        feedback,
      }

      const token = session.access_token
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || "Error creando reunión")
      }

      router.push("/dashboard/meetings")
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
          <Link href="/dashboard/meetings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">Nueva reunión / clase</h2>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label>Fecha y hora</Label>
            <Input
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Duración (minutos)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select
              value={meetingType}
              onValueChange={(v) => setMeetingType(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="parent_teacher">Padres-maestros</SelectItem>
                <SelectItem value="staff">Personal</SelectItem>
                <SelectItem value="class">Clase</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {meetingType === 'class' && (
          <>
            <div>
              <Label>Curso</Label>
              <Select
                value={courseId}
                onValueChange={(v) => setCourseId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona curso" />
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
            <div>
              <Label>Tema</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div>
              <Label>Material de respaldo (URL)</Label>
              <Input
                value={materialsUrl}
                onChange={(e) => setMaterialsUrl(e.target.value)}
              />
            </div>
            <div>
              <Label>Asistencia maestro</Label>
              <Input
                type="checkbox"
                checked={teacherAttended}
                onChange={(e) => setTeacherAttended(e.target.checked)}
              />
            </div>
            <div>
              <Label>Retroalimentación</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </>
        )}

        <div>
          <Label>Ubicación / enlace</Label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div>
          <Label>Enlace de la reunión (Zoom, Teams...)</Label>
          <Input
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
          />
        </div>
        <div>
          <Label>Participantes (estimado)</Label>
          <Input
            type="number"
            value={participants ?? ''}
            onChange={(e) => {
              const v = e.target.value
              setParticipants(v === '' ? undefined : Number(v))
            }}
          />
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Guardando...' : 'Crear'}
          </Button>
        </div>
      </form>
    </div>
  )
}
