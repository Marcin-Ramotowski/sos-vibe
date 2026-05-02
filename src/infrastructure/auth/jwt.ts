import { SignJWT, jwtVerify } from 'jose'
import type { UserRole } from '@/domain/entities/user.entity'

export interface JWTPayload {
  sub: string
  role: UserRole
  firstName: string
  lastName: string
  email: string
}

const secret = new TextEncoder().encode(
  process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production',
)

const COOKIE_NAME = 'token'
const EXPIRATION = '7d'

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, secret)
  return payload as unknown as JWTPayload
}

export { COOKIE_NAME }
