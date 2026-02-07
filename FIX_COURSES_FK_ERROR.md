# Resolución de Error FK: `courses_teacher_id_fkey`

## Problema
Al intentar crear un curso, se obtiene:
```
insert or update on table "courses" violates foreign key constraint "courses_teacher_id_fkey"
```

Esto ocurre porque la tabla `courses.teacher_id` referencia `profiles.id`, pero el usuario autenticado no tiene un registro correspondiente en la tabla `profiles`.

## Causa Raíz
El trigger `on_auth_user_created` en la BD debería crear automáticamente un perfil cuando se registra un usuario, pero:
- Puede no haberse ejecutado correctamente
- El usuario ya existía en `auth.users` antes de aplicar el trigger
- Hay un desfase entre usuarios de autenticación y perfiles registrados

## Cambios Realizados

### 1. **Migración SQL (scripts/007_sync_auth_users_to_profiles.sql)**
Sincroniza todos los usuarios de `auth.users` sin perfil en `profiles`:
```sql
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data ->> 'full_name', u.email, 'Usuario'),
  COALESCE(u.raw_user_meta_data ->> 'role', 'student')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

**Ejecuta esta migración una sola vez en tu instancia de Supabase.**

### 2. **Actualización del Formulario (`app/dashboard/courses/new/page.tsx`)**
Cambios:
- ✅ Usa `.upsert()` en lugar de `.insert()` para el perfil del usuario actual (más seguro)
- ✅ Valida que el profesor seleccionado existe en `profiles` antes de insertar el curso
- ✅ Los **admins** pueden seleccionar qué profesor asignar el curso (selector desplegable)
- ✅ Mejor análisis de errores y mensajes legibles
- ✅ Trimming y validación de campos obligatorios

### 3. **Flujo de Creación de Curso (Mejorado)**
```
1. Usuario inicia sesión
2. Cargar perfil del usuario actual
3. Si no existe, crearlo con rol "teacher" (usuarios que crean cursos)
4. Si es admin, mostrar lista de profesores disponibles
5. Validar que el profesor seleccionado existe en `profiles`
6. Crear curso con teacher_id validado
```

## Pasos Dedespliegue (Orden Importante)

### Paso 1: Ejecutar la Migración SQL en Supabase
1. Accede a [Supabase Console](https://app.supabase.com)
2. Ve a **SQL Editor**
3. Crea una nueva consulta y pega el contenido de:
   ```
   scripts/007_sync_auth_users_to_profiles.sql
   ```
4. Ejecuta la consulta
   - Debería sincronizar todos los usuarios sin perfil
   - Si hay conflictos (duplicados), ignora (cláusula `ON CONFLICT DO NOTHING`)

```sql
-- Comando completo para ejecutar en Supabase SQL Editor:
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data ->> 'full_name', u.email, 'Usuario'),
  COALESCE(u.raw_user_meta_data ->> 'role', 'student')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

### Paso 2: Desplegar Código (Next.js)
```bash
# Opción A: Vercel / Netlify (CI/CD automático)
#   - Realiza push a la rama y el deploy se dispara automáticamente

# Opción B: Deploy Local / Self-hosted
git add .
git commit -m "fix: FK constraint courses_teacher_id_fkey - sync profiles & improve course form"
pnpm run build  # Verifica build localmente
# Luego deployer según tu setup (docker, systemctl, etc.)
```

### Paso 3: Validación Post-Despliegue

#### 3.1 Verificar que los usuarios tengan profiles
Ejecuta en **Supabase SQL Editor**:
```sql
-- Debe devolver 0 (sin usuarios huérfanos)
SELECT COUNT(*)
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
```

#### 3.2 Probar crear un curso en la app
1. Inicia sesión como teacher o admin
2. Ve a `/dashboard/courses/new`
3. Completa el formulario y crea un curso
4. Verifica que se crea sin errores de FK
5. Si eres admin, verifica el selector de profesor

## Configuración RLS Recomendada (Opcional)

Si aún tienes problemas de permisos, verifica que las políticas RLS permiten:
- **Insert público en `profiles`**: NO (solo auth).
- **Select público de `profiles`**: SÍ (necesario para listar profesores).
- **Upsert en `profiles` propios**: Sí (cada usuario actualiza su propio perfil).

Política de referencia:
```sql
-- Permitir a los usuarios ver perfiles (lectura)
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);

-- Permitir insertar el propio perfil (Auth trigger)
CREATE POLICY "profiles_insert_selfdeclaredas" ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Permitir actualizar el propio perfil
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE 
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
```

## Troubleshooting

### Error: `Row level security violating ... profiles`
**Causa**: Las políticas RLS en `profiles` están rechazando el insert/upsert.
**Solución**: Verifica que el usuario tiene permisos o que la política lo permite. Considera llamar a la API desde un servidor (usando `SECURITY DEFINER`) en lugar del cliente.

### Error: `Duplicate value of unique key: profiles.id`
**Causa**: El perfil ya existe.
**Solución**: El código usa `.upsert(... { onConflict: "id" })`, debería ignorar. Si persiste, verifica que no hay duplicados manualmente.

### Error: `teacher_id references non-existent profile`
**Causa**: La migración 007 no se ejecutó o no funcionó.
**Solución**: Ejecuta manualmente la query sql en Supabase SQL Editor y verifica que completa sin errores.

## Archivos Modificados
- ✅ `app/dashboard/courses/new/page.tsx` — formulario mejorado
- ✅ `scripts/007_sync_auth_users_to_profiles.sql` — migración de sincronización

## Compilación
```bash
pnpm run build
# ✓ Compiled successfully
```

---

**Nota Final**: Esta solución ensures que todos los usuarios autenticados tienen un perfil correspondiente siendo que `courses.teacher_id` siempre podrá resolveu una fila válida en `profiles`.
