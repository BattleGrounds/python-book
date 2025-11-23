import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in to Python Platform</h1>
          <p className="text-gray-600">Enter your credentials to access your account</p>
        </div>
        
        <LoginForm />
        
        <div className="text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}