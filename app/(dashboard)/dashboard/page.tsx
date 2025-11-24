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
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome section */}
      <div className="rounded-lg border bg-white p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold">
          Добро пожаловать, {profile?.name || user.email}!
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          {profile?.role === 'admin' 
            ? 'Управляйте курсами и отслеживайте прогресс студентов.'
            : 'Продолжайте своё обучение Python.'
          }
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{modules?.length || 0}</p>
              <p className="text-xs sm:text-sm text-gray-600">Активных модулей</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{completedLessons}</p>
              <p className="text-xs sm:text-sm text-gray-600">Завершённых уроков</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 sm:p-6 sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">
                {totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0}%
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Общий прогресс</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Modules */}
      <div className="rounded-lg border bg-white p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg sm:text-xl font-bold">Недавние модули</h2>
          <Link 
            href="/dashboard/modules"
            className="text-blue-600 hover:underline text-xs sm:text-sm"
          >
            Смотреть все
          </Link>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          {modules?.slice(0, 3).map((module) => (
            <div key={module.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate">{module.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{module.description}</p>
              </div>
              <Link
                href={`/dashboard/modules/${module.id}`}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md text-xs sm:text-sm hover:bg-blue-700 text-center transition-colors whitespace-nowrap"
              >
                Продолжить
              </Link>
            </div>
          ))}
          
          {(!modules || modules.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm sm:text-base">Модулей пока нет.</p>
              {profile?.role === 'admin' && (
                <Link 
                  href="/dashboard/admin"
                  className="text-blue-600 hover:underline text-sm sm:text-base inline-block mt-2"
                >
                  Создайте первый модуль
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions for Admin */}
      {profile?.role === 'admin' && (
        <div className="rounded-lg border bg-white p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-4">Быстрые действия</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            <Link
              href="/dashboard/admin/modules"
              className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-sm sm:text-base">Управление модулями</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Создавайте и редактируйте обучающие модули</p>
            </Link>
            <Link
              href="/dashboard/admin/users"
              className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-sm sm:text-base">Просмотр студентов</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Отслеживайте прогресс студентов и отправки</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}