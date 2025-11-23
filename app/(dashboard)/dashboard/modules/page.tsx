import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Edit3, Lock } from 'lucide-react'

export default async function ModulesPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Получаем модули
  const { data: modules } = await supabase
    .from('modules')
    .select(`
      *,
      lessons (
        id,
        title,
        order
      )
    `)
    .eq('is_published', true)
    .order('order')

  // Получаем прогресс пользователя
  const { data: userProgress } = await supabase
    .from('user_progress')
    .select('lesson_id, completed')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Learning Modules</h1>
          <p className="text-gray-600">Explore all available Python modules</p>
        </div>
      </div>

      <div className="grid gap-6">
        {modules?.map((module) => (
          <div key={module.id} className="rounded-lg border bg-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold">{module.title}</h2>
                </div>
                <p className="text-gray-600 mb-4">{module.description}</p>
                
                {/* Lessons list */}
                <div className="space-y-2">
                  {module.lessons?.map((lesson) => {
                    const isCompleted = userProgress?.some(
                      up => up.lesson_id === lesson.id && up.completed
                    )
                    
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 py-2 px-3 rounded border"
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <span className="flex-1 text-sm">
                          {lesson.order}. {lesson.title}
                        </span>
                        {isCompleted && (
                          <span className="text-xs text-green-600 font-medium">
                            Completed
                          </span>
                        )}
                      </div>
                    )
                  })}
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
            <h3 className="text-lg font-semibold mb-2">No modules available</h3>
            <p className="text-gray-600 mb-4">Check back later for new content.</p>
          </div>
        )}
      </div>
    </div>
  )
}