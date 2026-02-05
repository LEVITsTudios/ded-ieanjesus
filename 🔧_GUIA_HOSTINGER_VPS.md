# 🔧 Deploy en Hostinger VPS - Guía Práctica

## ⚠️ PREREQUISITO IMPORTANTE

**Tu plan Hostinger debe ser:**
- ✅ VPS (Virtual Private Server)
- ✅ O Business Hosting + acceso SSH
- ❌ NO Shared Hosting básico (no soporta Node.js)

**Si tienes compartido:** necesitas upgrade a VPS (~$10-20/mes extra)

---

## 📋 PLANIFICACIÓN

### Tiempo Total
```
Configuración inicial:     20 minutos
Deploy primera vez:        30 minutos
Setup SSL:                 10 minutos
─────────────────────────────────
Total:                     ~60 minutos
```

### Lo Que Necesitas
```
✅ VPS Hostinger con SSH activo
✅ Dominio (tuyo o apuntando a Hostinger)
✅ Git repository (GitHub/GitLab)
✅ Terminal SSH (Windows: PuTTY o CMD)
✅ Variables de entorno Supabase
```

---

## 🚀 PASO 1: Preparar Repositorio Git

### En tu máquina local:

```bash
# Iniciar git
cd c:\Proyectos-Software\academic-registration-system
git init

# Añadir todo
git add .
git commit -m "Initial commit - Dashboard PWA academico"

# Crear en GitHub
# 1. Ir a https://github.com/new
# 2. Crear repo "academic-registration-system"
# 3. NO inicializar con README

# Conectar local con GitHub
git remote add origin https://github.com/TU_USUARIO/academic-registration-system.git
git branch -M main
git push -u origin main

# Verificar
git log --oneline
```

**Resultado esperado:**
```
✅ Repo visible en https://github.com/tu-usuario/academic-registration-system
✅ Todos los archivos subidos
```

---

## 🔑 PASO 2: Conectar SSH a Hostinger

### Obtener credenciales SSH

