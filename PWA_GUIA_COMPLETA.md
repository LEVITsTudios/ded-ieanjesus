# 📱 PWA (Progressive Web App) - Guía Completa

## ¿Qué es una PWA?

Una **Progressive Web App (PWA)** es una aplicación web que funciona como una app nativa con características como:
- ✅ Instalación en dispositivos (sin App Store)
- ✅ Funcionamiento offline
- ✅ Notificaciones push
- ✅ Sincronización automática de datos
- ✅ Acceso a características del dispositivo

## 🚀 Características Implementadas

### 1. **Instalación como App**
Tu dashboard ahora se puede instalar como una aplicación:
- En Android: Aparece un botón "Instalar" automáticamente
- En iPhone: Usa Share → "Add to Home Screen"
- En Desktop: Chrome muestra opción de instalación

### 2. **Funcionamiento Offline**
- Accede a tu dashboard sin conexión
- Los cambios se guardan localmente
- Sincronización automática cuando reconectes

### 3. **Notificaciones Push**
- Recibe notificaciones nativas en tu teléfono
- Incluso con la app cerrada
- Totalmente personalizable

### 4. **Dashboard Responsive**
- Se adapta a cualquier tamaño de pantalla
- Mobile-first design
- Navegación optimizada para dedo

## 📦 Instalación de la PWA

### Android
```
1. Abre el dashboard en Chrome
2. Toca el botón "Instalar" (arriba a la derecha)
3. Toca "Instalar"
4. ¡Listo! Tendrás un icono en tu pantalla de inicio
```

### iPhone/iPad
```
1. Abre el dashboard en Safari
2. Toca el botón Compartir (icono de flecha)
3. Toca "Agregar a la pantalla de inicio"
4. Nombra la app (ej: "LVTsAcademic")
5. Toca "Agregar"
```

### Desktop (Windows/Mac)
```
1. Abre el dashboard en Chrome
2. Haz clic en el icono de "Instalar" (arriba a la derecha)
3. Haz clic en "Instalar"
4. ¡Listo! Se agregará a tu menú de aplicaciones
```

## 🔌 Funcionamiento Offline

### ¿Cómo funciona?

```
ONLINE (Conexión Normal)
│
├─ Accedes a cualquier página
├─ Se guardan en caché
└─ Se sincroniza todo

        ↓↓↓

SIN CONEXIÓN
│
├─ Ves las páginas cacheadas
├─ Puedes editar/crear (se guarda localmente)
├─ Verás badge "Sin Conexión"
└─ Los cambios esperan sincronización

        ↓↓↓

VUELVE LA CONEXIÓN
│
├─ Se sincroniza automáticamente
├─ Los cambios se envían al servidor
├─ Recibes confirmación
└─ Datos se actualizan
```

### Qué funciona offline

✅ **SÍ funciona offline:**
- Ver cursos (si ya los visitaste)
- Ver horarios
- Ver calificaciones
- Ver historial de asistencias
- Leer anuncios

❌ **NO funciona offline:**
- Marcar asistencia (se sincroniza después)
- Crear nuevos quizzes (se sincroniza después)
- Subir materiales (se sincroniza después)

### Indicadores de estado

- **Verde Online**: Tienes conexión
- **Naranja Sin Conexión**: No hay internet
- **Azul Sincronizando**: Enviando cambios
- **X cambios pendientes**: Datos listos para sincronizar

## 🔔 Notificaciones Push

### Cómo habilitarlas

```
1. En el dashboard, verás una alerta: "Habilita notificaciones"
2. Haz clic en "Habilitar"
3. Tu navegador pedirá permiso
4. Haz clic en "Permitir"
5. ¡Listo! Recibirás notificaciones
```

### Tipos de notificaciones

