'use client'

import { useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { usePyodide } from '@/app/hooks/use-pyodide'
import { Play, Square, RotateCcw, Download, Upload, ArrowRight } from 'lucide-react'

// Динамически импортируем Monaco Editor
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900">
      <div className="text-white">Loading Editor...</div>
    </div>
  )
})

interface CodeEditorProps {
  initialCode?: string
  lesson?: any
  onCodeRun?: (result: any) => void
  onCodeChange?: (code: string) => void
  readOnly?: boolean
}

const DEFAULT_CODE = `# Welcome to Python Editor!
# Write your Python code here and click Run

print("Hello, World!")

# Simple calculations
result = 2 + 3 * 4
print(f"2 + 3 * 4 = {result}")

# Lists and loops
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(f"I like {fruit}")

# Functions
def greet(name):
    return f"Hello, {name}!"

print(greet("Python Learner"))`

export default function CodeEditor({ 
  initialCode = DEFAULT_CODE, 
  lesson,
  onCodeRun,
  onCodeChange,
  readOnly = false 
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [stdin, setStdin] = useState('')
  const [stdinLines, setStdinLines] = useState<string[]>([])
  const editorRef = useRef<any>(null)
  const stdinInputRef = useRef<HTMLInputElement>(null)
  
  const {
    loading,
    error,
    output,
    isRunning,
    waitingForInput,
    runCode,
    provideInput,
    clearOutput,
  } = usePyodide()

  const handleEditorDidMount = useCallback((editor: any) => {
    editorRef.current = editor
    setIsEditorReady(true)
  }, [])

  const handleCodeChange = useCallback((value: string = '') => {
    setCode(value)
    if (onCodeChange) {
      onCodeChange(value)
    }
  }, [onCodeChange])

  const handleRunCode = async () => {
    console.log('Running code:', code)
    
    // Подготавливаем stdin из текстового поля
    const stdinData = stdin.trim() || stdinLines.join('\n')
    
    // Проверяем, есть ли функция solution() в коде
    const hasSolutionFunction = /def\s+solution\s*\(/.test(code)
    
    // Если есть функция solution, добавляем её вызов
    let codeToRun = code
    if (hasSolutionFunction) {
      codeToRun = code + '\n\n# Автоматический вызов solution()\nsolution()'
    }
    
    const result = await runCode(codeToRun, {
      stdin: stdinData,
      onInputRequest: () => {
        // Фокус на поле ввода, если код запрашивает ввод
        if (stdinInputRef.current) {
          stdinInputRef.current.focus()
        }
      }
    })
    console.log('Run result:', result)
    
    if (onCodeRun) {
      onCodeRun(result)
    }
  }

  const handleStdinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (stdin.trim() && waitingForInput) {
      provideInput(stdin.trim())
      setStdinLines(prev => [...prev, stdin.trim()])
      setStdin('')
    }
  }

  const handleStdinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && waitingForInput) {
      e.preventDefault()
      handleStdinSubmit(e)
    }
  }

  const handleStopCode = () => {
    // Note: Pyodide execution cannot be stopped easily in browser
    // This is mostly for UI consistency
    clearOutput()
  }

  const handleResetCode = () => {
    setCode(initialCode)
    setStdin('')
    setStdinLines([])
    clearOutput()
  }

  const handleSaveCode = () => {
    const blob = new Blob([code], { type: 'text/x-python' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'code.py'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleLoadCode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setCode(content)
      clearOutput()
    }
    reader.readAsText(file)
    
    // Сбрасываем input чтобы можно было загрузить тот же файл снова
    event.target.value = ''
  }

  // Определяем содержимое консоли вывода
  const consoleContent = error 
    ? `Error: ${error}`
    : output 
    ? output 
    : "Run your code to see output here..."

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold">
            {lesson?.title || 'Python Editor'}
          </h3>
          {loading && (
            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">
              Loading Pyodide...
            </span>
          )}
          {error && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">
              Load Error
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 cursor-pointer text-sm">
            <Upload className="h-4 w-4" />
            Load
            <input
              type="file"
              accept=".py,.txt"
              onChange={handleLoadCode}
              className="hidden"
            />
          </label>

          <button
            onClick={handleSaveCode}
            disabled={!isEditorReady}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-sm"
          >
            <Download className="h-4 w-4" />
            Save
          </button>

          <button
            onClick={handleResetCode}
            disabled={!isEditorReady}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-sm"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>

          <button
            onClick={handleRunCode}
            disabled={!isEditorReady || isRunning || loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running...' : 'Run'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Code Editor */}
        <div className="flex-1 min-w-0 border-r border-gray-700">
          <Editor
            height="100%"
            defaultLanguage="python"
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly: readOnly,
              tabSize: 4,
              insertSpaces: true,
              detectIndentation: true,
              trimAutoWhitespace: true,
              wordWrap: 'on',
            }}
          />
        </div>

        {/* Output Panel */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="p-3 bg-gray-800 border-b border-gray-700">
            <h4 className="text-white font-medium">Output</h4>
          </div>
          
          <div className="flex-1 p-4 bg-black overflow-auto">
            <pre className={`font-mono text-sm whitespace-pre-wrap ${
              error ? 'text-red-400' : output ? 'text-green-400' : 'text-gray-400'
            }`}>
              {consoleContent}
            </pre>
          </div>

          {/* Stdin Input Area */}
          <div className="border-t border-gray-700 bg-gray-800">
            <div className="p-3 border-b border-gray-700">
              <h4 className="text-white font-medium text-sm">Standard Input (stdin)</h4>
              <p className="text-gray-400 text-xs mt-1">
                {waitingForInput 
                  ? 'Code is waiting for input. Enter a value and press Enter.' 
                  : 'Enter input values (one per line) or leave empty to provide input interactively.'}
              </p>
            </div>
            
            {waitingForInput ? (
              <form onSubmit={handleStdinSubmit} className="p-3 flex gap-2">
                <input
                  ref={stdinInputRef}
                  type="text"
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  onKeyDown={handleStdinKeyDown}
                  placeholder="Enter input value..."
                  className="flex-1 px-3 py-2 bg-gray-900 text-white border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  Send
                </button>
              </form>
            ) : (
              <div className="p-3">
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter input values (one per line)&#10;Example:&#10;5&#10;10&#10;hello"
                  className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-600 rounded focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
                  rows={3}
                />
                <p className="text-gray-400 text-xs mt-2">
                  Each line will be provided as input when your code calls input()
                </p>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400 flex justify-between">
            <div>
              {waitingForInput ? (
                <span className="text-yellow-400">● Waiting for input...</span>
              ) : isRunning ? (
                <span className="text-yellow-400">● Running Python code...</span>
              ) : loading ? (
                <span className="text-blue-400">● Loading Pyodide...</span>
              ) : (
                <span>● Ready</span>
              )}
            </div>
            <div className="text-gray-500">
              Python 3.11 (Pyodide)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}