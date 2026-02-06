"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  User,
  Heart,
  Brain,
  Star,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Datos Personales", icon: User },
  { id: 2, title: "Contacto de Emergencia", icon: Phone },
  { id: 3, title: "Salud Física", icon: Heart },
  { id: 4, title: "Salud Mental", icon: Brain },
  { id: 5, title: "Habilidades y Talentos", icon: Star },
];

export default function StudentFormPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Form data
  const [formData, setFormData] = useState({
    // Datos personales
    dateOfBirth: "",
    gender: "",
    nationality: "",
    documentType: "",
    documentNumber: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",

    // Contacto de emergencia
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
    emergencyContactEmail: "",
    secondaryContactName: "",
    secondaryContactPhone: "",

    // Salud física
    bloodType: "",
    allergies: [] as string[],
    allergiesOther: "",
    chronicConditions: [] as string[],
    chronicConditionsOther: "",
    medications: "",
    disabilities: [] as string[],
    disabilitiesOther: "",
    requiresSpecialAssistance: false,
    specialAssistanceDetails: "",
    lastMedicalCheckup: "",
    vaccinesUpToDate: "",
    physicalActivityLevel: "",

    // Salud mental
    mentalHealthConditions: [] as string[],
    mentalHealthOther: "",
    hasTherapist: "",
    therapistContact: "",
    stressLevel: "",
    sleepQuality: "",
    emotionalSupport: "",

    // Habilidades y talentos
    academicStrengths: [] as string[],
    learningStyle: "",
    artisticTalents: [] as string[],
    sportsTalents: [] as string[],
    languages: [] as string[],
    technicalSkills: [] as string[],
    hobbies: "",
    careerInterests: "",
    specialAchievements: "",
    extracurricularActivities: "",
  });

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        router.push("/auth/login");
      }
    };
    getUser();
  }, [supabase, router]);

  const updateFormData = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number) => {
    // Step-specific validation
    if (step === 1) {
      // Require document number when document type is DNI
      if (formData.documentType === "dni" && !formData.documentNumber.trim()) {
        setError("El número de documento (DNI) es requerido en este paso.");
        return false;
      }
      // Require date of birth
      if (!formData.dateOfBirth) {
        setError("La fecha de nacimiento es requerida.");
        return false;
      }
    }

    if (step === 2) {
      // Emergency contact minimal validation: name and phone
      if (!formData.emergencyContactName.trim() || !formData.emergencyContactPhone.trim()) {
        setError("Por favor completa el contacto de emergencia (nombre y teléfono).");
        return false;
      }
    }

    // Clear error if validation passes
    setError(null);
    return true;
  };

  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const toggleArrayItem = (field: string, item: string) => {
    setFormData((prev) => {
      const currentArray = prev[field as keyof typeof prev] as string[];
      const newArray = currentArray.includes(item)
        ? currentArray.filter((i) => i !== item)
        : [...currentArray, item];
      return { ...prev, [field]: newArray };
    });
  };

  const handleSubmit = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      // Guardar perfil estudiantil
      const { error: profileError } = await supabase
        .from("student_profiles")
        .upsert({
          user_id: userId,
          date_of_birth: formData.dateOfBirth || null,
          gender: formData.gender || null,
          nationality: formData.nationality || null,
          document_type: formData.documentType || null,
          document_number: formData.documentNumber || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          postal_code: formData.postalCode || null,
          emergency_contact_name: formData.emergencyContactName || null,
          emergency_contact_relation: formData.emergencyContactRelation || null,
          emergency_contact_phone: formData.emergencyContactPhone || null,
          emergency_contact_email: formData.emergencyContactEmail || null,
          secondary_contact_name: formData.secondaryContactName || null,
          secondary_contact_phone: formData.secondaryContactPhone || null,
          blood_type: formData.bloodType || null,
          allergies: formData.allergies.length > 0 ? formData.allergies : null,
          chronic_conditions:
            formData.chronicConditions.length > 0
              ? formData.chronicConditions
              : null,
          current_medications: formData.medications || null,
          disabilities:
            formData.disabilities.length > 0 ? formData.disabilities : null,
          requires_special_assistance: formData.requiresSpecialAssistance,
          special_assistance_details:
            formData.specialAssistanceDetails || null,
          last_medical_checkup: formData.lastMedicalCheckup || null,
          vaccines_up_to_date: formData.vaccinesUpToDate === "yes",
        });

      if (profileError) throw profileError;

      // Guardar encuesta
      const { error: surveyError } = await supabase
        .from("student_surveys")
        .upsert({
          user_id: userId,
          physical_activity_level: formData.physicalActivityLevel || null,
          mental_health_conditions:
            formData.mentalHealthConditions.length > 0
              ? formData.mentalHealthConditions
              : null,
          has_therapist: formData.hasTherapist === "yes",
          therapist_contact: formData.therapistContact || null,
          stress_level: formData.stressLevel || null,
          sleep_quality: formData.sleepQuality || null,
          emotional_support: formData.emotionalSupport || null,
          academic_strengths:
            formData.academicStrengths.length > 0
              ? formData.academicStrengths
              : null,
          learning_style: formData.learningStyle || null,
          artistic_talents:
            formData.artisticTalents.length > 0
              ? formData.artisticTalents
              : null,
          sports_talents:
            formData.sportsTalents.length > 0 ? formData.sportsTalents : null,
          languages: formData.languages.length > 0 ? formData.languages : null,
          technical_skills:
            formData.technicalSkills.length > 0
              ? formData.technicalSkills
              : null,
          hobbies: formData.hobbies || null,
          career_interests: formData.careerInterests || null,
          special_achievements: formData.specialAchievements || null,
          extracurricular_activities:
            formData.extracurricularActivities || null,
        });

      if (surveyError) throw surveyError;

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError(
        "Ocurrió un error al guardar tu información. Por favor intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dateOfBirth"
                    type="date"
                    className="pl-10"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      updateFormData("dateOfBirth", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Género</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(v) => updateFormData("gender", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Femenino</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                    <SelectItem value="prefer_not_say">
                      Prefiero no decir
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nacionalidad</Label>
                <Input
                  placeholder="Ej: Mexicana"
                  value={formData.nationality}
                  onChange={(e) =>
                    updateFormData("nationality", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(v) => updateFormData("documentType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dni">DNI</SelectItem>
                    <SelectItem value="passport">Pasaporte</SelectItem>
                    <SelectItem value="curp">CURP</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Número de Documento</Label>
              <Input
                placeholder="Número de identificación"
                value={formData.documentNumber}
                onChange={(e) =>
                  updateFormData("documentNumber", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Dirección</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  placeholder="Calle, número, colonia"
                  className="pl-10 min-h-[80px]"
                  value={formData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Input
                  placeholder="Ciudad"
                  value={formData.city}
                  onChange={(e) => updateFormData("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado/Provincia</Label>
                <Input
                  placeholder="Estado"
                  value={formData.state}
                  onChange={(e) => updateFormData("state", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Código Postal</Label>
                <Input
                  placeholder="C.P."
                  value={formData.postalCode}
                  onChange={(e) => updateFormData("postalCode", e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Esta información será usada solo en caso de emergencia.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="font-medium">Contacto Principal de Emergencia</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input
                    placeholder="Nombre del contacto"
                    value={formData.emergencyContactName}
                    onChange={(e) =>
                      updateFormData("emergencyContactName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parentesco</Label>
                  <Select
                    value={formData.emergencyContactRelation}
                    onValueChange={(v) =>
                      updateFormData("emergencyContactRelation", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mother">Madre</SelectItem>
                      <SelectItem value="father">Padre</SelectItem>
                      <SelectItem value="guardian">Tutor Legal</SelectItem>
                      <SelectItem value="grandparent">Abuelo/a</SelectItem>
                      <SelectItem value="sibling">Hermano/a</SelectItem>
                      <SelectItem value="uncle_aunt">Tío/a</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    type="tel"
                    placeholder="+593 123 456 7890"
                    value={formData.emergencyContactPhone}
                    onChange={(e) =>
                      updateFormData("emergencyContactPhone", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Correo Electrónico</Label>
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={formData.emergencyContactEmail}
                    onChange={(e) =>
                      updateFormData("emergencyContactEmail", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Contacto Secundario (Opcional)</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input
                    placeholder="Nombre del contacto"
                    value={formData.secondaryContactName}
                    onChange={(e) =>
                      updateFormData("secondaryContactName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    type="tel"
                    placeholder="+593 123 456 7890"
                    value={formData.secondaryContactPhone}
                    onChange={(e) =>
                      updateFormData("secondaryContactPhone", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Sangre</Label>
                <Select
                  value={formData.bloodType}
                  onValueChange={(v) => updateFormData("bloodType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                    <SelectItem value="unknown">No sé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Último Chequeo Médico</Label>
                <Input
                  type="date"
                  value={formData.lastMedicalCheckup}
                  onChange={(e) =>
                    updateFormData("lastMedicalCheckup", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Alergias (selecciona todas las que apliquen)</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "Ninguna",
                  "Polen",
                  "Polvo",
                  "Alimentos",
                  "Medicamentos",
                  "Insectos",
                  "Látex",
                ].map((allergy) => (
                  <div key={allergy} className="flex items-center space-x-2">
                    <Checkbox
                      id={`allergy-${allergy}`}
                      checked={formData.allergies.includes(allergy)}
                      onCheckedChange={() =>
                        toggleArrayItem("allergies", allergy)
                      }
                    />
                    <label
                      htmlFor={`allergy-${allergy}`}
                      className="text-sm cursor-pointer"
                    >
                      {allergy}
                    </label>
                  </div>
                ))}
              </div>
              <Input
                placeholder="Otras alergias (especificar)"
                value={formData.allergiesOther}
                onChange={(e) =>
                  updateFormData("allergiesOther", e.target.value)
                }
              />
            </div>

            <div className="space-y-3">
              <Label>
                Condiciones Crónicas (selecciona todas las que apliquen)
              </Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "Ninguna",
                  "Asma",
                  "Diabetes",
                  "Epilepsia",
                  "Problemas cardíacos",
                  "Problemas de visión",
                  "Problemas auditivos",
                ].map((condition) => (
                  <div key={condition} className="flex items-center space-x-2">
                    <Checkbox
                      id={`condition-${condition}`}
                      checked={formData.chronicConditions.includes(condition)}
                      onCheckedChange={() =>
                        toggleArrayItem("chronicConditions", condition)
                      }
                    />
                    <label
                      htmlFor={`condition-${condition}`}
                      className="text-sm cursor-pointer"
                    >
                      {condition}
                    </label>
                  </div>
                ))}
              </div>
              <Input
                placeholder="Otras condiciones (especificar)"
                value={formData.chronicConditionsOther}
                onChange={(e) =>
                  updateFormData("chronicConditionsOther", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Medicamentos Actuales</Label>
              <Textarea
                placeholder="Lista de medicamentos que toma actualmente (dejar vacío si no aplica)"
                value={formData.medications}
                onChange={(e) => updateFormData("medications", e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label>Discapacidades</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "Ninguna",
                  "Motriz",
                  "Visual",
                  "Auditiva",
                  "Intelectual",
                  "Psicosocial",
                ].map((disability) => (
                  <div key={disability} className="flex items-center space-x-2">
                    <Checkbox
                      id={`disability-${disability}`}
                      checked={formData.disabilities.includes(disability)}
                      onCheckedChange={() =>
                        toggleArrayItem("disabilities", disability)
                      }
                    />
                    <label
                      htmlFor={`disability-${disability}`}
                      className="text-sm cursor-pointer"
                    >
                      {disability}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="specialAssistance"
                  checked={formData.requiresSpecialAssistance}
                  onCheckedChange={(checked) =>
                    updateFormData("requiresSpecialAssistance", checked)
                  }
                />
                <label htmlFor="specialAssistance" className="text-sm">
                  Requiere asistencia especial en clases
                </label>
              </div>
              {formData.requiresSpecialAssistance && (
                <Textarea
                  placeholder="Describe el tipo de asistencia requerida"
                  value={formData.specialAssistanceDetails}
                  onChange={(e) =>
                    updateFormData("specialAssistanceDetails", e.target.value)
                  }
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>¿Vacunas al día?</Label>
              <RadioGroup
                value={formData.vaccinesUpToDate}
                onValueChange={(v) => updateFormData("vaccinesUpToDate", v)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="vaccines-yes" />
                  <label htmlFor="vaccines-yes">Sí</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="vaccines-no" />
                  <label htmlFor="vaccines-no">No</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unknown" id="vaccines-unknown" />
                  <label htmlFor="vaccines-unknown">No sé</label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Nivel de Actividad Física</Label>
              <Select
                value={formData.physicalActivityLevel}
                onValueChange={(v) =>
                  updateFormData("physicalActivityLevel", v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">
                    Sedentario (poco o nada de ejercicio)
                  </SelectItem>
                  <SelectItem value="light">
                    Ligero (1-2 días por semana)
                  </SelectItem>
                  <SelectItem value="moderate">
                    Moderado (3-4 días por semana)
                  </SelectItem>
                  <SelectItem value="active">
                    Activo (5-6 días por semana)
                  </SelectItem>
                  <SelectItem value="very_active">
                    Muy activo (todos los días)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                Esta información es confidencial y nos ayuda a brindarte mejor
                apoyo. Puedes omitir lo que no desees responder.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Label>
                Condiciones de Salud Mental (selecciona las que apliquen)
              </Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "Ninguna",
                  "Ansiedad",
                  "Depresión",
                  "TDAH",
                  "Trastorno del espectro autista",
                  "Trastorno de aprendizaje",
                  "Trastorno alimenticio",
                ].map((condition) => (
                  <div key={condition} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mental-${condition}`}
                      checked={formData.mentalHealthConditions.includes(
                        condition
                      )}
                      onCheckedChange={() =>
                        toggleArrayItem("mentalHealthConditions", condition)
                      }
                    />
                    <label
                      htmlFor={`mental-${condition}`}
                      className="text-sm cursor-pointer"
                    >
                      {condition}
                    </label>
                  </div>
                ))}
              </div>
              <Input
                placeholder="Otras condiciones (especificar)"
                value={formData.mentalHealthOther}
                onChange={(e) =>
                  updateFormData("mentalHealthOther", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>¿Actualmente recibes apoyo psicológico o terapia?</Label>
              <RadioGroup
                value={formData.hasTherapist}
                onValueChange={(v) => updateFormData("hasTherapist", v)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="therapist-yes" />
                  <label htmlFor="therapist-yes">Sí</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="therapist-no" />
                  <label htmlFor="therapist-no">No</label>
                </div>
              </RadioGroup>
              {formData.hasTherapist === "yes" && (
                <Input
                  placeholder="Nombre y contacto del terapeuta (opcional)"
                  value={formData.therapistContact}
                  onChange={(e) =>
                    updateFormData("therapistContact", e.target.value)
                  }
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>¿Cómo describirías tu nivel de estrés general?</Label>
              <Select
                value={formData.stressLevel}
                onValueChange={(v) => updateFormData("stressLevel", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="very_low">Muy bajo</SelectItem>
                  <SelectItem value="low">Bajo</SelectItem>
                  <SelectItem value="moderate">Moderado</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="very_high">Muy alto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>¿Cómo es tu calidad de sueño?</Label>
              <Select
                value={formData.sleepQuality}
                onValueChange={(v) => updateFormData("sleepQuality", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">
                    Excelente (8+ horas, sin interrupciones)
                  </SelectItem>
                  <SelectItem value="good">
                    Buena (7-8 horas, pocas interrupciones)
                  </SelectItem>
                  <SelectItem value="fair">
                    Regular (5-7 horas, algunas interrupciones)
                  </SelectItem>
                  <SelectItem value="poor">
                    Mala (menos de 5 horas o muy interrumpido)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                ¿Sientes que tienes suficiente apoyo emocional en tu vida?
              </Label>
              <Select
                value={formData.emotionalSupport}
                onValueChange={(v) => updateFormData("emotionalSupport", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">
                    Siempre tengo apoyo cuando lo necesito
                  </SelectItem>
                  <SelectItem value="usually">
                    Generalmente tengo apoyo
                  </SelectItem>
                  <SelectItem value="sometimes">A veces tengo apoyo</SelectItem>
                  <SelectItem value="rarely">Rara vez tengo apoyo</SelectItem>
                  <SelectItem value="never">
                    Nunca siento que tengo apoyo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Fortalezas Académicas</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "Matemáticas",
                  "Ciencias",
                  "Lenguaje/Literatura",
                  "Historia",
                  "Idiomas",
                  "Artes",
                  "Música",
                  "Educación Física",
                  "Tecnología",
                  "Ciencias Sociales",
                ].map((subject) => (
                  <div key={subject} className="flex items-center space-x-2">
                    <Checkbox
                      id={`strength-${subject}`}
                      checked={formData.academicStrengths.includes(subject)}
                      onCheckedChange={() =>
                        toggleArrayItem("academicStrengths", subject)
                      }
                    />
                    <label
                      htmlFor={`strength-${subject}`}
                      className="text-sm cursor-pointer"
                    >
                      {subject}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Estilo de Aprendizaje Preferido</Label>
              <Select
                value={formData.learningStyle}
                onValueChange={(v) => updateFormData("learningStyle", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visual">
                    Visual (aprendo mejor viendo imágenes, videos, diagramas)
                  </SelectItem>
                  <SelectItem value="auditory">
                    Auditivo (aprendo mejor escuchando explicaciones)
                  </SelectItem>
                  <SelectItem value="reading">
                    Lectura/Escritura (aprendo mejor leyendo y tomando notas)
                  </SelectItem>
                  <SelectItem value="kinesthetic">
                    Kinestésico (aprendo mejor haciendo y practicando)
                  </SelectItem>
                  <SelectItem value="mixed">
                    Mixto (combino varios estilos)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Talentos Artísticos</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "Dibujo/Pintura",
                  "Música",
                  "Canto",
                  "Danza",
                  "Teatro",
                  "Fotografía",
                  "Escritura creativa",
                  "Manualidades",
                ].map((talent) => (
                  <div key={talent} className="flex items-center space-x-2">
                    <Checkbox
                      id={`art-${talent}`}
                      checked={formData.artisticTalents.includes(talent)}
                      onCheckedChange={() =>
                        toggleArrayItem("artisticTalents", talent)
                      }
                    />
                    <label
                      htmlFor={`art-${talent}`}
                      className="text-sm cursor-pointer"
                    >
                      {talent}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Talentos Deportivos</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "Fútbol",
                  "Básquetbol",
                  "Voleibol",
                  "Natación",
                  "Atletismo",
                  "Gimnasia",
                  "Artes marciales",
                  "Tenis",
                ].map((sport) => (
                  <div key={sport} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sport-${sport}`}
                      checked={formData.sportsTalents.includes(sport)}
                      onCheckedChange={() =>
                        toggleArrayItem("sportsTalents", sport)
                      }
                    />
                    <label
                      htmlFor={`sport-${sport}`}
                      className="text-sm cursor-pointer"
                    >
                      {sport}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Idiomas que hablas</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "Español",
                  "Inglés",
                  "Francés",
                  "Portugués",
                  "Alemán",
                  "Italiano",
                  "Chino",
                  "Japonés",
                ].map((lang) => (
                  <div key={lang} className="flex items-center space-x-2">
                    <Checkbox
                      id={`lang-${lang}`}
                      checked={formData.languages.includes(lang)}
                      onCheckedChange={() => toggleArrayItem("languages", lang)}
                    />
                    <label
                      htmlFor={`lang-${lang}`}
                      className="text-sm cursor-pointer"
                    >
                      {lang}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Habilidades Técnicas/Digitales</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "Programación",
                  "Diseño gráfico",
                  "Edición de video",
                  "Redes sociales",
                  "Office/Google Docs",
                  "Robótica",
                  "Electrónica",
                  "Gaming competitivo",
                ].map((skill) => (
                  <div key={skill} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tech-${skill}`}
                      checked={formData.technicalSkills.includes(skill)}
                      onCheckedChange={() =>
                        toggleArrayItem("technicalSkills", skill)
                      }
                    />
                    <label
                      htmlFor={`tech-${skill}`}
                      className="text-sm cursor-pointer"
                    >
                      {skill}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pasatiempos e Intereses</Label>
              <Textarea
                placeholder="Cuéntanos qué te gusta hacer en tu tiempo libre"
                value={formData.hobbies}
                onChange={(e) => updateFormData("hobbies", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Intereses de Carrera/Profesión</Label>
              <Textarea
                placeholder="¿Qué te gustaría estudiar o a qué te gustaría dedicarte en el futuro?"
                value={formData.careerInterests}
                onChange={(e) =>
                  updateFormData("careerInterests", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Logros Especiales</Label>
              <Textarea
                placeholder="Concursos, premios, certificaciones, reconocimientos, etc."
                value={formData.specialAchievements}
                onChange={(e) =>
                  updateFormData("specialAchievements", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Actividades Extracurriculares</Label>
              <Textarea
                placeholder="Clubes, grupos, voluntariado, etc."
                value={formData.extracurricularActivities}
                onChange={(e) =>
                  updateFormData("extracurricularActivities", e.target.value)
                }
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Ficha Estudiantil
          </h1>
          <p className="mt-2 text-muted-foreground">
            Completa tu información para personalizar tu experiencia educativa
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Paso {currentStep} de {STEPS.length}
            </span>
            <span className="font-medium text-primary">
              {Math.round(progress)}% completado
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="mt-4 flex justify-between">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-1 ${
                    isActive
                      ? "text-primary"
                      : isCompleted
                        ? "text-green-600"
                        : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                      isActive
                        ? "border-primary bg-primary/10"
                        : isCompleted
                          ? "border-green-600 bg-green-600 text-white"
                          : "border-muted"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="hidden text-xs md:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const Icon = STEPS[currentStep - 1].icon;
                return <Icon className="h-5 w-5 text-primary" />;
              })()}
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 &&
                "Información básica sobre ti para tu expediente"}
              {currentStep === 2 &&
                "Personas a contactar en caso de emergencia"}
              {currentStep === 3 &&
                "Información médica importante para tu seguridad"}
              {currentStep === 4 &&
                "Información para brindarte mejor apoyo emocional"}
              {currentStep === 5 &&
                "Descubramos tus fortalezas y áreas de interés"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {renderStep()}

            {/* Navigation */}
            <div className="mt-8 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={goToNextStep}
                >
                  Siguiente
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-gradient-to-r from-primary to-accent"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Completar Registro
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Puedes actualizar esta información en cualquier momento desde tu
          perfil.
        </p>
      </div>
    </div>
  );
}
