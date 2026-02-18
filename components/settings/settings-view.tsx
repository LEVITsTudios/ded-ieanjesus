"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Settings, Globe, Users, Cog, Bell, Lock } from "lucide-react"
import type { UserRole } from "@/lib/types"

interface SettingsViewProps {
  institutions: any[]
  userId: string
}

export function SettingsView({ institutions, userId }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState("general")
  const [academicYear, setAcademicYear] = useState("2026")
  const [currency, setCurrency] = useState("USD")
  const [language, setLanguage] = useState("es")
  const [attendanceThreshold, setAttendanceThreshold] = useState("80")
  const [gradingScale, setGradingScale] = useState("numeric")
  const [maxStudentsPerCourse, setMaxStudentsPerCourse] = useState("40")
  const [academicPeriods, setAcademicPeriods] = useState("4")
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // TODO: Call API to save settings
      console.log("Saving settings:", {
        academic_year: academicYear,
        currency,
        language,
        attendance_threshold: attendanceThreshold,
        grading_scale: gradingScale,
        max_students_per_course: maxStudentsPerCourse,
        academic_periods: academicPeriods,
      })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert("Configuración guardada exitosamente")
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Error al guardar la configuración")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
          <p className="text-muted-foreground mt-2">Administra los parámetros de tu institución educativa</p>
        </div>
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Cog className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="academic" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Académico</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Seguridad</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>Parámetros básicos de la plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Año Académico</label>
                  <Input 
                    type="text" 
                    value={academicYear} 
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2026"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Moneda</label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      <SelectItem value="MXN">Peso Mexicano (MXN)</SelectItem>
                      <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Idioma</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Zona Horaria</label>
                  <Select defaultValue="america/guayaquil">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="america/guayaquil">America/Guayaquil (Ecuador)</SelectItem>
                      <SelectItem value="america/mexico_city">America/Mexico_City</SelectItem>
                      <SelectItem value="america/buenos_aires">America/Buenos_Aires</SelectItem>
                      <SelectItem value="america/sao_paulo">America/Sao_Paulo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {institutions && institutions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Instituciones Registradas</CardTitle>
                <CardDescription>Instituciones habilitadas en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {institutions.map((inst) => (
                    <div key={inst.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{inst.name}</p>
                        <p className="text-xs text-muted-foreground">{inst.address || "Sin dirección"}</p>
                      </div>
                      <Badge variant={inst.is_active ? "default" : "secondary"}>
                        {inst.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Academic Settings */}
        <TabsContent value="academic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Académica</CardTitle>
              <CardDescription>Parámetros de administración académica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Umbral de Asistencia (%)</label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={attendanceThreshold} 
                    onChange={(e) => setAttendanceThreshold(e.target.value)}
                    placeholder="80"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Porcentaje mínimo de asistencia requerida
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Escala de Calificación</label>
                  <Select value={gradingScale} onValueChange={setGradingScale}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="numeric">Numérica (0-100)</SelectItem>
                      <SelectItem value="letter">Letras (A-F)</SelectItem>
                      <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Máx. Estudiantes por Curso</label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={maxStudentsPerCourse} 
                    onChange={(e) => setMaxStudentsPerCourse(e.target.value)}
                    placeholder="40"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Períodos Académicos</label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="4" 
                    value={academicPeriods} 
                    onChange={(e) => setAcademicPeriods(e.target.value)}
                    placeholder="4"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Cantidad de períodos en el año académico
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Períodos Académicos</CardTitle>
              <CardDescription>Fechas de los períodos del año</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4].slice(0, parseInt(academicPeriods)).map((period) => (
                  <div key={period} className="grid gap-2 md:grid-cols-3 p-3 border rounded-lg">
                    <Input placeholder={`Período ${period} - Inicio`} type="date" />
                    <Input placeholder={`Período ${period} - Fin`} type="date" />
                    <Input placeholder={`Período ${period} - Nombre`} defaultValue={`Período ${period}`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Settings */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>Configuraciones de cuentas de usuario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Requiere Verificación de Email</p>
                    <p className="text-xs text-muted-foreground">Todos los usuarios deben verificar su email</p>
                  </div>
                  <Button variant="outline" size="sm">Activar</Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Requiere PIN de Seguridad</p>
                    <p className="text-xs text-muted-foreground">Capa adicional de autenticación</p>
                  </div>
                  <Button variant="outline" size="sm">Activar</Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Permite Autenticación Biométrica</p>
                    <p className="text-xs text-muted-foreground">Huella digital y reconocimiento facial</p>
                  </div>
                  <Button variant="outline" size="sm">Activar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>Gestiona alertas y notificaciones del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Notificaciones por Email</p>
                    <p className="text-xs text-muted-foreground">Enviar alertas por correo electrónico</p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Notificaciones Push</p>
                    <p className="text-xs text-muted-foreground">Alertas en navegadores y dispositivos</p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Notificaciones SMS</p>
                    <p className="text-xs text-muted-foreground">Alertas críticas por mensaje de texto</p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Seguridad</CardTitle>
              <CardDescription>Políticas de seguridad y privacidad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Enfocer HTTPS</p>
                    <p className="text-xs text-muted-foreground">Todas las conexiones serán encriptadas</p>
                  </div>
                  <Badge variant="default">Activado</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Rate Limiting</p>
                    <p className="text-xs text-muted-foreground">Proteger contra ataques de fuerza bruta</p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Políticas de Contraseña</p>
                    <p className="text-xs text-muted-foreground">Requiere mayúsculas, números, caracteres especiales</p>
                  </div>
                  <Button variant="outline" size="sm">Editar</Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Auditoría de Logs</p>
                    <p className="text-xs text-muted-foreground">Registrar todas las acciones administrativas</p>
                  </div>
                  <Button variant="outline" size="sm">Ver Logs</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancelar</Button>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  )
}