| Tipo | Ejemplo | Cuándo |
|------|---------|--------|
| Clase | "Clase de Matemáticas en 10 min" | Inicio de clase |
| Calificación | "Se publicó tu calificación: 9.5" | Profesor cargó notas |
| Anuncio | "Nuevo anuncio importante" | Profesor creó anuncio |
| Asistencia | "Asistencia registrada" | Se marcó tu asistencia |
| Quiz | "Nuevo quiz disponible" | Se creó un nuevo quiz |

### Permisos necesarios

```
Notificaciones
├─ Básicas: Solo ver notificaciones
├─ Badge: Mostrar contador en el icono
└─ Sound & Vibration: Sonido y vibración
```

## 📊 Estrategias de Caching

Usamos 3 estrategias dependiendo del tipo de contenido:

### 1. **Cache First** (Recursos estáticos)
```
CSS, JavaScript, imágenes
│
├─ ¿Está en caché? → Usa caché
└─ ¿No? → Descarga y cacheа
```
**Ventaja:** Máxima velocidad  
**Desventaja:** Cambios lentos

### 2. **Network First** (APIs y datos)
```
Datos de usuarios, cursos, etc.
│
├─ ¿Hay conexión? → Descarga
├─ ¿Error? → Usa caché
└─ ¿Sin caché? → Muestra offline
```
**Ventaja:** Datos siempre frescos  
**Desventaja:** Más lento sin conexión

### 3. **Stale While Revalidate** (Contenido)
```
Páginas HTML
│
├─ Devuelve caché al instante
└─ En segundo plano, actualiza
```
**Ventaja:** Rápido + actualizado  
**Desventaja:** Complejidad

## 🔄 Sincronización de Datos

### Cómo funciona

```
1. Haces un cambio (editas, creas, etc)
   ↓
2. Si hay conexión → Se envía al instante
   Si NO hay → Se guarda localmente
   ↓
3. Cuando vuelve conexión → Automático sync
   ↓
4. Se sincroniza con servidor
   ↓
5. Recibes confirmación
```

### Forzar sincronización manual

```javascript
// En la consola del navegador
if ('serviceWorker' in navigator) {
  const registration = await navigator.serviceWorker.ready
  registration.sync.register('sync-data')
}
```

## 💾 Almacenamiento Local

### Dónde se guardan los datos

| Lugar | Tipo | Límite |
|-------|------|--------|
| **Cache API** | Recursos (CSS, JS) | ~50 MB |
| **IndexedDB** | Datos pendientes | ~100 MB |
| **LocalStorage** | Preferencias | ~5 MB |
| **SessionStorage** | Datos temp | ~5 MB |

### Ver datos guardados (Developer Tools)

```
Chrome DevTools:
1. F12 o Ctrl+Shift+I
2. Pestaña "Application"
3. Sección "Storage":
   ├─ Cache Storage (recursos)
   ├─ IndexedDB (datos pendientes)
   └─ LocalStorage (preferencias)
```

## 🔐 Seguridad y Privacidad

### HTTPS obligatorio
En producción, PWA REQUIERE HTTPS. Localhost funciona con HTTP.

### Datos sincronizados
- ✅ Se envían por HTTPS (encriptado)
- ✅ Validación en servidor
- ✅ Row Level Security (RLS) en DB
- ✅ Sin guardar contraseñas

### Borrar datos

```
Chrome/Edge/Firefox:
1. Abre DevTools (F12)
2. Pestaña "Application"
3. Botón "Clear site data"
4. Selecciona qué borrar
5. Click "Clear"
```

## 🐛 Solución de Problemas

### PWA no se instala

**Problema:** El botón no aparece  
**Soluciones:**
- Necesita HTTPS (en producción)
- Requiere manifest.json
- Debe haber SW registrado
- Usar navegador compatible

```bash
# Verificar en consola
if ('serviceWorker' in navigator) {
  console.log('✅ Service Worker soportado')
}
if ('Notification' in window) {
  console.log('✅ Notificaciones soportadas')
}
```

### Cambios no se sincronizan

