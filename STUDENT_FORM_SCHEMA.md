# Mapeo de Campos - Ficha Estudiantil a Base de Datos

Esta documentación muestra dónde se almacena cada campo del formulario de ficha estudiantil en la base de datos.

## PASO 1: Datos Personales

| Campo del Formulario | Tabla Destino | Columna SQL | Tipo | Requerido |
|---|---|---|---|---|
| Fecha de Nacimiento | profiles | date_of_birth | DATE | ✓ |
| Género | student_profiles | gender | TEXT | |
| Nacionalidad | student_profiles | nationality | TEXT | |
| Tipo de Documento | student_profiles | document_type | TEXT (cedula, pasaporte, dni, etc.) | ✓ |
| Número de Documento | student_profiles | document_number | TEXT | ✓ (si DNI) |
| Dirección | profiles | address | TEXT | |
| Ciudad | student_profiles | city | TEXT | |
| Estado/Provincia | student_profiles | state | TEXT | |
| Código Postal | student_profiles | postal_code | TEXT | |

## PASO 2: Contacto de Emergencia

| Campo del Formulario | Tabla Destino | Columna SQL | Tipo | Requerido |
|---|---|---|---|---|
| Nombre Completo | student_profiles | emergency_contact_name | TEXT | ✓ |
| Parentesco | student_profiles | emergency_contact_relationship | TEXT | ✓ |
| Teléfono | student_profiles | emergency_contact_phone | TEXT | ✓ |
| Correo Electrónico | student_profiles | emergency_contact_email | TEXT | |
| Contacto Secundario - Nombre | student_profiles | secondary_contact_name | TEXT | |
| Contacto Secundario - Teléfono | student_profiles | secondary_contact_phone | TEXT | |

## PASO 3: Salud Física

| Campo del Formulario | Tabla Destino | Columna SQL | Tipo | Requerido |
|---|---|---|---|---|
| Tipo de Sangre | student_profiles | blood_type | TEXT | |
| Alergias (selección múltiple) | student_surveys | allergies | TEXT[] | |
| Alergias - Otras | student_surveys | allergies_details | TEXT | |
| Condiciones Crónicas (selección múltiple) | student_surveys | chronic_conditions | TEXT[] | |
| Condiciones Crónicas - Otras | student_surveys | chronic_illness_details | TEXT | |
| Medicamentos Actuales | student_surveys | current_medications | TEXT | |
| Discapacidades (selección múltiple) | student_surveys | disabilities | TEXT[] | |
| Requiere Asistencia Especial | student_surveys | requires_special_attention | BOOLEAN | |
| Detalles de Asistencia Especial | student_surveys | special_attention_details | TEXT | |
| Último Chequeo Médico | student_surveys | last_medical_checkup | DATE | |
| Vacunas al Día | student_surveys | vaccines_up_to_date | BOOLEAN | |
| Nivel de Actividad Física | student_surveys | physical_activity_level | TEXT (sedentary, light, moderate, active, very_active) | |

## PASO 4: Salud Mental

| Campo del Formulario | Tabla Destino | Columna SQL | Tipo | Requerido |
|---|---|---|---|---|
| Condiciones de Salud Mental (selección múltiple) | student_surveys | mental_health_conditions | TEXT[] | |
| Condiciones - Otras | student_surveys | mental_health_details | TEXT | |
| Recibe Apoyo Psicológico | student_surveys | receives_psychological_support | BOOLEAN | |
| Contacto del Terapeuta | student_surveys | psychological_support_details | TEXT | |
| Nivel de Estrés | student_surveys | stress_level | TEXT (very_low, low, moderate, high, very_high) | |
| Calidad de Sueño | student_surveys | sleep_quality | TEXT (excellent, good, fair, poor) | |
| Apoyo Emocional | student_surveys | emotional_support | TEXT (always, usually, sometimes, rarely, never) | |

## PASO 5: Habilidades y Talentos

| Campo del Formulario | Tabla Destino | Columna SQL | Tipo | Requerido |
|---|---|---|---|---|
| Fortalezas Académicas (selección múltiple) | student_surveys | academic_strengths | TEXT[] | |
| Estilo de Aprendizaje | student_surveys | primary_learning_style | TEXT (visual, auditory, reading, kinesthetic, mixed) | |
| Talentos Artísticos (selección múltiple) | student_surveys | artistic_talents | TEXT[] | |
| Talentos Deportivos (selección múltiple) | student_surveys | extracurricular_interests | TEXT[] | |
| Idiomas que Hablas (selección múltiple) | student_surveys | languages_spoken | TEXT[] | |
| Habilidades Técnicas (selección múltiple) | student_surveys | technical_skills | TEXT[] | |
| Pasatiempos e Intereses | student_surveys | hobbies | TEXT | |
| Intereses de Carrera | student_surveys | career_interests | TEXT | |
| Logros Especiales | student_surveys | special_talents | TEXT | |
| Actividades Extracurriculares | student_surveys | extracurricular_interests | TEXT[] | |

## Tablas Involucradas

### 1. **profiles** (datos de usuario compartidos)
- `id` (UUID, primary key)
- `date_of_birth` (DATE)
- `address` (TEXT)
- Otros campos generales

### 2. **student_profiles** (información específica del estudiante)
- `id` (UUID primary key)
- `user_id` (FK a profiles)
- Datos personales, documento, contacto de emergencia
- Información médica básica (blood_type)

### 3. **student_surveys** (encuesta de habilidades y evaluación)
- `id` (UUID primary key)
- `student_profile_id` (FK a student_profiles)
- Información de salud detallada
- Habilidades y talentos
- Información mental y emocional

## Flujo de Guardado

```
Formulario HTML
    ↓
Estado React (formData)
    ↓
Validación Client-Side
    ↓
Pruebas de Unicidad (DNI)
    ↓
1. UPDATE profiles (date_of_birth, address)
    ↓
2. UPSERT student_profiles (datos personales, emergencia)
    ↓
3. UPSERT student_surveys (salud, habilidades, talentos)
    ↓
Redirección a /dashboard
```

## Notas Importantes

- **Unicidad**: DNI es único por usuario. Se valida antes de guardar.
- **Arrays**: Campos con selección múltiple se guardan como arrays TEXT[] en Postgres.
- **Null Safety**: Todos los campos opcionales se guardan como NULL si están vacíos.
- **RLS Policies**: Las políticas de Row Level Security permiten que:
  - Los estudiantes vean y editen su propia ficha
  - Los padres/tutores vean la ficha del estudiante
  - Los maestros y admins vean fichas de estudiantes
- **Timestamps**: El campo `survey_completed_at` registra cuándo se completó la ficha por última vez.

## Pasos para Aplicar Cambios

1. **Aplicar migración SQL** (scripts/005_add_missing_student_form_columns.sql):
   ```bash
   psql "postgres://<user>:<pass>@<host>:5432/<db>" -f scripts/005_add_missing_student_form_columns.sql
   ```

2. **Desplegar código** (app/dashboard/profile/student-form/page.tsx ya incluye la lógica de almacenamiento).

3. **Pruebas**: Completar la ficha de estudiante y verificar que todos los campos se guarden en Supabase.
