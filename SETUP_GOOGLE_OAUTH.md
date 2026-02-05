# 🔐 Configuración de Google OAuth en Supabase

## Pasos para habilitar el proveedor Google:

### 1. Ve a la Consola de Supabase
- Accede a: https://app.supabase.com
- Selecciona tu proyecto

### 2. En el menú izquierdo, ve a: **Authentication** → **Providers**

### 3. Busca "Google" y haz clic para expandirlo

### 4. Habilita el proveedor (toggle en ON)

### 5. Configura las credenciales de Google Cloud:

#### A. Crear Google OAuth 2.0 Credentials:
1. Ve a: https://console.cloud.google.com/
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a "APIs & Services" → "Credentials"
4. Haz clic en "Create Credentials" → "OAuth 2.0 Client ID"
5. Elige tipo: "Web application"
6. En "Authorized JavaScript origins" agrega:
   - `https://liamgsolvdjxjusmtyov.supabase.co`
   
7. En "Authorized redirect URIs" agrega:
   - `https://liamgsolvdjxjusmtyov.supabase.co/auth/v1/callback?provider=google`

8. Copia el **Client ID** y **Client Secret**

### 6. Vuelve a Supabase y pega en:
- **Client ID**: [Tu Client ID de Google]
- **Client Secret**: [Tu Client Secret de Google]

### 7. Haz clic en **Save**

### 8. (Opcional) Actualiza variables de entorno:

Si quieres usar variables en tu .env.local:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu_client_id_aqui
https://liamgsolvdjxjusmtyov.supabase.co/auth/v1/callback
```

## ✅ Listo!
Ahora el botón "Continuar con Google" funcionará correctamente.
