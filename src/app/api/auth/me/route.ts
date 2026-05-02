import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  const email = request.headers.get('x-user-email')
  const firstName = request.headers.get('x-user-first-name')
  const lastName = request.headers.get('x-user-last-name')

  if (!userId || !userRole) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: 'Nieautoryzowany' },
      { status: 401 },
    )
  }

  return NextResponse.json({
    id: userId,
    role: userRole,
    email,
    firstName,
    lastName,
  })
}
