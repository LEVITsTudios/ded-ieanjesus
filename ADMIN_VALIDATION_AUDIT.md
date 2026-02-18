# 🔍 AUDITORÍA DE ACCESIBILIDAD ADMIN - CRUDS COMPLETOS

**Fecha:** Febrero 12, 2026  
**Estado:** En Validación  
**Prioridad:** CRÍTICA - Bloquea Producción

---

## 📊 RESUMEN EJECUTIVO

| Aspecto | Status | Detalles |
|---------|--------|----------|
| **Páginas Dashboard** | ⚠️ 13/15 | 2 páginas faltando |
| **Endpoints API** | ⚠️ 9/13 | 4 endpoints faltando |
| **Protección Roles** | ✅ OK | Validado en endpoints existentes |
| **Permisos CRUD Admin** | ⚡ REVIEW | Algunos demasiado restrictivos |
| **Accesibilidad Admin** | 87% | Necesita correcciones finales |

---

## ❌ PÁGINAS FALTANTES (Admin debe acceder)

### 1. `/dashboard/reports` ❌ NO EXISTE
- **Sidebar:** ✅ Listado (línea 99-103)
- **Página:** ❌ Falta crear `app/dashboard/reports/page.tsx`
- **Roles:** admin, teacher
- **CRUD Requerido:** Read (ver reportes), Posible Export
- **Impacto:** Admin NO puede ver reportes

```tsx
// FALTA CREAR: app/dashboard/reports/page.tsx
- Seleccionar período
- Filtrar por curso/estudiante
- Exportar PDF/Excel
- Gráficas de desempeño
```

### 2. `/dashboard/settings` ❌ NO EXISTE  
- **Sidebar:** ✅ Listado (línea 116-119)
- **Página:** ❌ Falta crear `app/dashboard/settings/page.tsx`
- **Roles:** admin
- **CRUD Requerido:** Read/Write configuraciones
- **Impacto:** Admin NO puede configurar sistema

```tsx
// FALTA CREAR: app/dashboard/settings/page.tsx
- Configuración de períodos académicos
- Horarios por defecto
- Escalas de calificación
- Políticas de asistencia
```

---

## ❌ ENDPOINTS API FALTANTES

### 1. `/api/attendance` ❌ FALTA
- **Página:** ✅ Existe `app/dashboard/attendance/page.tsx`
- **Endpoint GET:** ❌ NO EXISTE
- **Endpoint POST:** ❌ NO EXISTE  
- **Endpoint PUT:** ❌ NO EXISTE
- **Impacto:** Admin NO puede crear/editar asistencias via API

**Requiere:** Crear `app/api/attendance/route.ts` y `app/api/attendance/[id]/route.ts`

### 2. Rutas específicas faltando validación

| Endpoint | GET | POST | PUT | DELETE | Status |
|----------|-----|------|-----|--------|--------|
| /api/users | ✅ | ✅ | ❓ | ❓ | Check PUT/DEL |
| /api/courses | ✅ | ✅ | ✅ | ✅ | OK |
| /api/grades | ✅ | ✅ | ✅ | ✅ | OK |
| /api/attendance | ❌ | ❌ | ❌ | ❌ | **FALTA** |
| /api/materials | ✅ | ✅ | ❓ | ❓ | Check PUT/DEL |
| /api/meetings | ✅ | ✅ | ❓ | ❓ | Check PUT/DEL |
| /api/announcements | ✅ | ✅ | ❓ | ❓ | Check PUT/DEL |

---

## ⚡ PROBLEMAS DE AUTORIZACIÓN (Demasiado Restrictivos)

