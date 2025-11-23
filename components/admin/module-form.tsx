'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Module = Database['public']['Tables']['modules']['Row']
type ModuleInsert = Database['public']['Tables']['modules']['Insert']

interface ModuleFormProps {
  module?: Module
}

export function ModuleForm({ module }: ModuleFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<ModuleInsert>({
    title: module?.title || '',
    description: module?.description || '',
    order: module?.order || 0,
    is_published: module?.is_published || false,
  })

  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title,
        description: module.description || '',
        order: module.order,
        is_published: module.is_published,
      })
    }
  }, [module])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (module) {
        // Обновляем существующий модуль
        const { error } = await supabase
          .from('modules')
          .update({
            title: formData.title,
            description: formData.description,
            order: formData.order,
            is_published: formData.is_published,
            updated_at: new Date().toISOString(),
          })
          .eq('id', module.id)

        if (error) throw error
      } else {
        // Создаем новый модуль
        const { error } = await supabase
          .from('modules')
          .insert([{
            title: formData.title,
            description: formData.description,
            order: formData.order,
            is_published: formData.is_published,
          }])

        if (error) throw error
      }

      router.push('/dashboard/admin/modules')
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Module Title *
        </label>
        <input
          type="text"
          id="title"
          required
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter module title"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Describe what students will learn in this module"
        />
      </div>

      {/* Order */}
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
        <p className="mt-1 text-sm text-gray-500">
          Determines the display order (lower numbers appear first)
        </p>
      </div>

      {/* Published */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_published"
          checked={formData.is_published}
          onChange={(e) => handleChange('is_published', e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="is_published" className="ml-2 block text-sm text-gray-700">
          Publish module (make it visible to students)
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-6">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : module ? 'Update Module' : 'Create Module'}
        </button>
        
        <button
          type="button"
          onClick={() => router.push('/dashboard/admin/modules')}
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}