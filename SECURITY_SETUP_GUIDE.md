# 🔐 GUÍA COMPLETA: Seguridad Avanzada del Sistema

## 📋 Resumen de Cambios

Se han implementado **3 capas de seguridad adicionales** en tu sistema:

1. **PIN de Seguridad** - Código de 6 dígitos como segunda capa
2. **Preguntas de Seguridad** - Para recuperación de cuenta
3. **Autenticación Biométrica** - Huella dactilar / Reconocimiento facial

---

## 🔧 PASO 1: Ejecutar Scripts SQL

### Importante: Debes ejecutar este script en tu base de datos Supabase

1. Ve a [Supabase Console](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** → **New Query**
4. Copia y pega el contenido de este archivo:
   ```
   /scripts/004_security_pin_and_recovery.sql
   ```
5. Haz clic en **Run**

Esto creará las siguientes tablas:
- `security_pins` - Almacena los PINs de usuario
- `security_questions` - Preguntas de seguridad disponibles
- `user_security_answers` - Respuestas de los usuarios
- `biometric_devices` - Dispositivos biométricos registrados
- `pin_attempt_logs` - Registro de intentos
- `biometric_attempt_logs` - Historial de biometría

---

## ✅ PASO 2: Habilitar Google OAuth (Soluciona el error 400)

### Problema Actual:
```
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

### Solución:

#### 2.1 En Google Cloud Console:
1. Ve a https://console.cloud.google.com/
2. Crea o selecciona un proyecto
3. Ve a **APIs & Services** → **Credentials**
4. Haz clic en **+ Create Credentials** → **OAuth 2.0 Client ID**
5. Selecciona **Web application**
6. Agrega estas URIs autorizadas:

   **JavaScript Origins:**
   ```
   https://liamgsolvdjxjusmtyov.supabase.co
   ```

   **Redirect URIs:**
   ```
   https://liamgsolvdjxjusmtyov.supabase.co/auth/v1/callback?provider=google
   ```

7. Copia el **Client ID** y **Client Secret**

#### 2.2 En Supabase Console:
1. Ve a tu proyecto en https://app.supabase.com
2. Ve a **Authentication** → **Providers**
3. Busca **Google** y haz clic para expandir
4. Activa el toggle (ON)
5. Pega el **Client ID** y **Client Secret** obtenidos de Google
6. Haz clic en **Save**

#### 2.3 (Opcional) Actualizar variables de entorno:
```env
# .env.local
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu_client_id_aqui
```

---

## 🔑 PASO 3: Configurar PIN de Seguridad

### Para los Usuarios:

1. **Ir a Configuración de Seguridad:**
   - Después de iniciar sesión, ir a `/dashboard/security`
   - O buscar "Configuración de Seguridad" en el menú

2. **Configurar PIN:**
   - Click en "Configurar PIN"
   - Ingresa un PIN de 6 dígitos
   - Confirma el mismo PIN
   - ¡Listo! Tu PIN está activo

3. **Próximos inicios de sesión:**
   - Inicia sesión con email y contraseña
   - Se pedirá tu PIN de 6 dígitos
   - Si no ingresas correctamente en 5 intentos en 15 minutos, se bloquea

### En el Código:

Los componentes están en:
- **Componentes UI:** `/components/security/pin-input.tsx`
- **Página configuración:** `/app/dashboard/security/page.tsx`
- **Hook:** `/hooks/use-security.ts` → `useSecurityPin()`

---

## ❓ PASO 4: Configurar Preguntas de Seguridad

### Preguntas Predefinidas (agregadas automáticamente):

1. ¿Cuál es el nombre de tu mascota?
2. ¿En qué ciudad naciste?
3. ¿Cuál es el nombre de tu mejor amigo/a de la infancia?
4. ¿Cuál es tu película favorita?
5. ¿En qué escuela primaria estudiaste?
6. ¿Cuál es el nombre de tu primer novio/a?
7. ¿Cuál es tu comida favorita?
8. ¿Cuál es el nombre de tu calle donde creciste?
9. ¿Cuál es tu deporte favorito?
10. ¿Cuál es el modelo de tu primer auto?

### Para los Usuarios:

1. **Ir a Configuración de Seguridad:**
   - `/dashboard/security` → Pestaña "Preguntas"

2. **Configurar Preguntas:**
   - Click en "Configurar Preguntas"
   - Se muestran 3 preguntas al azar
   - Puedes cambiar las preguntas si quieres
   - Ingresa tus respuestas con cuidado (mayúsculas/minúsculas no importan)
   - Se requiere acertar al menos 2 de 3 para recuperar cuenta

3. **Usar en Recuperación:**
   - En el formulario de "Olvidé mi contraseña"
   - Se pedirán 2 de tus 3 preguntas
   - Si aciertas, puedes resetear tu contraseña

### En el Código:

- **Componentes UI:** `/components/security/security-questions.tsx`
- **Hook:** `/hooks/use-security.ts` → `useSecurityQuestions()`

---

## 🔗 PASO 5: Configurar Autenticación Biométrica

### Requisitos:
- Navegador moderno (Chrome, Edge, Safari 13+)
- Dispositivo con sensor biométrico (huella, cara, etc)
- Windows 10+, macOS, iOS 13+, Android

### Para los Usuarios:

1. **Verificar Soporte:**
   - El sistema detecta automáticamente si es soportado
   - `/dashboard/security` → Pestaña "Biometría"

2. **Registrar Dispositivo:**
   - Click en "Registrar Dispositivo"
   - Dale un nombre (ej: "Mi iPhone", "Mi Laptop")
   - El sistema pedirá tu huella/cara
   - Coloca tu dedo o mira la cámara
   - ¡Registrado!

3. **Usar en Login:**
   - Inicia sesión con email y contraseña
   - Se pide el PIN (si lo tienes)
   - Se pide biometría
   - ¡Acceso otorgado!

4. **Múltiples Dispositivos:**
   - Puedes registrar muchos dispositivos
   - Cada uno se almacena por separado
   - Puedes ver cuándo fue usado por última vez

### En el Código:

- **Componentes UI:** `/components/security/biometric-auth.tsx`
- **Hook:** `/hooks/use-security.ts` → `useBiometric()`

---

## 📱 Flujo de Login con todas las Capas

```
1. Usuario ingresa email y contraseña
   ↓
2. Si tiene PIN habilitado:
   → Mostrar diálogo para ingresar PIN
   → Verificar PIN
   ↓
3. Si tiene dispositivos biométricos:
   → Mostrar diálogo de autenticación biométrica
   → Verificar huella/cara
   ↓
4. Verificar si es estudiante sin perfil completo
   ↓
5. Redirigir a dashboard o perfil estudiantil
```

---

## 🛡️ Medidas de Seguridad Implementadas

### PIN:
- ✅ Almacenado con SHA-256 (no en plain text)
- ✅ Límite de 5 intentos en 15 minutos
- ✅ Registro de intentos (auditoría)
- ✅ Log de IP y User Agent

### Preguntas de Seguridad:
- ✅ Respuestas normalizadas y hasheadas
- ✅ Se requiere 66% de aciertos
- ✅ Preguntas encriptadas
- ✅ No se muestran respuestas correctas

### Biometría:
- ✅ Usa WebAuthn (estándar FIDO2)
- ✅ La llave privada nunca sale del dispositivo
- ✅ Registro de intentos
- ✅ Múltiples dispositivos soportados

---

## 📂 Archivos Creados

```
/components/security/
  ├── pin-input.tsx          # Componentes para PIN
  ├── security-questions.tsx # Componentes para preguntas
  └── biometric-auth.tsx     # Componentes para biometría

/hooks/
  └── use-security.ts        # Hooks para seguridad

/app/dashboard/security/
  └── page.tsx               # Página de configuración

/scripts/
  └── 004_security_pin_and_recovery.sql  # Script de BD

/app/auth/login/
  └── page.tsx               # Login actualizado
```

---

## 🔍 Testing

### 1. Prueba PIN:
```bash
# Ir a /dashboard/security
# Configurar un PIN (ej: 123456)
# Cerrar sesión
# Intentar login - se pedirá el PIN
# Intentar 5 veces mal - se bloqueará 15 min
```

### 2. Prueba Preguntas:
```bash
# Ir a /dashboard/security
# Configurar preguntas
# Ir a /auth/login
# Click "¿Olvidaste tu contraseña?"
# Ingresar email
# Responder preguntas de seguridad
# Resetear contraseña
```

### 3. Prueba Biometría:
```bash
# Ir a /dashboard/security
# Si es soportado, registrar dispositivo
# Cerrar sesión
# Login - se pedirá biometría
# Colocar dedo/cara
```

---

## 🚀 Próximas Mejoras (Opcionales)

- [ ] Recuperación por SMS/Correo
- [ ] Autenticación de dos factores (2FA) con app authenticator
- [ ] Notificaciones de acceso anómalo
- [ ] Historial detallado de login
- [ ] Cambio de contraseña más seguro
- [ ] Sesiones activas / Cerrar todas las sesiones
- [ ] Alertas de cambios de seguridad

---

## ❓ Preguntas Frecuentes

**P: ¿Qué pasa si olvido mi PIN?**
R: Usa "Olvidé mi contraseña" → Responde preguntas de seguridad → Resetea contraseña y PIN

**P: ¿Qué pasa si pierdo mi dispositivo biométrico?**
R: Sigue usando PIN y contraseña. Elimina el dispositivo en Configuración de Seguridad

**P: ¿Es seguro guardar PIN en la BD?**
R: Sí, se almacenan hasheados con SHA-256, no en plain text

**P: ¿Funciona en móvil?**
R: Sí, WebAuthn funciona en iOS 13+ y Android

---

## 📞 Soporte

Si tienes problemas:

1. Revisa la consola del navegador (F12)
2. Verifica que el script SQL se ejecutó correctamente
3. Comprueba que Google OAuth está habilitado en Supabase
4. Asegúrate de usar HTTPS en producción (requerido para WebAuthn)

---

**Última actualización:** Febrero 2026
**Estado:** ✅ Completamente implementado
