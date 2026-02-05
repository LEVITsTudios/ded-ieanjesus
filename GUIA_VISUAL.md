# 👨‍💻 GUÍA VISUAL PASO A PASO

## PARTE 1: FIX DEL ERROR DE GOOGLE

### Paso 1.1: Ir a Google Cloud Console
```
https://console.cloud.google.com/
```
![Logo de Google Cloud]

### Paso 1.2: Crear Credenciales OAuth
```
APIs & Services → Credentials → + Create Credentials
→ OAuth 2.0 Client ID → Web application
```

### Paso 1.3: Configurar URIs
**Agregar en "Authorized JavaScript origins":**
```
https://liamgsolvdjxjusmtyov.supabase.co
```

**Agregar en "Authorized redirect URIs":**
```
https://liamgsolvdjxjusmtyov.supabase.co/auth/v1/callback?provider=google
```

### Paso 1.4: Copiar Credenciales
```
Client ID: [xxxxxxxx-xxxx.apps.googleusercontent.com]
Client Secret: [XXXXXXXXXXXXXX]
```

### Paso 1.5: Ir a Supabase
```
https://app.supabase.com
→ Tu Proyecto
→ Authentication
→ Providers
→ Google
```

### Paso 1.6: Habilitar Google
```
☑️ Activar Google Provider
📝 Client ID: [Pega aquí]
📝 Client Secret: [Pega aquí]
💾 Save
```

### Paso 1.7: ¡Listo!
```
❌ Error 400 resuelto
✅ Google Login funciona
```

---

## PARTE 2: CONFIGURAR BASE DE DATOS

### Paso 2.1: Ir a Supabase SQL Editor
```
https://app.supabase.com
→ Tu Proyecto
→ SQL Editor
→ New Query
```

### Paso 2.2: Copiar Script
Abre el archivo:
```
/scripts/004_security_pin_and_recovery.sql
```
Y copia TODO el contenido

### Paso 2.3: Pegar en SQL Editor
```
[Pegar el script]
```

### Paso 2.4: Ejecutar
```
Click en "Run" (botón verde)
```

### Paso 2.5: Verificar
```
✅ 6 nuevas tablas creadas
✅ Índices creados
✅ RLS habilitado
✅ 10 preguntas de seguridad insertadas
```

---

## PARTE 3: USAR PIN DE SEGURIDAD

### Para el Usuario Final:

#### 3.1: Ir a Configuración de Seguridad
```
Después de iniciar sesión
→ Dashboard
→ Buscar "Configuración de Seguridad"
O ir directamente a: /dashboard/security
```

#### 3.2: Ir a Tab "PIN"
```
┌─────────────────────────────────┐
│ PIN | Preguntas | Biometría    │
├─────────────────────────────────┤
│                                 │
│  🔒 PIN de Seguridad           │
│  Agrega un PIN de 6 dígitos    │
│                                 │
│  ⚠️ PIN no configurado         │
│                                 │
│  [Configurar PIN]              │
│                                 │
└─────────────────────────────────┘
```

#### 3.3: Click "Configurar PIN"
```
Se abre un diálogo:
┌─────────────────────────────┐
│ 🔒 Configurar PIN          │
├─────────────────────────────┤
│ Crea tu PIN                │
│ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ │
│ │_│ │_│ │_│ │_│ │_│ │_│ │
│                           │
│ (Ingresa 6 dígitos)      │
└─────────────────────────────┘
```

#### 3.4: Ingresa PIN (6 dígitos)
```
Ejemplo: 1 2 3 4 5 6
(Se ve como puntos por seguridad)
```

#### 3.5: Se Pide Confirmación
```
Confirma tu PIN
┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐
│_│ │_│ │_│ │_│ │_│ │_│
(Ingresa el mismo PIN)
```

#### 3.6: ✅ Listo!
```
┌──────────────────────────────┐
│ ✓ PIN configurado            │
│ Tu cuenta está protegida      │
│ [Cambiar PIN]                │
└──────────────────────────────┘
```

---

## PARTE 4: USAR PREGUNTAS DE SEGURIDAD

### 4.1: Ir a Tab "Preguntas"
```
┌─────────────────────────────┐
│ PIN | Preguntas | Biometría │
├─────────────────────────────┤
│                             │
│  ❓ Preguntas de Seguridad │
│  Para recuperar tu cuenta   │
│                             │
│  [Configurar Preguntas]     │
│                             │
└─────────────────────────────┘
```

