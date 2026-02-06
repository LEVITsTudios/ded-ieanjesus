# ⚡ Checklist de Producción - Últimos Pasos

Sigue estos pasos para que todo funcione en producción:

## 1. ✅ Migraciones SQL (5 minutos)

Ve a **Supabase Dashboard** → **SQL Editor** y ejecuta:

```sql
-- Copia el contenido de scripts/005_notifications_and_profiles.sql
-- Luego el contenido de scripts/006_push_subscriptions.sql
```

**Verifica que se ejecutaron exitosamente** (sin errores).

---

## 2. 🔑 Generar Claves VAPID (2 minutos)

En tu terminal local:

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Ejemplo de output:
```
Public Key: BCabc123xyz...
Private Key: def456ghi...
```

**Guarda ambas claves en un lugar seguro.**

---

## 3. 🔐 Agregar Secretos a GitHub (3 minutos)

Ve a: **Tu repositorio en GitHub** → **Settings** → **Secrets and variables** → **Actions**

Haz click en **New repository secret** y añade:

| Name | Value |
|------|-------|
| `SUPABASE_ACCESS_TOKEN` | [Tu token de Supabase] |
| `SUPABASE_SERVICE_ROLE_KEY` | [Tu service role key] |
| `SUPABASE_DB_PASSWORD` | [Tu contraseña de BD] |
| `SUPABASE_DB_URL` | `postgresql://postgres:PASSWORD@HOST:5432/postgres` |
| `VERCEL_DEPLOY_HOOK_URL` | [Tu webhook de Vercel] (opcional) |

### Cómo obtener cada secreto:

**SUPABASE_ACCESS_TOKEN:**
- Supabase → Settings → Personal tokens → Generate token

**SUPABASE_SERVICE_ROLE_KEY:**
- Supabase → Project settings → API → Show → Service role (anon_key)

**SUPABASE_DB_PASSWORD:**
- Supabase → Settings → Database → Password (la que usaste al crear el proyecto)

**SUPABASE_DB_URL:**
- Supabase → Project settings → Database → Connection string → PostgreSQL
- Reemplaza `[YOUR-PASSWORD]` con tu contraseña real

**VERCEL_DEPLOY_HOOK_URL** (opcional):
- Vercel → Tu proyecto → Settings → Git → Deploy Hooks → Create hook

---

## 4. 🚀 Configurar Variables en Vercel (3 minutos)

Ve a: **Vercel** → **Tu proyecto** → **Settings** → **Environment Variables**

Añade:

```
NEXT_PUBLIC_VAPID_PUBLIC = <tu_clave_publica_vapid>
VAPID_PRIVATE_KEY = <tu_clave_privada_vapid>
NOTIFICATIONS_FROM = noreply@tudominio.com
```

**Importante:** Estas variables se usan para **Web Push Notifications**.

---

## 5. 🔄 Triggear Despliegue (1 minuto)

Haz un pequeño cambio y push para triggear Vercel:

```bash
git add . && git commit -m "Trigger production deployment" && git push origin main
```

Vercel debería empezar el despliegue automáticamente.

---

## 6. ✔️ Verificar en Producción (5 minutos)

Una vez Vercel haya desplegado:

1. **Abre tu sitio desplegado** (ej: `https://tu-proyecto.vercel.app`)
2. **Abre DevTools** (F12)
3. **Ve a Application → Service Workers**
4. **Verifica que `/sw.js` esté "Active and running"** ✅
5. **Intenta instalar la PWA** (debería mostrar "Install" en el navegador)
6. **Prueba login** con usuario con rol admin
7. **Ve a `/dashboard/users`** y prueba crear un usuario
8. **Ve a `/dashboard/notifications`** y verifica que funciona

---

## 7. 🧪 Test de API (Opcional)

Prueba un endpoint desde terminal:

```bash
# Reemplaza con tu URL y token real
curl -X GET https://tu-proyecto.vercel.app/api/users \
  -H "Authorization: Bearer TU_SESSION_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 8. 📱 Probar PWA Offline (Opcional)

1. Instala la PWA en tu dispositivo
2. Desactiva internet
3. La app debería mostrar página de "Sin Conexión" pero funcionar parcialmente

---

## 🎉 ¡Listo!

Si completaste todos los pasos, tu sistema está **100% funcional en producción**:

✅ Usuarios pueden registrarse y loginear
✅ Admin puede gestionar: usuarios, cursos, anuncios, calificaciones, materiales, horarios, reuniones
✅ Navbar con dropdown de usuario y notificaciones
✅ Notificaciones persistidas en servidor y cliente
✅ PWA instalable y offline-first
✅ Push notifications configuradas
✅ CI/CD automático con GitHub Actions

---

## 📞 Soporte

Si algo no funciona:

1. **Service Worker no aparece:** Revisa que `/public/sw.js` existe y que `/public/manifest.json` está linkeado en `app/layout.tsx`
2. **Notificaciones no se guardan:** Ejecuta los scripts SQL en Supabase
3. **Push notifications error:** Verifica que `VAPID_PRIVATE_KEY` está en Vercel env
4. **Usuarios no se crean:** Verifica permisos RLS en Supabase

---

**Documentación completa:** Ver `DEPLOYMENT_GUIDE.md` y `IMPLEMENTATION_SUMMARY.md`
