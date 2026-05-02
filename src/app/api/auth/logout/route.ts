import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/infrastructure/auth/jwt'

export async function POST() {
  const response = NextResponse.json({ message: 'Wylogowano pomyślnie' })
  response.cookies.delete(COOKIE_NAME)
  return response
}
