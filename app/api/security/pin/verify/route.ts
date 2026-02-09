import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  createPinValidatedCookie,
  clearPinValidatedCookie,
} from "@/lib/pin-validation";

/**
 * POST /api/security/pin/verify
 * Valida el PIN del usuario y establece cookie de validación
 * Si es exitoso, establece httpOnly cookie que persiste por 1 hora
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[PIN Verify API] POST request started");

    const body = await request.json();
    const { pin, userId } = body;

    if (!pin || pin.length < 4 || pin.length > 6) {
      return NextResponse.json(
        { error: "PIN debe tener 4-6 dígitos" },
        { status: 400 }
      );
    }

    if (!/^\d+$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN solo debe contener dígitos" },
        { status: 400 }
      );
    }

    if (!userId) {
      console.error("[PIN Verify API] No userId provided");
      return NextResponse.json(
        { error: "Usuario no identificado" },
        { status: 400 }
      );
    }

    // Crear cliente Supabase
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error("[PIN Verify API] Missing Supabase env vars");
      return NextResponse.json(
        { error: "Configuración del servidor incorrecta" },
        { status: 500 }
      );
    }

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    });

    // ✅ Obtener token del Authorization header (NUEVO MÉTODO)
    const authHeader = request.headers.get('authorization');
    console.log("[PIN Verify API] Auth header present:", !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("[PIN Verify API] No Authorization header or invalid format");
      return NextResponse.json(
        { error: "No autenticado. Por favor inicia sesión" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remover "Bearer "
    console.log("[PIN Verify API] Token extracted:", token.substring(0, 20) + '...');

    // Decodificar JWT para obtener el user_id
    console.log("[PIN Verify API] Attempting to decode JWT...");
    const decodedToken = decodeJwt(token);
    
    if (!decodedToken) {
      console.error("[PIN Verify API] Failed to decode JWT token");
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    const tokenUserId = decodedToken.sub; // 'sub' es el user_id en JWTs de Supabase
    console.log("[PIN Verify API] Token contains user_id:", tokenUserId);
    console.log("[PIN Verify API] Request body userId:", userId);
    console.log("[PIN Verify API] Do they match?", tokenUserId === userId);

    if (tokenUserId !== userId) {
      console.error("[PIN Verify API] User ID mismatch:", {
        tokenUserId: tokenUserId?.substring(0, 20) + '...',
        providedUserId: userId?.substring(0, 20) + '...',
        exactMatch: tokenUserId === userId,
        tokenUserIdType: typeof tokenUserId,
        userIdType: typeof userId,
      });
      return NextResponse.json(
        { error: "No autorizado. User ID mismatch" },
        { status: 403 }
      );
    }

    console.log("[PIN Verify API] Token validation successful. Continuing with PIN verification...");

    // Hash del PIN usando SHA-256
    const pinHash = await hashPin(pin);
    
    console.log("[PIN Verify API] Client provided PIN hash:", pinHash.substring(0, 20) + '...');
    console.log("[PIN Verify API] Client provided PIN hash length:", pinHash.length);

    console.log("[PIN Verify API] Fetching PIN hash from database for user:", userId);

    // Obtener PIN hasheado de la BD (usando client con token)
    const { data: pinData, error: fetchError } = await supabase
      .from("security_pins")
      .select("pin_hash, is_active")
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      console.error("[PIN Verify API] Error fetching PIN:", fetchError);
      return NextResponse.json(
        { error: "PIN no configurado" },
        { status: 404 }
      );
    }

    if (!pinData) {
      console.error("[PIN Verify API] No PIN found for user");
      return NextResponse.json(
        { error: "PIN no configurado para este usuario" },
        { status: 404 }
      );
    }

    console.log("[PIN Verify API] PIN from database:", pinData.pin_hash.substring(0, 20) + '...');
    console.log("[PIN Verify API] PIN from database length:", pinData.pin_hash.length);
    console.log("[PIN Verify API] PIN is_active:", pinData.is_active);

    if (!pinData?.is_active) {
      console.error("[PIN Verify API] PIN is not active");
      return NextResponse.json(
        { error: "PIN desactivado" },
        { status: 403 }
      );
    }

    // Comparar hashes
    const isValid = pinData.pin_hash === pinHash;
    
    console.log("[PIN Verify API] ===== HASH COMPARISON =====");
    console.log("[PIN Verify API] Client hash:    ", pinHash.substring(0, 30) + '...');
    console.log("[PIN Verify API] Database hash:  ", pinData.pin_hash.substring(0, 30) + '...');
    console.log("[PIN Verify API] Are they equal? ", isValid);
    console.log("[PIN Verify API] Client length:  ", pinHash.length);
    console.log("[PIN Verify API] Database length:", pinData.pin_hash.length);

    if (!isValid) {
      console.log("[PIN Verify API] PIN validation FAILED for user:", userId);

      // Registrar intento fallido
      try {
        await supabase.from("pin_attempt_logs").insert({
          user_id: userId,
          success: false,
          ip_address: await getClientIp(),
          user_agent: request.headers.get("user-agent") || "",
        });
      } catch (logErr) {
        console.warn("[PIN Verify API] Failed to log attempt:", logErr);
      }

      return NextResponse.json(
        { 
          success: false,
          error: "PIN incorrecto" 
        },
        { status: 401 }
      );
    }

    console.log("[PIN Verify API] PIN validation successful for user:", userId);

    // Registrar intento exitoso
    try {
      await supabase.from("pin_attempt_logs").insert({
        user_id: userId,
        success: true,
        ip_address: await getClientIp(),
        user_agent: request.headers.get("user-agent") || "",
      });
    } catch (logErr) {
      console.warn("[PIN Verify API] Failed to log attempt:", logErr);
    }

    // ✅ PIN VÁLIDO: Crear respuesta con cookie
    const response = NextResponse.json(
      {
        success: true,
        message: "PIN validado exitosamente",
      },
      { status: 200 }
    );

    // Establecer httpOnly cookie de validación
    const cookie = createPinValidatedCookie(userId);
    response.cookies.set(
      cookie.name,
      cookie.value,
      cookie.options
    );

    return response;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : "";

    console.error("[PIN Verify API] POST error:", {
      message: errorMsg,
      stack: errorStack,
      fullError: String(err),
    });

    return NextResponse.json(
      { error: "Error al procesar solicitud", details: errorMsg },
      { status: 500 }
    );
  }
}

/**
 * GET /api/security/pin/verify
 * Obtiene el estado de validación del PIN para la sesión actual
 */
