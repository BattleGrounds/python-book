import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold">Вход в Python Platform</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Введите свои данные для доступа к аккаунту</p>
        </div>
        
        <LoginForm />
        
        <div className="text-center">
          <p className="text-sm sm:text-base text-gray-600">
            Нет аккаунта?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}