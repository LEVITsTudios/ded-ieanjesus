"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FolderOpen,
  Plus,
  Search,
  FileText,
  Video,
  ImageIcon,
  Link as LinkIcon,
  Download,
  Calendar,
  BookOpen,
} from "lucide-react"

const materials = [
  {
    id: 1,
    title: "Guia de Algebra Lineal",
    description: "Material de apoyo para el tema de matrices y determinantes",
    course: "Matematicas",
    type: "pdf",
    uploadedBy: "Prof. Garcia",
    date: "2026-02-04",
    size: "2.5 MB",
  },
  {
    id: 2,
    title: "Video: Revolucion Ecuatoriana",
    description: "Documental sobre los eventos clave de la revolucion",
    course: "Historia",
    type: "video",
    uploadedBy: "Prof. Sanchez",
    date: "2026-02-03",
    size: "150 MB",
  },
  {
    id: 3,
    title: "Presentacion: Celula Animal",
    description: "Diapositivas sobre la estructura celular",
    course: "Ciencias",
    type: "presentation",
    uploadedBy: "Prof. Lopez",
    date: "2026-02-02",
    size: "8.2 MB",
  },
  {
    id: 4,
    title: "Infografia: Sistema Solar",
    description: "Imagen interactiva del sistema solar",
    course: "Ciencias",
    type: "image",
    uploadedBy: "Prof. Lopez",
    date: "2026-02-01",
    size: "1.8 MB",
  },
  {
    id: 5,
    title: "Ejercicios de Gramatica",
    description: "Practica de conjugacion verbal",
    course: "Espanol",
    type: "pdf",
    uploadedBy: "Prof. Martinez",
    date: "2026-01-30",
    size: "500 KB",
  },
  {
    id: 6,
    title: "Recurso Externo: Khan Academy",
    description: "Link a curso de algebra",
    course: "Matematicas",
    type: "link",
    uploadedBy: "Prof. Garcia",
    date: "2026-01-28",
    size: "-",
  },
]

const typeConfig = {
  pdf: { label: "PDF", icon: FileText, color: "bg-destructive/10 text-destructive" },
  video: { label: "Video", icon: Video, color: "bg-primary/10 text-primary" },
  image: { label: "Imagen", icon: ImageIcon, color: "bg-accent/10 text-accent" },
  presentation: { label: "Presentacion", icon: FileText, color: "bg-chart-4/10 text-chart-4" },
  link: { label: "Enlace", icon: LinkIcon, color: "bg-chart-3/10 text-chart-3" },
}

export default function MaterialsPage() {
  const [search, setSearch] = useState("")
  const [courseFilter, setCourseFilter] = useState("all")

  const courses = [...new Set(materials.map((m) => m.course))]

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase())
    const matchesCourse = courseFilter === "all" || m.course === courseFilter
    return matchesSearch && matchesCourse
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Materiales</h1>
          <p className="text-muted-foreground">Recursos y materiales de estudio</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
          <Link href="/dashboard/materials/new">
            <Plus className="mr-2 h-4 w-4" />
            Subir Material
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar materiales..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por curso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los cursos</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course} value={course}>
                {course}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-muted p-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-center text-muted-foreground">No hay materiales disponibles</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((material) => {
            const type = typeConfig[material.type as keyof typeof typeConfig]
            const TypeIcon = type.icon

            return (
              <Card
                key={material.id}
                className="group border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-xl p-3 ${type.color}`}>
                      <TypeIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base text-foreground truncate">{material.title}</CardTitle>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        <BookOpen className="mr-1 h-3 w-3" />
                        {material.course}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-2">{material.description}</CardDescription>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(material.date).toLocaleDateString("es-MX")}
                    </span>
                    <span>{material.size}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">{material.uploadedBy}</span>
                    <Button size="sm" variant="ghost" className="h-8 text-xs">
                      <Download className="mr-1 h-3 w-3" />
                      Descargar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
