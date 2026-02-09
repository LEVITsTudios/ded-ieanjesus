# 🔧 SOLUCIÓN: PIN Guardado en Format Viejo (Base64)

## El Problema Exacto

**PIN en BD:** `MjqwNzlw` (Base64, 8 caracteres)
**PIN esperado:** `a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3` (SHA-256, 64 caracteres)

**Resultado:** 401 Unauthorized porque los hashes NO coinciden

---

## ✅ SOLUCIÓN EN 4 PASOS

### PASO 1: Verifica el Servidor (Importante)

Mira la **terminal donde corre Next.js**, busca:

```
✓ Ready in X.Xs
```

Si **NO ves esto** después de reiniciar, significa que el servidor está compilando todavía.

**Si YES visto:**
```bash
npm run dev
```
Presiona **Ctrl+C** para detener y luego ejecuta de nuevo.

---

### PASO 2: Elimina el PIN Viejo en Supabase

1. **Abre:** https://supabase.com → Tu proyecto
2. **Click:** SQL Editor (lado izquierdo)
3. **Copia y pega esto:**

```sql
DELETE FROM security_pins 
WHERE LENGTH(pin_hash) < 64;
```

4. **Click:** Botón "Run" (verde)
5. **Resultado:** Debe decir "1 row deleted" (o el número de PINs viejos)

---

### PASO 3: Recarga la App

- Abre: http://192.168.101.71:3000/auth/login
- Presiona: **Ctrl+Shift+R** (reload hard, sin caché)
- O abre en **incógnita** (nueva ventana privada)

---

### PASO 4: Crea un PIN Nuevo

1. **Haz login** con tus credenciales (email + password)

2. **Aparecerá diálogo de PIN**

3. **Ingresa:** `123456` (en los 6 campos)
   - Debería auto-avanzar

4. **Confirma:** `123456`

5. **Click:** "Guardar"

---

### PASO 5: Revisa los Logs (Debug)

**En la terminal del servidor, busca:**

```
[PIN API] PIN hash length: 64 (should be 64) ✓
```

**Y después:**

```
[PIN Verify API] ===== HASH COMPARISON =====
[PIN Verify API] Client hash:     a665a45920422f9d...
[PIN Verify API] Database hash:   a665a45920422f9d...
[PIN Verify API] Are they equal?  true ✓
```

---

### PASO 6: Valida el PIN

1. **Aparecer diálogo de validación**
2. **Ingresa:** `1 2 3 4 5 6`
3. **Resultado:** ✅ **Debe permitir acceso al dashboard**

---

## 🐛 Si Sigue Sin Funcionar

**Revisa:**

1. **Terminal del servidor** - ¿Hay error al compilar?
2. **Consola del navegador (F12)** - ¿Error en cliente?
3. **Supabase SQL** - ¿El PIN tiene 64 caracteres?

```sql
SELECT pin_hash, LENGTH(pin_hash) FROM security_pins LIMIT 1;
```

---

## 🎯 Resumen de por qué sucedió

1. Primero guardé PIN en Base64 (código viejo)
2. Luego cambié a SHA-256 (código nuevo)
3. El PIN viejo en BD no se limpió automáticamente
4. Al verificar, compara SHA-256 con Base64 → No coinciden → 401

**Solución:** Eliminar PIN viejo, crear uno nuevo con SHA-256 ✅

---

**Avísame cuando lo hagas y qué ves en los logs** 👈
