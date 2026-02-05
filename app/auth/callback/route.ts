import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Verificar si el usuario necesita completar su perfil
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        // Si es estudiante y no tiene ficha estudiantil, redirigir
        if (profile?.role === "student") {
          const { data: studentProfile } = await supabase
            .from("student_profiles")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (!studentProfile) {
            return NextResponse.redirect(
              `${origin}/dashboard/profile/student-form`
            );
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redirigir a la página de error si hay problemas
  return NextResponse.redirect(`${origin}/auth/error?error=auth_callback_error`);
}
