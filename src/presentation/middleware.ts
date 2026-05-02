import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/infrastructure/auth/jwt'

const PUBLIC_PATHS = ['/api/auth/login', '/api/auth/logout', '/api/health']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /api/* routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Nieautoryzowany' }, { status: 401 })
  }

  try {
    const payload = await verifyToken(token)

    const headers = new Headers(request.headers)
    headers.set('x-user-id', payload.sub)
    headers.set('x-user-role', payload.role)
    headers.set('x-user-email', payload.email)
    headers.set('x-user-first-name', payload.firstName)
    headers.set('x-user-last-name', payload.lastName)

    return NextResponse.next({ request: { headers } })
  } catch {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Nieważny token' }, { status: 401 })
  }
}

export const config = {
  matcher: ['/api/:path*'],
}
