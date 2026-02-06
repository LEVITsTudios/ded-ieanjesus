"use client";

import React from "react"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  GraduationCap,
  Mail,
  Lock,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Chrome,
  Eye,
  EyeOff,
  Fingerprint,
} from "lucide-react";
import { PinVerificationDialog } from "@/components/security/pin-input";
import { BiometricAuth } from "@/components/security/biometric-auth";
import { useSecurityPin, useBiometric } from "@/hooks/use-security";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [showBiometricAuth, setShowBiometricAuth] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasPinEnabled, setHasPinEnabled] = useState(false);
  const [hasBiometricDevices, setHasBiometricDevices] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();
  const { verifyPin } = useSecurityPin();
  const { authenticateWithBiometric, checkBiometricSupport } = useBiometric();
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  useEffect(() => {
    checkBiometricSupport().then(setIsBiometricSupported);
  }, [checkBiometricSupport]);

  // Auto-redirect if session exists
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          router.push('/dashboard');
        }
      } catch (e) {
        // ignore
      }
    };
    checkSession();
  }, [supabase, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Correo electrónico o contraseña incorrectos");
        } else if (signInError.message.includes("Email not confirmed")) {
          setError(
            "Tu correo electrónico no ha sido verificado. Por favor revisa tu bandeja de entrada."
          );
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (data.user) {
        setCurrentUserId(data.user.id);
        
        // Verificar si tiene PIN habilitado
        const { data: pinData } = await supabase
          .from("security_pins")
          .select("id, is_active")
          .eq("user_id", data.user.id)
          .single();

        if (pinData?.is_active) {
          setHasPinEnabled(true);
          setShowPinVerification(true);
          return;
        }

        // Verificar si tiene dispositivos biométricos
        if (isBiometricSupported) {
          const { data: bioDevices } = await supabase
            .from("biometric_devices")
            .select("id")
            .eq("user_id", data.user.id)
            .eq("is_active", true);

          if (bioDevices && bioDevices.length > 0) {
            setHasBiometricDevices(true);
            setShowBiometricAuth(true);
            return;
          }
        }

        // Continuar con el login normal
        completeLogin(data.user.id);
      }
    } catch (err) {
      setError("Ocurrió un error inesperado. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = async (userId: string) => {
    try {
      // Verificar si el estudiante necesita completar su ficha
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profile?.role === "student") {
        const { data: studentProfile } = await supabase
          .from("student_profiles")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (!studentProfile) {
          router.push("/dashboard/profile/student-form");
          return;
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("Error al completar el login");
    }
  };

  const handlePinVerification = async (pin: string): Promise<boolean> => {
    if (!currentUserId) return false;
    
    const result = await verifyPin(currentUserId, pin);
    
    if (result.success) {
      // PIN verificado, continuar con biometría si está disponible
      if (isBiometricSupported && hasBiometricDevices) {
        setShowPinVerification(false);
        setShowBiometricAuth(true);
        return true;
      }
      
      // No hay biometría, completar login
      setShowPinVerification(false);
      completeLogin(currentUserId);
      return true;
    }
    
    return false;
  };

  const handleBiometricAuth = async (): Promise<boolean> => {
    if (!currentUserId) return false;
    
    const result = await authenticateWithBiometric(currentUserId);
    
    if (result.success) {
      completeLogin(currentUserId);
      return true;
    }
    
    return false;
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${baseUrl}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setError("Error al iniciar sesión con Google: " + error.message);
        setGoogleLoading(false);
      }
    } catch (err) {
      setError("Error al conectar con Google");
      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/auth/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setResetEmailSent(true);
      }
    } catch (err) {
      setError("Error al enviar el correo de recuperación");
    } finally {
      setLoading(false);
    }
  };

  if (showResetForm) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">
              Escuela Dominical
            </span>
          </div>

          <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Recuperar Contraseña</CardTitle>
              <CardDescription>
                Ingresa tu correo electrónico para recibir un enlace de
                recuperación
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resetEmailSent ? (
                <div className="space-y-4 text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-muted-foreground">
                    Hemos enviado un enlace de recuperación a{" "}
                    <strong>{email}</strong>
                  </p>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => {
                      setShowResetForm(false);
                      setResetEmailSent(false);
                    }}
                  >
                    Volver al inicio de sesión
                  </Button>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="resetEmail">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="resetEmail"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar Enlace de Recuperación"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowResetForm(false)}
                  >
                    Volver al inicio de sesión
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <Link
          href="/"
          className="absolute left-4 top-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors sm:left-8 sm:top-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">Escuela Dominical</span>
        </div>

        <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              Bienvenido de vuelta
            </CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
              >
                {googleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Chrome className="mr-2 h-4 w-4" />
                )}
                Continuar con Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    O continúa con email
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link href="/auth/forgot-password">
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 h-auto text-xs"
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                ¿No tienes una cuenta?{" "}
              </span>
              <Link
                href="/auth/register"
                className="font-medium text-primary hover:underline"
              >
                Regístrate aquí
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PIN Verification Dialog */}
      <PinVerificationDialog
        isOpen={showPinVerification}
        onOpenChange={setShowPinVerification}
        onSubmit={handlePinVerification}
        isLoading={loading}
      />

      {/* Biometric Auth Dialog */}
      <BiometricAuth
        isOpen={showBiometricAuth}
        onOpenChange={setShowBiometricAuth}
        onAuthenticate={handleBiometricAuth}
        isLoading={loading}
      />
    </div>
  );
}
