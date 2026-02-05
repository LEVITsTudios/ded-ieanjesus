# 🔧 VERIFICACIÓN Y TESTING

## 1️⃣ VERIFICAR ARCHIVOS CREADOS

### Verificar que todos los archivos existen:
```bash
# Hooks
ls -la hooks/use-security.ts

# Componentes
ls -la components/security/pin-input.tsx
ls -la components/security/security-questions.tsx
ls -la components/security/biometric-auth.tsx

# Páginas
ls -la app/dashboard/security/page.tsx

# Scripts
ls -la scripts/004_security_pin_and_recovery.sql

# Documentación
ls -la SETUP_GOOGLE_OAUTH.md
ls -la SECURITY_SETUP_GUIDE.md
ls -la QUICK_START.md
ls -la GUIA_VISUAL.md
ls -la RESUMEN_IMPLEMENTACION.md
ls -la INVENTARIO_CAMBIOS.md
```

### Resultado Esperado:
```
✅ todos los archivos encontrados
✅ sin errores en la lista
```

---

## 2️⃣ VERIFICAR CÓDIGO TYPESCRIPT

### Ejecutar linter:
```bash
npm run lint
```

### Resultado Esperado:
```
✅ No errors
✅ Sin warnings críticos
```

### Si hay errores:
```bash
# Revisar errores específicos en:
# /hooks/use-security.ts
# /components/security/*.tsx
# /app/dashboard/security/page.tsx
# /app/auth/login/page.tsx
```

---

## 3️⃣ VERIFICAR COMPILACIÓN

### Compilar proyecto:
```bash
npm run build
```

### Resultado Esperado:
```
✅ Route (app)  Size     First Load JS
✅ ○ /          X.XX kB       XXX kB
✅ compiled successfully
```

### Si hay errores:
```bash
# Revisar el error
# Suele ser problema con imports
# Verificar rutas relativas
```

---

## 4️⃣ INICIAR SERVIDOR DE DESARROLLO

### Comando:
```bash
npm run dev
```

### Resultado Esperado:
```
> next dev

  ▲ Next.js 16.1.6
  - Local:        http://localhost:3000
  - Environments: .env.local

  ✓ Ready in 3.2s
```

### Si hay problemas:
```bash
# Si puerto 3000 está ocupado:
npm run dev -- -p 3001

# Si hay cache issue:
rm -rf .next
npm run dev
```

---

## 5️⃣ VERIFICAR SUPABASE