### 4.2: Click "Configurar Preguntas"
```
Se abre diálogo con 3 preguntas al azar:

Pregunta 1:
┌─────────────────────────────────────┐
│ ¿Cuál es el nombre de tu mascota?   │
│ Respuesta: [________________]        │
└─────────────────────────────────────┘

Pregunta 2:
┌─────────────────────────────────────┐
│ ¿En qué ciudad naciste?             │
│ Respuesta: [________________]        │
└─────────────────────────────────────┘

Pregunta 3:
┌─────────────────────────────────────┐
│ ¿Nombre de tu mejor amigo?          │
│ Respuesta: [________________]        │
└─────────────────────────────────────┘

[Guardar Preguntas]
```

### 4.3: Responde todas
```
⚠️ Importante:
- Las respuestas son sensibles al contexto
- Se normalizan automáticamente
- No importa mayúsculas/minúsculas
- Responde de forma clara

Ejemplo:
Pregunta: ¿Cuál es el nombre de tu mascota?
Respuesta: Luna ✓ (Correcto)
          luna ✓ (También correcto)
          LUNA ✓ (También correcto)
```

### 4.4: ✅ Guardadas!
```
Se muestran las preguntas guardadas
[Actualizar Preguntas]
```

### 4.5: Usar en Recuperación
```
Si olvidas contraseña:

1. Click "¿Olvidaste tu contraseña?"
2. Ingresa tu email
3. Se piden 2 de tus 3 preguntas
4. Responde correctamente
5. Resetea tu contraseña
```

---

## PARTE 5: USAR AUTENTICACIÓN BIOMÉTRICA

### 5.1: Ir a Tab "Biometría"
```
┌─────────────────────────────┐
│ PIN | Preguntas | Biometría │
├─────────────────────────────┤
│                             │
│  👆 Autenticación Biométrica│
│  Huella dactilar / Rostro   │
│                             │
│  [Registrar Dispositivo]    │
│                             │
└─────────────────────────────┘
```

### 5.2: Click "Registrar Dispositivo"
```
Se abre diálogo:

┌─────────────────────────────┐
│ 👆 Registrar Dispositivo   │
├─────────────────────────────┤
│ Nombre del dispositivo:    │
│ [Ej: Mi iPhone____________]│
│                            │
│ [Registrar Dispositivo]    │
└─────────────────────────────┘
```

### 5.3: Ingresa Nombre
```
Ejemplos válidos:
✅ Mi iPhone
✅ Mi Laptop
✅ Mi Galaxy S21
✅ Trabajo - Windows
✅ Casa - Mac
```

### 5.4: Click "Registrar"
```
Se mostrará:
┌─────────────────────────────────┐
│ 👆 Esperando...                │
│                                 │
│ Coloca tu dedo o mira la cámara│
│                                 │
│ (Detector biométrico activo)   │
│                                 │
│ ⏳ Procesando...                │
└─────────────────────────────────┘
```

### 5.5: Usa Biometría
```
Opción 1 - Huella Dactilar:
→ Coloca tu dedo en el sensor
→ Mantén 1-2 segundos
→ ✓ Detectado

Opción 2 - Reconocimiento Facial:
→ Mira la cámara
→ Mantén la cara visible
→ ✓ Detectado
```

### 5.6: ✅ Registrado!
```
Dispositivo guardado:

📱 Mi iPhone
Registrado: 05-02-2026
Usado: 05-02-2026 14:23

[Mi iPhone] [Eliminar]
```

### 5.7: Usar en Login
```
Siguiente login:

1. Email + Contraseña ✓
2. PIN (si está habilitado) ✓
3. Se abre diálogo biométrico:

   ┌──────────────────────────┐
   │ 👆 Autenticación        │
   │ Coloca tu dedo          │
   │ (o mira la cámara)      │
   │                         │
   │ ⏳ Esperando...         │
   │                         │
   │ [Cancelar]              │
   └──────────────────────────┘

4. Coloca dedo/cara
5. ✓ Acceso otorgado
```

---

## PARTE 6: FLUJO COMPLETO DE LOGIN

