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
      <div className="text-white">Загрузка редактора...</div>
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

const DEFAULT_CODE = `# Добро пожаловать в редактор Python!
# Напишите свой код Python здесь и нажмите Запустить

print("Привет, мир!")

# Простые вычисления
result = 2 + 3 * 4
print(f"2 + 3 * 4 = {result}")

# Списки и циклы
fruits = ["яблоко", "банан", "вишня"]
for fruit in fruits:
    print(f"Мне нравится {fruit}")

# Функции
def greet(name):
    return f"Привет, {name}!"

print(greet("Изучающий Python"))`

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
    ? `Ошибка: ${error}`
    : output 
    ? output 
    : "Запустите код, чтобы увидеть вывод здесь..."

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Editor Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 sm:p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-white font-semibold text-sm sm:text-base">
            {lesson?.title || 'Редактор Python'}
          </h3>
          {loading && (
            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded whitespace-nowrap">
              Загрузка Pyodide...
            </span>
          )}
          {error && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded whitespace-nowrap">
              Ошибка загрузки
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <label className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-700 text-white rounded hover:bg-gray-600 cursor-pointer text-xs sm:text-sm">
            <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Загрузить</span>
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
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-xs sm:text-sm"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Сохранить</span>
          </button>

          <button
            onClick={handleResetCode}
            disabled={!isEditorReady}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-xs sm:text-sm"
          >
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Сброс</span>
          </button>

          <button
            onClick={handleRunCode}
            disabled={!isEditorReady || isRunning || loading}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-medium text-xs sm:text-sm"
          >
            <Play className="h-3 w-3 sm:h-4 sm:w-4" />
            {isRunning ? 'Выполняется...' : 'Запустить'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Code Editor */}
        <div className="flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-gray-700">
          <Editor
            height="100%"
            defaultLanguage="python"
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
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
          <div className="p-2 sm:p-3 bg-gray-800 border-b border-gray-700">
            <h4 className="text-white font-medium text-xs sm:text-sm">Вывод</h4>
          </div>
          
          <div className="flex-1 p-2 sm:p-4 bg-black overflow-auto">
            <pre className={`font-mono text-xs sm:text-sm whitespace-pre-wrap ${
              error ? 'text-red-400' : output ? 'text-green-400' : 'text-gray-400'
            }`}>
              {consoleContent}
            </pre>
          </div>

          {/* Stdin Input Area */}
          <div className="border-t border-gray-700 bg-gray-800">
            <div className="p-2 sm:p-3 border-b border-gray-700">
              <h4 className="text-white font-medium text-xs sm:text-sm">Стандартный ввод (stdin)</h4>
              <p className="text-gray-400 text-xs mt-1">
                {waitingForInput 
                  ? 'Код ожидает ввода. Введите значение и нажмите Enter.' 
                  : 'Введите значения (по одному на строку) или оставьте пустым для интерактивного ввода.'}
              </p>
            </div>
            
            {waitingForInput ? (
              <form onSubmit={handleStdinSubmit} className="p-2 sm:p-3 flex gap-2">
                <input
                  ref={stdinInputRef}
                  type="text"
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  onKeyDown={handleStdinKeyDown}
                  placeholder="Введите значение..."
                  className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-900 text-white border border-gray-600 rounded focus:outline-none focus:border-blue-500 text-xs sm:text-sm"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  Отправить
                </button>
              </form>
            ) : (
              <div className="p-2 sm:p-3">
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Введите значения (по одному на строку)&#10;Пример:&#10;5&#10;10&#10;привет"
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-900 text-white border border-gray-600 rounded focus:outline-none focus:border-blue-500 font-mono text-xs sm:text-sm resize-none"
                  rows={3}
                />
                <p className="text-gray-400 text-xs mt-2">
                  Каждая строка будет передана как ввод, когда ваш код вызовет input()
                </p>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400 flex flex-col sm:flex-row justify-between gap-1">
            <div>
              {waitingForInput ? (
                <span className="text-yellow-400">● Ожидание ввода...</span>
              ) : isRunning ? (
                <span className="text-yellow-400">● Выполнение кода Python...</span>
              ) : loading ? (
                <span className="text-blue-400">● Загрузка Pyodide...</span>
              ) : (
                <span>● Готово</span>
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