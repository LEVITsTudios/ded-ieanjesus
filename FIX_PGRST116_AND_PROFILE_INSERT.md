# 🔧 Fix: Problema de PGRST116 y Perfiles Inexistentes

## Problema Encontrado

El error `PGRST116 - Cannot coerce the result to a single JSON object` sucedía porque:

1. **`.single()` espera exactamente 1 resultado**
2. Si retorna 0 registros (perfil no existe), falla con PGRST116
3. El UPDATE no creaba el registro automáticamente, solo actualizaba si existía

## ✅ Soluciones Implementadas

### 1. Cambiar `.single()` a `.limit(1)` en todos los SELECT

**Archivos modificados:**
- [app/onboarding/page.tsx](app/onboarding/page.tsx) - línea 305
- [lib/profile-completion.ts](lib/profile-completion.ts) - línea 28

**Cambio:**
```typescript
// ❌ Antes (causa PGRST116 si no hay resultado)
.select('*').single()

// ✅ Después (retorna array vacío si no hay resultado)
.select('*').limit(1)
const data = array?.[0] || null
```

### 2. Agregar INSERT automático si UPDATE falla

**Archivo:** [lib/profile-completion.ts](lib/profile-completion.ts) - función `updateProfileData`

**Lógica:**
1. Intenta UPDATE
2. Si UPDATE no afecta filas (retorna array vacío)
3. Intenta INSERT automáticamente
4. Si INSERT funciona, el registro se crea

```typescript
// Si UPDATE no afecta ninguna fila
if (!updateResult || updateResult.length === 0) {
  console.log('[updateProfileData] ⚠️ UPDATE no afectó filas. Intentando INSERT...');
  
  const { data: insertResult, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  
  // ... manejar insertResult
}
```

---

## 🧪 Cómo Funciona Ahora

### Primer guardado (perfil no existe):
1. Usuario llena formulario y hace click "Guardar"
2. `updateProfileData` intenta UPDATE → retorna `[]` (0 filas)
3. Detecta que no hay filas y intenta INSERT
4. INSERT crea el registro con el ID del usuario
5. SELECT verifica y encuentra el registro
6. ✅ Los datos se guardan correctamente

### Guardados posteriores (perfil existe):
1. UPDATE encuentra el registro → actualiza datos existentes
2. SELECT verifica y encuentra el registro
3. ✅ Los datos se actualizan correctamente

---

## 📊 Cambios Realizados

| Aspecto | Antes | Después |
|--------|-------|---------|
| Método SELECT | `.single()` | `.limit(1)` + `array?.[0]` |
| Error si no existe | PGRST116 | Array vacío (manejo seguro) |
| Creación de perfil | ❌ Manual | ✅ Automática con INSERT |
| Actualización de perfil | ✅ UPDATE | ✅ UPDATE → INSERT fallback |

---

## 🔍 Debugging Mejorado

Ahora recibirás logs exactos como:

```
[updateProfileData] UPDATE result: {rowsAffected: 1, data: [...]}
[updateProfileData] ✓ UPDATE exitoso

// O si no existe:
[updateProfileData] UPDATE result: {rowsAffected: 0, data: []}
[updateProfileData] ⚠️ UPDATE no afectó filas. Intentando INSERT...
[updateProfileData] ✓ INSERT exitoso: [...]
```

---

## ⚠️ Requisitos Previos

Para que esto funcione, la tabla `profiles` debe tener RLS configurado correctamente:

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT (para la creación automática)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Permitir UPDATE (para la actualización)
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Permitir SELECT (para la verificación)
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

Si aún ves errores RLS, ejecuta el script SQL en [SQL_DIAGNOSIS_SCRIPT.sql](SQL_DIAGNOSIS_SCRIPT.sql)

---

## 🚀 Próximos Pasos

1. Prueba el formulario nuevamente
2. Verifica en Supabase Dashboard que veas los registros en `profiles`
3. Si aún hay problemas, revisa los logs en el navegador (F12)
4. Asegúrate de que las políticas RLS estén creadas correctamente
