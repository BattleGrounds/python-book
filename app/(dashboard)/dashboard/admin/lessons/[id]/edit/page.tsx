import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LessonForm } from '@/components/admin/lesson-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface EditLessonPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditLessonPage({ params }: EditLessonPageProps) {
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

  // Получаем данные урока
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .single()

  if (!lesson) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/admin/modules/${lesson.module_id}/lessons`}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Lesson</h1>
          <p className="text-gray-600">
            Update lesson details and tests
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg border bg-white p-6">
        <LessonForm lesson={lesson} moduleId={lesson.module_id} />
      </div>
    </div>
  )
}