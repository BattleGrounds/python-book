import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, CheckCircle, Clock, BarChart3 } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Получаем данные профиля
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Получаем модули - админы видят все, студенты только опубликованные
  const { data: modules } = profile?.role === 'admin'
    ? await supabase
        .from('modules')
        .select('*')
        .order('order')
    : await supabase
        .from('modules')
        .select('*')
        .eq('is_published', true)
        .order('order')

  // Получаем прогресс пользователя
  const { data: userProgress } = await supabase
    .from('user_progress')
    .select('lesson_id, completed')
    .eq('user_id', user.id)

  const completedLessons = userProgress?.filter(up => up.completed).length || 0
  const totalLessons = modules?.reduce((total, module) => {
    // Здесь нужно будет добавить подсчет уроков для каждого модуля
    return total + 5 // временное значение
  }, 0) || 0

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="rounded-lg border bg-white p-6">
        <h1 className="text-2xl font-bold">
          Welcome back, {profile?.name || user.email}!
        </h1>
        <p className="text-gray-600">
          {profile?.role === 'admin' 
            ? 'Manage your courses and track student progress.'
            : 'Continue your Python learning journey.'
          }
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{modules?.length || 0}</p>
              <p className="text-sm text-gray-600">Active Modules</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{completedLessons}</p>
              <p className="text-sm text-gray-600">Completed Lessons</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">
                {totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-600">Overall Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Modules */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Modules</h2>
          <Link 
            href="/dashboard/modules"
            className="text-blue-600 hover:underline text-sm"
          >
            View all
          </Link>
        </div>
        
        <div className="space-y-4">
          {modules?.slice(0, 3).map((module) => (
            <div key={module.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">{module.title}</h3>
                <p className="text-sm text-gray-600">{module.description}</p>
              </div>
              <Link
                href={`/dashboard/modules/${module.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Continue
              </Link>
            </div>
          ))}
          
          {(!modules || modules.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No modules available yet.</p>
              {profile?.role === 'admin' && (
                <Link 
                  href="/dashboard/admin"
                  className="text-blue-600 hover:underline"
                >
                  Create your first module
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions for Admin */}
      {profile?.role === 'admin' && (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-bold mb-4">Admin Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/dashboard/admin/modules"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold">Manage Modules</h3>
              <p className="text-sm text-gray-600">Create and edit learning modules</p>
            </Link>
            <Link
              href="/dashboard/admin/users"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold">View Students</h3>
              <p className="text-sm text-gray-600">Track student progress and submissions</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}