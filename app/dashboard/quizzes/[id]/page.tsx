"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Home,
  AlertCircle,
  Brain,
  Target,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  points: number;
  order_index: number;
  options: QuizOption[];
}

interface QuizOption {
  id: string;
  option_text: string;
  is_correct: boolean;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score: number;
}

export default function QuizDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchQuiz = async () => {
      const { data: quizData } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

      if (quizData) {
        setQuiz(quizData);
        setTimeLeft(quizData.time_limit_minutes * 60);
      }

      const { data: questionsData } = await supabase
        .from("quiz_questions")
        .select(
          `
          *,
          options:quiz_options(*)
        `
        )
        .eq("quiz_id", quizId)
        .order("order_index");

      if (questionsData) {
        setQuestions(questionsData);
      }

      setLoading(false);
    };

    fetchQuiz();
  }, [quizId, supabase]);

  const submitQuiz = useCallback(async () => {
    if (submitting || !quiz) return;
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Calculate score
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach((question) => {
      totalPoints += question.points;
      const selectedOptionId = answers[question.id];
      const correctOption = question.options.find((o) => o.is_correct);

      if (selectedOptionId && correctOption?.id === selectedOptionId) {
        correctAnswers++;
        earnedPoints += question.points;
      }
    });

    const finalScore = Math.round((earnedPoints / totalPoints) * 100);
    setScore(finalScore);

    // Save attempt
    const { data: attemptData } = await supabase
      .from("quiz_attempts")
      .insert({
        quiz_id: quizId,
        user_id: user.id,
        score: finalScore,
        started_at: new Date(
          Date.now() - (quiz.time_limit_minutes * 60 - (timeLeft || 0)) * 1000
        ).toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (attemptData) {
      setAttemptId(attemptData.id);

      // Save individual answers
      const answersToSave = questions.map((question) => {
        const selectedOptionId = answers[question.id];
        const correctOption = question.options.find((o) => o.is_correct);
        const isCorrect = correctOption?.id === selectedOptionId;

        return {
          attempt_id: attemptData.id,
          question_id: question.id,
          selected_option_id: selectedOptionId || null,
          is_correct: isCorrect,
        };
      });

      await supabase.from("quiz_answers").insert(answersToSave);
    }

    setQuizCompleted(true);
    setShowResults(true);
    setSubmitting(false);
  }, [answers, questions, quiz, quizId, supabase, submitting, timeLeft]);

  // Timer
  useEffect(() => {
    if (!quizStarted || quizCompleted || timeLeft === null) return;

    if (timeLeft <= 0) {
      submitQuiz();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, quizCompleted, timeLeft, submitQuiz]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startQuiz = async () => {
    setQuizStarted(true);
  };

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg text-muted-foreground">Quiz no encontrado</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/quizzes">Volver a Quizzes</Link>
        </Button>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const passed = score >= quiz.passing_score;

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="overflow-hidden">
          <div
            className={`py-8 text-center ${passed ? "bg-gradient-to-br from-green-500 to-emerald-600" : "bg-gradient-to-br from-amber-500 to-orange-600"}`}
          >
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
              {passed ? (
                <Trophy className="h-10 w-10 text-white" />
              ) : (
                <Target className="h-10 w-10 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-white">
              {passed ? "Felicidades!" : "Sigue practicando"}
            </h2>
            <p className="mt-2 text-white/80">
              {passed
                ? "Has aprobado el quiz exitosamente"
                : "No alcanzaste el puntaje mínimo, pero puedes intentarlo de nuevo"}
            </p>
          </div>

          <CardContent className="space-y-6 p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-3xl font-bold text-primary">{score}%</p>
                <p className="text-sm text-muted-foreground">Tu Puntuación</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-3xl font-bold">
                  {quiz.passing_score}%
                </p>
                <p className="text-sm text-muted-foreground">Mínimo Requerido</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-3xl font-bold">
                  {answeredCount}/{questions.length}
                </p>
                <p className="text-sm text-muted-foreground">Respondidas</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Resumen de Respuestas</h4>
              {questions.map((question, index) => {
                const selectedOptionId = answers[question.id];
                const correctOption = question.options.find((o) => o.is_correct);
                const isCorrect = correctOption?.id === selectedOptionId;
                const selectedOption = question.options.find(
                  (o) => o.id === selectedOptionId
                );

                return (
                  <div
                    key={question.id}
                    className={`rounded-lg border p-4 ${isCorrect ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30" : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${isCorrect ? "bg-green-500" : "bg-red-500"}`}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        ) : (
                          <XCircle className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {index + 1}. {question.question_text}
                        </p>
                        {selectedOption && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            Tu respuesta: {selectedOption.option_text}
                          </p>
                        )}
                        {!isCorrect && correctOption && (
                          <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                            Respuesta correcta: {correctOption.option_text}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-transparent"
              onClick={() => {
                setQuizStarted(false);
                setQuizCompleted(false);
                setShowResults(false);
                setAnswers({});
                setCurrentQuestionIndex(0);
                setTimeLeft(quiz.time_limit_minutes * 60);
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Intentar de nuevo
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/quizzes">
                <Home className="mr-2 h-4 w-4" />
                Volver a Quizzes
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Start screen
  if (!quizStarted) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
              <Brain className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            <CardDescription className="text-base">
              {quiz.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                <Brain className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{questions.length}</p>
                  <p className="text-xs text-muted-foreground">Preguntas</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{quiz.time_limit_minutes} min</p>
                  <p className="text-xs text-muted-foreground">Tiempo límite</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{quiz.passing_score}%</p>
                  <p className="text-xs text-muted-foreground">Para aprobar</p>
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Una vez que inicies el quiz, el temporizador comenzará. Asegúrate
                de tener suficiente tiempo para completarlo.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              asChild
              className="w-full sm:w-auto bg-transparent"
            >
              <Link href="/dashboard/quizzes">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
            <Button
              onClick={startQuiz}
              className="w-full sm:flex-1 bg-gradient-to-r from-primary to-accent"
            >
              Comenzar Quiz
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Quiz in progress
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          <p className="text-sm text-muted-foreground">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </p>
        </div>
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg font-bold ${
            timeLeft !== null && timeLeft < 60
              ? "bg-red-500/10 text-red-600"
              : "bg-muted"
          }`}
        >
          <Clock className="h-5 w-5" />
          {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answeredCount} respondidas</span>
          <span>{questions.length - answeredCount} restantes</span>
        </div>
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestionIndex + 1}. {currentQuestion?.question_text}
          </CardTitle>
          <CardDescription>
            Selecciona la respuesta correcta ({currentQuestion?.points || 1}{" "}
            punto{(currentQuestion?.points || 1) > 1 ? "s" : ""})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQuestion?.id] || ""}
            onValueChange={(value) =>
              handleAnswerSelect(currentQuestion?.id, value)
            }
            className="space-y-3"
          >
            {currentQuestion?.options.map((option, index) => (
              <div
                key={option.id}
                className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                  answers[currentQuestion.id] === option.id
                    ? "border-primary bg-primary/5"
                    : ""
                }`}
              >
                <RadioGroupItem value={option.id} id={option.id} />
                <Label
                  htmlFor={option.id}
                  className="flex-1 cursor-pointer text-base"
                >
                  <span className="mr-2 font-medium text-muted-foreground">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option.option_text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
            >
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={submitQuiz}
              disabled={submitting}
              className="bg-gradient-to-r from-primary to-accent"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Finalizar Quiz
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Question Navigator */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-medium">Navegación Rápida</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, index) => (
              <Button
                key={q.id}
                variant={
                  currentQuestionIndex === index
                    ? "default"
                    : answers[q.id]
                      ? "secondary"
                      : "outline"
                }
                size="sm"
                className={`h-8 w-8 p-0 ${answers[q.id] && currentQuestionIndex !== index ? "bg-green-500/20 text-green-600 hover:bg-green-500/30" : ""}`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
