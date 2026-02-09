# 🔧 FIX: PIN Hash Validation Issue

## 📋 Problemas Identificados

### 1. ❌ PIN Hash Inconsistencia (CRÍTICO)
**Síntoma:** El PIN de 6 dígitos no se verificaba correctamente en login, mostrando "PIN incorrecto"

**Causa Raíz:**
- **Al guardar PIN** (en `app/api/security/pin/route.ts`): Se usaba `Base64` encoding
- **Al verificar PIN** (en `hooks/use-security.ts`): Se usaba `SHA-256` hashing
- Resultaba en comparaciones que NUNCA coincidían ❌

### 2. ⚠️ Refresh Token Error
**Error:** `Invalid Refresh Token: Refresh Token Not Found`
**Causa:** El middleware intentaba hacer refresh sin token válido en cookies

---

## ✅ Soluciones Implementadas

### 1. PIN Hash - Unificación a SHA-256

#### Cambio en `app/api/security/pin/route.ts`

**ANTES:**
```typescript
// ❌ Usaba Base64 (NO es hash seguro)
const pin_hash = Buffer.from(pin).toString('base64')
```

**DESPUÉS:**
```typescript
// ✅ Ahora usa SHA-256 (coincide con verificación)
const pin_hash = await hashPin(pin)

// Nueva función helper agregada:
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
```

**Ahora el flujo es:**
1. Dashboard/Onboarding → Crea PIN → SHA-256 → Supabase
2. Login → Ingresa PIN → SHA-256 → Compara con DB → ✅ COINCIDE

### 2. Middleware - Error Handling Mejorado

#### Cambio en `lib/supabase/proxy.ts`

**Mejoras:**
- ✅ Detecta errores de refresh token específicamente
- ✅ Redirige a login SI HAY error de token
- ✅ Permite solicitud SI NO HAY sesión pero tampoco error
- ✅ mejor logging para debugging
- ✅ Excluye mejor las rutas que NO necesitan auth (`/_next`, `/public`)

```typescript
// Ahora detecta refresh token errors específicamente
if (errorMsg.includes('Refresh Token') || errorMsg.includes('refresh_token')) {
  console.warn('[Middleware] Refresh token issue, redirecting...')
  // Redirige a login
} else if (errorMsg.includes('timeout')) {
  console.warn('[Middleware] Auth timeout, allowing request...')
  // Continúa sin bloquear
}
```

---

## 🧪 Cómo Probar

### Test 1: Crear PIN Nuevo
```bash
1. npm run dev
2. Ir a http://localhost:3000/onboarding
3. O ir a http://localhost:3000/dashboard/security
4. Crear PIN: 123456
5. Confirmar PIN: 123456
```

**Resultado esperado:** ✅ PIN guardado con SHA-256

### Test 2: Verificar PIN en Login
```bash
1. Logout si estás dentro
2. Ir a http://localhost:3000/auth/login
3. Ingresar credenciales
4. Aparece diálogo de PIN
5. Ingresar PIN: 123456 (el que creaste)
```

**Resultado esperado:** ✅ PIN aceptado, procede al dashboard/biometría

### Test 3: PIN Incorrecto
```bash
1. Mismo flujo anterior
2. Ingresar PIN: 999999 (incorrecto)
```

**Resultado esperado:** ✅ Muestra "PIN incorrecto. Intenta de nuevo."

### Test 4: Refresh Token
```bash
1. npm run dev
2. Abre DevTools → Application → Cookies
3. Elimina : `sb-*-auth-token`
4. Ve a http://localhost:3000/dashboard
```

**Resultado esperado:** ✅ Redirige a login (NO error de refresh token)

---

## 📊 Flujos Actualizados

### Flujo de Creación de PIN
```
                    ANTES ❌              DESPUÉS ✅
Onboarding/Dashboard   
         ├─ PIN Input: "123456"  →  hashPin("123456") 
         │                         SHA-256 Hash
         └─ API POST /api/security/pin
              │
              └─ Base64 ❌         SHA-256 ✅
                 │                  │
                 └─ Supabase DB   DB contiene SHA-256
                    (NO coincide)
```

### Flujo de Verificación de PIN
```
Login Page
  ├─ PIN Input: "123456"
  │
  └─ verifyPin()
     ├─ hashPin("123456") → SHA-256 Hash ✅
     │
     ├─ SELECT pin_hash FROM security_pins
     │   WHERE user_id = current_user
     │
     └─ Compare: SHA-256 == SHA-256 ✅ COINCIDE
        ├─ TRUE → Continuar a biometría/dashboard
        └─ FALSE → "PIN incorrecto"
```

---

## 🔍 Verificación en Base de Datos

Para verificar que los PINs ahora están correctos en Supabase:

```sql
-- SQL en Supabase Console
SELECT id, pin_hash, is_active, created_at 
FROM security_pins 
LIMIT 5;

-- Resultado esperado:
-- pin_hash debe ser un largo string hexadecimal (SHA-256)
-- NO debe ser corto o parecer Base64
```

**SHA-256 Hash ejemplo:**
- ✅ Correcto: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- ❌ Incorrecto (Base64): `MTIzNDU2`

---

## 📝 Notas de Implementación

1. **Compatibilidad:** Si hay PINs antiguos guardados con Base64, estos NO funcionarán
   - **Solución:** Los usuarios necesitarán crear un nuevo PIN
   - Se puede agregar una migración SQL si es necesario

2. **Seguridad:** SHA-256 es mejor que Base64, pero en producción se recomienda `bcrypt`
   - El código tiene comentarios indicando esto
   - Future improvement: Implementar bcrypt en backend

3. **Performance:** SHA-256 es rápido y soportado en todos los navegadores modernos

---

## ✨ Cambios Resumidos

| Archivo | Cambio |
|---------|--------|
| `app/api/security/pin/route.ts` | Cambió Base64 → SHA-256, agregó función `hashPin` |
| `lib/supabase/proxy.ts` | Mejor error handling para refresh token |
| `hooks/use-security.ts` | SIN CAMBIOS (ya usaba SHA-256) ✅ |

**Total cambios:** 2 archivos, 1 función agregada, mejor seguridad y funcionalidad

---

## 🚀 Próximos Pasos

- [ ] Probar con PINs existentes (si hay)
- [ ] Considerar migración de PINs viejos (Base64 → SHA-256)
- [ ] En producción: Migrar a bcrypt en backend
- [ ] Agregar 2FA con TOTP si se requiere