1. **Login en tu panel Hostinger:**
   - Ir a hPanel (https://hpanel.hostinger.com)
   - Services → Tu VPS
   - Tab "SSH"
   - Copiar:
     - Hostname/IP
     - Username
     - Port (usualmente 22)
     - Password (o usar SSH Key)

### Conectar desde Windows

**Opción A: Usar CMD/PowerShell (Windows 10+)**
```powershell
ssh usuario@tu-ip-hostinger -p 22
# Te pedirá contraseña
```

**Opción B: Usar PuTTY (más fácil)**
1. Descargar: https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html
2. Host: `tu-ip-hostinger`
3. Port: `22` (cambiar si Hostinger usa otro)
4. Click "Open"
5. Username: `root` o el usuario
6. Password: tu contraseña Hostinger

**Opción C: Usar VSCode**
```
1. Instalar extension "Remote - SSH"
2. Command Palette → "Remote-SSH: Connect to Host..."
3. Add new host: ssh usuario@tu-ip-hostinger
4. Connect
5. Aceptar fingerprint
```

**Verificar conexión:**
```bash
whoami
pwd
ls -la
```

---

## 📦 PASO 3: Instalar Node.js en el VPS

Una vez conectado SSH:

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20 (LTS recomendado)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version
npm --version

# Instalar pnpm (si lo usas)
npm install -g pnpm
pnpm --version
```

**Resultado esperado:**
```
node v20.x.x
npm 10.x.x
pnpm 8.x.x
```

---

## 🗂️ PASO 4: Clonar y Configurar Proyecto

```bash
# Crear carpeta para app
mkdir -p ~/apps
cd ~/apps

# Clonar desde GitHub
git clone https://github.com/TU_USUARIO/academic-registration-system.git
cd academic-registration-system

# Instalar dependencias
npm install
# o si usas pnpm
pnpm install

# Verificar que instaló correcto
ls -la node_modules | head -10
```

**Resultado esperado:**
```
✅ Carpeta ~/apps/academic-registration-system/
✅ node_modules/ con todas las dependencias
✅ .next/ ya generado
```

---

## 🔐 PASO 5: Variables de Entorno

```bash
# Crear archivo .env.local
nano .env.local
```

Pegar (con TUS valores de Supabase):
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tuyxyzproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Servidor
NEXT_PUBLIC_APP_URL=https://tudominio.com
NODE_ENV=production

# Base de datos (si usas direct)
DATABASE_URL=postgresql://...

# Auth
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_secret
NEXTAUTH_SECRET=generar_con: openssl rand -base64 32
```

Guardar: `Ctrl+X` → `Y` → `Enter`

---

## 🏗️ PASO 6: Build y Test Local

```bash
# Build
npm run build

# Test en localhost del server
NODE_ENV=production npm run start

# Visitando desde otra máquina:
# http://ip-hostinger:3000
# Ctrl+C para parar
```

**Resultado esperado:**
```
✅ Build completado sin errores
✅ Accesible en http://ip:3000
✅ Todos los archivos státicos sirviendo
```

---

## ⚙️ PASO 7: Configurar PM2 (Process Manager)

PM2 mantiene tu app corriendo siempre (auto-restart si cae):

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Crear archivo de configuración
nano ecosystem.config.js
```

Copiar esto:
```javascript
module.exports = {
  apps: [
    {
      name: "dashboard-academico",
      script: "npm",
      args: "start",
      cwd: "/root/apps/academic-registration-system",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      error_file: "/var/log/pm2/dashboard-error.log",
      out_file: "/var/log/pm2/dashboard-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G"
    }
  ]
};
```

Guardar y ejecutar:
```bash
pm2 start ecosystem.config.js

# Ver estado
pm2 status

# Ver logs
pm2 logs

# Hacer que inicie con el servidor
pm2 startup
pm2 save

# Para detener/reiniciar
pm2 stop dashboard-academico
pm2 restart dashboard-academico
pm2 delete dashboard-academico
```

**Resultado esperado:**
```
✅ App corriendo en puerto 3000
✅ Auto-reinicia si cae
✅ Logs visibles en pm2 logs
```

---

## 🌐 PASO 8: Configurar Nginx (Reverse Proxy)

Nginx es un servidor web que recibe en puerto 80/443 y envía a tu app en 3000:

```bash
# Instalar Nginx
sudo apt install -y nginx

# Crear configuración para tu app
sudo nano /etc/nginx/sites-available/default
```

Reemplazar TODO el contenido con esto:
```nginx
# Redirect HTTP a HTTPS (opcional, luego)
server {
    listen 80;
    listen [::]:80;
    server_name tu-dominio.com www.tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts para aplicaciones largas
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Servir archivos estáticos públicos directamente
    location ~* ^/(manifest\.json|sw\.js|images\/|fonts\/|public\/) {
        root /root/apps/academic-registration-system/.next/static;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Guardar y reiniciar:
```bash
# Verificar sintaxis
sudo nginx -t

# Reiniciar
sudo systemctl restart nginx

# Habilitar autostart
sudo systemctl enable nginx

# Ver estado
sudo systemctl status nginx
```

**Verificar:** 
```bash
# Desde tu PC
curl http://tu-ip-hostinger
# Debería cargar la app
```

---

## 🔒 PASO 9: Configurar SSL (HTTPS) con Let's Encrypt

HTTPS es OBLIGATORIO para PWA:

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado (automático)
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Seguir instrucciones:
# 1. Email para notificaciones
# 2. Aceptar términos
# 3. Share email (optional)
```

**Resultado:**
```
✅ Certificado instalado
✅ HTTP auto-redirige a HTTPS
✅ Válido por 90 días
✅ Auto-renew automático
```

Verificar:
```bash
# Deber renovarse automáticamente
sudo certbot renew --dry-run

# Ver certificados
sudo certbot certificates
```

---

## 🌍 PASO 10: Apuntar Dominio a Hostinger

### Si el dominio está en Hostinger:

1. **hPanel → Domains → tu-dominio.com**
2. **Manage → DNS**
3. Crear records:
   ```
   Tipo: A
   Name: @
   Value: TU_IP_HOSTINGER
   TTL: 3600
   
   Tipo: CNAME
   Name: www
   Value: tu-dominio.com
   TTL: 3600
   ```

### Si dominio está en otro registrador:

1. En tu registrador (GoDaddy, Namecheap, etc):
   ```
   DNS A Record:
   @        → TU_IP_HOSTINGER
   www      → TU_IP_HOSTINGER
   ```

2. Esperar propagación (5-30 minutos)

**Verificar:**
```bash
# Desde tu PC
nslookup tu-dominio.com
# Debería mostrar tu IP
```

---

## ✅ PASO 11: Verificar Todo Funciona

```bash
# En el VPS
pm2 status
pm2 logs

# Desde tu PC
# 1. Ir a https://tu-dominio.com
# 2. Verificar carga correctamente
# 3. Abrir DevTools (F12)
# 4. Application → Service Workers
# 5. Debe estar "active"
# 6. Application → Manifest
# 7. Debe listar todo el PWA
```

---

## 🔄 PASO 12: Updates y Deployments

### Actualizar código (sin downtime):

```bash
ssh usuario@tu-ip

cd ~/apps/academic-registration-system

# Traer cambios
git pull origin main

# Instalar nuevas dependencias (si hay)
npm install

# Rebuild
npm run build

# Reiniciar (con 0 downtime en cluster mode)
pm2 restart dashboard-academico --wait-ready

# Verificar
pm2 logs
```

### Comando rápido:
```bash
alias update-app='cd ~/apps/academic-registration-system && git pull && npm install && npm run build && pm2 restart dashboard-academico'

# Usar
update-app
```

---

## 🛡️ SEGURIDAD - Checklist

```bash
# 1. Cambiar contraseña SSH
passwd

# 2. Crear SSH key (mejor que contraseña)
ssh-keygen -t ed25519

# 3. Permisos correctos
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519

# 4. Firewall
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status

# 5. Backup automático
# Configurar en Hostinger panel → Backups

# 6. Monitorear logs
pm2 logs
sudo tail -f /var/log/nginx/error.log
```

---

## 📊 MONITOREO y LOGS

### PM2 Dashboard:
```bash
# Ver estado en vivo
pm2 monit

# Guardar logs
pm2 logs > /tmp/app.log

# Limpiar logs viejos
pm2 flush
```

### Nginx Logs:
```bash
# Acceso
sudo tail -f /var/log/nginx/access.log

# Errores
sudo tail -f /var/log/nginx/error.log

# Resumen
sudo tail -100 /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c
```

### Sistema:
```bash
# CPU y memoria
top

# O más bonito
sudo apt install -y htop
htop

# Espacio disco
df -h

# Conexiones
ss -tulpn | grep LISTEN
```

---

## ⚡ PERFORMANCE TIPS

### 1. Aumentar Workers PM2:
```javascript
// ecosystem.config.js
instances: 4,  // o más según CPU
```

### 2. Nginx Cache:
```nginx
# Agregar en /etc/nginx/sites-available/default
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;

location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 1h;
    # ...
}
```

### 3. Compresión:
```nginx
gzip on;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
gzip_min_length 1000;
```

---

## 🐛 TROUBLESHOOTING

### App no inicia
```bash
pm2 delete dashboard-academico
pm2 start ecosystem.config.js
pm2 logs  # Ver el error
```

### Nginx no sirve
```bash
sudo nginx -t  # Verificar sintaxis
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log
```

### Dominio no resuelve
```bash
nslookup tu-dominio.com
# Si no muestra tu IP, esperar propagación DNS
```

### SSL error
```bash
sudo certbot certificates
sudo certbot renew
```

### Puerto 3000 en uso
```bash
sudo lsof -i :3000
sudo kill -9 PID
pm2 restart dashboard-academico
```

### Base de datos no conecta
```bash
# Verificar variables en .env.local
nano .env.local

# Verificar que Supabase está online
# Desde PM2 logs
pm2 logs | grep -i "database\|supabase"
```

---

## 💰 COSTO ESTIMADO

```
Hostinger VPS (ya tienes):    $0 (ya contratado)
Dominio:                       $0-12/año (ya tienes?)
SSL (Let's Encrypt):           GRATIS
Backup automático:             Incluido o $5/mes
─────────────────────────────────────────────
TOTAL ADICIONAL:               $0-5/mes
```

---

## 📝 RESUMEN COMANDOS CLAVE

```bash
# Conectar
ssh usuario@tu-ip-hostinger

# Empezar app
cd ~/apps/academic-registration-system
pm2 start ecosystem.config.js

# Ver logs
pm2 logs

# Actualizar código
git pull
npm install
npm run build
pm2 restart dashboard-academico

# Detener/Reiniciar
pm2 stop dashboard-academico
pm2 restart dashboard-academico

# Ver qué está corriendo
pm2 status
pm2 monit

# Certificado SSL
sudo certbot renew
```

---

## ✨ ¡LISTO!

Tu dashboard académico estará corriendo en:
```
✅ https://tu-dominio.com
✅ PWA instalable
✅ Offline funcional
✅ Notificaciones activas
✅ Auto-backup
✅ SSL válido
✅ Escalable a más usuarios
```

---

## 📞 CONTACTO HOSTINGER

Si tienes problemas con tu VPS:
- **Support Hostinger:** https://support.hostinger.com
- **Chat 24/7:** Disponible en hPanel
- **Email:** support@hostinger.com

---

**¡Tu aplicación en Hostinger lista!** 🚀

*Última actualización: Feb 5, 2026*
