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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-gray-600">Manage your learning platform</p>
        </div>
        <Link
          href="/dashboard/admin/modules/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4" />
          New Module
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{modules?.length || 0}</p>
              <p className="text-sm text-gray-600">Total Modules</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {modules?.filter(m => m.is_published).length || 0} published
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{users?.length || 0}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {users?.filter(u => u.role === 'student').length || 0} students
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">{submissions?.length || 0}</p>
              <p className="text-sm text-gray-600">Submissions</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {submissions?.filter(s => s.passed).length || 0} passed
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold">
                {submissions?.length ? Math.round(
                  (submissions.filter(s => s.passed).length / submissions.length) * 100
                ) : 0}%
              </p>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Submissions */}
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Submissions</h2>
            <Link 
              href="/dashboard/admin/submissions"
              className="text-sm text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentSubmissions?.map((submission: any) => (
              <div key={submission.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium text-sm">
                    {submission.profiles?.name || submission.profiles?.email}
                  </p>
                  <p className="text-xs text-gray-600">{submission.lessons?.title}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  submission.passed 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {submission.passed ? 'Passed' : 'Failed'}
                </div>
              </div>
            ))}
            
            {(!recentSubmissions || recentSubmissions.length === 0) && (
              <p className="text-center text-gray-500 py-4">No submissions yet</p>
            )}
          </div>
        </div>

        {/* Management Cards */}
        <div className="space-y-4">
          <Link
            href="/dashboard/admin/modules"
            className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="font-semibold">Manage Modules</h3>
              <p className="text-sm text-gray-600">Create and edit learning content</p>
            </div>
          </Link>

          <Link
            href="/dashboard/admin/users"
            className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-semibold">Manage Users</h3>
              <p className="text-sm text-gray-600">View and manage students</p>
            </div>
          </Link>

          <Link
            href="/dashboard/admin/submissions"
            className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="h-8 w-8 text-purple-600" />
            <div>
              <h3 className="font-semibold">View Submissions</h3>
              <p className="text-sm text-gray-600">Review student work</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}