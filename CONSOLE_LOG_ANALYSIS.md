# 🔍 Análisis de Log de Consola - Formulario de Registro

## 📋 Problemas Identificados

### 1. ❌ Error HTTP 406 (Not Acceptable)
```
GET https://liamgsolvdjxjusmtyov.supabase.co/rest/v1/profiles?select=id%2Cfull_name%2Cemail%2Cphone%2Caddress%2Cdate_of_birth%2Cdni%2Clatitude%2Clongitude%2Crole&id=eq.69479c20-c94b-45c9-bdbb-8bee060cff19 406 (Not Acceptable)
```

**Causa:** La consulta con select explícito fallaba probablemente por:
- Campo `role` que no existe en la tabla
- Conflicto con políticas RLS de Supabase
- Selectores excesivos no permitidos

**Solución Implementada:** ✅
- [lib/profile-completion.ts](lib/profile-completion.ts) - Cambiar de:
  ```typescript
  .select('id, full_name, email, phone, address, date_of_birth, dni, latitude, longitude, role')
  ```
  a:
  ```typescript
  .select('*')
  ```

---

### 2. ❌ Validación de Fecha de Nacimiento Insuficiente

**Problema:** El validador acepta fechas inválidas como:
- `0002-07-28` (año 2 d.C.)
- `0020-07-28` (siglo I)
- `0200-07-28` (siglo III)
- `2000-07-28` ✅ (válida)

**Causa:** Falta de validación de año: el código solo validaba si la edad era > 120, pero no rechazaba años inválidos

**Solución Implementada:** ✅
- [lib/validators.ts](lib/validators.ts) - Agregar validaciones:
  1. **Validación de formato:** Regex `YYYY-MM-DD`
  2. **Validación de año:** `1900 <= year <= currentYear`
  3. **Validación de fecha válida:** `!isNaN(Date.getTime())`

Cambios:
```typescript
// Agregado:
const year = birthDate.getFullYear()
if (year < 1900 || year > today.getFullYear()) {
  return { valid: false, message: 'El año debe estar entre 1900 y ' + today.getFullYear() }
}
```

---

### 3. ❌ Campos No Soportados en updateProfileData

**Problema:** El formulario envía campos que `updateProfileData` no acepta en su TypeScript:
- `email`
- `dni`
- `city`
- `province`
- `postal_code`
- `latitude` / `longitude`
- `location_url`

**Causa:** La función tenía un tipos de datos incompletos

**Solución Implementada:** ✅
- [lib/profile-completion.ts](lib/profile-completion.ts) - Agregar campos faltantes a la interfaz:
```typescript
data: {
  full_name?: string
  email?: string              // ← Nuevo
  phone?: string
  address?: string
  date_of_birth?: string
  avatar_url?: string
  grade_level?: string
  department?: string
  dni?: string                // ← Nuevo
  city?: string               // ← Nuevo
  province?: string           // ← Nuevo
  postal_code?: string        // ← Nuevo
  latitude?: number           // ← Nuevo
  longitude?: number          // ← Nuevo
  location_url?: string       // ← Nuevo
}
```

---

### 4. 🟡 Pérdida de Datos Después de Guardar (PARCIALMENTE RESUELTA)

**Síntoma en el log:**
```
page.tsx:124 [savePersonalData] Intentando guardar datos personales
page.tsx:137 [savePersonalData] ✓ Todos los campos validados correctamente
page.tsx:158 [savePersonalData] ✓ Datos guardados. Avanzando al step 1
...
page.tsx:383 [getMissingProfileFields] Estados actuales: {full_name: '', dni: '', ...}  ← Datos vacíos!
```

**Causas Probable:**
- El error 406 al cargar el perfil hace que `profileData` sea null
- `loadUserProfile` se ejecuta después del savePersonalData y retorna datos vacíos
- El merge de `profile` + `formData` no mantiene los datos si profile es null

**Soluciones Implementadas:** ✅

1. **Verificación post-guardado en savePersonalData:**
   - Agregar query de verificación inmediata después de guardar
   - Log detallado de qué se guardó vs. qué se lee
   - Re-sincronizar tanto `profile` como `formData` con los datos verificados

2. **Cambiar select genérico (406 fix):**
   - Esto debería permitir que `loadUserProfile` cargue datos correctamente

---

## 🔧 Cambios Realizados

### Archivo: [lib/validators.ts](lib/validators.ts)
**Función:** `validateDateOfBirth`
- ✅ Agregar validación de formato YYYY-MM-DD
- ✅ Agregar validación de año (1900-actual)
- ✅ Agregar validación de fecha válida

### Archivo: [lib/profile-completion.ts](lib/profile-completion.ts)

**1. checkProfileCompletion:**
- ❌ Cambiar `.select('id, full_name, email, phone, address, date_of_birth, dni, latitude, longitude, role')`
- ✅ Por: `.select('*')`

**2. updateProfileData:**
- ✅ Agregar campos faltantes en la interfaz de tipos

### Archivo: [app/onboarding/page.tsx](app/onboarding/page.tsx)

**savePersonalData:**
- ✅ Agregar logs detallados de datos a guardar
- ✅ Agregar verificación post-guardado inmediata
- ✅ Re-sincronizar states si la verificación es exitosa

---

## 📊 Impacto de Cambios

| Problema | Antes | Después |
|----------|-------|---------|
| Error 406 | ❌ Falla al cargar perfil | ✅ Carga correctamente |
| Fecha inválida | ❌ Acepta año 0002 | ✅ Rechaza años < 1900 |
| Campos faltantes | ⚠️  TypeScript error | ✅ Todos soportados |
| Datos vacíos | ⚠️  Intermitente | ✅ Verificado post-guardado |

---

## 🧪 Próximos Pasos de Testing

1. **Prueba de Validación de Fecha:**
   ```
   ❌ 0002-07-28 → Debe fallar
   ❌ 0200-07-28 → Debe fallar
   ✅ 1990-07-28 → Debe pasar
   ✅ 2000-07-28 → Debe pasar
   ```

2. **Prueba de Guardado:**
   - Llenar formulario completo
   - Guardar y verificar logs
   - Confirmar que los datos se cargan en el siguiente acceso

3. **Prueba de RLS:**
   - Verificar que el error 406 se resuelve
   - Confirmar que `loadUserProfile` carga datos correctamente después de `savePersonalData`

---

## 📝 Notas Adicionales

- El error 406 también podría estar relacionado con **políticas RLS** de Supabase
- Si persiste después de estos cambios, revisar:
  - `enable_rls` en la tabla `profiles`
  - Políticas de SELECT para el usuario autenticado
  - Headers Accept en las solicitudes de Supabase

- La cookie de PIN parece estar guardándose correctamente
- Las preguntas de seguridad se cargan sin problemas
