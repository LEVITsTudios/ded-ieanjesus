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
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Clock,
  Trophy,
  Play,
  CheckCircle2,
  Search,
  Filter,
  BookOpen,
  Target,
  Zap,
  BarChart3,
  Star,
} from "lucide-react";
import Link from "next/link";

interface Quiz {
  id: string;
  title: string;
  description: string;
  course_id: string;
  time_limit_minutes: number;
  passing_score: number;
  is_active: boolean;
  created_at: string;
  courses?: { name: string; code: string };
  question_count?: number;
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number;
  completed_at: string;
  quizzes?: { title: string };
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

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

      // Get quizzes
      const { data: quizzesData } = await supabase
        .from("quizzes")
        .select(
          `
          *,
          courses (name, code)
        `
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      // Get question counts
      if (quizzesData) {
        const quizzesWithCounts = await Promise.all(
          quizzesData.map(async (quiz) => {
            const { count } = await supabase
              .from("quiz_questions")
              .select("*", { count: "exact", head: true })
              .eq("quiz_id", quiz.id);
            return { ...quiz, question_count: count || 0 };
          })
        );
        setQuizzes(quizzesWithCounts);
      }

      // Get user's attempts
      const { data: attemptsData } = await supabase
        .from("quiz_attempts")
        .select(
          `
          *,
          quizzes (title)
        `
        )
        .eq("user_id", user.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(10);

      setAttempts(attemptsData || []);
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const filteredQuizzes = quizzes.filter(
    (quiz) =>
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.courses?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAttemptForQuiz = (quizId: string) => {
    return attempts.find((a) => a.quiz_id === quizId);
  };

  const averageScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((acc, a) => acc + a.score, 0) / attempts.length)
      : 0;

  const completedQuizzes = new Set(attempts.map((a) => a.quiz_id)).size;

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
            Quizzes y Evaluaciones
          </h1>
          <p className="text-muted-foreground">
            Refuerza tu aprendizaje con actividades interactivas
          </p>
        </div>
        {(userRole === "admin" || userRole === "teacher") && (
          <Button asChild>
            <Link href="/dashboard/quizzes/create">
              <Zap className="mr-2 h-4 w-4" />
              Crear Quiz
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Quizzes Disponibles
              </p>
              <p className="text-2xl font-bold">{quizzes.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completados</p>
              <p className="text-2xl font-bold">{completedQuizzes}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
              <Trophy className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Promedio</p>
              <p className="text-2xl font-bold">{averageScore}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Intentos Totales</p>
              <p className="text-2xl font-bold">{attempts.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar quizzes..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtrar
        </Button>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="available" className="space-y-6">
        <TabsList>
          <TabsTrigger value="available">Disponibles</TabsTrigger>
          <TabsTrigger value="completed">Completados</TabsTrigger>
          <TabsTrigger value="progress">Mi Progreso</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {filteredQuizzes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">
                  No hay quizzes disponibles
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Los quizzes aparecerán aquí cuando estén disponibles.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredQuizzes.map((quiz) => {
                const attempt = getAttemptForQuiz(quiz.id);
                const isCompleted = !!attempt;

                return (
                  <Card
                    key={quiz.id}
                    className="group overflow-hidden transition-all hover:shadow-lg"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Badge variant="secondary" className="mb-2">
                          {quiz.courses?.name || "General"}
                        </Badge>
                        {isCompleted && (
                          <Badge
                            variant={
                              attempt.score >= quiz.passing_score
                                ? "default"
                                : "destructive"
                            }
                            className="flex items-center gap-1"
                          >
                            {attempt.score >= quiz.passing_score ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <Target className="h-3 w-3" />
                            )}
                            {attempt.score}%
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="line-clamp-2 text-lg">
                        {quiz.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {quiz.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{quiz.question_count} preguntas</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{quiz.time_limit_minutes} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          <span>{quiz.passing_score}% mínimo</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button asChild className="w-full">
                        <Link href={`/dashboard/quizzes/${quiz.id}`}>
                          <Play className="mr-2 h-4 w-4" />
                          {isCompleted ? "Volver a intentar" : "Comenzar Quiz"}
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {attempts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">
                  No has completado ningún quiz
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Comienza un quiz para ver tu progreso aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {attempts.map((attempt) => (
                <Card key={attempt.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                          attempt.score >= 70
                            ? "bg-green-500/20 text-green-600"
                            : "bg-amber-500/20 text-amber-600"
                        }`}
                      >
                        {attempt.score >= 70 ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <Target className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {attempt.quizzes?.title || "Quiz"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Completado el{" "}
                          {new Date(attempt.completed_at).toLocaleDateString(
                            "es-ES",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold">{attempt.score}%</p>
                        <p className="text-xs text-muted-foreground">
                          Puntuación
                        </p>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.ceil(attempt.score / 20)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Tu Progreso de Aprendizaje
              </CardTitle>
              <CardDescription>
                Resumen de tu desempeño en evaluaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <p className="text-3xl font-bold text-primary">
                    {completedQuizzes}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Quizzes Completados
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {averageScore}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Promedio General
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <p className="text-3xl font-bold text-amber-600">
                    {attempts.filter((a) => a.score >= 70).length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Quizzes Aprobados
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Últimos Resultados</h4>
                {attempts.slice(0, 5).map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">
                      {attempt.quizzes?.title || "Quiz"}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${
                            attempt.score >= 70
                              ? "bg-green-500"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${attempt.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {attempt.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
