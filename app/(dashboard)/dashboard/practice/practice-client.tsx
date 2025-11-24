'use client'

import dynamic from 'next/dynamic'

// Динамически импортируем редактор на клиенте
const CodeEditor = dynamic(() => import('@/components/editor/code-editor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-gray-600">Загрузка редактора Python...</div>
    </div>
  )
})

export function PracticeClient() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 sm:p-6 border-b bg-white">
        <h1 className="text-xl sm:text-2xl font-bold">Песочница Python</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Практикуйте навыки Python в этом интерактивном редакторе на Pyodide
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        <CodeEditor />
      </div>
    </div>
  )
}