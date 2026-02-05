# 🚀 DEPLOY A SERVIDOR - Guía Completa

## 📋 Opciones de Hosting

Tu aplicación Next.js puede deployarse en:

```
FÁCIL (1-2 clicks):
├─ Vercel ⭐ (Recomendado para Next.js)
├─ Netlify
└─ AWS Amplify

MEDIO (30 min):
├─ DigitalOcean App Platform
├─ Railway
├─ Heroku (legacy)
└─ Render

AVANZADO (1-2 horas):
├─ AWS EC2 + manual
├─ DigitalOcean VPS
├─ Linode VPS
├─ Docker + servidor propio
└─ Google Cloud Run
```

## ⭐ OPCIÓN 1: VERCEL (Más Fácil - Recomendado)

**Vercel es hecho por los creadores de Next.js**

### Paso 1: Preparar Repositorio Git

```bash
# Si no tienes git iniciado
git init
git add .
git commit -m "Initial commit - Dashboard PWA"

# Crear repositorio en GitHub
# 1. Ir a https://github.com/new
# 2. Crear repo "academic-registration-system"
# 3. Seguir instrucciones para push

git remote add origin https://github.com/tu-usuario/academic-registration-system.git
git branch -M main
git push -u origin main
```

### Paso 2: Conectar con Vercel

```
1. Ir a https://vercel.com
2. Click "Sign Up" → GitHub
3. Autorizar Vercel
4. Click "Import Project"
5. Seleccionar tu repositorio
6. Click "Import"
```

### Paso 3: Configurar Variables de Entorno

En Vercel dashboard:
```
1. Project Settings → Environment Variables
2. Agregar tus variables de .env.local:

NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
SUPABASE_SERVICE_ROLE_KEY=tu_key_secret
```

### Paso 4: Deploy

```
1. Haz un push a GitHub
2. Vercel detecta automáticamente
3. Build automático
4. Deploy en segundos
5. URL generada automáticamente
```

**Ventajas:**
- ✅ Automático
- ✅ HTTPS gratis
- ✅ CDN incluido
- ✅ Scalable automáticamente
- ✅ Free tier disponible

**Desventajas:**
- ✗ Menos control
- ✗ Costos si crece mucho

---

## 🔧 OPCIÓN 2: DIGITALOCEAN APP PLATFORM

### Paso 1: Crear Cuenta

```
1. Ir a https://www.digitalocean.com
2. Sign Up → Email
3. Crear cuenta
4. Agregar método de pago
```

### Paso 2: Crear App

```
1. Click "Create" → App
2. Conectar GitHub
3. Seleccionar repositorio
4. Click "Next"
5. Seleccionar rama "main"
6. Click "Next"
```

### Paso 3: Configurar Build

```
Select Resource:
├─ Name: academic-dashboard
├─ Source: GitHub repo
├─ Branch: main
├─ Build command: npm run build
└─ Run command: npm start

Environment:
├─ Node.js 20.x
└─ Port: 3000
```

### Paso 4: Variables de Entorno

```
1. Click "Environment"
2. Agregar variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
3. Click "Save"
```

### Paso 5: Deploy

```
1. Review configuration
2. Click "Create Resources"
3. Esperar build (5-10 min)
4. Obtener URL automática
```

**Costo:** ~$12/mes básico

---

## 🐳 OPCIÓN 3: DOCKER + SERVIDOR PROPIO (Avanzado)

### Paso 1: Crear Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código
COPY . .

# Build Next.js
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando start
CMD ["npm", "start"]
```

### Paso 2: Crear docker-compose.yml

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    restart: always
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### Paso 3: Crear Servidor VPS

**DigitalOcean Droplet:**
```
1. Click "Create" → Droplet
2. Seleccionar Ubuntu 22.04 LTS
3. Basic plan ($5-10/mes)
4. Agregar SSH key
5. Create Droplet
```

### Paso 4: Configurar Servidor

```bash
# SSH a tu servidor
ssh root@tu_ip

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt install docker-compose-plugin -y

# Crear directorio para app
mkdir -p /app
cd /app

# Clonar repositorio
git clone https://github.com/tu-usuario/academic-registration-system.git .

# Crear .env.production
nano .env.local
# Agregar variables...

# Build imagen
docker compose build

