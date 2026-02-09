# 🔐 GUÍA DE VERIFICACIÓN Y TESTING DEL PIN

## ⚠️ Estado Actual

Se han realizado los siguientes cambios para forzar validación de PIN:

### ✅ Cambios Realizados

1. **Hash SHA-256** en `app/api/security/pin/route.ts`
   - PINs ahora se hashean con SHA-256 (no Base64)
   - Función `hashPin()` implementada

2. **Cookies httpOnly** en `app/api/security/pin/verify/route.ts`
   - Set-Cookie con maxAge: 3600 (1 hora)
   - Credenciales incluidas en fetch con `credentials: 'include'`

3. **Middleware** en `middleware.ts`
   - Fuerza validación de PIN para `/dashboard`
   - Redirige a login si PIN no está validado

4. **Logout mejorado** en `app/api/auth/logout/route.ts`
   - Limpia cookies de sesión
   - Limpia cookie de PIN validado

---

## 🧪 PASO 1: Verificar que el Servidor Está Cacha los Cambios

### A. Reinicia el servidor de desarrollo:
```bash
# Presiona Ctrl+C en la terminal del servidor
# Luego ejecuta:
npm run dev
```

**Espera a que veas:**
```
✓ Ready in 2.3s
```

### B. Verifica que no hay errores TypeScript:
```bash
# En otra terminal:
npm run typecheck
```

**Esperado:** Sin errores

---

## 🔍 PASO 2: Verificar que el Diálogo de PIN se Muestra

### A. Navega a http://localhost:3000/auth/login

### B. Usa credenciales de prueba:
```
Email: test@example.com (o el que uses)
Password: TuContraseña123
```

### C. Verifica que después del login:
- ✅ Aparece el diálogo de verificación de PIN
- ✅ Pide 6 dígitos
- ✅ Auto-avanza entre campos

---

## 🔐 PASO 3: Crear/Actualizar PIN en la Base de Datos

### A. Opción 1: Crear nuevo PIN en onboarding
1. Navega a `/onboarding`
2. Completa hasta paso 3 (PIN)
3. Ingresa un PIN (ejemplo: `123456`)
4. Confirma el PIN
5. Guarda

**Verifica en consola:**
```
✓ PIN guardado exitosamente: { success: true, ... }
```

### B. Opción 2: Configurar PIN en dashboard
1. Después de login (si no hay PIN)
2. Navega a `/dashboard/security`
3. Hace clic en "Configurar PIN"
4. Ingresa PIN: `123456`
5. Confirma: `123456`
6. Guarda

---

## 🧮 PASO 4: Verificar PIN en la Base de Datos

1. Abre Supabase Dashboard
2. Ve a SQL Editor
3. Corre esta query:

```sql
SELECT id, user_id, pin_hash, is_active, created_at
FROM security_pins
ORDER BY created_at DESC
LIMIT 5;
```

**Esperado:** `pin_hash` es un string hexadecimal largo (NO números)
```
id    | user_id | pin_hash                                               | is_active
------|---------|------------------------------------------------------|----------
123   | abc-def | a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3 | true
```

---

## 🔑 PASO 5: Probar Validación de PIN

### A. Logout
1. Click en usuario → Logout
2. Verifica que se limpian las cookies

### B. Login nuevamente
1. Email + Password
2. **Debería aparecer el diálogo de PIN automáticamente**

### C. Ingresa el PIN incorrecto
1. Ejemplo: `654321`
2. Debe mostrar error: "PIN incorrecto"

### D. Ingresa el PIN correcto
1. Ejemplo: `123456`
2. Debe permitir acceso a `/dashboard`

---

## 🐛 DEBUGGING: Si PIN no funciona

### Síntoma: "PIN incorrecto" aunque ingreso correcto

**Causa Probable:** Hash mismatch (Base64 vs SHA-256)

**Solución:**
1. Abre Supabase Dashboard
2. SQL Editor → Ejecuta:

```sql
-- Limpia PINs viejos (Base64)
DELETE FROM security_pins
WHERE pin_hash NOT LIKE '%[a-f0-9]%' -- Borra los que NO son hexadecimal
   OR length(pin_hash) < 64;

-- Verifica que quedaron solo SHA-256
SELECT pin_hash FROM security_pins LIMIT 1;
```

3. Crea un PIN nuevo en `/dashboard/security`
4. Prueba login

### Síntoma: 401 Unauthorized en PIN verification

**Causa Probable:** Cookies de sesión no se envían

**Debug:**
1. Abre DevTools (F12)
2. Console → Ejecuta:

```javascript
// Ver cookies disponibles:
document.cookie

// Debería mostrar algo como:
// "sb-ECxxxxxxxxx-auth-token=eyJhbg..."
```

3. Si no hay cookies, reinicia el servidor y login nuevamente
4. Verifica en Network tab que el fetch a `/api/security/pin/verify` 
   lleva header: `Cookie: ...`

### Síntoma: Middleware redirige al login aunque PIN esté validado

**Debug:**
1. Agrega logging temporal en `middleware.ts`
2. Verifica que `pin_validated` cookie se está guardando
3. Network tab → Busca respuesta de verificación con `Set-Cookie: pin_validated=...`

---

## 📊 CHECKLIST DE VERIFICACIÓN

- [ ] Servidor reiniciado (npm run dev)
- [ ] No hay errores TypeScript
- [ ] Diálogo de PIN aparece después de login
- [ ] PIN se hashea correctamente en DB (SHA-256)
- [ ] PIN correcto permite acceso
- [ ] PIN incorrecto muestra error
- [ ] Logout limpia cookies
- [ ] Cookies se envían en fetch (DevTools Network)
- [ ] Middleware redirige sin PIN
- [ ] Middleware permite acceso con PIN validado

---

## 🚀 PRÓXIMOS PASOS (Si todo funciona)

1. **Cleanup Base de Datos:**
   - Ejecutar `CLEAN_OLD_PINS.sql` en Supabase
   - Elimina PINs viejos que no sean SHA-256

2. **Testing Completo:**
   - Prueba en diferentes navegadores
   - Prueba logout/login múltiple
   - Prueba recarga de página (debe mantener sesión 1 hora)

3. **Deployment:**
   - Deploy a Vercel/hosting
   - Verificar CORS headers si es necesario
   - Test en producción

---

## 🆘 Problemas Comunes

### "La sesión se pierde al recargar"
- Verifica que httpOnly cookies se están guardando
- Network tab → Respuesta de `/api/security/pin/verify` debe tener `Set-Cookie: pin_validated=...`

### "PIN siempre dice incorrecto"
- Ejecuta query en Supabase para verificar formato del hash
- Crea nuevo PIN (borra el viejo)
- Verifica que `hashPin()` usa SHA-256 en ambos lados (cliente y servidor)

### "Cookies no se envían (401)"
- Verifica `credentials: 'include'` en el fetch
- Verifica que el servidor lee cookies con `request.cookies.getAll()`
- Checa CORS headers si cliente y servidor están en dominios diferentes

---

## 📝 Notas

- PIN se requiere DESPUÉS de login exitoso
- PIN se persiste 1 hora con httpOnly cookie
- Logout limpia ambas cookies (sesión + PIN)
- Middleware fuerza validación para `/dashboard`
- DB campo: `security_pins.pin_hash` debe ser SHA-256 hex (64 caracteres)
