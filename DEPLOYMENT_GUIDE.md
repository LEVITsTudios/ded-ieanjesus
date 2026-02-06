# Guía de Configuración Final - Sistema de Registro Académico

## 1. Migración de Base de Datos

Las tablas necesarias deben existir en Supabase. Ejecuta estos scripts en el **SQL Editor** de Supabase:

### Script 005: Notificaciones y Perfiles
```sql
-- 005_notifications_and_profiles.sql
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dni text;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name text;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
```

### Script 006: Suscripciones Push
```sql
-- 006_push_subscriptions.sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
```

## 2. Generar Claves VAPID para Push Notifications

Ejecuta en tu terminal (requiere Node.js):

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Obtendrás algo como:
```
Public Key: BC...
Private Key: ...
```

Guarda ambas claves de forma segura.

## 3. Configurar Variables de Entorno en GitHub

Ve a tu repositorio en GitHub:
1. **Settings → Secrets and variables → Actions**
2. Añade estos secretos:

| Nombre | Valor | Notas |
|--------|-------|-------|
| `SUPABASE_URL` | URL de tu proyecto Supabase | `https://xyzexample.supabase.co` |
| `SUPABASE_ACCESS_TOKEN` | Token de acceso de Supabase | Se obtiene de Supabase dashboard → Personal tokens |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key | En Supabase → Settings → API |
| `SUPABASE_DB_PASSWORD` | Contraseña de DB | En Supabase → Database → Connection string |
| `SUPABASE_DB_URL` | Connection string PostgreSQL | `postgresql://postgres:password@host:5432/postgres` |
| `VERCEL_DEPLOY_HOOK_URL` | Deploy hook de Vercel (opcional) | En Vercel → Project settings → Git |

## 4. Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel
2. **Settings → Environment Variables**
3. Añade:

```bash
NEXT_PUBLIC_VAPID_PUBLIC=<tu_clave_publica_vapid>
VAPID_PRIVATE_KEY=<tu_clave_privada_vapid>
NOTIFICATIONS_FROM=noreply@tudominio.com

# Si necesitas acceso a Supabase desde servidor (opcional)
SUPABASE_SERVICE_ROLE_KEY=<tu_service_role_key>
```

## 5. Endpoints API Disponibles

### Usuarios
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `GET /api/users/[id]` - Obtener usuario
- `PUT /api/users/[id]` - Actualizar usuario
- `DELETE /api/users/[id]` - Eliminar usuario

### Cursos
- `GET /api/courses` - Listar cursos
- `POST /api/courses` - Crear curso
- `GET /api/courses/[id]` - Obtener curso
- `PUT /api/courses/[id]` - Actualizar curso
- `DELETE /api/courses/[id]` - Eliminar curso

### Anuncios
- `GET /api/announcements` - Listar anuncios
- `POST /api/announcements` - Crear anuncio
- `PUT /api/announcements/[id]` - Actualizar anuncio
- `DELETE /api/announcements/[id]` - Eliminar anuncio

### Calificaciones
- `GET /api/grades` - Listar calificaciones
- `POST /api/grades` - Crear calificación
- `PUT /api/grades/[id]` - Actualizar calificación
- `DELETE /api/grades/[id]` - Eliminar calificación

### Materiales
- `GET /api/materials` - Listar materiales
- `POST /api/materials` - Crear material
- `PUT /api/materials/[id]` - Actualizar material
- `DELETE /api/materials/[id]` - Eliminar material

### Horarios
- `GET /api/schedules` - Listar horarios
- `POST /api/schedules` - Crear horario
- `PUT /api/schedules/[id]` - Actualizar horario
- `DELETE /api/schedules/[id]` - Eliminar horario

### Reuniones
- `GET /api/meetings` - Listar reuniones
- `POST /api/meetings` - Crear reunión
- `PUT /api/meetings/[id]` - Actualizar reunión
- `DELETE /api/meetings/[id]` - Eliminar reunión

### Notificaciones
- `GET /api/notifications` - Obtener notificaciones del usuario
- `POST /api/notifications` - Crear notificación
- `PATCH /api/notifications/[id]` - Actualizar (marcar como leída)
- `DELETE /api/notifications/[id]` - Eliminar notificación

### Push Notifications
- `POST /api/push-subscriptions` - Registrar suscripción push
- `POST /api/send-push` - Enviar notificación push (admin)

## 6. Testing

### Probar Endpoint de Usuarios
```bash
curl -X GET https://tu-dominio.vercel.app/api/users \
  -H "Authorization: Bearer TU_TOKEN"
```

### Probar Envío de Push
```bash
curl -X POST https://tu-dominio.vercel.app/api/send-push \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Prueba",
    "body": "Notificación de prueba",
    "userId": "usuario-uuid"
  }'
```

## 7. Verificar PWA en Producción

1. Abre tu sitio desplegado en navegador
2. Abre DevTools (F12)
3. Ve a **Application → Service Workers**
4. Verifica que `/sw.js` esté **Active and running**
5. En **Manifest**, verifica que `/manifest.json` sea válido
6. Instala la PWA (debería mostrar el prompt "Install" en la barra de dirección o menú)

## 8. Troubleshooting

### Service Worker no se registra
- Verifica que `/public/sw.js` existe
- Verifica que `/public/manifest.json` está linkeado en `app/layout.tsx`
- Revisa la consola para errores

### Push notifications no funcionan
- Verifica que `VAPID_PRIVATE_KEY` está configurado en Vercel
- Revisa que el usuario está autenticado antes de enviar push
- Verifica la tabla `push_subscriptions` en Supabase

### Notificaciones no se guardan
- Ejecuta los scripts SQL 005 y 006 en Supabase
- Verifica que la tabla `notifications` existe
- Asegúrate de que RLS está configurado correctamente (o deshabilitado para desarrollo)

## 9. Próximas Mejoras (Opcionales)

- [ ] Implementar paginación en listados
- [ ] Agregar búsqueda avanzada
- [ ] Implementar filtros por rol/estado
- [ ] Agregar reports/estadísticas
- [ ] Integración con email (SendGrid, Resend)
- [ ] Webhooks para eventos

---

**Sistema completamente funcional y listo para producción.**