# Iniciar servicio
docker compose up -d
```

### Paso 5: HTTPS con Let's Encrypt

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Obtener certificado
certbot certonly --standalone -d tudominio.com

# Copiar certificados a nginx
cp /etc/letsencrypt/live/tudominio.com/fullchain.pem ./ssl/
cp /etc/letsencrypt/live/tudominio.com/privkey.pem ./ssl/
```

### Paso 6: Configurar Nginx

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    # HTTP → HTTPS redirect
    server {
        listen 80;
        server_name tudominio.com www.tudominio.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name tudominio.com www.tudominio.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;

        # Proxy a Next.js
        location / {
            proxy_pass http://app:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Cache static files
        location /_next/static/ {
            proxy_cache_valid 30d;
            proxy_pass http://app:3000;
        }
    }
}
```

---

## 🌐 OPCIÓN 4: AWS EC2 (Más Control)

### Paso 1: Crear Instancia EC2

```
1. AWS Console → EC2
2. "Launch Instance"
3. Seleccionar: Ubuntu 22.04 LTS
4. Instance Type: t3.medium (o t3.micro para testing)
5. Crear/Seleccionar Security Group
6. Crear/Seleccionar Key Pair
7. Launch Instance
```

### Paso 2: Configurar Security Group

```
Inbound Rules:
├─ SSH (22): Tu IP
├─ HTTP (80): 0.0.0.0/0
└─ HTTPS (443): 0.0.0.0/0

Outbound Rules:
└─ All traffic
```

### Paso 3: Conectar y Configurar

```bash
# Conectar
ssh -i tu-key.pem ec2-user@tu-ip-publica

# Actualizar
sudo yum update -y
sudo yum install -y nodejs npm git

# Clonar repo
git clone https://github.com/tu-usuario/academic-registration-system.git
cd academic-registration-system

# Instalar dependencias
npm install

# Build
npm run build

# Crear .env.production
nano .env.local

# Instalar PM2 (process manager)
npm install -g pm2

# Iniciar app
pm2 start "npm start" --name "dashboard"
pm2 startup
pm2 save
```

### Paso 4: HTTPS con Nginx + Let's Encrypt

```bash
# Instalar Nginx
sudo yum install -y nginx

# Iniciar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Instalar Certbot
sudo yum install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot certonly --standalone -d tudominio.com

# Configurar Nginx proxy
sudo nano /etc/nginx/nginx.conf
# [Agregar config similar a la anterior]

# Verificar configuración
sudo nginx -t

# Recargar
sudo systemctl reload nginx
```

---

## 📦 OPCIÓN 5: RAILWAY (Muy Fácil)

### Paso 1: Crear Cuenta

```
1. Ir a https://railway.app
2. Sign Up → GitHub
3. Autorizar
```

### Paso 2: Crear Proyecto

```
1. New Project
2. Deploy from GitHub
3. Seleccionar repositorio
4. Confirmar
```

### Paso 3: Variables de Entorno

```
1. Project → Variables
2. Agregar tus variables
```

### Paso 4: Deploy

```
Automático al hacer push a GitHub
```

**Costo:** ~$7/mes

---

## 🔐 CONFIGURACIÓN DE DOMINIO

### Paso 1: Comprar Dominio

Opciones:
- Namecheap: https://www.namecheap.com
- GoDaddy: https://www.godaddy.com
- Google Domains: https://domains.google
- AWS Route53: https://aws.amazon.com/route53

### Paso 2: Apuntar DNS

**Si usas Vercel:**
```
1. Vercel Dashboard → Settings → Domains
2. Agregar dominio
3. Copiar nameservers
4. En registrar, cambiar nameservers
5. Esperar propagación (24-48h)
```

**Si usas servidor propio:**
```
A Record:
└─ Name: @
└─ Value: Tu IP pública
└─ TTL: 3600

CNAME Record (www):
└─ Name: www
└─ Value: tu-servidor.com
└─ TTL: 3600
```

### Paso 3: Verificar

```bash
# Esperar DNS propagación
nslookup tudominio.com

# Debería mostrar tu IP
```

---

## 📋 CHECKLIST PRE-DEPLOY

### Código
```
☐ npm run build exitoso
☐ npm run start funciona localmente
☐ npm run lint sin errores
☐ Todos los imports correctos
```

### Seguridad
```
☐ Variables de entorno configuradas
☐ .env.local NO está en git
☐ .gitignore correctamente configurado
☐ Database credentials seguros
☐ API keys no expuestas
```

### Supabase
```
☐ Supabase project activo
☐ Database creada
☐ SQL scripts ejecutados:
   ├─ 001_create_tables.sql ✓
   ├─ 002_student_profile_and_quizzes.sql ✓
   ├─ 003_security_features.sql ✓
   └─ 004_security_pin_and_recovery.sql ✓
