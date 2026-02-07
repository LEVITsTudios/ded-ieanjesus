import { type NextRequest } from "next/server"
import { NextResponse } from "next/server"

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

  // For now, just pass through other routes
  // TODO: Re-enable with proper profile completion check when context is available
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
