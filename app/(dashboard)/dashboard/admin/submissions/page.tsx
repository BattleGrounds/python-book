import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Code, User } from 'lucide-react'

export default async function AdminSubmissionsPage() {
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

  // Получаем отправки с связанными данными
  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      *,
      profiles (
        name,
        email
      ),
      lessons (
        title,
        module_id,
        modules (
          title
        )
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Student Submissions</h1>
        <p className="text-gray-600">Review and monitor student work</p>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {submissions?.map((submission: any) => (
          <div key={submission.id} className="rounded-lg border bg-white p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">
                    {submission.lessons?.title}
                  </h3>
                  <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                    submission.passed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {submission.passed ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {submission.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {submission.profiles?.name || submission.profiles?.email}
                  </span>
                  <span>Module: {submission.lessons?.modules?.title}</span>
                  <span>
                    Submitted: {new Date(submission.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Code Preview */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Code className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Code Solution</span>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto max-h-40 overflow-y-auto">
                {submission.code}
              </pre>
            </div>

            {/* Output */}
            {submission.output && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Output</span>
                </div>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                  {submission.output}
                </pre>
              </div>
            )}
          </div>
        ))}

        {(!submissions || submissions.length === 0) && (
          <div className="text-center py-12">
            <Code className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
            <p className="text-gray-600">Student submissions will appear here.</p>
          </div>
        )}
      </div>
    </div>
  )
}