☐ RLS policies configuradas
☐ Auth providers habilitados
```

### PWA
```
☐ Iconos en /public/:
   ├─ icon-192x192.png ✓
   ├─ icon-512x512.png ✓
   ├─ apple-touch-icon.png ✓
   └─ manifest.json ✓
☐ Service Worker registrado
☐ HTTPS habilitado (requerido para PWA)
```

### Performance
```
☐ Build size < 5MB
☐ No console errors
☐ Lighthouse score > 85
☐ Responsive en móvil
```

---

## 🚀 PASOS FINALES

### 1. Build para Producción

```bash
# Build optimizado
npm run build

# Verificar salida
ls -la .next/standalone/
```

### 2. Crear GitHub Repository

```bash
git init
git add .
git commit -m "Production ready"
git branch -M main
git push -u origin main
```

### 3. Elegir Hosting y Deploy

**Recomendación por perfil:**

**Usuario no técnico:**
→ Vercel (1 click)

**Desarrollador:**
→ DigitalOcean App Platform (30 min)

**DevOps/Infra:**
→ Docker + VPS propio (1-2h)

### 4. Configurar Dominio

```
1. Comprar dominio
2. Apuntar DNS a tu servidor
3. Configurar HTTPS
4. Esperar propagación
```

### 5. Verificar Deploy

```
1. Abre tudominio.com
2. Verifica HTTPS (🔒)
3. Prueba offline (DevTools)
4. Prueba notificaciones
5. Prueba responsive (móvil)
```

---

## 📊 COMPARATIVA DE HOSTING

| Feature | Vercel | DigitalOcean | AWS | Docker VPS |
|---------|--------|-------------|-----|-----------|
| Ease | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Cost | Free-$20 | $5-20 | Free-$100 | $5-50 |
| Scalability | Auto | Manual | Auto | Manual |
| HTTPS | ✅ Free | ✅ Free | ✅ Free | ✅ Free (Let's Encrypt) |
| Control | Limited | Good | Excellent | Full |
| Deployment | 1 click | 30 min | 1-2h | 1-2h |

---

## 🔧 MONITOREO EN PRODUCCIÓN

### Logs

```bash
# Vercel
vercel logs

# DigitalOcean
docker logs -f container_name

# SSH Server
tail -f /var/log/app.log
pm2 logs
```

### Métricas

```
Monitorear:
├─ Error rate
├─ Response time
├─ Database queries
├─ Memory usage
└─ Disk space
```

### Herramientas

- **Vercel Analytics:** Automático
- **Sentry:** Error tracking
- **DataDog:** Observabilidad
- **New Relic:** APM

---

## 🆘 TROUBLESHOOTING

### "Página en blanco"

```
1. Verifica console errors (F12)
2. Verifica NEXT_PUBLIC variables
3. Verifica database connection
4. Verifica logs del servidor
```

### "500 Server Error"

```
1. Revisa logs del servidor
2. Verifica variables de entorno
3. Verifica database está online
4. Verifica permisos de archivos
```

### "HTTPS no funciona"

```
1. Verifica certificado válido
2. Verifica nginx configurado
3. Redirige HTTP a HTTPS
4. Verifica puertos 80/443 abiertos
```

### "PWA no se instala"

```
1. Verifica HTTPS activo
2. Verifica manifest.json existe
3. Verifica icons en /public/
4. Recarga página (Ctrl+Shift+R)
```

---

## 📞 RESUMEN RECOMENDADO

**Opción 1: Vercel** (Más fácil)
```
Tiempo: 5 minutos
Costo: Free tier o $20/mes
Dificultad: ⭐
```

**Opción 2: DigitalOcean App Platform** (Equilibrado)
```
Tiempo: 30 minutos
Costo: $12/mes
Dificultad: ⭐⭐
```

**Opción 3: Docker + VPS** (Máximo control)
```
Tiempo: 1-2 horas
Costo: $5-20/mes
Dificultad: ⭐⭐⭐
```

---

**¿Necesitas ayuda con alguna opción específica?** 🚀
