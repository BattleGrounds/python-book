import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Mail, Calendar, BookOpen, Shield, User as UserIcon } from 'lucide-react'
import { UserRoleEditor } from './user-role-editor'

export default async function AdminUsersPage() {
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

  // Получаем пользователей с прогрессом
  const { data: users } = await supabase
    .from('profiles')
    .select(`
      *,
      user_progress (
        completed
      ),
      submissions (
        id,
        passed
      )
    `)
    .order('created_at', { ascending: false })

  // Подсчитываем статистику
  const totalUsers = users?.length || 0
  const totalStudents = users?.filter(u => u.role === 'student').length || 0
  const totalAdmins = users?.filter(u => u.role === 'admin').length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Управление пользователями</h1>
        <p className="text-gray-600">Просмотр и управление пользователями платформы</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{totalUsers}</p>
              <p className="text-sm text-gray-600">Всего пользователей</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <UserIcon className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-sm text-gray-600">Студентов</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">{totalAdmins}</p>
              <p className="text-sm text-gray-600">Администраторов</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Прогресс
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Отправки
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Регистрация
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users?.map((userData) => {
                const completedLessons = userData.user_progress?.filter((up: { completed: any }) => up.completed).length || 0
                const totalSubmissions = userData.submissions?.length || 0
                const passedSubmissions = userData.submissions?.filter((s: { passed: any }) => s.passed).length || 0
                const successRate = totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0

                return (
                  <tr key={userData.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {userData.name || 'Без имени'}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {userData.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <UserRoleEditor 
                        userId={userData.id} 
                        currentRole={userData.role}
                        isCurrentUser={userData.id === user.id}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {completedLessons} завершено
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900">{totalSubmissions} всего</p>
                        <p className="text-green-600">{passedSubmissions} успешно</p>
                        {totalSubmissions > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Успешность: {successRate}%
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(userData.created_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {userData.id !== user.id && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                        {userData.id === user.id && (
                          <span className="text-xs text-blue-600">Вы</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {(!users || users.length === 0) && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">Пользователей пока нет</h3>
            <p className="text-gray-600">Пользователи появятся здесь после регистрации.</p>
          </div>
        )}
      </div>
    </div>
  )
}

