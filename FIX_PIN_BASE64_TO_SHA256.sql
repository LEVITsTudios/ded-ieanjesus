-- 🧹 ELIMINAR PIN VIEJO (Base64) Y CREAR UNO NUEVO (SHA-256)

-- PASO 1: Ver el PIN actual (ANTES)
SELECT user_id, pin_hash, LENGTH(pin_hash) as length
FROM security_pins
LIMIT 1;
-- Esperado: pin_hash = "MjqwNzlw" (es Base64, muy corto)

-- PASO 2: Eliminar PINs que NO sean SHA-256 válido
DELETE FROM security_pins
WHERE LENGTH(pin_hash) < 64 
   OR pin_hash !~ '^[a-f0-9]+$';

-- PASO 3: Verificar que se eliminó
SELECT COUNT(*) as pines_restantes FROM security_pins;
-- Esperado: 0 (si no tenías otros PINs)

-- PASO 4: Ahora el usuario debe crear un PIN NUEVO en la aplicación
-- La nueva lógica SHA-256 está activa en el servidor
-- PIN: 123456 (o el que prefieras)

-- PASO 5: Verificar que el nuevo PIN tiene formato correcto (SHA-256)
SELECT user_id, pin_hash, LENGTH(pin_hash) as length
FROM security_pins
LIMIT 1;
-- Esperado: pin_hash = "a665a45920422f9d..." (64 caracteres hex)
