import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PythonCodeChecker } from '@/lib/code-checker'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code, lessonId } = await request.json()

    if (!code || !lessonId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Получаем данные урока
    const { data: lesson } = await supabase
      .from('lessons')
      .select('test_code, exercise, solution')
      .eq('id', lessonId)
      .single()

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Только синтаксическая проверка
    const syntaxCheck = PythonCodeChecker.validateSyntax(code)
    
    const testResult = {
      passed: syntaxCheck.valid,
      message: syntaxCheck.valid ? 'Syntax is valid' : 'Syntax error',
      output: syntaxCheck.valid 
        ? '✅ Syntax validation passed\n💡 Use "Run Tests" for full execution' 
        : `❌ ${syntaxCheck.error}`,
      executionTime: 0
    }

    return NextResponse.json(testResult)
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}