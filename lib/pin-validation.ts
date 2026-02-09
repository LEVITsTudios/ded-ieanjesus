import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Verifica que el PIN fue validado recientemente en la sesión actual
 * Retorna true si es seguro continuar, false si necesita validación
 */
export async function verifyPinValidationStatus(
  request: NextRequest
): Promise<{ isPinValidated: boolean; requiresPinValidation: boolean }> {
  try {
    // 1. Verificar si hay cookie de PIN validado
    const pinValidatedCookie = request.cookies.get("pin_validated");
    if (pinValidatedCookie) {
      const { value } = pinValidatedCookie;
      try {
        const { timestamp, userId } = JSON.parse(value);
        // Cookie válida por 1 hora (3600000 ms)
        if (Date.now() - timestamp < 3600000) {
          return { isPinValidated: true, requiresPinValidation: false };
        }
      } catch {
        // Cookie corrupta, ignorar
      }
    }

    // 2. Verificar con servidor si usuario tiene PIN
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return { isPinValidated: false, requiresPinValidation: false };
    }

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { isPinValidated: false, requiresPinValidation: false };
    }

    // 3. Verificar si usuario tiene PIN activo
    const { data: pinData, error } = await supabase
      .from("security_pins")
      .select("is_active")
      .eq("user_id", user.id)
      .single();

    if (error || !pinData?.is_active) {
      // No hay PIN o está inactivo
      return { isPinValidated: false, requiresPinValidation: false };
    }

    // 4. Usuario tiene PIN pero no está validado en esta sesión
    return { isPinValidated: false, requiresPinValidation: true };
  } catch (err) {
    console.error("Error checking PIN validation status:", err);
    return { isPinValidated: false, requiresPinValidation: false };
  }
}

/**
 * Marca el PIN como validado para la sesión actual
 * Se usa después de una validación exitosa
 */
export function createPinValidatedCookie(userId: string) {
  const value = JSON.stringify({
    userId,
    timestamp: Date.now(),
  });

  return {
    name: "pin_validated",
    value,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 3600, // 1 hora en segundos
      path: "/",
    },
  };
}

/**
 * Limpia la cookie de PIN validado (para logout)
 */
export function clearPinValidatedCookie() {
  return {
    name: "pin_validated",
    value: "",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 0,
      path: "/",
    },
  };
}
