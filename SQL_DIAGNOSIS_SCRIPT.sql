-- ============================================================
-- SCRIPT DE DIAGNÓSTICO: Revisar y Arreglar RLS en Supabase
-- ============================================================
-- Ejecuta estos comandos en el SQL Editor de Supabase

-- PASO 1: Verificar estado actual de RLS en tabla profiles
-- =========================================================
SELECT 
  tablename,
  rowsecurity as "RLS Enabled?"
FROM pg_tables 
WHERE tablename = 'profiles';

-- Resultado esperado: rowsecurity = true (t)


-- PASO 2: Ver todas las políticas actuales
-- ==========================================
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Si está vacío = ❌ No hay políticas (por eso falla)


-- PASO 3: Ver estructura de la tabla profiles
-- =============================================
\d profiles;

-- Verificar que existe columna 'id' de tipo UUID


-- PASO 4: ARREGLO - Ejecutar esto si no hay políticas o son incorrectas
-- ====================================================================

-- 4a. Habilitar RLS si no está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4b. ELIMINAR políticas old si existen
-- (Descomenta si necesitas borrar políticas existentes)
-- DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
-- DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
-- DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
-- DROP POLICY IF EXISTS "Admin can do everything" ON profiles;

-- 4c. CREAR nuevas políticas correctas
-- SELECT: Los usuarios pueden ver sus propios datos
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- UPDATE: Los usuarios pueden actualizar sus propios datos
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT: Los usuarios pueden crear su propio perfil
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- DELETE: Los usuarios pueden eliminar su propio perfil
CREATE POLICY "Users can delete their own profile"
  ON profiles
  FOR DELETE
  USING (auth.uid() = id);


-- PASO 5: Verificar que las políticas se crearon correctamente
-- ============================================================
SELECT 
  policyname,
  tablename,
  qual as "USING Clause",
  with_check as "WITH CHECK Clause"
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Deberías ver 4 políticas: SELECT, UPDATE, INSERT, DELETE


-- PASO 6: Test - Verificar que el usuario autenticado puede acceder
-- =================================================================
-- Este query solo funcionará si:
-- 1. Estás autenticado en Supabase
-- 2. Existe un registro en profiles con tu user ID
SELECT 
  id,
  full_name,
  email,
  phone,
  date_of_birth,
  dni,
  updated_at
FROM profiles
WHERE id = auth.uid()
LIMIT 1;

-- Si retorna data = ✅ Las políticas RLS funcionan correctamente
-- Si retorna error 406 = ❌ Aún hay problema con RLS


-- PASO 7: Verificar que existe un registro para el usuario actual
-- ===============================================================
SELECT auth.uid() as "Your User ID";

-- Luego verifica si existe ese ID en profiles:
SELECT COUNT(*) FROM profiles WHERE id = '[PASTE_USER_ID_HERE]';

-- Si COUNT = 0, necesitas insertar un registro inicial:
INSERT INTO profiles (id, email, full_name)
VALUES (auth.uid(), auth.jwt() ->> 'email', 'Nombre Inicial')
ON CONFLICT (id) DO NOTHING;

