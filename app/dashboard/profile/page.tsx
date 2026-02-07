"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Lock,
  ArrowRight,
  Edit2,
  AlertCircle,
  Loader2,
} from "lucide-react"

interface ProfileData {
  id: string
  email: string
  full_name: string
  role: string
  phone?: string
  address?: string
  date_of_birth?: string
  avatar_url?: string
  department?: string
  grade_level?: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) {
          router.push("/auth/login")
          return
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single()

        if (profileError) {
          setError(`Error al cargar el perfil: ${profileError.message}`)
          return
        }

        setProfile(profileData)
      } catch (err: any) {
        setError(`Error inesperado: ${err?.message || String(err)}`)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || "No se pudo cargar el perfil"}
        </AlertDescription>
      </Alert>
    )
  }

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const roleColor = {
    admin: "bg-red-500",
    teacher: "bg-blue-500",
    student: "bg-green-500",
    parent: "bg-purple-500",
  }[profile.role as keyof typeof roleColor] || "bg-gray-500"

  const roleLabel = {
    admin: "Administrador",
    teacher: "Profesor",
    student: "Estudiante",
    parent: "Padre de Familia",
  }[profile.role as keyof typeof roleLabel] || "Usuario"

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header del perfil */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground">Gestiona tu información personal y configuración</p>
      </div>

      {/* Tarjeta principal del perfil */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24 border-2 border-primary">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className={`text-white font-bold text-lg ${roleColor}`}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-2">Rol</p>
                <Badge className={`${roleColor} text-white`}>{roleLabel}</Badge>
              </div>
            </div>

            {/* Información principal */}
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Nombre</p>
                <p className="text-lg font-semibold text-foreground">{profile.full_name}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                    <Mail className="h-4 w-4" />
                    Correo
                  </div>
                  <p className="text-foreground">{profile.email}</p>
                </div>

                {profile.phone && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </div>
                    <p className="text-foreground">{profile.phone}</p>
                  </div>
                )}

                {profile.date_of_birth && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      Fecha de Nacimiento
                    </div>
                    <p className="text-foreground">
                      {new Date(profile.date_of_birth).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                )}

                {profile.address && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                      <MapPin className="h-4 w-4" />
                      Dirección
                    </div>
                    <p className="text-foreground">{profile.address}</p>
                  </div>
                )}
              </div>

              {profile.department && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Departamento</p>
                  <p className="text-foreground">{profile.department}</p>
                </div>
              )}

              {profile.grade_level && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Nivel/Grado</p>
                  <p className="text-foreground">{profile.grade_level}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de opciones */}
      <Tabs defaultValue="actions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="actions">Acciones</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        {/* Tab de Acciones */}
        <TabsContent value="actions" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Acciones Disponibles</CardTitle>
              <CardDescription>Actualiza tu información personal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/profile/student-form">
                <Button className="w-full justify-between" variant="outline">
                  <span className="flex items-center gap-2">
                    <Edit2 className="h-4 w-4" />
                    Completar Ficha Estudiantil
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/dashboard/security">
                <Button className="w-full justify-between" variant="outline">
                  <span className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Cambiar Contraseña
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/dashboard/settings">
                <Button className="w-full justify-between" variant="outline">
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Configuración de Cuenta
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Seguridad */}
        <TabsContent value="security" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Seguridad de Cuenta</CardTitle>
              <CardDescription>Protege tu cuenta con medidas de seguridad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                <div>
                  <p className="font-medium text-foreground">Contraseña</p>
                  <p className="text-sm text-muted-foreground">Última actualización hace más de 30 días</p>
                </div>
                <Link href="/dashboard/security">
                  <Button size="sm" variant="outline">Cambiar</Button>
                </Link>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                <div>
                  <p className="font-medium text-foreground">Autenticación de Dos Factores</p>
                  <p className="text-sm text-muted-foreground">No activada</p>
                </div>
                <Button size="sm" variant="outline" disabled>Activar</Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                <div>
                  <p className="font-medium text-foreground">Sesiones Activas</p>
                  <p className="text-sm text-muted-foreground">1 sesión activa</p>
                </div>
                <Button size="sm" variant="outline">Ver</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Configuración */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Preferencias</CardTitle>
              <CardDescription>Personaliza tu experiencia en el sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                <div>
                  <p className="font-medium text-foreground">Notificaciones por Correo</p>
                  <p className="text-sm text-muted-foreground">Recibe actualizaciones importantes</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                <div>
                  <p className="font-medium text-foreground">Tema Oscuro</p>
                  <p className="text-sm text-muted-foreground">Usa tema oscuro por defecto</p>
                </div>
                <input type="checkbox" className="h-4 w-4" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                <div>
                  <p className="font-medium text-foreground">Notificaciones Push</p>
                  <p className="text-sm text-muted-foreground">Recibe notificaciones en tu dispositivo</p>
                </div>
                <input type="checkbox" className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
