import { NextRequest, NextResponse } from 'next/server'
import { loginSchema } from '@/presentation/api/schemas/auth.schema'
import { PrismaUserRepository } from '@/infrastructure/repositories/PrismaUserRepository'
import { comparePassword } from '@/infrastructure/auth/password'
import { signToken, COOKIE_NAME } from '@/infrastructure/auth/jwt'
import { handleApiError } from '@/presentation/api/error-handler'
import { UnauthorizedError } from '@/domain/errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Błąd walidacji' },
        { status: 422 },
      )
    }

    const { email, password } = parsed.data
    const userRepo = new PrismaUserRepository()
    const user = await userRepo.findByEmail(email)

    if (!user) throw new UnauthorizedError('Nieprawidłowy email lub hasło')

    const valid = await comparePassword(password, user.passwordHash)
    if (!valid) throw new UnauthorizedError('Nieprawidłowy email lub hasło')

    const token = await signToken({
      sub: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    })

    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    })

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    return handleApiError(error)
  }
}
