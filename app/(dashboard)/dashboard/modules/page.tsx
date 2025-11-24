import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Edit3, Lock } from 'lucide-react'
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from 'react'

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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Обучающие модули</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Изучите все доступные модули Python</p>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {modules?.map((module) => (
          <div key={module.id} className="rounded-lg border bg-white p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
              <div className="flex-1 w-full min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                  <h2 className="text-lg sm:text-xl font-semibold break-words">{module.title}</h2>
                </div>
                <p className="text-sm sm:text-base text-gray-600 mb-4">{module.description}</p>
                
                {/* Lessons list */}
                <div className="space-y-2">
                  {module.lessons?.map((lesson: { id: Key | null | undefined; order: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; title: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined }) => {
                    const isCompleted = userProgress?.some(
                      up => up.lesson_id === lesson.id && up.completed
                    )
                    
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-2 sm:gap-3 py-2 px-2 sm:px-3 rounded border"
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <span className="flex-1 text-xs sm:text-sm truncate">
                          {lesson.order}. {lesson.title}
                        </span>
                        {isCompleted && (
                          <span className="text-xs text-green-600 font-medium whitespace-nowrap">
                            Завершено
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                <Link
                  href={`/dashboard/modules/${module.id}`}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-center"
                >
                  Открыть модуль
                </Link>
              </div>
            </div>
          </div>
        ))}

        {(!modules || modules.length === 0) && (
          <div className="text-center py-8 sm:py-12">
            <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Модулей пока нет</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">Загляните позже для нового контента.</p>
          </div>
        )}
      </div>
    </div>
  )
}