import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  BookOpen, 
  PlusCircle, 
  Edit3, 
  Eye, 
  EyeOff,
  Trash2
} from 'lucide-react'

export default async function AdminModulesPage() {
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

  // Получаем модули с уроками
  const { data: modules } = await supabase
    .from('modules')
    .select(`
      *,
      lessons (
        id,
        title
      )
    `)
    .order('order')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Modules</h1>
          <p className="text-gray-600">Create and organize learning content</p>
        </div>
        <Link
          href="/dashboard/admin/modules/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4" />
          New Module
        </Link>
      </div>

      {/* Modules List */}
      <div className="rounded-lg border bg-white">
        {modules?.map((module) => (
          <div key={module.id} className="border-b last:border-b-0">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-start gap-4 flex-1">
                <BookOpen className="h-6 w-6 text-blue-600 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{module.title}</h3>
                    {module.is_published ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        <Eye className="h-3 w-3" />
                        Published
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                        <EyeOff className="h-3 w-3" />
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">{module.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Order: {module.order}</span>
                    <span>Lessons: {module.lessons?.length || 0}</span>
                    <span>
                      Created: {new Date(module.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/admin/modules/${module.id}/edit`}
                  className="flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-gray-50"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Link>
                <Link
                  href={`/dashboard/admin/modules/${module.id}/lessons`}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Manage Lessons
                </Link>
              </div>
            </div>
          </div>
        ))}

        {(!modules || modules.length === 0) && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">No modules yet</h3>
            <p className="text-gray-600 mb-4">Create your first module to get started.</p>
            <Link
              href="/dashboard/admin/modules/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <PlusCircle className="h-4 w-4" />
              Create Module
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}