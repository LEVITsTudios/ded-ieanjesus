# 🔐 FLUJO COMPLETO DE AUTENTICACIÓN CON PIN

## 📊 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE LOGIN CON PIN                        │
└─────────────────────────────────────────────────────────────────┘

PASO 1: FORMULARIO DE LOGIN
┌────────────────────────────────────────────┐
│ /app/auth/login/page.tsx                   │
│  - Email + Password                        │
│  - Botón: "Iniciar Sesión"                │
└────────────────────────────────────────────┘
                    │
                    ▼
PASO 2: AUTENTICACIÓN EN SUPABASE
┌────────────────────────────────────────────┐
│ supabase.auth.signInWithPassword()          │
│  - Valida credenciales                    │
│  - Supabase guarda sesión en cookies      │
└────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   ✅ ÉXITO              ❌ ERROR
   User encontrado       Mostrar error
        │
        ▼
PASO 3: VERIFICAR SI TIENE PIN HABILITADO
┐────────────────────────────────────────────┐
│ SELECT FROM security_pins WHERE user_id = ?│
└────────────────────────────────────────────┘
        │
    ┌───┴────────────────┐
    │                    │
    ▼ PIN ACTIVO         ▼ SIN PIN
┌─────────────────┐  Continuar login
│ Mostrar Diálogo │  Redirect /dashboard
│ de PIN          │
└─────────────────┘
    │
    ▼
PASO 4: INGRESO DE PIN (6 DÍGITOS)
┌────────────────────────────────────────────┐
│ /components/security/pin-input.tsx         │
│ - 6 campos numéricos                       │
│ - Auto-avance entre campos                │
│ - Cuando completa, envía al hook          │
└────────────────────────────────────────────┘
    │
    ▼
PASO 5: VERIFICACIÓN DE PIN (HOOK)
┌────────────────────────────────────────────┐
│ /hooks/use-security.ts → verifyPin()       │
│  1. Hash PIN con SHA-256 (cliente)        │
│  2. POST /api/security/pin/verify         │
│  3. Body: { pin, userId }                 │
│  4. Headers: credentials: 'include' ✨    │
└────────────────────────────────────────────┘
    │
    ▼ (Con cookies incluidas)
PASO 6: VERIFICACIÓN EN SERVIDOR
┌────────────────────────────────────────────┐
│ /app/api/security/pin/verify/route.ts      │
│  1. Leer cookies de request                │
│  2. getUser() - validar sesión            │
│  3. Verificar user_id coincide             │
│  4. Hash PIN recibido                     │
│  5. Comparar con DB                       │
└────────────────────────────────────────────┘
    │
    ├─ ❌ No autenticado → 401
    ├─ ❌ PIN incorrecto → 400
    ├─ ❌ Usuario mismatch → 403
    │
    ▼ ✅ PIN CORRECTO
PASO 7: ESTABLECER COOKIE DE VALIDACIÓN
┌────────────────────────────────────────────┐
│ Set-Cookie: pin_validated=true             │
│ maxAge: 3600 (1 hora)                     │
│ httpOnly: true                            │
│ path: /                                    │
└────────────────────────────────────────────┘
    │
    ▼
PASO 8: CLIENTE RECIBE RESPUESTA
┌────────────────────────────────────────────┐
│ response.ok && response.json()             │
│ → { success: true }                       │
│ Cookie se guarda automáticamente           │
└────────────────────────────────────────────┘
    │
    ▼
PASO 9: MIDDLEWARE VERIFICA COOKIE
┌────────────────────────────────────────────┐
│ middleware.ts                              │
│  - Intercepta request a /dashboard        │
│  - Verifica pi_validated cookie           │
│  - Si existe → Permitir acceso            │
│  - Si NO existe → Redirigir a login       │
└────────────────────────────────────────────┘
    │
    ▼
PASO 10: ACCESO AL DASHBOARD
┌────────────────────────────────────────────┐
│ /app/dashboard/page.tsx                    │
│ ✅ Usuario completamente autenticado      │
│ ✅ PIN validado                           │
│ ✅ Sesión activa por 1 hora               │
└────────────────────────────────────────────┘
```

---

## 🔄 RECARGA DE PÁGINA (Session Persistence)

```
Usuario en /dashboard → Recarga (Ctrl+R)
    │
    ▼
Middleware.ts intercepta
    │
    ▼
