"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, TrendingUp, TrendingDown, Award, BookOpen } from "lucide-react"
import { useState } from "react"

const gradesData = [
  {
    course: "Matematicas",
    teacher: "Prof. Garcia",
    assignments: [
      { name: "Examen Parcial 1", score: 85, maxScore: 100, date: "2026-01-15" },
      { name: "Tarea 1", score: 90, maxScore: 100, date: "2026-01-20" },
      { name: "Tarea 2", score: 88, maxScore: 100, date: "2026-01-28" },
      { name: "Examen Parcial 2", score: 92, maxScore: 100, date: "2026-02-01" },
    ],
    average: 88.75,
    trend: "up",
  },
  {
    course: "Espanol",
    teacher: "Prof. Martinez",
    assignments: [
      { name: "Ensayo 1", score: 78, maxScore: 100, date: "2026-01-18" },
      { name: "Examen Parcial 1", score: 82, maxScore: 100, date: "2026-01-25" },
      { name: "Proyecto", score: 95, maxScore: 100, date: "2026-02-02" },
    ],
    average: 85,
    trend: "up",
  },
  {
    course: "Ciencias",
    teacher: "Prof. Lopez",
    assignments: [
      { name: "Laboratorio 1", score: 90, maxScore: 100, date: "2026-01-22" },
      { name: "Examen Parcial 1", score: 75, maxScore: 100, date: "2026-01-30" },
      { name: "Reporte", score: 85, maxScore: 100, date: "2026-02-03" },
    ],
    average: 83.33,
    trend: "down",
  },
  {
    course: "Historia",
    teacher: "Prof. Sanchez",
    assignments: [
      { name: "Ensayo Historico", score: 88, maxScore: 100, date: "2026-01-19" },
      { name: "Examen Parcial 1", score: 92, maxScore: 100, date: "2026-01-27" },
    ],
    average: 90,
    trend: "up",
  },
]

function getGradeColor(score: number) {
  if (score >= 90) return "text-accent"
  if (score >= 80) return "text-primary"
  if (score >= 70) return "text-chart-4"
  return "text-destructive"
}

function getGradeBg(score: number) {
  if (score >= 90) return "bg-accent"
  if (score >= 80) return "bg-primary"
  if (score >= 70) return "bg-chart-4"
  return "bg-destructive"
}

export default function GradesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("current")
  
  const overallAverage = gradesData.reduce((acc, c) => acc + c.average, 0) / gradesData.length
  const highestGrade = Math.max(...gradesData.map((c) => c.average))
  const lowestGrade = Math.min(...gradesData.map((c) => c.average))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calificaciones</h1>
          <p className="text-muted-foreground">Revisa tu desempeno academico</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Periodo Actual</SelectItem>
            <SelectItem value="previous">Periodo Anterior</SelectItem>
            <SelectItem value="all">Todo el Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-3 shadow-lg">
              <Award className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${getGradeColor(overallAverage)}`}>
                {overallAverage.toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">Promedio General</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-xl bg-accent/10 p-3">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">{highestGrade.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Mejor Nota</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-xl bg-chart-4/10 p-3">
              <TrendingDown className="h-6 w-6 text-chart-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-chart-4">{lowestGrade.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Nota mas Baja</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{gradesData.length}</p>
              <p className="text-sm text-muted-foreground">Cursos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Grades */}
      <div className="space-y-4">
        {gradesData.map((course, index) => (
          <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                    <BookOpen className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-foreground">{course.course}</CardTitle>
                    <CardDescription>{course.teacher}</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${getGradeColor(course.average)}`}>
                      {course.average.toFixed(1)}
                    </span>
                    {course.trend === "up" ? (
                      <TrendingUp className="h-5 w-5 text-accent" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Promedio</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Progress value={course.average} className={`h-2 ${getGradeBg(course.average)}`} />
              </div>
              <div className="space-y-2">
                {course.assignments.map((assignment, aIndex) => (
                  <div
                    key={aIndex}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{assignment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(assignment.date).toLocaleDateString("es-MX")}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${getGradeColor(assignment.score)} border-current/20 bg-current/10`}
                    >
                      {assignment.score}/{assignment.maxScore}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
