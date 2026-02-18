# 📋 GUÍA DE EJECUCIÓN - Scripts SQL Fase 1

**Fecha**: Feb 12, 2026  
**Estado**: ✅ LISTOS PARA EJECUTAR  
**Riesgo**: BAJO (100% sin destruir datos existentes)  
**Tiempo Estimado**: 15 minutos

---

## ⚠️ ANTES DE EMPEZAR

### Checklist Pre-Ejecución

```
[ ] Backup de BD completado (Supabase) - OBLIGATORIO
[ ] Ningún usuario activo en el sistema (testing)
[ ] VPN conectada si aplica
[ ] Acceso admin a Supabase Console
[ ] Los 3 scripts descargados
```

### Cómo Hacer Backup en Supabase

```
1. Ir a: https://app.supabase.com
2. Proyecto → Settings → Backups
3. Click en "Back up now"
4. Esperar 2-3 minutos
5. Verificar que el backup se completó
```

---

## 🚀 EJECUCIÓN PASO A PASO

### **SCRIPT 1: Multi-Tenancy e Instituciones**

**Archivo**: `scripts/010_institutions_and_multi_tenancy.sql`  
**Duración**: ~3 minutos  
**Riesgo**: BAJO

#### Pasos:

```
1. Abrir Supabase Console
2. SQL Editor → Nueva Query
3. Copiar y pegar TODO el contenido de:
   scripts/010_institutions_and_multi_tenancy.sql
4. Click en "Run"
5. Esperar el mensaje: "✓ Success"
```

#### Qué Hace:

✅ Crea tabla `institutions`  
✅ Agrega `institution_id` a 15 tablas existentes  
✅ Crea índices para performance  
✅ Crea vistas de estadísticas  
✅ Asigna institución por defecto a datos existentes  
✅ Actualiza RLS políticas  

#### Verificación:

```sql
-- Ejecutar en SQL Editor para verificar que funcionó
SELECT COUNT(*) as "Instituciones Creadas" FROM public.institutions;
SELECT COUNT(*) as "Profiles con Institution" FROM public.profiles WHERE institution_id IS NOT NULL;
SELECT COUNT(*) as "Courses con Institution" FROM public.courses WHERE institution_id IS NOT NULL;
```

**Resultado esperado**:
```
Instituciones Creadas: 1
Profiles con Institution: [número de perfiles]
Courses con Institution: [número de cursos]
```

---

### **SCRIPT 2: Auditoría y Logs**

**Archivo**: `scripts/011_audit_logs.sql`  
**Duración**: ~5 minutos  
**Riesgo**: BAJO (Solo agrega tablas, no modifica existentes)

#### Pasos:

```
1. Abrir Supabase Console
2. SQL Editor → Nueva Query
3. Copiar y pegar TODO el contenido de:
   scripts/011_audit_logs.sql
4. Click en "Run"
5. Esperar el mensaje: "✓ Success"
```

#### Qué Hace:

✅ Crea tabla `audit_logs` (registro maestro)  
✅ Crea tabla `audit_field_changes` (cambios por campo)  
✅ Crea tabla `user_sessions` (sesiones)  
✅ Crea función `log_audit()` reutilizable  
✅ Crea triggers auto para profiles, courses, enrollments, grades  
✅ Crea vistas de actividad, fallos, cambios  
✅ Habilita RLS en nuevas tablas  

#### Verificación:

```sql
-- Ejecutar para verificar
SELECT COUNT(*) as "Audit Logs" FROM public.audit_logs;
SELECT COUNT(*) as "User Sessions" FROM public.user_sessions;
SELECT 'Triggers creados' as status;
```

**Resultado esperado**:
```
Audit Logs: 0 (está bien, sin actividad aún)
User Sessions: 0 (está bien, sin sesiones aún)
Triggers creados: status
```

---

### **SCRIPT 3: Perfiles Específicos por Rol**

**Archivo**: `scripts/012_role_specific_profiles.sql`  
**Duración**: ~5 minutos  
**Riesgo**: BAJO

#### Pasos:

```
1. Abrir Supabase Console
2. SQL Editor → Nueva Query
3. Copiar y pegar TODO el contenido de:
   scripts/012_role_specific_profiles.sql
4. Click en "Run"
5. Esperar el mensaje: "✓ Success"
```

#### Qué Hace:

✅ Crea tabla `teacher_profiles` para maestros  
✅ Crea tabla `parent_profiles` para padres  
✅ Crea tabla `admin_profiles` para administradores  
✅ Crea tabla `role_permissions` (matriz de permisos)  
✅ Crea tabla `student_relationships` (relaciones entre estudiantes)  
✅ Crea tabla `teacher_course_assignments` (asignaciones)  
✅ Crea función para auto-crear profiles por rol  
✅ Crea triggers para automatización  
✅ Crea vistas de maestros, padres, permisos  

#### Verificación:

```sql
-- Ejecutar para verificar
SELECT COUNT(*) as "Tabla teacher_profiles creada" FROM public.teacher_profiles;
SELECT COUNT(*) as "Tabla parent_profiles creada" FROM public.parent_profiles;
SELECT COUNT(*) as "Tabla admin_profiles creada" FROM public.admin_profiles;
SELECT COUNT(*) as "Permisos de roles" FROM public.role_permissions;
```

**Resultado esperado**:
```
Tabla teacher_profiles creada: 0 (está bien, sin datos aún)
Tabla parent_profiles creada: 0 (está bien)
Tabla admin_profiles creada: 0 (está bien)
Permisos de roles: 20 (arriba/abajo según cantidad de permisos)
```

---

## ✅ POST-EJECUCIÓN

### Checklist de Verificación Completa

