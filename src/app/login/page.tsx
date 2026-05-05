'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Footer } from '@/presentation/components/ui/Footer'

const loginSchema = z.object({
  email: z.email('Nieprawidłowy adres email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const body = await res.json()

      if (!res.ok) {
        toast.error(body.message ?? 'Błąd logowania')
        return
      }

      toast.success(`Witaj, ${body.firstName}!`)

      if (body.role === 'ADMIN') {
        router.push('/admin/courses')
      } else if (body.role === 'LECTURER') {
        router.push('/lecturer/courses')
      } else {
        router.push('/student/courses')
      }
    } catch {
      toast.error('Błąd połączenia z serwerem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-field.jpg')" }}
    >
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">SOS</h1>
            <p className="text-gray-500 mt-1 text-sm">System Obsługi Studiów</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`w-full bg-gray-100 rounded-full px-5 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border-0 ${
                  errors.email ? 'ring-2 ring-red-400' : ''
                }`}
                placeholder="Email"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500 px-2">{errors.email.message}</p>
              )}
            </div>

            <div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className={`w-full bg-gray-100 rounded-full px-5 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border-0 ${
                  errors.password ? 'ring-2 ring-red-400' : ''
                }`}
                placeholder="Hasło"
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500 px-2">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-500 text-white font-semibold py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </button>
          </form>

          <div className="mt-6 text-xs text-gray-400 text-center space-y-1">
            <p className="font-medium text-gray-500 mb-1">Konta testowe</p>
            <p>Admin: admin@uni.pl / admin123</p>
            <p>Prowadzący: lecturer@uni.pl / lecturer123</p>
            <p>Student: student@uni.pl / student123</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
