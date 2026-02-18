# 🔗 SINCRONIZACIÓN SUPABASE - CRUDS /attendance, /schedules, /materials

**Estado:** ⚠️ REQUIERE SINCRONIZACIÓN MANUAL EN SUPABASE  
**Tiempo:** 5 minutos  
**Complejidad:** Baja

---

## 📋 ¿QUÉ FALTA?

Las rutas `/attendance`, `/schedules`, `/materials` tienen:
- ✅ Endpoints API creados (`app/api/...`)
- ✅ Páginas creadas (`app/dashboard/...`)  
- ✅ Permisos y validaciones implementados
- ❌ **RLS policies no sincronizadas en Supabase** ← AQUÍ ESTÁ EL PROBLEMA

**Resultado:** Los CRUD no funcionan porque Supabase bloquea las operaciones sin RLS policies correctas.

---

## 🚀 SOLUCIÓN EN 3 PASOS

### PASO 1: Acceder a Supabase SQL Editor

```
1. Ir a: https://app.supabase.com
2. Seleccionar tu proyecto
3. SQL Editor (lado izquierdo)
4. Click en "New Query"
```

### PASO 2: Copiar y Ejecutar Script

**Archivo:** `scripts/013_sync_attendance_schedules_materials.sql`

**En Supabase:**
```bash
1. Copiar TODO el contenido de: 
   scripts/013_sync_attendance_schedules_materials.sql

2. Pegar en Supabase SQL Editor

3. Click botón "Run" (parte superior derecha)

4. Esperar confirmación: "Success - 0 rows"
```

**Lo que hace el script:**
- ✅ Crea/sincroniza tabla `attendances`
- ✅ Crea/sincroniza tabla `schedules`  
- ✅ Crea/sincroniza tabla `materials`
- ✅ Agrega índices para performance
- ✅ Configura RLS policies correctas
- ✅ Verifica que todo esté activado

### PASO 3: Validar en Supabase

**En Supabase:**

1. **Verificar Tablas:**
   ```
   Table Editor (lado izquierdo)
   → Buscar: attendances, schedules, materials
   → Debe mostrar "RLS enabled: ON"
   ```

2. **Verificar RLS Policies:**
   ```
   Database → RLS Policies (lado derecho)
   → Filtra por tabla: attendances
   → Debe mostrar 4 políticas:
      - attendances_select_own_or_teacher
      - attendances_insert_teacher_admin
      - attendances_update_teacher_admin
      - attendances_delete_admin
   → Repetir para: schedules, materials
   ```

3. **Test Rápido (SQL):**
   ```sql
   -- Ejecutar en SQL Editor para verificar struktura
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
     AND tablename IN ('attendances', 'schedules', 'materials')
   ORDER BY tablename;
   
   -- Debe retornar 3 filas con rowsecurity = true
   ```

---

## 🧪 VALIDAR EN LA APLICACIÓN

Después de ejecutar el script, probar en Next.js:

### Test 1: Registrar Asistencia (Admin)

```bash
1. npm run dev
2. Loguearse como ADMIN
3. Navegar a: /dashboard/attendance
4. Click "Crear asistencia"
5. Llenar:
   - Estudiante: <seleccionar>
   - Curso: <seleccionar>
   - Fecha: 2026-02-12
   - Estado: Present
6. Click "Guardar"
7. ✅ Debe mostrar: "Asistencia registrada"
```

### Test 2: Listar Horarios (Todos)

```bash
1. Navegar a: /dashboard/schedules
2. Debe mostrar lista de horarios
3. ✅ No debe mostrar error 403 (Forbidden)
```

### Test 3: Subir Material (Teacher)

```bash
1. Loguearse como TEACHER
2. Navegar a: /dashboard/materials
3. Click "Subir material"
4. Llenar:
   - Título: "Clase de Matemáticas"
   - Curso: <su propio curso>
   - URL: https://example.com/file.pdf
5. Click "Guardar"
6. ✅ Debe mostrar: "Material subido exitosamente"
```

---

## ⚙️ ESTRUCTURA SQL SINCRONIZADA

### Tabla: `attendances`
```sql
Campos:
  - id (UUID, primary key)
  - student_id (UUID, FK profiles)
  - course_id (UUID, FK courses)
  - date (DATE)
  - status (TEXT: 'present'|'absent'|'late'|'excused')
  - notes (TEXT)
  - recorded_by (UUID, FK profiles)
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)

Unique Constraint: (student_id, course_id, date)

RLS Policies:
  ✅ SELECT: Student ve sus registros, Teacher ve su curso, Admin ve todo
  ✅ INSERT: Solo Admin y Teacher
  ✅ UPDATE: Solo Admin y Teacher
  ✅ DELETE: Solo Admin
```

