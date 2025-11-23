import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LessonForm } from '@/components/admin/lesson-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface NewLessonPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function NewLessonPage({ params }: NewLessonPageProps) {
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

  // Получаем данные модуля
  const { data: module } = await supabase
    .from('modules')
    .select('*')
    .eq('id', id)
    .single()

  if (!module) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/admin/modules/${module.id}/lessons`}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create New Lesson</h1>
          <p className="text-gray-600">Add a new lesson to {module.title}</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg border bg-white p-6">
        <LessonForm moduleId={module.id} />
      </div>
    </div>
  )
}