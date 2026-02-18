"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Download, Filter, TrendingUp } from "lucide-react"
import type { UserRole } from "@/lib/types"

interface ReportsViewProps {
  courses: any[]
  enrollments: any[]
  grades: any[]
  attendances: any[]
  userRole: UserRole
  userId: string
}

export function ReportsView({
  courses,
  enrollments,
  grades,
  attendances,
  userRole,
  userId,
}: ReportsViewProps) {
  const [reportType, setReportType] = useState<"enrollment" | "grades" | "attendance" | "performance">("enrollment")
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<"month" | "quarter" | "year">("month")

  // Filter data based on selections
  const filteredCourses = selectedCourse ? courses.filter(c => c.id === selectedCourse) : courses
  const filteredEnrollments = selectedCourse 
    ? enrollments.filter(e => e.course_id === selectedCourse)
    : enrollments

  // Calculate statistics
  const totalEnrollments = filteredEnrollments.length
  const courseStats = filteredCourses.map(course => ({
    name: course.name,
    students: filteredEnrollments.filter(e => e.course_id === course.id).length,
    maxCapacity: course.max_students || 30,
  }))

  // Grade distribution data
  const gradeDistribution = [
    { range: "90-100", count: grades.filter(g => g.grade >= 90).length, fill: "#10b981" },
    { range: "80-89", count: grades.filter(g => g.grade >= 80 && g.grade < 90).length, fill: "#3b82f6" },
    { range: "70-79", count: grades.filter(g => g.grade >= 70 && g.grade < 80).length, fill: "#f59e0b" },
    { range: "60-69", count: grades.filter(g => g.grade >= 60 && g.grade < 70).length, fill: "#ef4444" },
    { range: "<60", count: grades.filter(g => g.grade < 60).length, fill: "#6b7280" },
  ]

  // Attendance statistics
  const attendanceStats = [
    { status: "Presente", count: attendances.filter(a => a.status === "present").length, fill: "#10b981" },
    { status: "Ausente", count: attendances.filter(a => a.status === "absent").length, fill: "#ef4444" },
    { status: "Tarde", count: attendances.filter(a => a.status === "late").length, fill: "#f59e0b" },
    { status: "Justificado", count: attendances.filter(a => a.status === "excused").length, fill: "#8b5cf6" },
  ]

  const handleExportPDF = () => {
    // TODO: Implement PDF export using jsPDF or similar
    console.log("Exporting PDF for report type:", reportType)
    alert("PDF export coming soon")
  }

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    console.log("Exporting Excel for report type:", reportType)
    alert("Excel export coming soon")
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground mt-2">Análisis de desempeño académico y estadísticas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Descargar Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Tipo de Reporte</label>
            <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enrollment">Inscripciones</SelectItem>
                <SelectItem value="grades">Calificaciones</SelectItem>
                <SelectItem value="attendance">Asistencias</SelectItem>
                <SelectItem value="performance">Desempeño General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Curso</label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los cursos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los cursos</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Período</label>
            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Este Mes</SelectItem>
                <SelectItem value="quarter">Este Trimestre</SelectItem>
                <SelectItem value="year">Este Año</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button variant="secondary" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Aplicar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Inscripciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments}</div>
            <p className="text-xs text-muted-foreground mt-1">+5% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Promedio de Calificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {grades.length > 0 
                ? (grades.reduce((sum, g) => sum + g.grade, 0) / grades.length).toFixed(1)
                : "N/A"
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">De {grades.length} registros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Asistencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendances.length > 0
                ? ((attendances.filter(a => a.status === "present").length / attendances.length) * 100).toFixed(0)
                : "N/A"
              }%
            </div>
            <p className="text-xs text-muted-foreground mt-1">De {attendances.length} registros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cursos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCourses.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Cursos registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {reportType === "enrollment" || reportType === "performance" ? (
          <Card>
            <CardHeader>
              <CardTitle>Inscripciones por Curso</CardTitle>
              <CardDescription>Capacidad actual vs máxima</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={courseStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" fill="#3b82f6" name="Estudiantes" />
                  <Bar dataKey="maxCapacity" fill="#e5e7eb" name="Capacidad Máxima" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {reportType === "grades" || reportType === "performance" ? (
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Calificaciones</CardTitle>
              <CardDescription>Rango de notas registradas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ range, count }) => `${range}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {reportType === "attendance" || reportType === "performance" ? (
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Asistencia</CardTitle>
              <CardDescription>Total de registros por estado</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {reportType === "performance" ? (
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Desempeño</CardTitle>
              <CardDescription>Evolución mensual</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={courseStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="students" stroke="#3b82f6" name="Estudiantes" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Datos</CardTitle>
          <CardDescription>Información completa del reporte seleccionado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium">Curso</th>
                  <th className="text-left py-2 px-4 font-medium">Estudiantes</th>
                  <th className="text-left py-2 px-4 font-medium">Promedio</th>
                  <th className="text-left py-2 px-4 font-medium">Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map(course => {
                  const courseEnrollments = filteredEnrollments.filter(e => e.course_id === course.id)
                  const courseGrades = grades.filter(g => g.course_id === course.id)
                  const courseAttendances = attendances.filter(a => a.course_id === course.id)
                  const avgGrade = courseGrades.length > 0 
                    ? (courseGrades.reduce((sum, g) => sum + g.grade, 0) / courseGrades.length).toFixed(1)
                    : "N/A"
                  const attendanceRate = courseAttendances.length > 0
                    ? ((courseAttendances.filter(a => a.status === "present").length / courseAttendances.length) * 100).toFixed(0)
                    : "N/A"

                  return (
                    <tr key={course.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4">{course.name}</td>
                      <td className="py-2 px-4">{courseEnrollments.length}</td>
                      <td className="py-2 px-4">{avgGrade}</td>
                      <td className="py-2 px-4">{typeof attendanceRate === "string" && attendanceRate !== "N/A" ? `${attendanceRate}%` : attendanceRate}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