### Tabla: `schedules`
```sql
Campos:
  - id (UUID, primary key)
  - course_id (UUID, FK courses)
  - day_of_week (INTEGER: 0-6)
  - start_time (TIME)
  - end_time (TIME)
  - classroom (TEXT)
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)

RLS Policies:
  ✅ SELECT: Todos pueden ver
  ✅ INSERT: Solo Admin y Teacher
  ✅ UPDATE: Teacher de curso o Admin
  ✅ DELETE: Solo Admin
```

### Tabla: `materials`
```sql
Campos:
  - id (UUID, primary key)
  - course_id (UUID, FK courses)
  - title (TEXT)
  - description (TEXT)
  - file_url (TEXT)
  - file_type (TEXT)
  - uploaded_by (UUID, FK profiles)
  - is_visible (BOOLEAN, DEFAULT true)
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)

RLS Policies:
  ✅ SELECT: Estudiantes inscritos, Teacher del curso, Admin
  ✅ INSERT: Solo Admin y Teacher
  ✅ UPDATE: Quien subió o Admin
  ✅ DELETE: Quien subió o Admin
```

---

## 📊 CHECKLIST DE SINCRONIZACIÓN

Después de ejecutar el script:

### EN SUPABASE
- [ ] Ir a Table Editor
- [ ] Verificar `attendances` existe y "RLS enabled: ON"
- [ ] Verificar `schedules` existe y "RLS enabled: ON"
- [ ] Verificar `materials` existe y "RLS enabled: ON"
- [ ] Ir a Database → RLS Policies
- [ ] Filtrar por `attendances`: Debe haber 4 políticas
- [ ] Filtrar por `schedules`: Debe haber 4 políticas
- [ ] Filtrar por `materials`: Debe haber 4 políticas

### EN LA APLICACIÓN
- [ ] Admin puede crear/editar/eliminar asistencias
- [ ] Teacher puede registrar asistencias en sus cursos
- [ ] Teacher puede subir materiales
- [ ] Student NO puede registrar asistencias
- [ ] Todos pueden ver horarios
- [ ] No hay errores 403 (Forbidden) inesperados

---

## 🔴 POSIBLES ERRORES Y SOLUCIONES

### Error 1: "403 Forbidden" en POST /api/attendance
**Causa:** RLS policy de INSERT falla  
**Solución:**
```sql
-- Verificar que user tiene role 'admin' o 'teacher'
SELECT id, email, role FROM public.profiles 
WHERE id = auth.uid();

-- Si no aparece, crear usuario primero
```

### Error 2: "Table does not exist"
**Causa:** Script no ejecutó correctamente  
**Solución:**
```
1. Copiar TODO el script nuevamente
2. Asegurar que esté completo
3. Ejecutar en Supabase SQL Editor
4. Verificar que no haya errores en color rojo
```

### Error 3: "Unique violation (23505)"
**Causa:** Intento de registrar asistencia duplicada  
**Solución:**
```
Normal - Solo puede haber 1 asistencia por estudiante+curso+fecha
Usar PUT /api/attendance/[id] para editar
```

### Error 4: "Permission denied" en DELETE
**Causa:** Solo Admin puede eliminar, Teacher no  
**Solución:**
```
Diseño correcto - Teachers no deben eliminar asistencias
Si necesitas permitirlo, cambiar política RLS
```

---

## 📞 VALIDACIÓN FINAL

**Antes de considerar "LISTO PARA PRODUCCIÓN":**

1. ✅ Script SQL ejecutado sin errores
2. ✅ RLS policies visibles en Supabase
3. ✅ Admin puede CRUD en /attendance
4. ✅ Teacher puede crear/editar en /attendance de su curso
5. ✅ Student NO puede crear (403)
6. ✅ Horarios visibles para todos
7. ✅ Materiales upload funciona para Teacher
8. ✅ No hay errores en Chrome DevTools Console

---

## 🎯 COMANDO RÁPIDO

```bash
# Después de ejecutar el script en Supabase, validar localmente:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR_PROJECT.supabase.co/rest/v1/attendances?limit=1" 

# Si retorna JSON array (incluso vacío), ✅ funciona
# Si retorna 403 Forbidden, revisar RLS policies
```

---

**Status:** ⏳ Espera sincronización manual  
**Próximo Paso:** Ejecutar script SQL en Supabase  
**Tiempo Estimado:** 5 minutos