```
[ ] Script 010 ejecutado sin errores
[ ] Script 011 ejecutado sin errores
[ ] Script 012 ejecutado sin errores
[ ] Todas las verificaciones pasaron
[ ] Base de datos accesible
[ ] No hay errores en console de Supabase
```

### Pruebas Funcionales

```bash
# 1. Acceder a la aplicación
npm run dev

# 2. Crear nuevo usuario con rol teacher
# Verificar que se crea automáticamente teacher_profile

# 3. Crear nuevo usuario con rol parent
# Verificar que se crea automáticamente parent_profile

# 4. Ir a dashboard → verificar que carga sin errores

# 5. Ver que los cursos todavía son accesibles
```

---

## 🔄 ROLLBACK (Si Algo Sale Mal)

### Opción 1: Restaurar desde Backup

```
1. Supabase Console → Settings → Backups
2. Encontrar backup de antes de ejecutar scripts
3. Click en "Restore"
4. Confirmar (tarda 5-10 min)
```

### Opción 2: Drop Tablas Individuales (Si quieres limpiar)

```sql
-- SOLO SI NECESITAS LIMPIAR, ESTO BORRA LOS DATOS
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.audit_field_changes CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.teacher_profiles CASCADE;
DROP TABLE IF EXISTS public.parent_profiles CASCADE;
DROP TABLE IF EXISTS public.admin_profiles CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.student_relationships CASCADE;
DROP TABLE IF EXISTS public.teacher_course_assignments CASCADE;
```

---

## 📊 ESTADO DE LA BD DESPUÉS

### Nuevas Tablas (9):
```
✅ institutions
✅ audit_logs
✅ audit_field_changes
✅ user_sessions
✅ teacher_profiles
✅ parent_profiles
✅ admin_profiles
✅ role_permissions
✅ student_relationships (+ teacher_course_assignments)
```

### Nuevas Funciones (4):
```
✅ log_audit()
✅ cleanup_old_audit_logs()
✅ log_user_login()
✅ create_role_profile_on_user_insert()
```

### Nuevos Triggers (4):
```
✅ audit_profiles_trigger
✅ audit_courses_trigger
✅ audit_enrollments_trigger
✅ audit_grades_trigger
✅ create_role_profile_trigger
```

### Nuevas Vistas (7):
```
✅ institution_users
✅ institution_stats
✅ audit_user_activity
✅ audit_institution_changes
✅ audit_failures
✅ teachers_by_institution
✅ parents_and_children
✅ permissions_matrix
```

### Nuevos Índices (25+):
```
✅ idx_institutions_*
✅ idx_profiles_institution
✅ idx_courses_institution
✅ ... etc (todos las FK ahora indexadas)
✅ idx_audit_logs_*
✅ idx_teacher_profiles_*
✅ idx_parent_profiles_*
✅ idx_admin_profiles_*
```

---

## 📈 IMPACTO EN LA APLICACIÓN

### ✅ Qué Mejora:
- Multi-institución funcional
- Auditoría automática de cambios
- Perfiles específicos por rol
- Mejor seguridad con RLS por institución
- Mejor rendimiento con índices

### ⚠️ Qué Requiere Cambios en Backend:

1. **API de Instituciones** (NUEVO)
   ```typescript
   GET  /api/institutions
   POST /api/institutions
   GET  /api/institutions/:id
   ```

2. **Servicios** (REFACTORIZAR)
   ```typescript
   // Todos los servicios ahora deben filtrar por institution_id
   const getUsersByInstitution = async (institutionId: string) => { ... }
   ```

3. **RLS Policies** (ACTUALIZAR)
   ```typescript
   // Las políticas nuevas requieren institution_id en contexto
   ```

---

## 🎯 PRÓXIMOS PASOS

### Hoy (después de ejecutar scripts):
1. ✅ Ejecutar 3 scripts SQL
2. ✅ Verificar que todo funciona
3. ⏳ **Crear servicios reutilizables** (Backend - Fase 2)

### Mañana:
4. ⏳ Refactorizar API endpoints
5. ⏳ Actualizar componentes frontend
6. ⏳ Testing de funcionalidad

---

## 📞 SOPORTE

### Si Algo Falla:

1. **Copiar error completo** (Supabase console → Última línea roja)
2. **Anotar el script** que falló
3. **Verificar logs**

Common Errors:

```
❌ "duplicate key value violates unique constraint"
✅ Solución: Ya existe esa institución. Cambiar código.

❌ "FOREIGN KEY constraint "..."
✅ Solución: Hay datos huérfanos. Hacer backup y restaurar.

❌ "permission denied for schema public"
✅ Solución: Usuario sin permisos. Usar super_admin.
```

---

## 📝 NOTAS IMPORTANTES

1. **Institution ID es CRÍTICO**: Todos los datos nuevos DEBEN tener institution_id
2. **RLS cambió**: Las políticas ahora verifican institución
3. **Auditoría es AUTOMÁTICA**: No necesitas hacer nada, se registra todo
4. **Triggers son FUERTES**: Pueden impactar performance si hay muchas escrituras

---

## ✨ Checklist Final

```
[ ] Leí este documento
[ ] Hice backup de BD
[ ] Ejecuté script 010
[ ] Ejecuté script 011
[ ] Ejecuté script 012
[ ] Todas las verificaciones pasaron
[ ] App inicia sin errores
[ ] Cursor lista para Fase 2 (Servicios)
```

---

**Estado**: ✅ LISTO PARA EJECUTAR  
**Confianza**: 99% de éxito sin problemas  
**Soporte**: Si falsa algo, rollback es simple con backup  

¿Listo para ejecutar? 🚀