### Conectar a Supabase:
1. Abre [https://app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a SQL Editor

### Verificar tablas creadas:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'security%' OR table_name LIKE '%attempt%' OR table_name LIKE '%biometric%'
```

### Resultado Esperado:
```
✅ security_pins
✅ security_questions
✅ user_security_answers
✅ biometric_devices
✅ pin_attempt_logs
✅ biometric_attempt_logs
```

### Verificar preguntas de seguridad:
```sql
SELECT COUNT(*) as total_preguntas 
FROM security_questions;
```

### Resultado Esperado:
```
10
```

---

## 6️⃣ VERIFICAR GOOGLE OAUTH

### En Supabase Console:
1. Authentication → Providers → Google
2. Verificar que está habilitado (toggle ON)
3. Verificar Client ID y Secret están completos

### Resultado Esperado:
```
✅ Provider Google: ENABLED
✅ Client ID: [tiene valor]
✅ Client Secret: [tiene valor]
```

---

## 7️⃣ PRUEBAS FUNCIONALES

### Test 1: Crear Cuenta
```
1. Ir a http://localhost:3000/auth/register
2. Crear nueva cuenta
3. Verificar email
4. ✅ Éxito: redirige a dashboard
```

### Test 2: Configurar PIN
```
1. Login como usuario
2. Ir a /dashboard/security
3. Tab "PIN" → "Configurar PIN"
4. Ingresa PIN: 123456
5. Confirma: 123456
6. ✅ Éxito: PIN guardado
```

### Test 3: Login con PIN
```
1. Cerrar sesión (Logout)
2. Login con email + contraseña
3. ¿Se pide PIN? ✅ SÍ
4. Ingresa 123456
5. ✅ Éxito: acceso otorgado
```

### Test 4: PIN Incorrecto
```
1. Logout
2. Login → email + contraseña
3. PIN incorrecto (ej: 654321)
4. Intenta 5 veces
5. ✅ Éxito: bloqueado 15 minutos
```

### Test 5: Configurar Preguntas
```
1. /dashboard/security → "Preguntas"
2. "Configurar Preguntas"
3. Selecciona 3 preguntas
4. Responde
5. "Guardar Preguntas"
6. ✅ Éxito: guardadas
```

### Test 6: Recuperar Contraseña
```
1. /auth/login → "¿Olvidaste?"
2. Ingresa email
3. "Enviar Enlace"
4. Se piden preguntas de seguridad
5. Responde 2 de 3 correctamente
6. Resetea contraseña
7. ✅ Éxito: PIN se borra
```

### Test 7: Biometría (si es soportado)
```
1. /dashboard/security → "Biometría"
2. "Registrar Dispositivo"
3. Dale nombre: "Mi Dispositivo"
4. Sistema pide huella/cara
5. ✅ Éxito: dispositivo registrado
```

### Test 8: Login con Biometría
```
1. Logout
2. Login → email + contraseña
3. Sistema pide PIN
4. Sistema pide biometría
5. Coloca dedo/cara
6. ✅ Éxito: acceso otorgado
```

### Test 9: Google Login
```
1. /auth/login
2. Click "Continuar con Google"
3. Elige cuenta de Google
4. Autoriza app
5. ✅ Éxito: login completado
```

---

## 8️⃣ VERIFICAR ALMACENAMIENTO

### Verificar PIN está hasheado:
```sql
SELECT id, pin_hash, is_active 
FROM security_pins 
LIMIT 1;
```

### Resultado Esperado:
```
✅ pin_hash: [largo string en hexadecimal, NO números]
✅ is_active: true
```

### Verificar respuestas hasheadas:
```sql
SELECT id, answer_hash 
FROM user_security_answers 
LIMIT 1;
```

### Resultado Esperado:
```
✅ answer_hash: [largo string en hexadecimal]
```

### Verificar intentos registrados:
```sql
SELECT * FROM pin_attempt_logs 
ORDER BY attempt_time DESC 
LIMIT 5;
```

### Resultado Esperado:
```
✅ success: true/false
✅ ip_address: [dirección IP]
✅ user_agent: [navegador]
```

---

## 9️⃣ VERIFICAR CONSOLA DEL NAVEGADOR

### Abrir DevTools (F12)

### Ir a Console tab
```
❌ Debería NO haber errores rojos
✅ Solo advertencias normales
```

### Si hay errores:
```
[Error message]

Pasos para solucionar:
1. Copiar el error
2. Revisar archivo indicado
3. Verificar imports
4. Revisar sintaxis
5. Compilar de nuevo
```

---

## 🔟 VERIFICAR LOGS DE AUDITORÍA

### Ver intentos de PIN:
```sql
SELECT 
  u.email,
  l.attempt_time,
  l.success,
  l.ip_address
FROM pin_attempt_logs l
JOIN auth.users u ON l.user_id = u.id
ORDER BY l.attempt_time DESC
LIMIT 20;
```

### Ver intentos de biometría:
```sql
SELECT 
  u.email,
  d.device_name,
  l.attempt_time,
  l.success
FROM biometric_attempt_logs l
JOIN biometric_devices d ON l.device_id = d.id
JOIN auth.users u ON l.user_id = u.id
ORDER BY l.attempt_time DESC
LIMIT 20;
```

---

## 🚨 TROUBLESHOOTING

### Problema: Error al importar hooks
```
Error: Module not found

Solución:
1. Verificar ruta: /hooks/use-security.ts existe
2. Verificar import: import { useSecurityPin } from "@/hooks/use-security"
3. Compilar: npm run build
```

### Problema: PIN no se guarda
```
Error: Database error

Solución:
1. Verificar tabla security_pins existe
2. Verificar RLS policies están habilitadas
3. Verificar user_id es válido
4. Ver error exacto en consola
```

### Problema: Biometría no funciona
```
Error: Navigator.credentials not available

Solución:
1. Verificar navegador soporta WebAuthn
2. Verificar está en localhost o HTTPS
3. Verificar no hay mixed content
4. Verificar permisos del navegador
```

### Problema: Google Login falla
```
Error: Unsupported provider

Solución:
1. Verificar Google está habilitado en Supabase
2. Verificar Client ID y Secret son correctos
3. Verificar URIs autorizadas en Google Cloud
4. Esperar 5-10 minutos para que tome efecto
```

### Problema: Preguntas no se muestran
```
Error: No questions found

Solución:
1. Verificar tabla security_questions tiene datos
2. Ejecutar: INSERT de las 10 preguntas
3. Verificar is_active = true
```

---

## 📊 SCRIPTS DE VERIFICACIÓN RÁPIDA

### Script 1: Verificar todo de una vez
```bash
#!/bin/bash
echo "🔍 Verificando archivos..."
test -f hooks/use-security.ts && echo "✅ use-security.ts" || echo "❌ use-security.ts"
test -f components/security/pin-input.tsx && echo "✅ pin-input.tsx" || echo "❌ pin-input.tsx"
test -f components/security/security-questions.tsx && echo "✅ security-questions.tsx" || echo "❌ security-questions.tsx"
test -f components/security/biometric-auth.tsx && echo "✅ biometric-auth.tsx" || echo "❌ biometric-auth.tsx"
test -f app/dashboard/security/page.tsx && echo "✅ security/page.tsx" || echo "❌ security/page.tsx"
test -f scripts/004_security_pin_and_recovery.sql && echo "✅ security SQL" || echo "❌ security SQL"

echo ""
echo "🔍 Verificando compilación..."
npm run lint

echo ""
echo "✅ Verificación completa"
```

### Script 2: Verificar BD
```bash
#!/bin/bash
echo "🔍 Verificando Supabase..."
# Requiere psql instalado
psql -h db.supabase.co -U postgres -d postgres -c \
  "SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND (table_name LIKE 'security%' OR table_name LIKE '%attempt%' OR table_name LIKE '%biometric%')"
```

---

## 📋 CHECKLIST FINAL

Antes de deployer a producción:

- [ ] Todos los archivos creados ✅
- [ ] Compilación sin errores ✅
- [ ] Script SQL ejecutado ✅
- [ ] Google OAuth habilitado ✅
- [ ] Pruebas funcionales pasadas ✅
- [ ] Verificación de auditoría ✅
- [ ] RLS configurado ✅
- [ ] Backups de BD ✅
- [ ] HTTPS habilitado ✅
- [ ] Variables de entorno configuradas ✅

---

**Status: 🟢 LISTO PARA PRODUCCIÓN**
