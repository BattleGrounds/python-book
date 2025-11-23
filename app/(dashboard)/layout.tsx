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

  // Получаем данные профиля
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden w-64 border-r bg-gray-50 md:block">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b p-6">
            <h1 className="text-xl font-bold">Python Platform</h1>
            <p className="text-sm text-gray-600">
              {profile?.role === 'admin' ? 'Admin' : 'Student'} Dashboard
            </p>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 p-4">
            <DashboardNav role={profile?.role} />
          </div>
          
          {/* User info & Sign out */}
          <div className="border-t p-4">
            <div className="mb-4">
              <p className="text-sm font-medium">{profile?.name || user.email}</p>
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
            <DashboardNav role={profile?.role} mobile />
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