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
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from 'react'

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
  const sortedLessons = module.lessons?.sort((a: { order: number }, b: { order: number }) => a.order - b.order) || []

  // Считаем статистику
  const totalLessons = sortedLessons.length
  const completedLessons = userProgress?.filter(up => up.completed).length || 0
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // Находим следующий урок для продолжения
  const nextLesson = sortedLessons.find((lesson: { id: any }) => 
    !userProgress?.some(up => up.lesson_id === lesson.id && up.completed)
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start gap-2 sm:gap-4">
        <Link
          href="/dashboard/modules"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          aria-label="Назад к модулям"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-2">
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Обучающий модуль</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">{module.title}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">{module.description}</p>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{totalLessons}</p>
              <p className="text-xs sm:text-sm text-gray-600">Всего уроков</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{completedLessons}</p>
              <p className="text-xs sm:text-sm text-gray-600">Завершено</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{progressPercentage}%</p>
              <p className="text-xs sm:text-sm text-gray-600">Прогресс</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalLessons > 0 && (
        <div className="rounded-lg border bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Прогресс модуля</span>
            <span className="text-xs sm:text-sm text-gray-600">{completedLessons}/{totalLessons} уроков</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
            <div 
              className="bg-blue-600 h-2 sm:h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Continue Learning Card */}
      {nextLesson && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900">Продолжить обучение</h3>
              <p className="text-sm sm:text-base text-blue-700 mt-1 break-words">
                Следующий: {nextLesson.title}
              </p>
              <p className="text-xs sm:text-sm text-blue-600 mt-2 line-clamp-2">
                {nextLesson.content.substring(0, 100)}...
              </p>
            </div>
            <Link
              href={`/dashboard/modules/${moduleId}/lessons/${nextLesson.id}`}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base whitespace-nowrap w-full sm:w-auto justify-center"
            >
              <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              Продолжить
            </Link>
          </div>
        </div>
      )}

      {/* Lessons List */}
      <div className="rounded-lg border bg-white">
        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-bold">Уроки</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Пройдите все уроки, чтобы завершить этот модуль
          </p>
        </div>

        <div className="divide-y">
          {sortedLessons.map((lesson: { id: Key | null | undefined; title: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; content: string; exercise: any }, index: number) => {
            const isCompleted = userProgress?.some(
              up => up.lesson_id === lesson.id && up.completed
            )
            const isNextLesson = nextLesson?.id === lesson.id
            
            return (
              <div key={lesson.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
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
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                        {lesson.title}
                      </h3>
                      {isCompleted && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full whitespace-nowrap">
                          Завершено
                        </span>
                      )}
                      {isNextLesson && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full whitespace-nowrap">
                          Следующий урок
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                      {lesson.content.substring(0, 150)}...
                    </p>

                    {lesson.exercise && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600">
                        <PlayCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Содержит задание по программированию</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <Link
                      href={`/dashboard/modules/${moduleId}/lessons/${lesson.id}`}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base w-full sm:w-auto ${
                        isCompleted
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : isNextLesson
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      {isCompleted ? 'Повторить' : isNextLesson ? 'Продолжить' : 'Начать'}
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
          <div className="text-center py-8 sm:py-12">
            <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Уроков пока нет
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              В этом модуле пока нет уроков.
            </p>
          </div>
        )}
      </div>

      {/* Module Completion */}
      {completedLessons === totalLessons && totalLessons > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-semibold text-green-900">
                Модуль завершён! 🎉
              </h3>
              <p className="text-sm sm:text-base text-green-700 mt-1">
                Вы успешно завершили все уроки в этом модуле.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
                <Link
                  href="/dashboard/modules"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center text-sm sm:text-base"
                >
                  Найти ещё модули
                </Link>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors text-center text-sm sm:text-base"
                >
                  Назад к дашборду
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}