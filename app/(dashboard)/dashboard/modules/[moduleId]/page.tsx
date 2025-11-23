import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  ArrowLeft,
  Lock,
  PlayCircle
} from 'lucide-react'

interface ModulePageProps {
  params: Promise<{
    moduleId: string
  }>
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { moduleId } = await params
  
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Получаем данные модуля и уроков
  const { data: module } = await supabase
    .from('modules')
    .select(`
      *,
      lessons (
        id,
        title,
        content,
        order,
        exercise,
        created_at
      )
    `)
    .eq('id', moduleId)
    .eq('is_published', true)
    .single()

  if (!module) {
    notFound()
  }

  // Получаем прогресс пользователя
  const { data: userProgress } = await supabase
    .from('user_progress')
    .select('lesson_id, completed')
    .eq('user_id', user.id)

  // Сортируем уроки по порядку
  const sortedLessons = module.lessons?.sort((a, b) => a.order - b.order) || []

  // Считаем статистику
  const totalLessons = sortedLessons.length
  const completedLessons = userProgress?.filter(up => up.completed).length || 0
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // Находим следующий урок для продолжения
  const nextLesson = sortedLessons.find(lesson => 
    !userProgress?.some(up => up.lesson_id === lesson.id && up.completed)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/modules"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <BookOpen className="h-4 w-4" />
            <span>Learning Module</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{module.title}</h1>
          <p className="text-gray-600 mt-2">{module.description}</p>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{totalLessons}</p>
              <p className="text-sm text-gray-600">Total Lessons</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{completedLessons}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">{progressPercentage}%</p>
              <p className="text-sm text-gray-600">Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalLessons > 0 && (
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Module Progress</span>
            <span className="text-sm text-gray-600">{completedLessons}/{totalLessons} lessons</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Continue Learning Card */}
      {nextLesson && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Continue Learning</h3>
              <p className="text-blue-700 mt-1">
                Next up: {nextLesson.title}
              </p>
              <p className="text-blue-600 text-sm mt-2">
                {nextLesson.content.substring(0, 100)}...
              </p>
            </div>
            <Link
              href={`/dashboard/modules/${moduleId}/lessons/${nextLesson.id}`}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlayCircle className="h-5 w-5" />
              Continue
            </Link>
          </div>
        </div>
      )}

      {/* Lessons List */}
      <div className="rounded-lg border bg-white">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Lessons</h2>
          <p className="text-gray-600 mt-1">
            Complete all lessons to finish this module
          </p>
        </div>

        <div className="divide-y">
          {sortedLessons.map((lesson, index: number) => {
            const isCompleted = userProgress?.some(
              up => up.lesson_id === lesson.id && up.completed
            )
            const isNextLesson = nextLesson?.id === lesson.id
            
            return (
              <div key={lesson.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Lesson Number */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCompleted 
                      ? 'bg-green-100 text-green-600' 
                      : isNextLesson
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Lesson Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {lesson.title}
                      </h3>
                      {isCompleted && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Completed
                        </span>
                      )}
                      {isNextLesson && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          Next Lesson
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {lesson.content.substring(0, 150)}...
                    </p>

                    {lesson.exercise && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <PlayCircle className="h-4 w-4" />
                        <span>Includes coding exercise</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    <Link
                      href={`/dashboard/modules/${moduleId}/lessons/${lesson.id}`}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        isCompleted
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : isNextLesson
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      {isCompleted ? 'Review' : isNextLesson ? 'Continue' : 'Start'}
                      <PlayCircle className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {sortedLessons.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No lessons yet
            </h3>
            <p className="text-gray-600 mb-4">
              This module doesn't have any lessons yet.
            </p>
          </div>
        )}
      </div>

      {/* Module Completion */}
      {completedLessons === totalLessons && totalLessons > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <div className="flex items-center gap-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <div>
              <h3 className="text-xl font-semibold text-green-900">
                Module Completed! 🎉
              </h3>
              <p className="text-green-700 mt-1">
                You've successfully completed all lessons in this module.
              </p>
              <div className="flex gap-3 mt-4">
                <Link
                  href="/dashboard/modules"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Browse More Modules
                </Link>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}