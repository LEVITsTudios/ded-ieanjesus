"use client"

import React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  GraduationCap,
  BookOpen,
  Users,
  Calendar,
  ClipboardCheck,
  Bell,
  Shield,
  ChevronRight,
  Sparkles,
} from "lucide-react"

function FloatingCard({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <div
      className={`animate-float ${className}`}
      style={{
        animationDelay: `${delay}s`,
        transform: "perspective(1000px)",
      }}
    >
      {children}
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 hover:border-primary/30">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <CardContent className="relative p-6">
        <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-primary to-accent p-3 text-primary-foreground shadow-lg shadow-primary/25">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const features = [
    {
      icon: BookOpen,
      title: "Gestion de Clases",
      description: "Administra cursos, materiales y contenido educativo de forma organizada y accesible.",
    },
    {
      icon: ClipboardCheck,
      title: "Control de Asistencia",
      description: "Registro automatizado de asistencias con reportes detallados y notificaciones.",
    },
    {
      icon: Calendar,
      title: "Horarios Flexibles",
      description: "Programa clases, reuniones y eventos con calendario integrado y recordatorios.",
    },
    {
      icon: Users,
      title: "Reuniones Virtuales",
      description: "Organiza reuniones entre padres, maestros y estudiantes facilmente.",
    },
    {
      icon: Shield,
      title: "Permisos y Ausencias",
      description: "Sistema completo para solicitar y aprobar permisos con seguimiento en tiempo real.",
    },
    {
      icon: Bell,
      title: "Notificaciones",
      description: "Mantente informado con alertas personalizadas sobre calificaciones y eventos.",
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Escuela Dominical</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Caracteristicas
            </Link>
            <Link href="#about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Acerca de
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Iniciar Sesion</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30">
              <Link href="/auth/register">Registrarse</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div
              className={`space-y-8 transition-all duration-1000 ${
                mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                <span>Sistema Academico Moderno</span>
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
                Gestion Educativa{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Inteligente
                </span>
              </h1>
              <p className="max-w-lg text-lg text-muted-foreground leading-relaxed text-pretty">
                Plataforma integral para administrar todos los aspectos de tu institucion educativa. 
                Desde asistencias hasta calificaciones, todo en un solo lugar.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                >
                  <Link href="/auth/register">
                    Comenzar Ahora
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#features">Ver Caracteristicas</Link>
                </Button>
              </div>
            </div>

            {/* 3D Floating Cards */}
            <div
              className={`relative hidden h-[500px] lg:block transition-all duration-1000 delay-300 ${
                mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              <FloatingCard delay={0} className="absolute left-0 top-0">
                <Card className="w-48 border-border/50 bg-card/80 backdrop-blur-xl shadow-xl">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Estudiantes</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">1,234</p>
                    <p className="text-xs text-muted-foreground">Activos este mes</p>
                  </CardContent>
                </Card>
              </FloatingCard>

              <FloatingCard delay={0.5} className="absolute right-0 top-20">
                <Card className="w-56 border-border/50 bg-card/80 backdrop-blur-xl shadow-xl">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                        <ClipboardCheck className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Asistencia</span>
                    </div>
                    <div className="flex items-end gap-1">
                      {[65, 80, 75, 90, 85, 95, 88].map((h, i) => (
                        <div
                          key={i}
                          className="w-5 rounded-t bg-gradient-to-t from-primary to-accent"
                          style={{ height: `${h * 0.6}px` }}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </FloatingCard>

              <FloatingCard delay={1} className="absolute bottom-20 left-10">
                <Card className="w-52 border-border/50 bg-card/80 backdrop-blur-xl shadow-xl">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-chart-3 to-primary flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Cursos</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">48</p>
                    <p className="text-xs text-muted-foreground">En progreso</p>
                  </CardContent>
                </Card>
              </FloatingCard>

              <FloatingCard delay={1.5} className="absolute bottom-0 right-10">
                <Card className="w-48 border-border/50 bg-card/80 backdrop-blur-xl shadow-xl">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-chart-4 to-accent flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Eventos</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">12</p>
                    <p className="text-xs text-muted-foreground">Esta semana</p>
                  </CardContent>
                </Card>
              </FloatingCard>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl text-balance">
              Todo lo que necesitas para{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                tu institucion
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground text-pretty">
              Herramientas completas para administradores, maestros, estudiantes y padres de familia.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary to-accent">
            <div className="absolute inset-0 opacity-30">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                  backgroundSize: "30px 30px",
                }}
              />
            </div>
            <CardContent className="relative flex flex-col items-center gap-6 py-16 text-center">
              <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl text-balance">
                Comienza a transformar tu institucion hoy
              </h2>
              <p className="max-w-xl text-primary-foreground/90 text-pretty">
                Unete a miles de instituciones que ya confian en Escuela Dominical para gestionar su educacion de manera eficiente.
              </p>
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="shadow-xl"
              >
                <Link href="/auth/register">
                  Crear Cuenta Gratis
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Escuela Dominical</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2026 Escuela Dominical. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotateX(5deg) rotateY(-5deg);
          }
          50% {
            transform: translateY(-20px) rotateX(-5deg) rotateY(5deg);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  )
}
