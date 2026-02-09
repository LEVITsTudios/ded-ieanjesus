-- ============================================
-- 🧹 LIMPIAR PINs VIEJOS (Base64 → SHA-256)
-- ============================================

-- PASO 1: DEBUG - Ver PINs actuales
-- Ejecuta esto primero para ver qué hay
SELECT 
  id, 
  user_id, 
  pin_hash,
  LENGTH(pin_hash) as hash_length,
  is_active, 
  created_at 
FROM security_pins 
ORDER BY created_at DESC;

-- ============================================
-- PASO 2: IDENTIFICAR PINs VIEJOS (Base64)
-- ============================================

-- Base64 característicos:
-- - Contiene caracteres: +, /, =
-- - Longitud variable (normalmente < 24-32)
-- SHA-256 característico:
-- - Solo hex: [a-f0-9]
-- - Exactamente 64 caracteres

SELECT 
  id,
  user_id,
  pin_hash,
  LENGTH(pin_hash) as length,
  CASE 
    WHEN pin_hash ~ '[+/=]' THEN '❌ Base64 (tiene + / =)'
    WHEN LENGTH(pin_hash) < 64 THEN '❌ Base64 (muy corto)'
    WHEN pin_hash ~ '^[a-f0-9]{64}$' THEN '✅ SHA-256 válido'
    ELSE '⚠️ DESCONOCIDO'
  END as tipo
FROM security_pins
ORDER BY created_at DESC;

-- ============================================
-- PASO 3: ELIMINAR PINs VIEJOS (Base64)
-- ============================================
-- ⚠️ DESCOMENTAR SOLO SI VERIFICASTE EL PASO 2

/* Descomenta la siguiente línea para ejecutar:
DELETE FROM security_pins 
WHERE 
  pin_hash ~ '[+/=]'  -- Contiene caracteres Base64
  OR (
    LENGTH(pin_hash) < 64 
    AND pin_hash NOT ~ '^[a-f0-9]{64}$'  -- No es SHA-256
  );

;*/

-- ============================================
-- PASO 4: VERIFICACIÓN FINAL
-- ============================================
-- Ejecuta esto DESPUÉS de limpiar para confirmar

SELECT 
  'VÁLIDOS (SHA-256)' as estado,
  COUNT(*) as cantidad
FROM security_pins
WHERE LENGTH(pin_hash) = 64
  AND pin_hash ~ '^[a-f0-9]{64}$'

UNION ALL

SELECT 
  'INVÁLIDOS (Base64 o corrupto)' as estado,
  COUNT(*) as cantidad
FROM security_pins
WHERE NOT (
  LENGTH(pin_hash) = 64
  AND pin_hash ~ '^[a-f0-9]{64}$'
);

-- ============================================
-- INFORMACIÓN ADICIONAL
-- ============================================
-- Tabla: security_pins
-- Campo importante: pin_hash
-- Formato esperado: hexadecimal de 64 caracteres
-- Ejemplo válid: a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3

-- Tabla: pin_attempt_logs (para auditoría)
SELECT 
  id,
  user_id,
  success,
  attempt_time,
  ip_address,
  CASE WHEN success THEN '✅' ELSE '❌' END as resultado
FROM pin_attempt_logs
ORDER BY attempt_time DESC
LIMIT 10;
