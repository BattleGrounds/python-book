import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  PlusCircle, 
  Edit3, 
  GripVertical,
  Eye
} from 'lucide-react'
import { notFound } from 'next/navigation'

interface ModuleLessonsPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ModuleLessonsPage({ params }: ModuleLessonsPageProps) {
  // Распаковываем params
  const { id } = await params
  
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

  // Получаем модуль и его уроки
  const { data: module } = await supabase
    .from('modules')
    .select(`
      *,
      lessons (
        id,
        title,
        order,
        content,
        exercise,
        solution,
        created_at
      )
    `)
    .eq('id', id)
    .single()

  if (!module) {
    notFound()
  }

  // Сортируем уроки по порядку
  const sortedLessons = module.lessons?.sort((a, b) => a.order - b.order) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/admin/modules"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Manage Lessons</h1>
            <p className="text-gray-600">
              {module.title} - {sortedLessons.length} lessons
            </p>
          </div>
        </div>
        
        <Link
          href={`/dashboard/admin/modules/${module.id}/lessons/new`}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4" />
          New Lesson
        </Link>
      </div>

      {/* Lessons List */}
      <div className="rounded-lg border bg-white">
        {sortedLessons.map((lesson) => (
          <div key={lesson.id} className="border-b last:border-b-0">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {lesson.order}
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{lesson.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                    {lesson.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      Created: {new Date(lesson.created_at).toLocaleDateString()}
                    </span>
                    {lesson.exercise && (
                      <span>Has exercise</span>
                    )}
                    {lesson.solution && (
                      <span>Has solution</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/admin/lessons/${lesson.id}/edit`}
                  className="flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-gray-50"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Link>
                
                <Link
                  href={`/dashboard/modules/${module.id}/lessons/${lesson.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <Eye className="h-4 w-4" />
                  View
                </Link>
              </div>
            </div>
          </div>
        ))}

        {sortedLessons.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-300 mb-4">
              <PlusCircle className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No lessons yet</h3>
            <p className="text-gray-600 mb-4">
              Add lessons to start building your module content.
            </p>
            <Link
              href={`/dashboard/admin/modules/${module.id}/lessons/new`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <PlusCircle className="h-4 w-4" />
              Create First Lesson
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}