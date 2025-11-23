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
      throw new Error('Python runtime is still loading. Please wait...')
    }

    if (!testCode) {
      throw new Error('No test code available for this lesson')
    }

    // Проверяем что студент написал функцию solution
    if (!studentCode.includes('def solution(')) {
      return {
        passed: false,
        message: 'Missing solution function',
        error: 'You must define a function called solution()',
        output: '❌ Please define a function called solution() according to the task'
      }
    }

    // Проверяем синтаксис
    const syntaxCheck = PythonCodeChecker.validateSyntax(studentCode)
    if (!syntaxCheck.valid) {
      return {
        passed: false,
        message: 'Syntax error',
        error: syntaxCheck.error,
        output: `❌ Syntax error: ${syntaxCheck.error}`
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
        message: 'Execution failed',
        error: error.message,
        output: `💥 Execution error: ${error.message}`
      }
    }
  }

  const handleTestCode = async () => {
    if (!code.trim()) {
      alert('Please write some code first!')
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
        message: 'Test execution failed',
        error: error.message || 'Unknown error during testing',
        output: `❌ Test failed: ${error.message || 'Unknown error'}`
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert('Please write some code first!')
      return
    }

    if (!userId) {
      alert('User not authenticated. Please refresh the page.')
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
      alert(`Submission failed: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const latestSubmission = submissions[0]


  return (
    <div className="w-80 space-y-4">
      {/* Status Info */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="h-4 w-4 text-blue-600" />
          <h4 className="font-medium text-sm text-blue-900">Python Runtime</h4>
        </div>
        <div className="text-xs text-blue-700 space-y-1">
          {pyodideLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              Loading Python 3.11 (≈30MB)...
            </div>
          ) : pyodide ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-3 w-3" />
              Ready - Python 3.11
            </div>
          ) : (
            <div className="text-orange-600 flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600"></div>
              Initializing...
            </div>
          )}
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Code runs securely in your browser
        </p>
      </div>

      {/* Test Section */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm">Test Your Solution</h4>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTests(!showTests)}
              className="text-xs text-blue-600 hover:underline"
            >
              {showTests ? 'Hide Tests' : 'Show Tests'}
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
                title="Download test code"
              >
                <Download className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {showTests && testCode && (
          <div className="mb-3 p-3 bg-white border rounded">
            <div className="text-xs text-gray-600 mb-2">
              Test code that will run against your solution:
            </div>
            <div className="text-xs font-mono whitespace-pre-wrap bg-gray-900 text-green-400 p-2 rounded max-h-32 overflow-y-auto">
              {testCode}
            </div>
          </div>
        )}

        <button
          onClick={handleTestCode}
          disabled={isTesting || !code.trim() || pyodideLoading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 text-sm transition-colors"
        >
          {isTesting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Testing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              {pyodide ? 'Run Tests' : 'Check Syntax'}
            </>
          )}
        </button>

        {testResult && (
          <div className={`mt-3 p-3 rounded text-sm ${
            testResult.passed 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {testResult.passed ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span className="font-medium">{testResult.message}</span>
            </div>
            {testResult.output && (
              <pre className="text-xs mt-2 whitespace-pre-wrap font-mono bg-black/10 p-2 rounded">
                {testResult.output}
              </pre>
            )}
            {testResult.error && (
              <pre className="text-xs mt-2 whitespace-pre-wrap text-red-600 font-mono bg-red-100 p-2 rounded">
                {testResult.error}
              </pre>
            )}
            {testResult.executionTime && (
              <div className="text-xs text-gray-500 mt-2">
                Execution time: {testResult.executionTime}ms
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submission Status */}
      {latestSubmission && (
        <div className={`p-3 rounded-lg border ${
          latestSubmission.passed 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {latestSubmission.passed ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span className={`font-medium ${
              latestSubmission.passed ? 'text-green-800' : 'text-red-800'
            }`}>
              {latestSubmission.passed ? 'Completed' : 'Needs Work'}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Submitted {new Date(latestSubmission.created_at).toLocaleDateString()}
          </p>
          {latestSubmission.output && (
            <button
              onClick={() => {
                setTestResult({
                  passed: latestSubmission.passed,
                  message: latestSubmission.passed ? 'Previous submission passed' : 'Previous submission failed',
                  output: latestSubmission.output
                })
                setShowTests(true)
              }}
              className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <Eye className="h-3 w-3" />
              View details
            </button>
          )}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !code.trim() || pyodideLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Submitting...
          </div>
        ) : (
          'Submit Solution'
        )}
      </button>

      {/* Previous Submissions */}
      {submissions.length > 0 && (
        <div className="border rounded-lg p-3">
          <h4 className="font-medium text-sm mb-2">Recent Submissions</h4>
          <div className="space-y-2">
            {submissions.slice(0, 3).map((submission, index) => (
              <div key={submission.id} className="flex items-center gap-2 text-sm">
                {submission.passed ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-gray-600">
                  Attempt {submissions.length - index}
                </span>
                <Clock className="h-3 w-3 text-gray-400 ml-auto" />
                <span className="text-xs text-gray-500">
                  {new Date(submission.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}