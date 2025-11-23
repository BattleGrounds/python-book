'use client'

import dynamic from 'next/dynamic'

// Динамически импортируем редактор без SSR
const CodeEditor = dynamic(() => import('./code-editor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-900 rounded-lg">
      <div className="text-white">Loading Editor...</div>
    </div>
  )
})

export { CodeEditor }