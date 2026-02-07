-- =====================================================
-- Agregar políticas RLS para CRUD completo de admin en profiles
-- =====================================================

-- Permitir al admin insertar nuevos perfiles
CREATE POLICY "profiles_insert_admin" ON public.profiles FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Permitir al admin actualizar cualquier perfil
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_admin_or_own" ON public.profiles FOR UPDATE 
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Las políticas de SELECT y DELETE ya existen y funcionan correctamente:
-- - SELECT: "profiles_select_all" - todos pueden ver
-- - DELETE: "profiles_delete_admin" - solo admins pueden eliminar

-- Comentario
COMMENT ON POLICY "profiles_insert_admin" ON public.profiles IS 'Permite al admin crear nuevos perfiles de usuario';
COMMENT ON POLICY "profiles_update_admin_or_own" ON public.profiles IS 'Permite al admin actualizar cualquier perfil, usuarios actualizan solo el propio';
