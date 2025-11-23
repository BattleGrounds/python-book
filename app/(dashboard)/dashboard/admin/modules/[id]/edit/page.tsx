import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ModuleForm } from '@/components/admin/module-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface EditModulePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditModulePage({ params }: EditModulePageProps) {
  const {id} = await params
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
          href="/dashboard/admin/modules"
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Module</h1>
          <p className="text-gray-600">Update module details</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg border bg-white p-6">
        <ModuleForm module={module} />
      </div>
    </div>
  )
}