```
┌──────────────────────────────────┐
│ PÁGINA DE LOGIN                  │
├──────────────────────────────────┤
│                                  │
│  [Google]      ← ¡AHORA FUNCIONA!│
│                                  │
│  ─────────────────────────────   │
│                                  │
│  Email:    [usuario@email.com]   │
│  Password: [••••••••]     👁️    │
│                                  │
│  [Iniciar Sesión]                │
│                                  │
│  ¿Olvidaste contraseña?          │
│  ¿No tienes cuenta? Regístrate   │
│                                  │
└──────────────────────────────────┘
             ↓
        (Si credenciales OK)
             ↓
┌──────────────────────────────────┐
│ VERIFICAR PIN (si está habilitado)│
├──────────────────────────────────┤
│                                  │
│  🔒 Verificación de Seguridad    │
│  Ingresa tu PIN de 6 dígitos     │
│                                  │
│  ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐       │
│  │_│ │_│ │_│ │_│ │_│ │_│       │
│                                  │
└──────────────────────────────────┘
             ↓
        (Si PIN OK)
             ↓
┌──────────────────────────────────┐
│ AUTENTICACIÓN BIOMÉTRICA         │
│ (si hay dispositivos registrados) │
├──────────────────────────────────┤
│                                  │
│  👆 Autenticación Biométrica    │
│                                  │
│  Coloca tu dedo o mira cámara    │
│                                  │
│  [Usar Biometría] [Cancelar]    │
│                                  │
└──────────────────────────────────┘
             ↓
    (Si biometría OK o es opcional)
             ↓
┌──────────────────────────────────┐
│ ✅ ACCESO OTORGADO               │
├──────────────────────────────────┤
│                                  │
│ Redirigiendo al Dashboard...    │
│ ⏳ ████████████ 100%            │
│                                  │
└──────────────────────────────────┘
             ↓
        DASHBOARD
```

---

## PARTE 7: RECUPERACIÓN DE CONTRASEÑA

```
┌────────────────────────────────────┐
│ LOGIN                              │
│                                    │
│ [¿Olvidaste tu contraseña?]   ←── Click aquí
└────────────────────────────────────┘
             ↓
┌────────────────────────────────────┐
│ RECUPERAR CONTRASEÑA               │
├────────────────────────────────────┤
│                                    │
│ Email: [usuario@email.com]         │
│                                    │
│ [Enviar Enlace de Recuperación]   │
│                                    │
│ [Volver al inicio de sesión]      │
│                                    │
└────────────────────────────────────┘
             ↓
    (Email recibido con enlace)
             ↓
┌────────────────────────────────────┐
│ VERIFICAR PREGUNTAS DE SEGURIDAD   │
├────────────────────────────────────┤
│                                    │
│ Responde 2 de 3 preguntas:        │
│                                    │
│ ❓ ¿Cuál es tu mascota?           │
│ Respuesta: [Luna]                 │
│                                    │
│ ❓ ¿Tu ciudad?                    │
│ Respuesta: [Madrid]               │
│                                    │
│ [Verificar]                       │
│                                    │
└────────────────────────────────────┘
             ↓
    (Si respuestas correctas)
             ↓
┌────────────────────────────────────┐
│ RESETEAR CONTRASEÑA                │
├────────────────────────────────────┤
│                                    │
│ Nueva Contraseña: [••••••••]       │
│ Confirmar: [••••••••]              │
│                                    │
│ [Resetear Contraseña]              │
│                                    │
│ ⚠️ Tu PIN será reseteado          │
│                                    │
└────────────────────────────────────┘
             ↓
        ✅ ÉXITO
        
        Puedes iniciar sesión
        con tu nueva contraseña
```

---

## 🎯 CHECKLIST RÁPIDO PARA USUARIOS

### Configuración Inicial (5 minutos):
- [ ] Ir a `/dashboard/security`
- [ ] Configurar PIN (memoriza o anota en lugar seguro)
- [ ] Responder preguntas de seguridad
- [ ] Registrar dispositivo biométrico (opcional)

### Uso Diario:
- [ ] Usar email + contraseña para login
- [ ] Ingresar PIN si se pide
- [ ] Usar huella/cara para acceso rápido

### Mantenimiento:
- [ ] Revisar dispositivos registrados mensualmente
- [ ] Cambiar contraseña cada 3 meses
- [ ] Actualizar preguntas de seguridad si es necesario

---

**¡Listo! Ahora tu sistema es seguro y fácil de usar** 🎉
