# ✅ Vercel Deploy en Producción - Guía Inmediata

## 🎯 Donde estás ahora:
```
✅ GitHub conectado con tu código
✅ Vercel conectado con GitHub
⏳ Esperando hacer deploy a producción
```

---

## 🚀 PASO 1: Ir al Dashboard de Vercel

```
1. Abre: https://vercel.com/dashboard
2. Busca tu proyecto "academic-registration-system"
3. Click en el nombre del proyecto
```

---

## 🔐 PASO 2: Agregar Variables de Entorno (IMPORTANTE)

**Sin esto tu app no funcionará:**

```
1. En el proyecto, click "Settings" (arriba)
2. Left sidebar → "Environment Variables"
3. Agregar CADA una de estas (tus valores Supabase):

───────────────────────────────────────────────────

VARIABLE 1:
Nombre: NEXT_PUBLIC_SUPABASE_URL
Valor:  https://tuproyecto.supabase.co
(Busca en Supabase → Project Settings → API URLs → URL)

VARIABLE 2:
Nombre: NEXT_PUBLIC_SUPABASE_ANON_KEY
Valor:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
(Busca en Supabase → Project Settings → API Keys → anon public)

VARIABLE 3:
Nombre: SUPABASE_SERVICE_ROLE_KEY
Valor:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
(Busca en Supabase → Project Settings → API Keys → service_role secret)

───────────────────────────────────────────────────

4. Después de cada variable:
   - Seleccionar: Production (está checkeado)
   - Click "Save"

5. Cuando termines todas las variables:
   - Debe haber 3 variables agregadas
```

**Cómo encontrar tus valores Supabase:**

```
1. Abre: https://app.supabase.com
2. Selecciona tu proyecto
3. Click "Settings" (engranaje abajo izq)
4. Click "API"
5. Copiar:
   - Project URL
   - Anon public key
   - Service role key
```

---

## 🔄 PASO 3: Triggear Nuevo Deploy

**Vercel necesita reiniciar con las nuevas variables:**

```
OPCIÓN A (Más fácil):
1. En Dashboard Vercel
2. Click "Deployments" (tab arriba)
3. Busca el último deploy (debe decir "Failed" o "Ready")
4. Click los 3 puntitos (...) a la derecha
5. Click "Redeploy"
6. Click "Redeploy" de nuevo para confirmar
7. Esperar 1-2 minutos

OPCIÓN B (Por Git):
1. En tu PC, abre el proyecto
2. Haz cualquier cambio pequeño (ej: agregar un comentario en un archivo)
3. git add .
4. git commit -m "Trigger deploy"
5. git push origin main
6. Vercel auto-detecta y deploya
```

---

## 👀 PASO 4: Monitorear el Deploy

Mientras Vercel despliega:

```
1. En Dashboard Vercel → "Deployments"
2. Debe mostrar:
   ├─ Status: "Building" → "Ready" ✅
   └─ Puedes ver los logs en tiempo real
```

**Qué esperar:**

```
📊 FASE 1: Build (1-2 min)
├─ "Installing dependencies..."
├─ "Building application..."
├─ "Collecting Web Analytics..."
└─ ✅ "Build completed successfully"

⚡ FASE 2: Deploy (30 seg)
├─ "Creating production deployment..."
├─ "Finalizing deployment..."
└─ ✅ "Deployment complete"
```

**Si hay ERROR:**

```
Vercel mostrará el error en rojo
Copia el error y revisa:

1. ¿Variables de entorno correctas?
2. ¿Código no tiene errores TypeScript?
3. ¿package.json no tiene dependencias rotas?

Si necesitas fix:
- Arregla en tu PC
- git push origin main
- Vercel auto-redeploya
```

---

## ✅ PASO 5: Verificar Deploy Exitoso

Cuando veas "Ready" en verde ✅:

```
1. En Dashboard Vercel, encuentra:
   "Preview URL" o "Production URL"
   
2. Cópialo (ej: academic-registration-system.vercel.app)

3. Abre en navegador

4. Si carga y se ve bien → ¡ÉXITO! 🎉
```

**Verificar que funciona TODO:**

```
[ ] ✅ Se carga la página de login
[ ] ✅ Se ve responsive (abre DevTools F12, usa mobile view)
[ ] ✅ Servicio Worker está activo (DevTools → Application → Service Workers → debe decir "active")
[ ] ✅ PWA manifest está cargado (DevTools → Application → Manifest → debe listar campos)
[ ] ✅ Puedes ver el botón de instalar PWA (Chrome → buscador → icono de app)
```

---

## 🌍 PASO 6: Conectar tu Dominio Hostinger (OPCIONAL)

Si tienes dominio personalizado en Hostinger:

### Opción A: Usar dominio GRATIS de Vercel
```
URL final: academic-registration-system.vercel.app
- Ya funciona
- No requiere configuración
- HTTPS automático
```

### Opción B: Conectar dominio Hostinger
```
EN VERCEL:
1. Dashboard → Settings
2. Tab "Domains" (arriba)
3. Click "Add"
4. Escribir: tudominio.com
5. Click "Add"
6. Vercel genera 4 nameservers (cópialos)

EN HOSTINGER:
1. https://hpanel.hostinger.com
2. Domains → tu-dominio.com
3. Click "Manage"
4. Tab "DNS"
5. Cambiar Nameservers a los de Vercel
6. Click "Save"

ESPERAR:
- Propagación DNS: 5-30 minutos
- Vercel muestra cuando esté listo
```

---

## 🔍 PASO 7: Test Final en Producción

Una vez live (con Vercel o dominio Hostinger):

### Test 1: Login
```
1. Ve a https://tu-app.vercel.app (o tudominio.com)
2. Click "Google Login"
3. Autoriza
4. Debe entrar a dashboard
```

### Test 2: PWA
```
1. Abre DevTools (F12)
2. Application → Service Workers
3. Debe decir "active" en verde ✅

1. En Chrome, buscador
2. Debe aparecer icono de "Install" (a la izquierda de la URL)
3. Click para instalar como app
```

### Test 3: Offline
```
1. En DevTools → Network
2. Simular offline: "Offline" en dropdown de "Throttling"
3. Navega por la app
4. Debe funcionar (caché + offline)
5. Vuelve a Online: "No throttling"
```

### Test 4: Base de Datos
```
1. Si tienes login funcional
2. Navega al dashboard
3. Debe cargar datos desde Supabase
4. Si no carga → Variables de entorno mal configuradas
```

---

## 🎉 SI TODO FUNCIONA

```
Tu app en PRODUCCIÓN:
✅ Disponible en: https://tu-app.vercel.app
✅ HTTPS: Automático y gratis
✅ PWA: Instalable
✅ Offline: Funciona
✅ Notificaciones: Funcionan
✅ Base de datos: Conectada
✅ Dominio propio: (opcional)
✅ Auto-updates: Cada vez que hagas git push
✅ Escalable: Automático
✅ Gratis: Plan hobby de Vercel
```

---

## 🔄 ACTUALIZACIONES FUTURAS

```
Cuando quieras hacer cambios:

1. En tu PC, edita el código
2. git add .
3. git commit -m "Mi cambio"
4. git push origin main

Automáticamente:
- GitHub recibe el push
- Vercel lo detecta
- Construye (build)
- Despliega (1-2 min)
- Tu app está actualizada en vivo

Puedes ver todo en: https://vercel.com/dashboard
Tab "Deployments" → Historial completo
```

---

## 🐛 TROUBLESHOOTING