Verifica cookie pin_validated
    │
    ├─ Aún existe (< 1 hora) → ✅ Permitir acceso
    │
    └─ Expiró → Redirigir a login
```

---

## 🚪 LOGOUT

```
Usuario hace click en Logout
    │
    ▼
POST /api/auth/logout
    │
    ├─ supabase.auth.signOut()
    ├─ Limpiar cookie de sesión
    ├─ Limpiar cookie pin_validated
    │
    ▼
Redirect a /auth/login
    │
    ▼
Siguiente login requiere PIN nuevamente
```

---

## 🔐 FLUJO DE COOKIES

### Cliente (Browser)
```
1. Login en /auth/login
   Supabase guarda cookies automáticamente
   → localStorage también actualiza

2. Diálogo de PIN
   POST /api/security/pin/verify
   credentials: 'include' → Envía cookies

3. Servidor establece pin_validated cookie
   → Browser recibe y almacena

4. Middleware verifica
   → Lee la cookie automáticamente

5. Recargas futuras
   → Cookies persisten (1 hora)
```

### Servidor (Next.js API)
```
const supabase = createServerClient(url, key, {
  cookies: {
    getAll() {
      return request.cookies.getAll() // Lee cookies del request
    },
    setAll() {
      // Supabase no necesita setear en servidor
    }
  }
})

const { user } = await supabase.auth.getUser()
// getUser() usa cookies para validar sesión
```

---

## 🔑 Archivos Clave

### Client-Side Components
- `app/auth/login/page.tsx` - Formulario de login
- `components/security/pin-input.tsx` - Diálogo de PIN
- `hooks/use-security.ts` - Hook con `verifyPin()`

### Server-Side
- `app/api/security/pin/verify/route.ts` - Validación de PIN
- `app/api/security/pin/route.ts` - Guardar PIN (hash SHA-256)
- `app/api/auth/logout/route.ts` - Logout con limpieza

### Middleware & Utilities
- `middleware.ts` - Fuerza PIN para /dashboard
- `lib/pin-validation.ts` - Gestión de cookies

---

## ⚙️ Configuración Crítica

### 1. **Hash SHA-256**
```typescript
const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
```

### 2. **Credentials Include**
```typescript
const response = await fetch('/api/security/pin/verify', {
  method: 'POST',
  credentials: 'include', // ✨ CRUCIAL
  body: JSON.stringify({ pin, userId })
})
```

### 3. **httpOnly Cookie**
```typescript
const pinCookie = createPinValidatedCookie()
response.cookies.set(
  pinCookie.name,     // 'pin_validated'
  pinCookie.value,    // 'true'
  pinCookie.options   // { httpOnly, maxAge: 3600 }
)
```

### 4. **Middleware Check**
```typescript
const { isPinValidated, requiresPinValidation } = 
  await verifyPinValidationStatus(request)

if (requiresPinValidation && !isPinValidated) {
  // Redirigir a login
}
```

---

## 🚨 Puntos de Fallo Comunes

| Síntoma | Causa | Solución |
|---------|-------|----------|
| 401 Unauthorized | Cookies no se envían | Verificar `credentials: 'include'` |
| PIN incorrecto | Hash mismatch | Limpiar DB, crear PIN nuevo |
| Sesión pierdo al recarga | Cookie expiró | Verificar maxAge, no limpieza prematura |
| Acceso sin PIN a /dashboard | Middleware falla | Verificar cookie de validación |
| No aparece diálogo PIN | PIN no existe en DB | Crear PIN en settings |

---

## 📋 Validación del Flow

```javascript
// En DevTools Console después de login:

// 1. Verificar sesión activa
await supabase.auth.getSession()
// → Debe retornar sesión válida

// 2. Verificar cookies
document.cookie
// → Debe incluir sb-***-auth-token

// 3. Verificar PIN se guarda
// Después de validar PIN, verificar Network tab
// Response debe incluir Set-Cookie: pin_validated

// 4. Recarga de página
// Middleware debe verificar cookie
// Página debe cargarse sin pedir PIN nuevamente (< 1 hora)
```

---

## 🎯 Resumen

```
Login Exitoso
    ↓
¿Tiene PIN? → Mostrar Diálogo
    ↓
PIN Correcto → Establecer Cookie
    ↓
Middleware Valida Cookie
    ↓
Acceso a /dashboard
    ↓
Sesión Activa (1 hora) ✅
```
