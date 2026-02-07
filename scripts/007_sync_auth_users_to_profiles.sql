-- =====================================================
-- Sincronizar users de auth con profiles
-- =====================================================

-- Crear perfiles para todos los usuarios de auth que no tengan uno
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data ->> 'full_name', u.email, 'Usuario'),
  COALESCE(u.raw_user_meta_data ->> 'role', 'student')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Comentario de completitud
COMMENT ON TABLE public.profiles IS 'Sincronizado desde auth.users. Cada usuario de auth DEBE tener un profile correspondiente.';

