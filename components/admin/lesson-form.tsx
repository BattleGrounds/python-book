'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TestEditor } from './test-editor'
import { Database } from '@/types/database'

type Lesson = Database['public']['Tables']['lessons']['Row']
type LessonInsert = Database['public']['Tables']['lessons']['Insert']

interface LessonFormProps {
  lesson?: Lesson
  moduleId: string
}

export function LessonForm({ lesson, moduleId }: LessonFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'content' | 'exercise' | 'tests'>('content')
  
  const [formData, setFormData] = useState<LessonInsert>({
    title: lesson?.title || '',
    content: lesson?.content || '',
    order: lesson?.order || 0,
    module_id: moduleId,
    exercise: lesson?.exercise || '',
    solution: lesson?.solution || '',
    test_code: lesson?.test_code || '',
  })

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        content: lesson.content,
        order: lesson.order,
        module_id: lesson.module_id,
        exercise: lesson.exercise || '',
        solution: lesson.solution || '',
        test_code: lesson.test_code || '',
      })
    }
  }, [lesson])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (lesson) {
        // Обновляем существующий урок
        const { error } = await supabase
          .from('lessons')
          .update({
            title: formData.title,
            content: formData.content,
            order: formData.order,
            exercise: formData.exercise,
            solution: formData.solution,
            test_code: formData.test_code,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lesson.id)

        if (error) throw error
      } else {
        // Создаем новый урок
        const { error } = await supabase
          .from('lessons')
          .insert([{
            title: formData.title,
            content: formData.content,
            order: formData.order,
            module_id: moduleId,
            exercise: formData.exercise,
            solution: formData.solution,
            test_code: formData.test_code,
          }])

        if (error) throw error
      }

      router.push(`/dashboard/admin/modules/${moduleId}/lessons`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTabClick = (tabId: 'content' | 'exercise' | 'tests') => {
    setActiveTab(tabId)
  }

  const tabs = [
    { id: 'content' as const, label: 'Content', icon: '📝' },
    { id: 'exercise' as const, label: 'Exercise', icon: '💪' },
    { id: 'tests' as const, label: 'Tests', icon: '🧪' },
  ]

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Tab Navigation - ВНЕ формы */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button" // Явно указываем type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Форма - только содержимое вкладок внутри формы */}
      <form onSubmit={handleSubmit}>
        {/* Basic Info - всегда видно */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Lesson Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter lesson title"
            />
          </div>

          <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-700">
              Order
            </label>
            <input
              type="number"
              id="order"
              min="0"
              value={formData.order}
              onChange={(e) => handleChange('order', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-96 mb-6">
          {activeTab === 'content' && (
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Lesson Content *
              </label>
              <textarea
                id="content"
                rows={12}
                required
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Explain the lesson concepts and provide examples..."
              />
            </div>
          )}

          {activeTab === 'exercise' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="exercise" className="block text-sm font-medium text-gray-700">
                  Exercise Description
                </label>
                <textarea
                  id="exercise"
                  rows={6}
                  value={formData.exercise || ''}
                  onChange={(e) => handleChange('exercise', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Describe the coding exercise for students..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Clearly explain what students need to implement
                </p>
              </div>

              <div>
                <label htmlFor="solution" className="block text-sm font-medium text-gray-700">
                  Example Solution (Optional)
                </label>
                <textarea
                  id="solution"
                  rows={8}
                  value={formData.solution || ''}
                  onChange={(e) => handleChange('solution', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Provide example solution code..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  This will be shown to students after they complete the exercise
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <TestEditor
              initialTestCode={formData.test_code || ''}
              onTestCodeChange={(code) => handleChange('test_code', code)}
              exerciseDescription={formData.exercise || ''}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : lesson ? 'Update Lesson' : 'Create Lesson'}
          </button>
          
          <button
            type="button"
            onClick={() => router.push(`/dashboard/admin/modules/${moduleId}/lessons`)}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}