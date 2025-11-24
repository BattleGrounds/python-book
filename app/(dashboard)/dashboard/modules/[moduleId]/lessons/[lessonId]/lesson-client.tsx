'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { SubmitSolution } from '@/components/editor/submit-solution'
import { CheckCircle, XCircle } from 'lucide-react'

// Динамически импортируем редактор на клиенте
const CodeEditor = dynamic(() => import('@/components/editor/code-editor'), {
  ssr: false,
      loading: () => (
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">Загрузка редактора Python...</div>
        </div>
      )
})

interface LessonClientProps {
  lesson: any
  submissions: any[]
}

export function LessonClient({ lesson, submissions }: LessonClientProps) {
  const [currentCode, setCurrentCode] = useState(
    lesson.exercise 
      ? `# ${lesson.title}\n# ${lesson.exercise}\n\n# Your solution here\ndef solution():\n\tpass` 
      : `# ${lesson.title}\n# Write your code here\ndef solution():\n\tpass`
  )
  const [testResult, setTestResult] = useState<any>(null)

  const handleCodeChange = (value: string = '') => {
    setCurrentCode(value)
  }

  const handleCodeRun = (result: any) => {
    setTestResult(result)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-3 sm:p-4 md:p-6 border-b bg-white">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
          <div className="flex-1 w-full min-w-0">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-2">
              <span>Модуль: {lesson.modules.title}</span>
              <span>•</span>
              <span>Урок {lesson.order}</span>
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 break-words">{lesson.title}</h1>
            <p className="text-sm sm:text-base text-gray-700 mb-4 whitespace-pre-wrap">{lesson.content}</p>
            
            {lesson.exercise && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Задание:</h3>
                <p className="text-xs sm:text-sm text-blue-800 whitespace-pre-wrap">{lesson.exercise}</p>
                
                {lesson.solution && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs sm:text-sm text-blue-700 font-medium">
                      Показать пример решения
                    </summary>
                    <pre className="mt-2 p-2 sm:p-3 bg-blue-100 rounded text-xs sm:text-sm overflow-x-auto">
                      {lesson.solution}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
          
          <div className="w-full lg:w-auto lg:min-w-[280px]">
            <SubmitSolution 
              lessonId={lesson.id}
              submissions={submissions}
              code={currentCode}
              onCodeRun={handleCodeRun}
            />
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <CodeEditor 
          initialCode={currentCode}
          lesson={lesson}
          onCodeRun={handleCodeRun}
          onCodeChange={handleCodeChange}
        />
      </div>

      {/* Test Results Panel */}
      {testResult && (
        <div className={`border-t p-3 sm:p-4 ${
          testResult.passed 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-2 sm:gap-3">
            {testResult.passed ? (
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            ) : (
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base">
                {testResult.passed ? 'Тесты пройдены!' : 'Тесты не пройдены'}
              </h3>
              <p className="text-xs sm:text-sm opacity-75 break-words">{testResult.message}</p>
            </div>
          </div>
          {testResult.output && (
            <pre className="mt-3 p-2 sm:p-3 bg-black text-green-400 rounded text-xs sm:text-sm font-mono overflow-x-auto">
              {testResult.output}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}