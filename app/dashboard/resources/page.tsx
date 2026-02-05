"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FolderOpen,
  FileText,
  Video,
  ImageIcon,
  Link as LinkIcon,
  Download,
  Search,
  Filter,
  Plus,
  Upload,
  File,
  Presentation,
  Music,
  Archive,
  ExternalLink,
  Eye,
  Calendar,
  User,
  BookOpen,
  Grid3X3,
  List,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: string;
  file_url: string;
  file_size: number;
  course_id: string;
  uploaded_by: string;
  is_public: boolean;
  created_at: string;
  courses?: { name: string; code: string };
  profiles?: { full_name: string };
}

const resourceIcons: Record<string, typeof FileText> = {
  document: FileText,
  video: Video,
  image: ImageIcon,
  link: LinkIcon,
  presentation: Presentation,
  audio: Music,
  archive: Archive,
  other: File,
};

const resourceColors: Record<string, string> = {
  document: "bg-blue-500/20 text-blue-600",
  video: "bg-red-500/20 text-red-600",
  image: "bg-green-500/20 text-green-600",
  link: "bg-purple-500/20 text-purple-600",
  presentation: "bg-orange-500/20 text-orange-600",
  audio: "bg-pink-500/20 text-pink-600",
  archive: "bg-amber-500/20 text-amber-600",
  other: "bg-gray-500/20 text-gray-600",
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    resource_type: "document",
    file_url: "",
    course_id: "",
  });

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get user role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setUserRole(profile?.role || null);

      // Get resources
      const { data: resourcesData } = await supabase
        .from("class_resources")
        .select(
          `
          *,
          courses (name, code),
          profiles (full_name)
        `
        )
        .order("created_at", { ascending: false });

      setResources(resourcesData || []);

      // Get courses for filter
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, name")
        .eq("status", "active");

      setCourses(coursesData || []);

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const handleUpload = async () => {
    if (!newResource.title || !newResource.file_url) return;

    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("class_resources").insert({
      title: newResource.title,
      description: newResource.description,
      resource_type: newResource.resource_type,
      file_url: newResource.file_url,
      file_size: 0,
      course_id: newResource.course_id || null,
      uploaded_by: user.id,
      is_public: true,
    });

    if (!error) {
      setUploadDialogOpen(false);
      setNewResource({
        title: "",
        description: "",
        resource_type: "document",
        file_url: "",
        course_id: "",
      });

      // Refresh resources
      const { data: resourcesData } = await supabase
        .from("class_resources")
        .select(
          `
          *,
          courses (name, code),
          profiles (full_name)
        `
        )
        .order("created_at", { ascending: false });

      setResources(resourcesData || []);
    }

    setUploading(false);
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === "all" || resource.resource_type === filterType;
    const matchesCourse =
      filterCourse === "all" || resource.course_id === filterCourse;

    return matchesSearch && matchesType && matchesCourse;
  });

  const resourceStats = {
    total: resources.length,
    documents: resources.filter((r) => r.resource_type === "document").length,
    videos: resources.filter((r) => r.resource_type === "video").length,
    links: resources.filter((r) => r.resource_type === "link").length,
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Recursos de Clase
          </h1>
          <p className="text-muted-foreground">
            Materiales de estudio, documentos y recursos multimedia
          </p>
        </div>
        {(userRole === "admin" || userRole === "teacher") && (
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Recurso
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Recurso</DialogTitle>
                <DialogDescription>
                  Sube o enlaza un recurso para tus estudiantes
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título del Recurso</Label>
                  <Input
                    placeholder="Ej: Guía de Estudio Unidad 1"
                    value={newResource.title}
                    onChange={(e) =>
                      setNewResource({ ...newResource, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    placeholder="Describe brevemente el contenido..."
                    value={newResource.description}
                    onChange={(e) =>
                      setNewResource({
                        ...newResource,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo de Recurso</Label>
                    <Select
                      value={newResource.resource_type}
                      onValueChange={(v) =>
                        setNewResource({ ...newResource, resource_type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Documento</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="image">Imagen</SelectItem>
                        <SelectItem value="link">Enlace</SelectItem>
                        <SelectItem value="presentation">
                          Presentación
                        </SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="archive">Archivo</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Curso (Opcional)</Label>
                    <Select
                      value={newResource.course_id}
                      onValueChange={(v) =>
                        setNewResource({ ...newResource, course_id: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>URL del Recurso</Label>
                  <Input
                    placeholder="https://..."
                    value={newResource.file_url}
                    onChange={(e) =>
                      setNewResource({
                        ...newResource,
                        file_url: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Pega el enlace al archivo o recurso (Google Drive, YouTube,
                    etc.)
                  </p>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={
                    uploading || !newResource.title || !newResource.file_url
                  }
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Agregar Recurso
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
              <FolderOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Recursos</p>
              <p className="text-2xl font-bold">{resourceStats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Documentos</p>
              <p className="text-2xl font-bold">{resourceStats.documents}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20">
              <Video className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Videos</p>
              <p className="text-2xl font-bold">{resourceStats.videos}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
              <LinkIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Enlaces</p>
              <p className="text-2xl font-bold">{resourceStats.links}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar recursos..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="document">Documentos</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="image">Imágenes</SelectItem>
            <SelectItem value="link">Enlaces</SelectItem>
            <SelectItem value="presentation">Presentaciones</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCourse} onValueChange={setFilterCourse}>
          <SelectTrigger className="w-full sm:w-48">
            <BookOpen className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Curso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los cursos</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex rounded-lg border">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-r-none"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-l-none"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Resources */}
      {filteredResources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">
              No se encontraron recursos
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery || filterType !== "all" || filterCourse !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Los recursos aparecerán aquí cuando se agreguen"}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredResources.map((resource) => {
            const Icon =
              resourceIcons[resource.resource_type] || File;
            const colorClass =
              resourceColors[resource.resource_type] ||
              "bg-gray-500/20 text-gray-600";

            return (
              <Card
                key={resource.id}
                className="group overflow-hidden transition-all hover:shadow-lg"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {resource.resource_type}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2 text-base">
                    {resource.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3 pt-0">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {resource.courses && (
                      <Badge variant="outline" className="text-xs">
                        {resource.courses.name}
                      </Badge>
                    )}
                    {resource.file_size > 0 && (
                      <span>{formatFileSize(resource.file_size)}</span>
                    )}
                  </div>
                </CardContent>
                <div className="flex border-t p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <a
                      href={resource.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      Ver
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <a
                      href={resource.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <Download className="mr-1 h-4 w-4" />
                      Descargar
                    </a>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredResources.map((resource) => {
            const Icon =
              resourceIcons[resource.resource_type] || File;
            const colorClass =
              resourceColors[resource.resource_type] ||
              "bg-gray-500/20 text-gray-600";

            return (
              <Card key={resource.id} className="transition-all hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{resource.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {resource.courses && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {resource.courses.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {resource.profiles?.full_name || "Desconocido"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(resource.created_at).toLocaleDateString(
                          "es-ES"
                        )}
                      </span>
                      {resource.file_size > 0 && (
                        <span>{formatFileSize(resource.file_size)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{resource.resource_type}</Badge>
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={resource.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={resource.file_url} download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
