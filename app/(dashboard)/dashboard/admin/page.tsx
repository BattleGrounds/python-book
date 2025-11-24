import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  FileText,
  PlusCircle,
  Edit3
} from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Проверяем права админа
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Получаем статистику
  const { data: modules } = await supabase
    .from('modules')
    .select('id, is_published')

  const { data: users } = await supabase
    .from('profiles')
    .select('id, role')

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, passed')

  const { data: recentSubmissions } = await supabase
    .from('submissions')
    .select(`
      id,
      created_at,
      passed,
      profiles (name, email),
      lessons (title)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Админ-панель</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Управляйте платформой обучения</p>
        </div>
        <Link
          href="/dashboard/admin/modules/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 sm:px-4 py-2 text-white hover:bg-blue-700 text-sm sm:text-base transition-colors w-full sm:w-auto justify-center"
        >
          <PlusCircle className="h-4 w-4" />
          Новый модуль
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{modules?.length || 0}</p>
              <p className="text-xs sm:text-sm text-gray-600">Всего модулей</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {modules?.filter(m => m.is_published).length || 0} опубликовано
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{users?.length || 0}</p>
              <p className="text-xs sm:text-sm text-gray-600">Всего пользователей</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {users?.filter(u => u.role === 'student').length || 0} студентов
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{submissions?.length || 0}</p>
              <p className="text-xs sm:text-sm text-gray-600">Отправок</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {submissions?.filter(s => s.passed).length || 0} прошло
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4 sm:p-6 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">
                {submissions?.length ? Math.round(
                  (submissions.filter(s => s.passed).length / submissions.length) * 100
                ) : 0}%
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Успешность</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Recent Submissions */}
        <div className="rounded-lg border bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg sm:text-xl font-bold">Недавние отправки</h2>
            <Link 
              href="/dashboard/admin/submissions"
              className="text-xs sm:text-sm text-blue-600 hover:underline"
            >
              Смотреть все
            </Link>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            {recentSubmissions?.map((submission: any) => (
              <div key={submission.id} className="flex items-center justify-between p-2 sm:p-3 border rounded gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-xs sm:text-sm truncate">
                    {submission.profiles?.name || submission.profiles?.email}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{submission.lessons?.title}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                  submission.passed 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {submission.passed ? 'Прошло' : 'Не прошло'}
                </div>
              </div>
            ))}
            
            {(!recentSubmissions || recentSubmissions.length === 0) && (
              <p className="text-center text-gray-500 py-4 text-sm">Отправок пока нет</p>
            )}
          </div>
        </div>

        {/* Management Cards */}
        <div className="space-y-3 sm:space-y-4">
          <Link
            href="/dashboard/admin/modules"
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base">Управление модулями</h3>
              <p className="text-xs sm:text-sm text-gray-600">Создавайте и редактируйте обучающий контент</p>
            </div>
          </Link>

          <Link
            href="/dashboard/admin/users"
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base">Управление пользователями</h3>
              <p className="text-xs sm:text-sm text-gray-600">Просмотр и управление студентами</p>
            </div>
          </Link>

          <Link
            href="/dashboard/admin/submissions"
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base">Просмотр отправок</h3>
              <p className="text-xs sm:text-sm text-gray-600">Проверка работ студентов</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}