# 🔧 Solución del Error "Failed to fetch" en Login

## Problema
El usuario recibe el error `Failed to fetch` al intentar hacer login, originado en la línea 83 de `app/auth/login/page.tsx`:

```
await supabase.auth.signInWithPassword({...})
```

## Causas Comunes

| Causa | Síntoma | Solución |
|-------|---------|----------|
| **Variables de entorno faltantes** | Error inmediato | Verificar `.env.local` |
| **Credenciales incorrectas de Supabase** | Error de conexión | Validar URL y clave API |
| **Problemas de red/conectividad** | Timeout al conectar | Verificar conexión a internet |
| **CORS bloqueado** | Error de "preflight" | Verificar configuración CORS en Supabase |
| **Supabase no accesible** | Error 503/504 | Verificar estado de Supabase |
| **Cliente Supabase mal inicializado** | Error durante creación del cliente | Recrear instancia del cliente |

## ✅ Pasos para Resolver

### 1. Verificar Variables de Entorno

Asegúrate que `.env.local` en la raíz del proyecto contiene:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_[tu-clave]
SUPABASE_SERVICE_ROLE_KEY=[tu-service-role-key]
```

**Nota**: Las variables públicas (con prefijo `NEXT_PUBLIC_`) se inyectan en tiempo de compilación. Si las cambias, **debes reiniciar el servidor de desarrollo**.

### 2. Validar Credenciales de Supabase

1. Ve a [supabase.com](https://supabase.com) y accede a tu proyecto
2. Navega a **Settings → API**
3. Verifica que:
   - **Project URL** comience con `https://`
   - **Public API Key** (anon key) comience con `sb_publishable_`
   - **Service Role Key** esté configurada

4. Copia los valores correctos a `.env.local`

### 3. Usar el Script de Diagnóstico

En la consola del navegador (F12), ejecuta:

```javascript
// Primero importa el módulo
import { runSupabaseDiagnostics, checkNetworkConnectivity } from '@/lib/supabase/diagnostic.ts'

// Luego ejecuta los diagnósticos
await runSupabaseDiagnostics();
await checkNetworkConnectivity();
```

**Espera**: Nota que esto puede no funcionar directamente en la consola. En su lugar:

1. Abre cualquier página de la aplicación
2. Abre la consola del navegador (F12)
3. Busca mensajes con prefijo `[Login]` o `🔍` que indiquen problemas

### 4. Verificar Conectividad de Red

- ✓ ¿Tienes conexión a internet?
- ✓ ¿Puedes acceder a https://supabase.com sin errores?
- ✓ ¿El firewall corporativo/VPN bloquea supabase.co?

### 5. Reiniciar el Servidor de Desarrollo

Después de cambiar variables de entorno:

```bash
# Detén el servidor (Ctrl+C)
# Luego reinicia:
npm run dev
# o
pnpm dev
```

### 6. Limpiar Caché del Navegador

1. Abre DevTools (F12)
2. Haz clic derecho en el botón "Recargar"
3. Selecciona "Vaciar caché y hacer una recarga forzada"

O simplemente presiona: **Ctrl+Shift+Delete** (Windows) o **Cmd+Shift+Delete** (Mac)

## 🧪 Pruebas de Conexión

### Test 1: Verificar Acceso a Supabase

En la consola del navegador:

```javascript
const url = "https://liamgsolvdjxjusmtyov.supabase.co";
const key = "sb_publishable_XyGN-VGG4aqExpF4Y1kxdQ_6HStbQXY";

fetch(`${url}/rest/v1/`, {
  method: 'GET',
  headers: {
    'apikey': key,
    'Accept': 'application/json',
  },
})
.then(r => console.log('Status:', r.status))
.catch(e => console.error('Error:', e.message));
```

**Resultado esperado**: `Status: 404` (es normal, significa que Supabase responde)

### Test 2: Verificar Conectividad General

```javascript
fetch('https://www.google.com/favicon.ico', { method: 'HEAD', mode: 'no-cors' })
.then(() => console.log('✓ Internet OK'))
.catch(e => console.error('✗ Network error:', e.message));
```

## 📊 Cambios Realizados

Se han mejorado los siguientes archivos:

### 1. **`lib/supabase/client.ts`**
   - Creación de nueva instancia del cliente en cada llamada
   - Mejor configuración de opciones de autenticación
   - Logs mejorados para debugging

### 2. **`app/auth/login/page.tsx`**
   - Mejor manejo del error "Failed to fetch"
   - Logs detallados en la consola
   - Mensajes de error más descriptivos para el usuario
   - Validación de inicialización del cliente

## 🚨 Mensajes de Error Mejorados

Ahora recibirás mensajes más claros:

| Error | Causa Probable | Acción |
|-------|---|---|
| "No se puede conectar al servicio de autenticación" | Red/DNS | Verifica conexión internet |
| "Error de configuración. Por favor recarga la página" | Variables de entorno | Recarga la página o reinicia dev server |
| "Error de conexión" | CORS o Supabase down | Verifica URLs y estado de Supabase |

## 📝 Logs en Consola

Ahora puedes ver logs detallados para debugging. Abre DevTools (F12) y:

1. Intenta hacer login
2. Mira la consola (pestaña "Console")
3. Busca mensajes con `[Login]` 
4. Proporciona esa información si necesitas ayuda

Ejemplo de buenos logs:

```
[Login] Attempting authentication with email: usuario@example.com
[Login] Sign in error: {
  message: "Invalid login credentials",
  status: 400,
  code: "invalid_credentials"
}
```

## 🔗 Enlaces Útiles

- [Documentación Supabase Auth](https://supabase.com/docs/guides/auth)
- [Estado de Supabase](https://status.supabase.com)
- [Foro de Supabase](https://github.com/supabase/supabase/discussions)

## ❓ Si Nada Funciona

1. **Obtén logs detallados**:
   - Abre DevTools
   - Intenta login
   - Copia todos los mensajes de `[Login]`

2. **Verifica el estado de Supabase**: https://status.supabase.com

3. **Recrear el cliente Supabase**:
   ```bash
   # Elimina node_modules y reinstala
   rm -r node_modules
   npm install
   npm run dev
   ```

4. **Contacta a soporte de Supabase** con:
   - URL del proyecto (sin claves secretas)
   - Región del proyecto
   - Error exacto de la consola
   - Pasos para reproducir
