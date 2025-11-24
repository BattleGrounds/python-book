'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Clock, Play, Eye, Cpu, Download } from 'lucide-react'
import { PythonCodeChecker } from '@/lib/code-checker'
import { usePyodide } from '@/app/hooks/use-pyodide'

interface SubmitSolutionProps {
  lessonId: string
  submissions: any[]
  code?: string
  onCodeRun?: (result: any) => void
}

export function SubmitSolution({
  lessonId,
  submissions,
  code = '',
  onCodeRun
}: SubmitSolutionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [showTests, setShowTests] = useState(false)
  const [testCode, setTestCode] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  
  const { pyodide, loading: pyodideLoading, error: pyodideError } = usePyodide()
  const supabase = createClient()

  // Получаем ID текущего пользователя
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUserId()
  }, [supabase.auth])

  // Загружаем тестовый код из базы
  useEffect(() => {
    const loadTestCode = async () => {
      try {
        const { data: lesson } = await supabase
          .from('lessons')
          .select('test_code')
          .eq('id', lessonId)
          .single()

        if (lesson && lesson.test_code) {
          setTestCode(lesson.test_code)
        }
      } catch (error) {
        console.error('Failed to load test code:', error)
      }
    }

    loadTestCode()
  }, [lessonId, supabase])

  // Функция для выполнения тестов с Pyodide
  const runTestsWithPyodide = async (studentCode: string): Promise<any> => {
    if (!pyodide) {
      throw new Error('Python runtime всё ещё загружается. Пожалуйста, подождите...')
    }

    if (!testCode) {
      throw new Error('Тестовый код недоступен для этого урока')
    }

    // Проверяем что студент написал функцию solution
    if (!studentCode.includes('def solution(')) {
      return {
        passed: false,
        message: 'Отсутствует функция solution',
        error: 'Вы должны определить функцию solution()',
        output: '❌ Пожалуйста, определите функцию solution() согласно заданию'
      }
    }

    // Проверяем синтаксис
    const syntaxCheck = PythonCodeChecker.validateSyntax(studentCode)
    if (!syntaxCheck.valid) {
      return {
        passed: false,
        message: 'Ошибка синтаксиса',
        error: syntaxCheck.error,
        output: `❌ Ошибка синтаксиса: ${syntaxCheck.error}`
      }
    }

    // Выполняем код студента и тесты
    try {
      const result = await PythonCodeChecker.executeCode(
        studentCode,
        testCode,
        pyodide
      )
      return result
    } catch (error: any) {
      return {
        passed: false,
        message: 'Ошибка выполнения',
        error: error.message,
        output: `💥 Ошибка выполнения: ${error.message}`
      }
    }
  }

  const handleTestCode = async () => {
    if (!code.trim()) {
      alert('Пожалуйста, сначала напишите код!')
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      const result = await runTestsWithPyodide(code)
      setTestResult(result)

      if (onCodeRun) {
        onCodeRun(result)
      }
    } catch (error: any) {
      console.error('Test error:', error)
      setTestResult({
        passed: false,
        message: 'Ошибка выполнения тестов',
        error: error.message || 'Неизвестная ошибка при тестировании',
        output: `❌ Тест не пройден: ${error.message || 'Неизвестная ошибка'}`
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert('Пожалуйста, сначала напишите код!')
      return
    }

    if (!userId) {
      alert('Пользователь не аутентифицирован. Пожалуйста, обновите страницу.')
      return
    }

    setIsSubmitting(true)

    try {
      const testResult = await runTestsWithPyodide(code)

      // Сохраняем отправку в базу с user_id
      const { data: submission, error } = await supabase
        .from('submissions')
        .insert([{
          lesson_id: lessonId,
          user_id: userId,
          code: code,
          passed: testResult.passed,
          output: testResult.output || testResult.message || testResult.error
        }])
        .select()
        .single()

      if (error) {
        console.error('Submission error details:', error)
        throw error
      }

      // Обновляем прогресс если задание пройдено
      if (testResult.passed) {
        const { error: progressError } = await supabase
          .from('user_progress')
          .upsert({
            user_id: userId,
            lesson_id: lessonId,
            completed: true
          }, {
            onConflict: 'user_id,lesson_id'
          })

        if (progressError) {
          console.error('Progress update error:', progressError)
        }
      }

      // Обновляем страницу чтобы показать новую отправку
      window.location.reload()
    } catch (error: any) {
      console.error('Submission error:', error)
      alert(`Ошибка отправки: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const latestSubmission = submissions[0]


  return (
    <div className="w-full lg:w-80 space-y-3 sm:space-y-4">
      {/* Status Info */}
      <div className="border rounded-lg p-3 sm:p-4 bg-blue-50">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <h4 className="font-medium text-xs sm:text-sm text-blue-900">Python Runtime</h4>
        </div>
        <div className="text-xs text-blue-700 space-y-1">
          {pyodideLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              Загрузка Python 3.11 (≈30МБ)...
            </div>
          ) : pyodide ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-3 w-3" />
              Готово - Python 3.11
            </div>
          ) : (
            <div className="text-orange-600 flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600"></div>
              Инициализация...
            </div>
          )}
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Код выполняется безопасно в вашем браузере
        </p>
      </div>

      {/* Test Section */}
      <div className="border rounded-lg p-3 sm:p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-medium text-xs sm:text-sm">Протестируйте решение</h4>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTests(!showTests)}
              className="text-xs text-blue-600 hover:underline whitespace-nowrap"
            >
              {showTests ? 'Скрыть тесты' : 'Показать тесты'}
            </button>
            {testCode && (
              <button
                onClick={() => {
                  const blob = new Blob([testCode], { type: 'text/x-python' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'tests.py'
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="text-xs text-green-600 hover:underline flex items-center gap-1"
                title="Скачать тестовый код"
              >
                <Download className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {showTests && testCode && (
          <div className="mb-3 p-2 sm:p-3 bg-white border rounded">
            <div className="text-xs text-gray-600 mb-2">
              Тестовый код, который будет запущен для вашего решения:
            </div>
            <div className="text-xs font-mono whitespace-pre-wrap bg-gray-900 text-green-400 p-2 rounded max-h-32 overflow-y-auto">
              {testCode}
            </div>
          </div>
        )}

        <button
          onClick={handleTestCode}
          disabled={isTesting || !code.trim() || pyodideLoading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 text-xs sm:text-sm transition-colors"
        >
          {isTesting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Тестирование...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              {pyodide ? 'Запустить тесты' : 'Проверить синтаксис'}
            </>
          )}
        </button>

        {testResult && (
          <div className={`mt-3 p-2 sm:p-3 rounded text-xs sm:text-sm ${
            testResult.passed 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {testResult.passed ? (
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="font-medium break-words">{testResult.message}</span>
            </div>
            {testResult.output && (
              <pre className="text-xs mt-2 whitespace-pre-wrap font-mono bg-black/10 p-2 rounded overflow-x-auto">
                {testResult.output}
              </pre>
            )}
            {testResult.error && (
              <pre className="text-xs mt-2 whitespace-pre-wrap text-red-600 font-mono bg-red-100 p-2 rounded overflow-x-auto">
                {testResult.error}
              </pre>
            )}
            {testResult.executionTime && (
              <div className="text-xs text-gray-500 mt-2">
                Время выполнения: {testResult.executionTime}мс
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submission Status */}
      {latestSubmission && (
        <div className={`p-2 sm:p-3 rounded-lg border ${
          latestSubmission.passed 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {latestSubmission.passed ? (
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
            )}
            <span className={`font-medium text-xs sm:text-sm ${
              latestSubmission.passed ? 'text-green-800' : 'text-red-800'
            }`}>
              {latestSubmission.passed ? 'Завершено' : 'Требует доработки'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">
            Отправлено {new Date(latestSubmission.created_at).toLocaleDateString('ru-RU')}
          </p>
          {latestSubmission.output && (
            <button
              onClick={() => {
                setTestResult({
                  passed: latestSubmission.passed,
                  message: latestSubmission.passed ? 'Предыдущая отправка прошла' : 'Предыдущая отправка не прошла',
                  output: latestSubmission.output
                })
                setShowTests(true)
              }}
              className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <Eye className="h-3 w-3" />
              Просмотреть детали
            </button>
          )}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !code.trim() || pyodideLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm sm:text-base transition-colors"
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Отправка...
          </div>
        ) : (
          'Отправить решение'
        )}
      </button>

      {/* Previous Submissions */}
      {submissions.length > 0 && (
        <div className="border rounded-lg p-2 sm:p-3">
          <h4 className="font-medium text-xs sm:text-sm mb-2">Недавние отправки</h4>
          <div className="space-y-2">
            {submissions.slice(0, 3).map((submission, index) => (
              <div key={submission.id} className="flex items-center gap-2 text-xs sm:text-sm">
                {submission.passed ? (
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
                )}
                <span className="text-gray-600">
                  Попытка {submissions.length - index}
                </span>
                <Clock className="h-3 w-3 text-gray-400 ml-auto flex-shrink-0" />
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(submission.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}