### La app carga pero no ve datos
```
Problema: Variables de entorno incorrectas

Solución:
1. Vercel → Settings → Environment Variables
2. Verifica EXACTAMENTE:
   - NEXT_PUBLIC_SUPABASE_URL (con https://)
   - NEXT_PUBLIC_SUPABASE_ANON_KEY (toda la cadena)
   - SUPABASE_SERVICE_ROLE_KEY (toda la cadena)
3. Redeploy (click 3 puntitos → Redeploy)
4. Esperar 2 minutos
```

### Build falla
```
Problema: Error en el código

Solución:
1. Ve a Deployments
2. Click el deploy fallido (rojo)
3. Scroll → Logs
4. Busca "Error:" en rojo
5. El error está ahí explícito
6. Arregla en tu PC
7. git push
8. Vercel redeploya automáticamente
```

### Dominio no resuelve
```
Problema: DNS no propagó

Solución:
1. Espera 5-30 minutos (DNS propaga)
2. Vercel mostrará cuando esté listo
3. Verifica en: https://nslookup.io/tudominio.com
4. Si sale "Nameserver not found" → espera más
```

### PWA no instala
```
Problema: Probablemente falta HTTPS en desarrollo o hay error

Solución:
1. Abre DevTools (F12)
2. Console (tab)
3. Busca errores en rojo
4. Copia el error
5. Arregla y git push
```

---

## 📊 ESTADO ACTUAL

```
┌─────────────────────────────────┐
│                                 │
│  Tu App en PRODUCCIÓN 🚀        │
│                                 │
│  ✅ GitHub conectado            │
│  ✅ Vercel conectado            │
│  ⏳ Variables configuradas      │
│  ⏳ Build en proceso o listo    │
│  ⏳ Deploy en vivo              │
│                                 │
│  Siguiente: Agregar variables   │
│  y confirmar deploy             │
│                                 │
└─────────────────────────────────┘
```

---

## 📋 CHECKLIST FINAL

```
[ ] 1. Abrir https://vercel.com/dashboard
[ ] 2. Encontrar proyecto "academic-registration-system"
[ ] 3. Click "Settings"
[ ] 4. Environment Variables
[ ] 5. Agregar NEXT_PUBLIC_SUPABASE_URL
[ ] 6. Agregar NEXT_PUBLIC_SUPABASE_ANON_KEY
[ ] 7. Agregar SUPABASE_SERVICE_ROLE_KEY
[ ] 8. Click "Deployments"
[ ] 9. Redeploy último deployment
[ ] 10. Esperar hasta que diga "Ready" ✅
[ ] 11. Copiar URL de producción
[ ] 12. Abrir en navegador
[ ] 13. Verificar que carga
[ ] 14. Test Service Worker (DevTools)
[ ] 15. Test PWA offline
[ ] 16. 🎉 ÉXITO!
```

---

## 🎯 RESUMEN

```
AHORA:
1. Vercel dashboard
2. Agregar 3 variables (Supabase)
3. Redeploy
4. Esperar "Ready"
5. Probar en navegador

LISTO:
Tu app en producción 🚀
```

---

## ❓ PREGUNTAS RÁPIDAS

**P: ¿Cuánto tiempo tarda el deploy?**
- R: 2-5 minutos normalmente

**P: ¿Se ve diferente en producción?**
- R: No, es exactamente lo mismo

**P: ¿Puedo cambiar variables sin redeploy?**
- R: No, necesitas redeploy para que apliquen

**P: ¿Mi código está seguro en Vercel?**
- R: Sí, muy seguro. Usado por miles de empresas

**P: ¿Qué pasa si hay error en el build?**
- R: Vercel no despliega. Muestra el error. Arreglas y repushea.

**P: ¿Cuánto cuesta después?**
- R: Nada si usas plan hobby. Pagan solo si usas mucho (raro)

---

**¡YA CASI ESTÁ!** 🎉

**Próximo paso:** Ve a Vercel y agrega las variables de entorno.

*Si necesitas ayuda con las variables de Supabase, dime y te ayudo a encontrarlas.*

---

*Última actualización: Feb 5, 2026*
