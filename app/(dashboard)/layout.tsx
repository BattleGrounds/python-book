import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard/nav'
import { SignOutButton } from '@/components/auth/signout-button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Получаем данные профиля - пробуем несколько раз, так как RLS может блокировать
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Если профиль не найден из-за RLS, пробуем еще раз с другим запросом
  if (!profile && profileError) {
    // Пробуем получить профиль без фильтра по id (для админов)
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('*')
    
    profile = allProfiles?.find(p => p.id === user.id) || null
  }

  // Если профиль все еще не найден (ошибка PGRST116 означает "не найдено"), создаем его
  const isNotFoundError = !profile && (
    profileError?.code === 'PGRST116' || 
    profileError?.message?.includes('No rows') ||
    !profileError
  )

  if (isNotFoundError) {
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        role: 'student',
      })
      .select()
      .single()

    if (!createError && newProfile) {
      profile = newProfile
      profileError = null
    }
  }

  // Если все еще нет профиля, используем значения по умолчанию
  const displayProfile = profile || {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    role: 'student' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden w-64 border-r bg-gray-50 md:block">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b p-6">
            <h1 className="text-xl font-bold">Python Platform</h1>
            <p className="text-sm text-gray-600">
              {displayProfile.role === 'admin' ? 'Admin' : 'Student'} Dashboard
            </p>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 p-4">
            <DashboardNav role={displayProfile.role} />
          </div>
          
          {/* User info & Sign out */}
          <div className="border-t p-4">
            <div className="mb-4">
              <p className="text-sm font-medium">{displayProfile.name || user.email}</p>
              <p className="text-xs text-gray-600">{user.email}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        {/* Mobile header */}
        <div className="border-b bg-white p-4 md:hidden">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">Python Platform</h1>
            <DashboardNav role={displayProfile.role} mobile />
          </div>
        </div>
        
        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}