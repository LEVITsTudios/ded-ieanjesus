"use client";

import React from "react"

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
  Chrome,
  ArrowLeft,
} from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    dni: "",
    phone: "",
    role: "student" as "student" | "teacher" | "parent" | "admin",
    adminCode: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const supabase = createClient();
  const [oauth, setOauth] = useState<string | null>(null);
  const [oauthEmail, setOauthEmail] = useState<string>("");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const o = params.get("oauth");
      const em = params.get("email") || "";
      setOauth(o);
      setOauthEmail(em);
      if (o === "google" && em) {
        setFormData((f) => ({ ...f, email: em }));
      }
    } catch (e) {
      // ignore server-side
    }
  }, []);

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError("El nombre completo es requerido");
      return false;
    }
    if (formData.fullName.trim().split(" ").length < 2) {
      setError("Por favor ingresa tu nombre completo (nombre y apellido)");
      return false;
    }
    if (!formData.email.trim()) {
      setError("El correo electrónico es requerido");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Por favor ingresa un correo electrónico válido");
      return false;
    }
    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return false;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError("La contraseña debe contener al menos una letra mayúscula");
      return false;
    }
    if (!/[0-9]/.test(formData.password)) {
      setError("La contraseña debe contener al menos un número");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return false;
    }
    if (formData.role === "admin" && !formData.adminCode.trim()) {
      setError(
        "Se requiere un código de invitación válido para registrarse como administrador"
      );
      return false;
    }
    if (!formData.dni || !formData.dni.trim()) {
      setError("El DNI / número de identificación es requerido");
      return false;
    }
    if (!/^[0-9]{6,12}$/.test(formData.dni.trim())) {
      setError("Por favor ingresa un DNI válido (solo números, 6-12 dígitos)");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      // If OAuth flow (Google), update profile instead of signUp
      if (oauth === "google") {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("No se encontró sesión OAuth. Por favor intenta iniciar sesión con Google nuevamente.");
          setLoading(false);
          return;
        }

        // Update profiles table
        const { error: updateError } = await supabase.from('profiles').upsert({
          id: user.id,
          full_name: formData.fullName,
          phone: formData.phone,
          dni: formData.dni,
          role: formData.role
        });

        if (updateError) {
          setError(updateError.message);
          setLoading(false);
          return;
        }

        // If student, let them continue to student form
        if (formData.role === 'student') {
          // ensure redirect to student form
          window.location.href = '/dashboard/profile/student-form';
          return;
        }

        setSuccess(true);
        setLoading(false);
        return;
      }
      // Si es admin, verificar el código de invitación
      if (formData.role === "admin") {
        const { data: codeData, error: codeError } = await supabase
          .from("admin_invite_codes")
          .select("*")
          .eq("code", formData.adminCode)
          .eq("is_used", false)
          .gt("expires_at", new Date().toISOString())
          .single();

        if (codeError || !codeData) {
          setError(
            "El código de invitación no es válido, ya fue usado o ha expirado"
          );
          setLoading(false);
          return;
        }
      }

      // Obtener la URL base correctamente
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      const redirectUrl =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${baseUrl}/auth/callback`;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            dni: formData.dni,
            role: formData.role,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("Este correo electrónico ya está registrado");
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      // Si es admin y el registro fue exitoso, marcar el código como usado
      if (formData.role === "admin" && data.user) {
        await supabase
          .from("admin_invite_codes")
          .update({
            is_used: true,
            used_by: data.user.id,
            used_at: new Date().toISOString(),
          })
          .eq("code", formData.adminCode);
      }

      setSuccess(true);
    } catch (err) {
      setError("Ocurrió un error inesperado. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Registro Exitoso</CardTitle>
            <CardDescription className="text-base">
              Hemos enviado un correo de verificación a{" "}
              <strong>{formData.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Por favor revisa tu bandeja de entrada (y la carpeta de spam) y
                haz clic en el enlace de verificación para activar tu cuenta.
              </AlertDescription>
            </Alert>
            <div className="text-center text-sm text-muted-foreground">
              <p>¿No recibiste el correo?</p>
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => setSuccess(false)}
              >
                Intentar con otro correo
              </Button>
            </div>
            <Button asChild className="w-full">
              <Link href="/auth/login">Ir a Iniciar Sesión</Link>
            </Button>
          </CardContent>
        </Card>
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
              Crear Cuenta
            </CardTitle>
            <CardDescription>
              Únete a nuestra plataforma educativa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    O regístrate con email
                  </span>
                </div>
              </div>

              {/* Nombre completo */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="Juan Pérez García"
                    className="pl-10"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* DNI / Número de Identificación */}
              <div className="space-y-2">
                <Label htmlFor="dni">DNI / Número de Identificación</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dni"
                    placeholder="12345678"
                    className="pl-10"
                    value={formData.dni}
                    onChange={(e) =>
                      setFormData({ ...formData, dni: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (Opcional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+593 123 456 7890"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Rol */}
              <div className="space-y-2">
                <Label htmlFor="role">Tipo de Usuario</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: typeof formData.role) =>
                    setFormData({ ...formData, role: value, adminCode: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Estudiante</SelectItem>
                    <SelectItem value="teacher">Maestro/Profesor</SelectItem>
                    <SelectItem value="parent">Padre/Representante</SelectItem>
                    <SelectItem value="admin">
                      Administrador (Requiere código)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Código de Admin */}
              {formData.role === "admin" && (
                <div className="space-y-2">
                  <Label htmlFor="adminCode">Código de Invitación</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="adminCode"
                      type="text"
                      placeholder="ADMIN-XXXX-XXXX"
                      className="pl-10"
                      value={formData.adminCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          adminCode: e.target.value.toUpperCase(),
                        })
                      }
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Solicita un código de invitación al administrador del
                    sistema
                  </p>
                </div>
              )}

              {/* Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p
                    className={
                      formData.password.length >= 8
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }
                  >
                    {formData.password.length >= 8 ? "✓" : "○"} Mínimo 8
                    caracteres
                  </p>
                  <p
                    className={
                      /[A-Z]/.test(formData.password)
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }
                  >
                    {/[A-Z]/.test(formData.password) ? "✓" : "○"} Una letra
                    mayúscula
                  </p>
                  <p
                    className={
                      /[0-9]/.test(formData.password)
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }
                  >
                    {/[0-9]/.test(formData.password) ? "✓" : "○"} Un número
                  </p>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repite tu contraseña"
                    className="pl-10"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                {formData.confirmPassword && (
                  <p
                    className={`text-xs ${formData.password === formData.confirmPassword ? "text-green-600" : "text-destructive"}`}
                  >
                    {formData.password === formData.confirmPassword
                      ? "✓ Las contraseñas coinciden"
                      : "✗ Las contraseñas no coinciden"}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear Cuenta"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                ¿Ya tienes una cuenta?{" "}
              </span>
              <Link
                href="/auth/login"
                className="text-primary hover:underline font-medium"
              >
                Iniciar Sesión
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Al registrarte, aceptas nuestros{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Términos de Servicio
          </Link>{" "}
          y{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Política de Privacidad
          </Link>
        </p>
      </div>
    </div>
  );
}
