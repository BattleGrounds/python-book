'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, User as UserIcon, Loader2 } from 'lucide-react'

interface UserRoleEditorProps {
  userId: string
  currentRole: 'student' | 'admin'
  isCurrentUser: boolean
}

export function UserRoleEditor({ userId, currentRole, isCurrentUser }: UserRoleEditorProps) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = createClient()

  const handleRoleChange = async (newRole: 'student' | 'admin') => {
    if (isCurrentUser) {
      setMessage('Нельзя изменить свою собственную роль')
      return
    }

    if (newRole === role) return

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error

      setRole(newRole)
      setMessage('Роль успешно обновлена')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error updating role:', error)
      setMessage('Ошибка при обновлении роли')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        ) : (
          <>
            <button
              onClick={() => handleRoleChange('student')}
              disabled={isCurrentUser || loading}
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                role === 'student'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={isCurrentUser ? 'Нельзя изменить свою роль' : 'Изменить на студента'}
            >
              <UserIcon className="h-3 w-3" />
              student
            </button>
            <button
              onClick={() => handleRoleChange('admin')}
              disabled={isCurrentUser || loading}
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                role === 'admin'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={isCurrentUser ? 'Нельзя изменить свою роль' : 'Изменить на администратора'}
            >
              <Shield className="h-3 w-3" />
              admin
            </button>
          </>
        )}
      </div>
      {message && (
        <p className={`text-xs ${
          message.includes('Ошибка') ? 'text-red-600' : 'text-green-600'
        }`}>
          {message}
        </p>
      )}
    </div>
  )
}

