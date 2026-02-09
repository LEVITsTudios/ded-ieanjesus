# ⚠️ PROBLEMA: PIN Guardado en Formato Viejo (Base64)

## 🔍 Diagnóstico

El PIN está guardado en **Base64** (`MjqwNzlw`), pero el servidor está hasheando con **SHA-256**.

```
Base64 en BD:   MjqwNzlw (8 chars)
SHA-256 esperado: a665a45920422f9d... (64 chars hex)
                                       ❌ No coinciden
```

## ✅ Solución (3 pasos rápidos)

### PASO 1: Elimina el PIN viejo en Supabase

1. Abre Supabase Dashboard
2. SQL Editor → Copia esto:

```sql
DELETE FROM security_pins
WHERE LENGTH(pin_hash) < 64;
```

3. Click "Run" ✓

### PASO 2: Recarga la aplicación

- Presiona F5 o Ctrl+R en http://192.168.101.71:3000

### PASO 3: Crea un PIN nuevo

1. Haz login normalmente (email + password)
2. Verás el diálogo de PIN
3. Ingresa un PIN nuevo: **`123456`** (o el que prefieras)
4. Confirma: **`123456`**
5. Click "Guardar"

**Mira la consola del servidor:**
```
[PIN API] PIN hash (first 20 chars): a665a45920422f9d...
[PIN API] PIN hash length: 64 (should be 64) ✓
```

### PASO 4: Ahora valida el PIN

1. Ingresa los 6 dígitos: `1 2 3 4 5 6`
2. **Debe funcionar** ✅

---

## 🐛 Si aún dice "PIN incorrecto"

**Debug:**

1. Verifica en BD que el nuevo PIN tiene 64 caracteres:
```sql
SELECT pin_hash, LENGTH(pin_hash) FROM security_pins LIMIT 1;
```

**Esperado:**
```
pin_hash                                              length
a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e... 64
```

2. Verifica en consola:
   - ✓ Token obtenido: `[PIN Verify] Session token obtained`
   - ✓ Decodificado: Debe ver el user_id
   - ✓ PIN hasheado: Debe coincidir con BD

---

## 📋 Resumen de Cambios 

- ✅ Servidor hashea PIN con SHA-256
- ✅ Cliente obtiene token de sesión
- ✅ Servidor valida token
- ✅ PIN nuevo se guarda en SHA-256

**Siguiente:** Elimina PIN viejo y crea uno nuevo 👆