**Problema:** Los datos no se envían  
**Soluciones:**
```
1. Verifica que tienes conexión (indicador verde)
2. Abre DevTools → Network → revisa requests
3. Recarga la página (Ctrl+F5)
4. Limpia caché (Application → Clear)
```

### Notificaciones no llegan

**Problema:** No recibes notificaciones  
**Soluciones:**
```
1. Verifica permiso de notificaciones
   DevTools → Application → Notifications
   
2. Si está "denied":
   - Haz clic en candado (URL bar)
   - Busca "Notificaciones"
   - Cambia a "Permitir"
   
3. Verifica que Service Worker esté activo
   DevTools → Application → Service Workers
```

### Caché antiguo

**Problema:** Ves una versión vieja del sitio  
**Soluciones:**
```
1. Recarga forzada: Ctrl+Shift+R o Cmd+Shift+R
2. Limpia caché: DevTools → Application → Clear
3. Desinstala app: Quita icono de escritorio
4. Reinstala: Vuelve a instalar
```

### Offline muy lento

**Problema:** El sitio va lento sin conexión  
**Soluciones:**
```
1. Recarga una vez (pre-caché)
2. Visita páginas principales primero
3. Los datos cacheados mejoran con el tiempo
```

## 📈 Monitoreo y Estadísticas

### Verificar qué está cacheado

```javascript
// En consola del navegador
caches.keys().then(names => {
  names.forEach(name => {
    caches.open(name).then(cache => {
      cache.keys().then(requests => {
        console.log(`${name}: ${requests.length} items`)
      })
    })
  })
})
```

### Ver datos pendientes

```javascript
// En consola
const db = await indexedDB.databases()
console.log('IndexedDB bases:', db)
```

## 🎯 Mejores Prácticas

### Para usuarios

✅ **Haz:**
- Instala la app para mejor experiencia
- Habilita notificaciones
- Usa offline frecuentemente
- Permite actualizar cuando pida

❌ **No hagas:**
- No limpies caché constantemente
- No deshabilites notificaciones
- No forces cerrar app
- No edites múltiples cosas offline simultáneamente

### Para desarrolladores

```
Caching:
✅ Cache primera (assets estáticos)
✅ Network first (datos importantes)
✅ Stale while revalidate (contenido)

Sincronización:
✅ Enqueue requests offline
✅ Sincronizar en batch
✅ Reintentar con backoff

Notificaciones:
✅ Ser selectivo (no spam)
✅ Dar contexto
✅ Permitir silenciar
```

## 📱 Compatibilidad

| Navegador | Desktop | Mobile |
|-----------|---------|--------|
| Chrome | ✅ Full | ✅ Full |
| Edge | ✅ Full | ✅ Full |
| Firefox | ✅ Full | ✅ Full |
| Safari | ✅ Básico | ⚠️ Limitado |
| Opera | ✅ Full | ✅ Full |

## 🔗 Enlaces Útiles

- [MDN PWA](https://developer.mozilla.org/es/docs/Web/Progressive_web_apps)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [Caniuse PWA](https://caniuse.com/pwa)
- [Service Workers](https://developer.mozilla.org/es/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/es/docs/Web/API/Push_API)

## ❓ Preguntas Frecuentes

**¿Es seguro usar offline?**  
Sí, los datos se validan en el servidor cuando sincroniza.

**¿Cuánto espacio usa?**  
Típicamente 10-50 MB dependiendo de uso. Maximum 100 MB.

**¿Se sincroniza sin pedir?**  
Sí, automáticamente cuando vuelve conexión.

**¿Puedo desinstalar?**  
Sí, quita el icono. Vuelve al sitio web normal.

**¿Funciona en todas partes?**  
No, necesita HTTPS en producción. Localhost = HTTP funciona.

**¿Las notificaciones llegan siempre?**  
Depende del SO. Android es más confiable que iOS.

---

**¡Listo! Tu dashboard es ahora una PWA completa con offline-first** 🚀
