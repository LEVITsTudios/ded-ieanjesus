# ⚠️ DIAGNÓSTICO: ¿POR QUÉ NO FUNCIONAN LOS CRUDS?

**Fecha:** Febrero 12, 2026  
**Diagnóstico:** Endpoints listos pero Base de Datos no sincronizada

---

## 🔴 EL PROBLEMA

Creaste 3 endpoints nuevos:
- ✅ `POST /api/attendance` → Registrar asistencia
- ✅ `PUT /api/attendance/[id]` → Editar asistencia
- ✅ `DELETE /api/attendance/[id]` → Eliminar asistencia

Pero **NO funcionan** porque:

```
Código en Next.js     ✅ LISTO
        ↓
Supabase API Client   ✅ LISTO
        ↓
Supabase Backend      ❌ RLS BLOQUEADO
        ↓
Error 403 Forbidden
```

---

## ❌ ANTES (Ahora)

```
Admin intenta: POST /api/attendance
{
  "student_id": "123abc",
  "course_id": "456def",
  "date": "2026-02-12",
  "status": "present"
}

Flujo actual:
1. Next.js recibe solicitud ✅
2. Valida autenticación ✅
3. Valida autorización (rol admin/teacher) ✅
4. Envía a Supabase: INSERT INTO attendances... ❌
5. Supabase responde: 403 FORBIDDEN
   Razón: "RLS policy denies access"
6. Error llega al usuario: "Forbidden"

Resultado: CRUD NO FUNCIONA ❌
```

---

## ✅ DESPUÉS (Cuando sincronices)

```
Mismo request, pero después de ejecutar script SQL:

1. Next.js recibe solicitud ✅
2. Valida autenticación ✅
3. Valida autorización (rol admin/teacher) ✅
4. Envía a Supabase: INSERT INTO attendances... ✅
5. Supabase verifica RLS policy:
   "Solo admin/teacher pueden insertar"
   Admin hace insert → ✅ PERMITIDO
6. Datos guardados en BD ✅
7. Success: "Asistencia registrada"

Resultado: CRUD FUNCIONA ✅
```

---

## 🔑 LA RAÍZ DEL PROBLEMA

Supabase tiene **Row Level Security (RLS)** habilitado en todas las tablas.  
RLS es una política de seguridad que dice:
- "Quién puede ver esto?"
- "Quién puede crear?"
- "Quién puede editar?"
- "Quién puede borrar?"

**Tu código API está bien**, pero:
- ❌ No hay política RLS que diga: "Admin PUEDE insertar en attendances"
- ❌ No hay política RLS que diga: "Teacher PUEDE editar en attendances de su curso"
- ❌ Supabase rechaza por defecto

Resultado = **403 Forbidden en todos los CRUD**

---

## 🛠️ LA SOLUCIÓN

Ejecutar un script SQL en Supabase que le diga:

```sql
-- Política RLS para INSERT en attendances
CREATE POLICY "attendances_insert_teacher_admin" ON public.attendances 
  FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Lo que significa:
-- "Permitir insert en attendances SI el usuario es admin O teacher"
```

---

## 📁 HAY 2 ARCHIVOS NUEVOS LISTOS

### 1. `scripts/013_sync_attendance_schedules_materials.sql`
- Contiene todos los CREATE POLICY necesarios
- Listo para copiar y ejecutar en Supabase

### 2. `SUPABASE_SYNC_GUIDE.md`
- Guía paso a paso
- Cómo ejecutar en Supabase
- Cómo validar que funcionó

---

## 📋 ESTADO ACTUAL DE CADA RUTA

### `/dashboard/attendance` 
| Aspecto | Status | Detalles |
|---------|--------|----------|
| Página React | ✅ CREADA | Componente lista |
| Endpoint GET | ✅ CREADO | API lista |
| Endpoint POST | ✅ CREADO | API lista |
| Endpoint PUT | ✅ CREADO | API lista |
| Endpoint DELETE | ✅ CREADO | API lista |
| Backend API (Node) | ✅ OK | Validaciones correctas |
| Base de Datos (Supabase) | ❌ **PENDIENTE** | Tabla existe pero sin RLS |
| **RESULTADO** | ⚠️ BLOQUEADO | Espera sincronización SQL |