export async function GET(request: NextRequest) {
  try {
    const pinValidatedCookie = request.cookies.get("pin_validated");

    if (pinValidatedCookie) {
      try {
        const { timestamp } = JSON.parse(pinValidatedCookie.value);
        // Válido por 1 hora
        if (Date.now() - timestamp < 3600000) {
          return NextResponse.json({
            pinValidated: true,
            remainingTime: 3600000 - (Date.now() - timestamp),
          });
        }
      } catch {
        // Cookie corrupta
      }
    }

    return NextResponse.json({
      pinValidated: false,
      remainingTime: 0,
    });
  } catch (err) {
    console.error("[PIN Verify API] GET error:", err);
    return NextResponse.json(
      { error: "Error al verificar PIN" },
      { status: 500 }
    );
  }
}

// Funciones auxiliares
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function decodeJwt(token: string): Record<string, any> | null {
  try {
    console.log("[decodeJwt] Starting JWT decode...");
    
    // Un JWT tiene 3 partes separadas por puntos: header.payload.signature
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      console.error("[decodeJwt] Invalid JWT format (wrong number of parts):", parts.length);
      return null;
    }

    // Decodificar el payload (segunda parte)
    const payload = parts[1];
    console.log("[decodeJwt] Payload part length:", payload.length);
    
    // En Node.js, usar Buffer en lugar de atob
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    
    console.log("[decodeJwt] Decoded payload (first 100 chars):", decoded.substring(0, 100));
    
    const parsed = JSON.parse(decoded);
    
    console.log("[decodeJwt] Parsed JWT. sub (user_id):", parsed.sub?.substring(0, 20) + '...');
    console.log("[decodeJwt] JWT exp:", new Date(parsed.exp * 1000).toISOString());
    
    // Verificar que el token no ha expirado
    if (parsed.exp && Date.now() / 1000 > parsed.exp) {
      console.error("[decodeJwt] Token has expired");
      return null;
    }
    
    return parsed;
  } catch (err) {
    console.error("[decodeJwt] Error decoding JWT:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

async function getClientIp(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip || "unknown";
  } catch {
    return "unknown";
  }
}
