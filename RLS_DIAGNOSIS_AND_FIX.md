# 🔴 Diagnóstico: Problema de RLS en Supabase

## Síntoma
```
[savePersonalData] ✓ Resultado de guardado: {success: true, error: null}
GET https://...backup supabase.co/rest/v1/profiles?select=*&id=eq.69479c20-c94b-45c9-bdbb-8bee060cff19 406 (Not Acceptable)
```

**Los datos NO se guardan en Supabase aunque reportan "éxito"**

---

## Root Cause: Row Level Security (RLS)

El error 406 indica que **las políticas de RLS están bloqueando las consultas SELECT** a la tabla `profiles`.

Posibles causas:
1. ❌ RLS está ENABLED pero NO hay políticas definidas
2. ❌ Las políticas son demasiado restrictivas (ej: solo admin)
3. ❌ Las políticas no incluyen al usuario autenticado
4. ❌ El UPDATE también falla silenciosamente por RLS

---

## 🔧 Cómo Revisar y Arreglar en Supabase Dashboard

### Paso 1: Ve a tu Dashboard de Supabase
1. Un https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **SQL Editor** o **Database** → **Tables**

### Paso 2: Revisa la tabla `profiles`

**En SQL Editor, ejecuta:**
```sql
-- Ver si RLS está ENABLED
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';

-- Debería retornar: rowsecurity = t (true) o f (false)
```

### Paso 3: Revisa las Políticas RLS Actuales
```sql
-- Ver todas las políticas en profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

**Si devuelve vacío:** ❌ No hay políticas definidas (por eso falla el SELECT)

---

## ✅ Solución Rápida: Crear Políticas RLS Correctas

**Ejecuta esto en SQL Editor:**

```sql
-- 1. HABILITAR RLS (si no está ya habilitado)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICA UNO: Los usuarios pueden VER (SELECT) sus propios datos
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 3. POLÍTICA DOS: Los usuarios pueden ACTUALIZAR (UPDATE) sus propios datos
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. POLÍTICA TRES: Los usuarios pueden INSERTAR (INSERT) su propio perfil (para initial signup)
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5. POLÍTICA CUATRO: ADMIN puede ver/editar todo (OPCIONAL)
CREATE POLICY "Admin can do everything"
  ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 🧪 Verificar que funcionó

**Después de crear las políticas, ejecuta en el navegador:**

Abre la consola del navegador (F12) y prueba el registro nuevamente.

**Deberías ver:**
```
[updateProfileData] Intentando guardar datos: {full_name: '...', dni: '...', ...}
[updateProfileData] ✓ UPDATE exitoso: [array with 1 object]
[savePersonalData] Verificación post-guardado: {datos: {full_name: '...', dni: '...', ...}, error: null}
```

---

## ⚠️ Notas Importantes

### Si la política de UPDATE falla
Asegúrate de que:
- El `id` en la tabla `profiles` coincida con `auth.uid()` del usuario autenticado
- El usuario debe estar autenticado (no anónimo)

### Si necesitas permitir a múltiples usuarios (ej: para admins)
```sql
CREATE POLICY "Users can view and edit their profile"
  ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### Si tienes problemas con UUID
Asegúrate que el tipo de `id` sea UUID:
```sql
ALTER TABLE profiles ALTER COLUMN id SET DATA TYPE uuid;
```

---

## 📋 Checklist de Debugging

- [ ] Verificar que RLS está ENABLED: `rowsecurity = t`
- [ ] Verificar que existen las 4 políticas básicas
- [ ] Confirmar que `auth.uid()` retorna el ID correcto del usuario
- [ ] Probar que SELECT funciona sin error 406
- [ ] Probar que UPDATE funciona y actualiza la BD
- [ ] Verificar en Supabase Dashboard que veas los registros en la tabla `profiles`

---

## 🆘 Si Aún No Funciona

1. **Deshabilita RLS temporalmente** (NO RECOMENDADO PARA PRODUCCIÓN):
   ```sql
   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
   ```
   Prueba si funciona. Si funciona, el problema es RLS.

2. **Revisa los logs de Supabase:**
   - Dashboard → `Profile` (esquina inferior izquierda) → `Logs`
   - Busca errores 406 ahí

3. **Verifica que el user_id es correcto:**
   ```sql
   SELECT auth.uid(); -- Debe retornar el UUID del usuario actual
   ```

---

## 📝 Referencias

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
