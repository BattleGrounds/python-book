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
      <div className="text-gray-600">Loading Python Editor...</div>
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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span>Module: {lesson.modules.title}</span>
              <span>•</span>
              <span>Lesson {lesson.order}</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
            <p className="text-gray-700 mb-4">{lesson.content}</p>
            
            {lesson.exercise && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Exercise:</h3>
                <p className="text-blue-800">{lesson.exercise}</p>
                
                {lesson.solution && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-blue-700 font-medium">
                      Show example solution
                    </summary>
                    <pre className="mt-2 p-3 bg-blue-100 rounded text-sm overflow-x-auto">
                      {lesson.solution}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
          
          <SubmitSolution 
            lessonId={lesson.id}
            submissions={submissions}
            code={currentCode}
            onCodeRun={handleCodeRun}
          />
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <CodeEditor 
          initialCode={currentCode}
          lesson={lesson}
          onCodeRun={handleCodeRun}
          onCodeChange={handleCodeChange}
        />
      </div>

      {/* Test Results Panel */}
      {testResult && (
        <div className={`border-t p-4 ${
          testResult.passed 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {testResult.passed ? (
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <XCircle className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <h3 className="font-semibold">
                {testResult.passed ? 'Tests Passed!' : 'Tests Failed'}
              </h3>
              <p className="text-sm opacity-75">{testResult.message}</p>
            </div>
          </div>
          {testResult.output && (
            <pre className="mt-3 p-3 bg-black text-green-400 rounded text-sm font-mono overflow-x-auto">
              {testResult.output}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}