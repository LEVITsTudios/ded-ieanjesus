import { type NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { verifyPinValidationStatus } from "@/lib/pin-validation"

export async function middleware(request: NextRequest) {
  // Skip auth for login, register, auth callbacks, onboarding, and static assets
  const pathname = request.nextUrl.pathname
  
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next()
  }

  // ✅ NUEVA VALIDACIÓN: Verificar PIN para rutas protegidas (dashboard, etc)
  // Si el usuario tiene PIN habilitado, DEBE estar validado en la sesión actual
  if (pathname.startsWith('/dashboard')) {
    try {
      const { isPinValidated, requiresPinValidation } = 
        await verifyPinValidationStatus(request);

      if (requiresPinValidation && !isPinValidated) {
        // ⚠️ Usuario requiere PIN pero no está validado - REDIRIGIR A LOGIN
        console.warn(`[Middleware] PIN validation required for user accessing ${pathname}`);
        
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/auth/login';
        loginUrl.searchParams.set('requiresPinValidation', 'true');
        
        return NextResponse.redirect(loginUrl);
      }
    } catch (err) {
      console.error('[Middleware] Error checking PIN validation:', err);
      // En caso de error, permitir (mejor ser permisivo que restrictivo)
      return NextResponse.next();
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