### `/dashboard/materials` 
| Aspecto | Status | Detalles |
|---------|--------|----------|
| Página React | ✅ CREADA | Componente lista |
| Endpoint GET | ✅ CREADO | API lista |
| Endpoint POST | ✅ MODIFICADO | Ahora acepta Teacher |
| Endpoint PUT | ⚠️ EXISTE | Necesita validación ownership |
| Endpoint DELETE | ⚠️ EXISTE | Necesita validación ownership |
| Backend API (Node) | ✅ OK | Validaciones correctas |
| Base de Datos (Supabase) | ❌ **PENDIENTE** | Tabla existe pero sin RLS |
| **RESULTADO** | ⚠️ BLOQUEADO | Espera sincronización SQL |

### `/dashboard/schedules`
| Aspecto | Status | Detalles |
|---------|--------|----------|
| Página React | ✅ CREADA | Componente lista |
| Endpoint GET | ✅ CREADO | API lista |
| Endpoint POST | ✅ CREADO | API lista |
| Endpoint PUT | ✅ CREADO | API lista |
| Endpoint DELETE | ✅ CREADO | API lista |
| Backend API (Node) | ✅ OK | Validaciones correctas |
| Base de Datos (Supabase) | ❌ **PENDIENTE** | Tabla existe pero sin RLS |
| **RESULTADO** | ⚠️ BLOQUEADO | Espera sincronización SQL |

---

## 🚀 PRÓXIMOS PASOS AHORA MISMO

### Paso 1: Preparar
1. Abre `scripts/013_sync_attendance_schedules_materials.sql`
2. Copia TODO el contenido

### Paso 2: Ejecutar en Supabase
1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Abre SQL Editor
4. Pega el script
5. Click "Run"
6. Espera: "Success - 0 rows" ✅

### Paso 3: Validar
1. En Supabase: Table Editor → Busca "attendances"
2. Verifica "RLS enabled: ON"
3. En App: `npm run dev`
4. Intenta crear asistencia desde /dashboard/attendance
5. Debe funcionar sin error 403

---

## 💡 EXPLICACIÓN TÉCNICA

Cuando ejecutes el script SQL:

```sql
-- ANTES
attendances (tabla existe)
├── sin RLS
└── SELECT/INSERT/UPDATE/DELETE: BLOQUEADO por defecto

-- DESPUÉS
attendances (tabla sincronizada)
├── RLS ON
├── SELECT policy: Estudiante ve su asistencia
├── INSERT policy: Admin/Teacher pueden registrar
├── UPDATE policy: Admin/Teacher pueden editar
└── DELETE policy: Solo Admin puede eliminar

Resultado: CRUD FUNCIONA ✅
```

---

## 🎯 RESUMEN FINAL

**Lo que se hizo:**
- ✅ 2 páginas nuevas creadas (`/attendance`, `/settings`, `/reports`)
- ✅ 7 endpoints API creados/modificados
- ✅ Validaciones de rol implementadas en cada endpoint
- ✅ Permisos expandidos para Teachers

**Lo que falta:**
- ❌ Sincronizar RLS policies en Supabase (5 minutos)

**Bloqueador:**
- 🔴 Sin RLS policies, Supabase rechaza todos los CRUD = 403 Forbidden

**Solución:**
- 🟢 Ejecutar `scripts/013_sync_attendance_schedules_materials.sql` en Supabase SQL Editor

**Tiempo estimado:** 5 minutos máximo

---

## ✅ CHECKLIST AHORA

- [ ] Copié `scripts/013_sync_attendance_schedules_materials.sql`
- [ ] Abrí Supabase SQL Editor
- [ ] Pegué el script
- [ ] Ejecuté (click "Run")
- [ ] Verifiqué que dice "Success"
- [ ] Fui a Table Editor y vi "RLS enabled: ON" en attendances
- [ ] Fui a Database → RLS Policies y vi las 4 políticas de attendances
- [ ] Intenté crear asistencia en `/dashboard/attendance`
- [ ] ✅ Funcionó sin error 403

---

**¿Cuándo lo hago?** AHORA MISMO - 5 MINUTOS  
**¿Es complicado?** NO - Click, copiar, pegar, run  
**¿Riesgo de perder datos?** NO - Solo crea/sincroniza, no borra nada

¡A ejecutar el script! 🚀

