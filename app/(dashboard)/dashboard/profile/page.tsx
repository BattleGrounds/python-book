// app/dashboard/profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { User, Mail, Save, Loader2 } from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })

  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(data)
      setFormData({
        name: data.name || '',
        email: data.email,
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      setMessage('Ошибка загрузки профиля')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage('Профиль успешно обновлён!')
      
      // Обновляем локальный профиль
      setProfile(prev => prev ? { ...prev, name: formData.name } : null)
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage('Ошибка обновления профиля')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Настройки профиля</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              Управляйте настройками аккаунта и предпочтениями
            </p>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {message && (
              <div className={`p-3 sm:p-4 rounded-md text-sm ${
                message.includes('Ошибка') 
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Полное имя
                </div>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                placeholder="Введите ваше полное имя"
              />
            </div>

            {/* Email Field (Read-only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email адрес
                </div>
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed text-sm sm:text-base"
              />
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                Email нельзя изменить
              </p>
            </div>

            {/* Role Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Роль аккаунта
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile?.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {profile?.role === 'admin' ? 'Администратор' : 'Студент'}
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                Ваша роль определяет доступные функции
              </p>
            </div>

            {/* Account Created */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Участник с
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-600">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Не указано'}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Сохранить изменения
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Statistics Card */}
        <div className="mt-4 sm:mt-6 bg-white shadow rounded-lg">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Статистика обучения</h2>
          </div>
          <div className="p-4 sm:p-6">
            <ProfileStats />
          </div>
        </div>
      </div>
    </div>
  )
}

// Компонент для отображения статистики обучения
function ProfileStats() {
  const [stats, setStats] = useState({
    completedLessons: 0,
    totalSubmissions: 0,
    successRate: 0,
  })
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Получаем завершенные уроки
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('completed', true)

      if (progressError) throw progressError

      // Получаем все отправки
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('passed')
        .eq('user_id', user.id)

      if (submissionsError) throw submissionsError

      const completedLessons = progressData?.length || 0
      const totalSubmissions = submissionsData?.length || 0
      const passedSubmissions = submissionsData?.filter(s => s.passed).length || 0
      const successRate = totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0

      setStats({
        completedLessons,
        totalSubmissions,
        successRate,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="text-center">
        <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.completedLessons}</div>
        <div className="text-xs sm:text-sm text-gray-600">Завершённых уроков</div>
      </div>
      <div className="text-center">
        <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.totalSubmissions}</div>
        <div className="text-xs sm:text-sm text-gray-600">Отправок кода</div>
      </div>
      <div className="text-center">
        <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.successRate}%</div>
        <div className="text-xs sm:text-sm text-gray-600">Успешность</div>
      </div>
    </div>
  )
}