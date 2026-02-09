import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { clearPinValidatedCookie } from "@/lib/pin-validation";

/**
 * POST /api/auth/logout
 * Limpia la sesión y las cookies de validación
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[Logout API] POST request started");

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return NextResponse.json(
        { error: "Configuración incorrecta" },
        { status: 500 }
      );
    }

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Configurar las cookies de respuesta
          cookiesToSet.forEach(({ name, value, options }) => {
            // Serán manejadas abajo
          });
        },
      },
    });

    // Hacer logout en Supabase
    console.log("[Logout API] Signing out user");
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.warn("[Logout API] SignOut warning:", signOutError);
      // Continuar de todas formas
    }

    // Crear respuesta
    const response = NextResponse.json(
      { success: true, message: "Logout exitoso" },
      { status: 200 }
    );

    // Limpiar cookie de PIN validado
    const pinCookie = clearPinValidatedCookie();
    response.cookies.set(
      pinCookie.name,
      pinCookie.value,
      pinCookie.options
    );

    // Limpiar cookies de sesión de Supabase
    response.cookies.delete("sb-auth-token");
    response.cookies.set("sb-auth-token", "", { maxAge: 0, path: "/" });

    console.log("[Logout API] Logout complete");
    return response;
  } catch (err) {
    console.error("[Logout API] Error:", err);
    return NextResponse.json(
      { error: "Error al hacer logout", details: String(err) },
      { status: 500 }
    );
  }
}
