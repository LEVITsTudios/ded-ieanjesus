"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";

interface SecurityQuestion {
  id: string;
  question_text: string;
}

interface SecurityAnswer {
  question_id: string;
  answer: string;
}

interface SecurityQuestionsSetupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (answers: SecurityAnswer[]) => Promise<void>;
  questions: SecurityQuestion[];
  isLoading?: boolean;
}

/**
 * Componente para configurar preguntas de seguridad
 */
export const SecurityQuestionsSetup: React.FC<SecurityQuestionsSetupProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  questions,
  isLoading = false,
}) => {
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<SecurityAnswer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Seleccionar 3 preguntas al azar
  useEffect(() => {
    if (questions.length > 0 && selectedQuestions.length === 0) {
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 3).map((q) => q.id);
      setSelectedQuestions(selected);
    }
  }, [questions, selectedQuestions.length]);

  const handleQuestionChange = (index: number, questionId: string) => {
    const newSelected = [...selectedQuestions];
    newSelected[index] = questionId;
    setSelectedQuestions(newSelected);

    // Limpiar respuesta al cambiar pregunta
    const newAnswers = [...answers];
    newAnswers[index] = { question_id: questionId, answer: "" };
    setAnswers(newAnswers);
  };

  const handleAnswerChange = (index: number, answer: string) => {
    const questionId = selectedQuestions[index];
    const newAnswers = [...answers];
    newAnswers[index] = { question_id: questionId, answer };
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (answers.some((a) => !a.answer.trim())) {
      setError("Por favor completa todas las respuestas");
      return;
    }

    try {
      await onSubmit(answers);
      setSuccess(true);
      setTimeout(() => {
        setSelectedQuestions([]);
        setAnswers([]);
        setSuccess(false);
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al guardar las preguntas de seguridad"
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Preguntas de Seguridad
          </DialogTitle>
          <DialogDescription>
            Responde estas preguntas para poder recuperar tu cuenta en caso de que olvides tu contraseña
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-foreground">
              ¡Preguntas de seguridad guardadas exitosamente!
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
              <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                Elige preguntas que solo tú conozcas la respuesta. Serán usadas para recuperar tu cuenta.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {selectedQuestions.map((questionId, index) => {
                const currentQuestion = questions.find((q) => q.id === questionId);
                const currentAnswer = answers.find(
                  (a) => a.question_id === questionId
                );

                return (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        Pregunta {index + 1}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label htmlFor={`question-${index}`} className="text-sm">
                          Elige una pregunta:
                        </Label>
                        <Select
                          value={questionId}
                          onValueChange={(value) =>
                            handleQuestionChange(index, value)
                          }
                        >
                          <SelectTrigger id={`question-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {questions.map((q) => (
                              <SelectItem key={q.id} value={q.id}>
                                {q.question_text}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {currentQuestion && (
                        <div>
                          <Label
                            htmlFor={`answer-${index}`}
                            className="text-sm font-medium"
                          >
                            Tu respuesta:
                          </Label>
                          <Input
                            id={`answer-${index}`}
                            type="text"
                            placeholder="Ingresa tu respuesta"
                            value={currentAnswer?.answer || ""}
                            onChange={(e) =>
                              handleAnswerChange(index, e.target.value)
                            }
                            disabled={isLoading}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Pregunta: <em>{currentQuestion.question_text}</em>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || answers.some((a) => !a.answer.trim())}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Preguntas"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface SecurityQuestionsVerifyProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (answers: SecurityAnswer[]) => Promise<boolean>;
  questions: SecurityQuestion[];
  isLoading?: boolean;
}

/**
 * Componente para verificar preguntas de seguridad en recuperación
 */
export const SecurityQuestionsVerify: React.FC<SecurityQuestionsVerifyProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  questions,
  isLoading = false,
}) => {
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<SecurityAnswer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (questions.length > 0 && selectedQuestions.length === 0) {
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 2).map((q) => q.id);
      setSelectedQuestions(selected);
      setAnswers(selected.map((qId) => ({ question_id: qId, answer: "" })));
    }
  }, [questions, selectedQuestions.length]);

  const handleAnswerChange = (index: number, answer: string) => {
    const newAnswers = [...answers];
    newAnswers[index].answer = answer;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (answers.some((a) => !a.answer.trim())) {
      setError("Por favor completa todas las respuestas");
      return;
    }

    const isValid = await onSubmit(answers);
    if (!isValid) {
      setError("Las respuestas no coinciden. Intenta de nuevo.");
      setAnswers(answers.map((a) => ({ ...a, answer: "" })));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Verifica tu Identidad
          </DialogTitle>
          <DialogDescription>
            Responde tus preguntas de seguridad para recuperar acceso a tu cuenta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {selectedQuestions.map((questionId, index) => {
              const currentQuestion = questions.find(
                (q) => q.id === questionId
              );
              const currentAnswer = answers[index];

              return (
                <Card key={index}>
                  <CardContent className="pt-6 space-y-3">
                    <Label className="text-base font-medium">
                      {currentQuestion?.question_text}
                    </Label>
                    <Input
                      type="text"
                      placeholder="Tu respuesta"
                      value={currentAnswer?.answer || ""}
                      onChange={(e) =>
                        handleAnswerChange(index, e.target.value)
                      }
                      disabled={isLoading}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isLoading || answers.some((a) => !a.answer.trim())
              }
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
