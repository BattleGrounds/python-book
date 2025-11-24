import { RegisterForm } from '@/components/auth/register-form'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold">Создать аккаунт</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Присоединяйтесь к нашей платформе для изучения Python</p>
        </div>
        
        <RegisterForm />
        
        <div className="text-center">
          <p className="text-sm sm:text-base text-gray-600">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}