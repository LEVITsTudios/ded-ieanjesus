"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Lock,
  Fingerprint,
  HelpCircle,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { PinSetupDialog } from "@/components/security/pin-input";
import { BiometricSetup } from "@/components/security/biometric-auth";
import { SecurityQuestionsSetup, SecurityQuestionsVerify } from "@/components/security/security-questions";
import { useSecurityPin, useSecurityQuestions, useBiometric } from "@/hooks/use-security";

interface BiometricDevice {
  id: string;
  device_name: string;
  created_at: string;
  last_used_at?: string;
  is_active: boolean;
}

interface SecurityQuestion {
  id: string;
  question_text: string;
}

export default function SecuritySettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showSecurityQuestions, setShowSecurityQuestions] = useState(false);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hasPinEnabled, setHasPinEnabled] = useState(false);
  const [hasSecurityQuestions, setHasSecurityQuestions] = useState(false);
  const [biometricDevices, setBiometricDevices] = useState<BiometricDevice[]>([]);
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([]);

  const { createPin } = useSecurityPin();
  const { getQuestions, saveAnswers } = useSecurityQuestions();
  const { registerBiometric, checkBiometricSupport } = useBiometric();

  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  useEffect(() => {
    loadSecuritySettings();
    checkBiometricSupport().then(setIsBiometricSupported);
  }, []);

  const loadSecuritySettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setCurrentUserId(user.id);

      // Cargar PIN
      const { data: pinData } = await supabase
        .from("security_pins")
        .select("id, is_active")
        .eq("user_id", user.id)
        .single();

      setHasPinEnabled(!!pinData?.is_active);

      // Cargar preguntas de seguridad
      const qResult = await getQuestions();
      if (qResult.success) {
        setSecurityQuestions(qResult.data || []);
      }

      const { data: answersData } = await supabase
        .from("user_security_answers")
        .select("id")
        .eq("user_id", user.id);

      setHasSecurityQuestions(!!answersData?.length);

      // Cargar dispositivos biométricos
      const { data: bioDevices } = await supabase
        .from("biometric_devices")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      setBiometricDevices(bioDevices || []);
    } catch (err) {
      setError("Error al cargar configuración de seguridad");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePinSetup = async (pin: string) => {
    if (!currentUserId) return;

    const result = await createPin(currentUserId, pin);
    if (result.success) {
      setHasPinEnabled(true);
      setShowPinSetup(false);
    }
  };

  const handleSecurityQuestionsSetup = async (
    answers: Array<{ question_id: string; answer: string }>
  ) => {
    if (!currentUserId) return;

    const result = await saveAnswers(currentUserId, answers);
    if (result.success) {
      setHasSecurityQuestions(true);
      setShowSecurityQuestions(false);
    }
  };

  const handleBiometricRegister = async (deviceName: string) => {
    if (!currentUserId) return;

    const result = await registerBiometric(currentUserId, deviceName);
    if (result.success) {
      // Recargar dispositivos
      loadSecuritySettings();
    }
  };

  const handleDeleteBiometricDevice = async (deviceId: string) => {
    const { error } = await supabase
      .from("biometric_devices")
      .update({ is_active: false })
      .eq("id", deviceId);

    if (error) {
      setError("Error al eliminar dispositivo");
      return;
    }

    loadSecuritySettings();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Configuración de Seguridad
            </h1>
            <p className="text-muted-foreground">
              Administra las opciones de seguridad de tu cuenta
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="pin" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pin">PIN</TabsTrigger>
            <TabsTrigger value="questions">Preguntas</TabsTrigger>
            <TabsTrigger value="biometric">Biometría</TabsTrigger>
          </TabsList>

          {/* PIN Tab */}
          <TabsContent value="pin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  PIN de Seguridad
                </CardTitle>
                <CardDescription>
                  Agrega un PIN de 6 dígitos como capa adicional de seguridad
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasPinEnabled ? (
                  <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      ✓ PIN habilitado. Tu cuenta está protegida con un PIN de seguridad.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Protege tu cuenta con un PIN de 6 dígitos adicional
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Beneficios:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Segunda capa de autenticación</li>
                    <li>Rápido y fácil de usar</li>
                    <li>Se pide tras autenticación correcta</li>
                  </ul>
                </div>

                <Button onClick={() => setShowPinSetup(true)} className="w-full">
                  {hasPinEnabled ? "Cambiar PIN" : "Configurar PIN"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Questions Tab */}
          <TabsContent value="questions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Preguntas de Seguridad
                </CardTitle>
                <CardDescription>
                  Responde preguntas para recuperar tu cuenta si olvidas tu contraseña
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasSecurityQuestions ? (
                  <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      ✓ Preguntas configuradas. Podrás recuperar tu cuenta con tus respuestas.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Configura preguntas para recuperar tu cuenta más fácilmente
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">¿Cómo funciona?</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Responde 3 preguntas personalizadas</li>
                    <li>Se usan para verificar tu identidad</li>
                    <li>Necesarias para recuperar tu cuenta</li>
                  </ul>
                </div>

                <Button onClick={() => setShowSecurityQuestions(true)} className="w-full">
                  {hasSecurityQuestions ? "Actualizar Preguntas" : "Configurar Preguntas"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Biometric Tab */}
          <TabsContent value="biometric" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5" />
                  Autenticación Biométrica
                </CardTitle>
                <CardDescription>
                  Usa tu huella dactilar o rostro para acceder rápidamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isBiometricSupported ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Tu dispositivo o navegador no soporta autenticación biométrica
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {biometricDevices.length > 0 ? (
                      <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
                        <AlertCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                          ✓ {biometricDevices.length} dispositivo{biometricDevices.length !== 1 ? "s" : ""} biométrico{biometricDevices.length !== 1 ? "s" : ""} registrado{biometricDevices.length !== 1 ? "s" : ""}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Registra tus dispositivos biométricos para acceso rápido
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-2">Ventajas:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Acceso rápido y seguro</li>
                        <li>Sin contraseñas necesarias</li>
                        <li>Funciona en múltiples dispositivos</li>
                      </ul>
                    </div>

                    <Button onClick={() => setShowBiometricSetup(true)} className="w-full">
                      {biometricDevices.length > 0 ? "Registrar Otro Dispositivo" : "Registrar Dispositivo"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <PinSetupDialog
        isOpen={showPinSetup}
        onOpenChange={setShowPinSetup}
        onSubmit={handlePinSetup}
      />

      <SecurityQuestionsSetup
        isOpen={showSecurityQuestions}
        onOpenChange={setShowSecurityQuestions}
        onSubmit={handleSecurityQuestionsSetup}
        questions={securityQuestions}
      />

      <BiometricSetup
        isOpen={showBiometricSetup}
        onOpenChange={setShowBiometricSetup}
        onRegister={handleBiometricRegister}
        devices={biometricDevices}
        onDeleteDevice={handleDeleteBiometricDevice}
      />
    </div>
  );
}
