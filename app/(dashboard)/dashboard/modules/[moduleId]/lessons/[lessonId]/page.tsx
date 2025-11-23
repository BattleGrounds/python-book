import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { LessonClient } from './lesson-client'

interface LessonPageProps {
  params: Promise<{
    moduleId: string
    lessonId: string
  }>
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { moduleId, lessonId } = await params
  
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Получаем данные урока
  const { data: lesson } = await supabase
    .from('lessons')
    .select(`
      *,
      modules (
        title,
        is_published
      )
    `)
    .eq('id', lessonId)
    .single()

  if (!lesson || !lesson.modules?.is_published) {
    notFound()
  }

  // Получаем предыдущие отправки пользователя
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <LessonClient 
      lesson={lesson}
      submissions={submissions || []}
    />
  )
}