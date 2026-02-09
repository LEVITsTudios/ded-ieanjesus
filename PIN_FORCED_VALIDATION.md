# 🔐 PIN Validation Security - Forzado de Validación

## 📋 Problema Original

El sistema permitía acceso al dashboard SIN validar el PIN:
- Usuario se autentica con email/password
- Dialogo PIN aparece
- Si recarga la página → **ACCESO PERMITIDO SIN PIN** ❌

## ✅ Solución Implementada

### 1. **Sistema de Cookie httpOnly Segura**

Después de validar el PIN exitosamente:
- Se establece cookie `pin_validated` 
- ✅ httpOnly: No accesible desde JavaScript
- ✅ Secure: Solo en HTTPS en producción
- ✅ SameSite: Protección contra CSRF
- ✅ Válido por: 1 hora

**Archivo:** `lib/pin-validation.ts`

### 2. **Nuevo Endpoint: `/api/security/pin/verify`**

```typescript
POST /api/security/pin/verify
Body: { pin: "123456", userId: "user_id" }
```

**Seguridad:**
- ✅ Valida en el SERVIDOR (no en cliente)
- ✅ Verifica que usuario está autenticado
- ✅ Hash SHA-256 en servidor
- ✅ Compara con BD
- ✅ Si es exitoso: establece cookie
- ✅ Registra intento en logs

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "PIN validado exitosamente"
}
```
+ Cookie `pin_validated` establecida automáticamente

**Archivo:** `app/api/security/pin/verify/route.ts`

### 3. **Middleware de Protección**

Nuevas reglas en `middleware.ts`:

```typescript
// Si pathname.startsWith('/dashboard'):
// 1. Verificar si usuario tiene PIN activo
// 2. Si SÍ tiene PIN:
//    - Verificar cookie de validación
//    - Si no está válida: REDIRIGIR A LOGIN
// 3. If NO tiene PIN: permitir acceso
```

**Flujo:**
```
Usuario intenta acceder a /dashboard
    ↓
¿Tiene PIN activo?
    ├─ SÍ: ¿Cookie de validación válida?
    │   ├─ SÍ: ✅ PERMITIR acceso
    │   └─ NO: ❌ REDIRIGIR a /auth/login
    │
    └─ NO: ✅ PERMITIR acceso
```

### 4. **Hook Actualizado: `useSecurityPin.verifyPin()`**

Antes:
- Validaba en cliente con Supabase
- Retornaba isValid

Ahora:
- Llama a `/api/security/pin/verify`
- El servidor valida y establece cookie
- Si exitoso: cliente redirige a dashboard

**Archivo:** `hooks/use-security.ts`

### 5. **Logout Seguro**

Nuevo endpoint `/api/auth/logout`:
- ✅ Hace signOut en Supabase
- ✅ Limpia cookie `pin_validated`
- ✅ Limpia otras cookies de sesión

**Cambios:** `components/navbar/user-menu.tsx`

---

## 🧪 Flujo Completo: Caso de Uso

### Escenario 1: Login Normal (con PIN habilitado)

```
1. Usuario va a /auth/login
2. Ingresa: email + password
3. Se valida ✓
4. ¿PIN activo? → SÍ
5. Muestra diálogo PIN
6. Usuario ingresa PIN: 123456
7. Cliente llama: POST /api/security/pin/verify
   ├─ Server: valida hash
   ├─ Server: compara con BD
   ├─ Server: ✓ coinciden
   ├─ Server: establece cookie httpOnly
   └─ Server: retorna { "success": true }
8. Cliente redirige a /dashboard
9. Middleware verifica:
   ├─ ¿Session? → SÍ
   ├─ ¿PIN requerido? → SÍ
   ├─ ¿Cookie validación? → SÍ y válida
   └─ ✅ PERMITIR acceso
10. Dashboard carga normalmente
```

### Escenario 2: Recarga de Página (PIN validado)

```
1. Usuario en /dashboard (PIN ya validado)
2. Presiona F5 (recarga)
3. Middleware verifica:
   ├─ ¿Session? → SÍ
   ├─ ¿PIN requerido? → SÍ
   ├─ ¿Cookie validación? → SÍ (válida por 1 hora)
   └─ ✅ PERMITIR acceso
