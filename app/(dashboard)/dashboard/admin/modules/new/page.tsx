import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ModuleForm } from '@/components/admin/module-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewModulePage() {
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
          <h1 className="text-2xl font-bold">Create New Module</h1>
          <p className="text-gray-600">Add a new learning module to your platform</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg border bg-white p-6">
        <ModuleForm />
      </div>
    </div>
  )
}