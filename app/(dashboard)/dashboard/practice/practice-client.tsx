'use client'

import dynamic from 'next/dynamic'

// Динамически импортируем редактор на клиенте
const CodeEditor = dynamic(() => import('@/components/editor/code-editor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-gray-600">Loading Python Editor...</div>
    </div>
  )
})

export function PracticeClient() {
  return (
    <div className="h-screen flex flex-col">
      <div className="p-6 border-b bg-white">
        <h1 className="text-2xl font-bold">Python Playground</h1>
        <p className="text-gray-600">
          Practice your Python skills in this interactive editor powered by Pyodide
        </p>
      </div>
      
      <div className="flex-1">
        <CodeEditor />
      </div>
    </div>
  )
}