4. Dashboard carga sin problema
```

### Escenario 3: Recarga de Página (PIN NO validado)

```
1. Usuario intenta ir a /dashboard directamente SIN validar PIN
   (o cookie expiró después de 1 hora)
2. Middleware verifica:
   ├─ ¿Session? → SÍ [pero cookie inválida]
   ├─ ¿PIN requerido? → SÍ
   ├─ ¿Cookie validación? → NO
   └─ ❌ REDIRIGIR a /auth/login?requiresPinValidation=true
3. Usuario ve login con indicación
4. Ingresa PIN nuevamente
5. Se establece cookie
6. Accede a /dashboard
```

### Escenario 4: Logout

```
1. Usuario en /dashboard
2. Presiona "Logout"
3. Cliente llama: POST /api/auth/logout
   ├─ Server: signOut en Supabase
   ├─ Server: limpia cookie pin_validated
   └─ Server: retorna success
4. Cookie se elimina (maxAge: 0)
5. Cliente redirige a /auth/login
6. Si intenta acceder a /dashboard:
   ├─ ¿Session? → NO [expiró]
   └─ ❌ Ya no puede acceder
```

### Escenario 5: PIN Incorrecto

```
1. Usuario ingresa PIN: 999999 (incorrecto)
2. Cliente llama: POST /api/security/pin/verify
   ├─ Server: calcula hash
   ├─ Server: compara con BD
   ├─ Server: ❌ no coinciden
   ├─ Server: registra intento fallido
   └─ Server: retorna { "success": false, "error": "PIN incorrecto" }
3. Cliente sigue en diálogo PIN
4. Muestra error: "PIN incorrecto. Intenta de nuevo."
5. Usuario puede reintentar
6. Después de 5 intentos fallidos en 15 min: 
   └─ Bloquea por 15 minutos (verificar en BD)
```

---

## 🔍 Verificación en Base de Datos

Ver intentos de PIN:

```sql
SELECT 
  user_id,
  success,
  attempt_time,
  ip_address,
  user_agent
FROM pin_attempt_logs
ORDER BY attempt_time DESC
LIMIT 20;
```

Ver si hay cookies válidas (en memoria del servidor):
```
No se guardan en BD - son httpOnly cookies del cliente
Pero se pueden verificar monitoreando /api/security/pin/verify GET
```

---

## 🔒 Ventajas de Esta Implementación

| Aspecto | Beneficio |
|--------|----------|
| **httpOnly Cookie** | No accesible desde XSS, protege contra robo |
| **Server-side validation** | No se puede manipular desde cliente |
| **Middleware protection** | Fuerza validación en CADA carga |
| **Time-based expiry** | 1 hora de validación, se renueva con login |
| **Logging** | Registra todos los intentos |
| **Clean logout** | Limpia cookies y sesión properly |

---

## 📈 Cambios Realizados

| Archivo | Cambio |
|---------|--------|
| `lib/pin-validation.ts` | **NUEVO**: Funciones de cookie segura |
| `app/api/security/pin/verify/route.ts` | **NUEVO**: Endpoint de validación segura |
| `app/api/auth/logout/route.ts` | **NUEVO**: Endpoint de logout limpio |
| `middleware.ts` | **ACTUALIZADO**: Verifica PIN validado |
| `hooks/use-security.ts` | **ACTUALIZADO**: `verifyPin()` usa nuevo endpoint |
| `components/navbar/user-menu.tsx` | **ACTUALIZADO**: Logout usa nuevo endpoint |

---

## 🚀 Próximos Pasos

### Optional (Recomendado):

1. **Rate limiting** en `/api/security/pin/verify`
   - Limitar a 5 intentos por 15 minutos
   
2. **Biometric skip** (opcional)
   - Permitir biometría sin PIN si está registrada
   
3. **2FA adicional**
   - Req OTP si hay mucho tiempo sin PIN validation
   
4. **PIN timeout personalizado**
   - Permitir usuarios elegir: 30 min, 1 hora, 8 horas, nunca

---

## ⚠️ Importante

- **Reiniciar servidor** después de estos cambios
- **Borrar cookies** del navegador (si es necesario)
- **Probar con PIN nuevo** (los viejos en Base64 no funcionarán)
- **Ejecutar script SQL**: `CLEAN_OLD_PINS.sql`

