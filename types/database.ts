export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'student' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: 'student' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'student' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      modules: {
        Row: {
          id: string
          title: string
          description: string | null
          order: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          order: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          title: string
          content: string
          order: number
          module_id: string
          exercise: string | null
          solution: string | null
          test_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          order: number
          module_id: string
          exercise?: string | null
          solution?: string | null
          test_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          order?: number
          module_id?: string
          exercise?: string | null
          solution?: string | null
          test_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          code: string
          passed: boolean
          output: string | null
          user_id: string
          lesson_id: string
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          passed?: boolean
          output?: string | null
          user_id: string
          lesson_id: string
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          passed?: boolean
          output?: string | null
          user_id?: string
          lesson_id?: string
          created_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          completed: boolean
          user_id: string
          lesson_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          completed?: boolean
          user_id: string
          lesson_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          completed?: boolean
          user_id?: string
          lesson_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}