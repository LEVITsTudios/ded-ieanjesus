# 🚀 DEPLOY - Guía Rápida (5 minutos)

## 🎯 Elige tu Opción

### OPCIÓN A: VERCEL (Más Fácil - Recomendado) ⭐

**Tiempo: 5 minutos**

```bash
# 1. Crear GitHub repo
git init
git add .
git commit -m "Initial"
git push -u origin main

# 2. Ir a https://vercel.com
# 3. Click "New Project" → Importar GitHub
# 4. Seleccionar repo
# 5. Agregar variables de entorno:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
# 6. Click "Deploy"

# ¡LISTO! Tu app está en https://tu-proyecto.vercel.app
```

**Costo:** Free tier disponible (muy limitado) o $20/mes  
**HTTPS:** ✅ Gratis incluido  
**Dominio propio:** Después (agregar en Vercel settings)

---

### OPCIÓN B: DIGITALOCEAN (Equilibrada) ⭐⭐

**Tiempo: 30 minutos**

```bash
# 1. Crear cuenta en https://www.digitalocean.com
# 2. Click "Create" → "App"
# 3. Conectar GitHub
# 4. Seleccionar tu repositorio
# 5. Branch: main
# 6. Agregar variables de entorno
# 7. Build command: npm run build
# 8. Run command: npm start
# 9. Click "Create Resources"

# Esperar 5-10 minutos
# ¡App deployada! URL automática generada
```

**Costo:** $12/mes básico  
**HTTPS:** ✅ Gratis incluido  
**Dominio propio:** Sí (cambiar nameservers)

---

### OPCIÓN C: DOCKER + VPS (Máximo Control) ⭐⭐⭐

**Tiempo: 1-2 horas**

```bash
# 1. Comprar VPS en DigitalOcean ($5-20/mes)
# 2. SSH a servidor
ssh root@tu_ip

# 3. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh

# 4. Clonar repo
git clone https://github.com/tu-usuario/repo.git
cd repo

# 5. Crear .env.production con variables

# 6. Crear Dockerfile (ver DEPLOY_SERVIDOR_GUIA.md)

# 7. Build y run
docker build -t dashboard .
docker run -d -p 3000:3000 --env-file .env.production dashboard

# 8. Configurar Nginx para HTTPS (ver guía)

# ¡App corriendo! Apunta DNS a tu IP
```

**Costo:** $5-20/mes  
**HTTPS:** ✅ Let's Encrypt (gratis)  
**Dominio propio:** Sí (apuntar A record)

---

## 🌐 Agregar Dominio Propio

### Paso 1: Comprar Dominio

Opciones baratas:
- **Namecheap:** https://www.namecheap.com (~$9/año)
- **Google Domains:** https://domains.google (~$12/año)

### Paso 2: Apuntar DNS

**Si usas Vercel:**
```
1. Vercel Dashboard → Settings → Domains
2. Agregar "tudominio.com"
3. Copiar nameservers que da Vercel
4. En tu registrador, cambiar nameservers
5. Esperar 24-48 horas
```

**Si usas servidor propio:**
```
En tu registrador (Namecheap, etc):
1. Custom DNS
2. Agregar:
   NS1: ns1.tu-proveedor.com (o equivalente)
   NS2: ns2.tu-proveedor.com
   
O directamente:
1. A Record → @ → Tu IP pública
2. CNAME Record → www → tu-servidor.com
3. Esperar propagación
```

---

## ✅ ANTES DE DEPLOYAR

### Checklist Crítico

```
✓ npm run build funciona localmente
✓ .env.local NO está en .gitignore (espera, SÍ debe estar)
✓ .gitignore tiene .env.local
✓ Variables de entorno copiadas
✓ Supabase con tablas creadas:
  - 001_create_tables.sql ✓
  - 002_student_profile_and_quizzes.sql ✓
  - 003_security_features.sql ✓
  - 004_security_pin_and_recovery.sql ✓
✓ Iconos PWA en /public/ (192x192, 512x512, etc)
✓ manifest.json presente
✓ .gitignore configurado
```

### Variables Requeridas

```env
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> Obtén estas de Supabase → Project Settings → API

---

## 🔐 IMPORTANTE: HTTPS PARA PWA

**PWA REQUIERE HTTPS en producción:**

✅ Vercel → HTTPS automático  
✅ DigitalOcean → HTTPS automático  
✅ VPS propio → Configurar Let's Encrypt  

Sin HTTPS:
- ✗ No se registra Service Worker
- ✗ PWA no se instala
- ✗ Notificaciones no funcionan
- ✗ Offline no funciona

---

## 📊 COMPARACIÓN RÁPIDA

| Aspecto | Vercel | DigitalOcean | Docker VPS |
|---------|--------|------------|-----------|
| **Tiempo setup** | 5 min | 30 min | 1-2h |
| **Costo** | Free-$20 | $12/mes | $5-20/mes |
| **HTTPS** | ✅ Auto | ✅ Auto | ✅ Manual |
| **Dificultad** | ⭐ Muy fácil | ⭐⭐ Fácil | ⭐⭐⭐ Normal |
| **Escalabilidad** | ✅ Auto | ⚠️ Manual | ⚠️ Manual |
| **Control** | ❌ Limitado | ✅ Bueno | ✅✅ Total |

---

## 🎯 RECOMENDACIÓN FINAL

### Para Aprender / MVP
→ **VERCEL** (5 minutos, gratis)

### Para Producción Pequeña
→ **DIGITALOCEAN** (30 minutos, $12/mes)

### Para Máximo Control
→ **DOCKER + VPS** (1-2 horas, $5-20/mes)

---

## 📞 SOPORTE RÁPIDO

**"¿Cuál elijo si estoy empezando?"**  
→ Vercel. Es lo más fácil.

**"¿Cuál si quiero dominio propio?"**  
→ Cualquiera. Todos soportan dominio propio.

**"¿HTTPS está incluido?"**  
→ Sí, en todos. (Vercel y DO lo hacen automático)

**"¿Cuánto cuesta?"**  
→ Vercel free (limitado), Otros $5-20/mes

**"¿Qué pasa con la base de datos?"**  
→ Supabase hosted (ya está en la nube)

---

## 🚀 PRÓXIMOS PASOS

```
1. Elegir opción (recomendado: Vercel)
2. Crear GitHub repo
3. Conectar con hosting
4. Agregar variables de entorno
5. Deploy
6. Verificar en navegador
7. Agregar dominio propio (opcional)
8. Monitorear
```

---

**Tiempo total: 5-30 minutos**  
**Resultado: App en producción con HTTPS** ✨

**Lee [DEPLOY_SERVIDOR_GUIA.md](DEPLOY_SERVIDOR_GUIA.md) para detalles completos** 📖