### Problema 1: Teachers NO pueden crear Materiales en sus Cursos
```typescript
// ACTUAL - /api/materials/route.ts (línea 30)
if (!user || user.user_metadata?.role !== 'admin') { // ❌ SOLO ADMIN
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// DEBE SER:
const userRole = user.user_metadata?.role
const isAdmin = userRole === 'admin'
const isTeacherOwner = userRole === 'teacher' && /* verify course ownership */
if (!user || (!isAdmin && !isTeacherOwner)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Problema 2: Teachers NO pueden registrar Asistencias
- Endpoint NO existe, pero en DB docentes deben poder registrar
- **Solución:** Crear endpoint `/api/attendance` con validación de rol

### Problema 3: Teachers NO pueden actualizar sus Calificaciones
```typescript
// ACTUAL - /api/grades/[id]/route.ts (línea 28)
if (!user || user.user_metadata?.role !== 'admin') { // ❌ SOLO ADMIN PUEDE EDITAR
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// DEBE SER:
const isAdmin = user.user_metadata?.role === 'admin'
const isTeacherOwner = user.user_metadata?.role === 'teacher' && /* verify course */
if (!user || (!isAdmin && !isTeacherOwner)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

## ✅ VALIDACIONES CORRECTAS (Endpoints con Protección OK)

| Endpoint | Validación | Detalle |
|----------|-----------|---------|
| POST /api/courses | ✅ Admin | Solo admin crea cursos |
| PUT /api/courses/[id] | ✅ Admin | Solo admin edita |
| DELETE /api/courses/[id] | ✅ Admin | Solo admin elimina |
| GET /api/users | ✅ Admin/Teacher | Profesores ven estudiantes |
| POST /api/users | ✅ Admin | Solo admin crea usuarios |
| GET /api/courses | ✅ Public | Todos ven cursos |
| GET /api/grades | ✅ Autenticado | Cualquiera puede ver |
| POST /api/grades | ✅ Admin | Solo admin registra notas |

---

## 🔧 PLAN DE CORRECCIONES

### Fase 1: Crear Páginas Faltantes (30 minutos)
```bash
1. app/dashboard/reports/page.tsx        # Para admin + teacher
2. app/dashboard/reports/components/     # Componentes de reportes
3. app/dashboard/settings/page.tsx       # Para admin solo
4. app/dashboard/settings/components/    # Componentes de config
```

### Fase 2: Crear Endpoints Faltantes (45 minutos)  
```bash
1. app/api/attendance/route.ts           # GET, POST para crear asistencias
2. app/api/attendance/[id]/route.ts      # PUT, DELETE para editar asistencias
3. Validación: Solo admin o teacher dueño del curso
```

### Fase 3: Ajustar Permisos (30 minutos)
```bash
1. /api/materials - Permitir teachers en sus cursos
2. /api/grades - Permitir teachers editar notas de sus estudiantes
3. /api/announcements - Permitir teachers crear anuncios de curso
4. /api/meetings - Permitir teachers organizar reuniones
```

### Fase 4: Validar Accesibilidad (30 minutos)
```bash
1. Pruebas Admin: Todas las 15 opciones del sidebar funcionan
2. Pruebas Teacher: Pueden acceder solo a lo permitido
3. Pruebas Student: No ven opciones de admin
4. E2E: CRUD completo para admin en cada módulo
```

---

## 📋 CHECKLIST DE PRODUCCIÓN

Para que Admin tenga acceso 100% a todos los CRUDS:

- [ ] `/dashboard/reports` existe y es accesible
- [ ] `/dashboard/settings` existe y es accesible
- [ ] `/api/attendance` (GET, POST, PUT, DELETE) existe
- [ ] `/api/users` tiene PUT y DELETE protegidos
- [ ] `/api/materials` permite teachers en sus cursos
- [ ] `/api/grades` permite teachers editar notas propias
- [ ] `/api/announcements` permite teachers crear
- [ ] `/api/meetings` permite teachers organizar
- [ ] Todos los endpoints validan `auth.uid()` correctamente
- [ ] RLS policies en DB coinciden con validaciones API
- [ ] E2E tests: Admin completa CRUD en cada módulo
- [ ] Sidebar muestra SOLO opciones permitidas por rol

---

## 🚀 IMPACTO EN PRODUCCIÓN

**Bloqueadores Críticos:**
- ❌ Admin NO puede ver reportes (falta página)
- ❌ Admin NO puede configurar sistema (falta página)
- ❌ No hay API para gestionar asistencias via código
- ❌ Teachers no pueden crear materiales en sus cursos (muy restrictivo)

**Severidad:** CRÍTICA - Debe resolverse ANTES de producción

---

**Siguiente Paso:** Proceder con correcciones de Fase 1 y 2
