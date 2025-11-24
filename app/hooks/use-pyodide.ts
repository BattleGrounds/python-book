// app/hooks/use-pyodide.ts
'use client'

import { useState, useEffect } from 'react'

declare global {
  interface Window {
    loadPyodide: any;
    pyodideOutputBuffer?: string;
    pyodideInputQueue?: string[];
    pyodideInputResolver?: (value: string) => void;
    pyodideWaitingForInput?: boolean;
  }
}

interface RunCodeResult {
  output: string;
  error?: string;
  waitingForInput?: boolean;
}

interface RunCodeOptions {
  stdin?: string;
  onInputRequest?: () => void;
}

export function usePyodide() {
  const [pyodide, setPyodide] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [output, setOutput] = useState<string>('')
  const [isRunning, setIsRunning] = useState(false)
  const [waitingForInput, setWaitingForInput] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadPyodideInstance = async () => {
      try {
        // Если Pyodide уже загружен в window
        if (window.loadPyodide) {
          const pyodideInstance = await window.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.0/full/",
          })
          await pyodideInstance.loadPackage(['micropip'])
          
          if (mounted) {
            setPyodide(pyodideInstance)
            setLoading(false)
          }
          return
        }

        // Динамически загружаем Pyodide
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.29.0/full/pyodide.js'
        
        script.onload = async () => {
          if (!window.loadPyodide) {
            throw new Error('Pyodide failed to load')
          }

          try {
            const pyodideInstance = await window.loadPyodide({
              indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.0/full/",
            })
            await pyodideInstance.loadPackage(['micropip'])
            
            if (mounted) {
              setPyodide(pyodideInstance)
              setLoading(false)
            }
          } catch (err: any) {
            if (mounted) {
              setError(`Pyodide initialization failed: ${err.message}`)
              setLoading(false)
            }
          }
        }

        script.onerror = () => {
          if (mounted) {
            setError('Failed to load Pyodide script')
            setLoading(false)
          }
        }

        document.head.appendChild(script)

      } catch (err: any) {
        if (mounted) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    loadPyodideInstance()

    return () => {
      mounted = false
    }
  }, [])

  const runCode = async (code: string, options?: RunCodeOptions): Promise<RunCodeResult> => {
    if (!pyodide) {
      return { output: 'Pyodide not loaded yet', error: 'Pyodide not loaded' }
    }

    setIsRunning(true)
    setWaitingForInput(false)
    setOutput('')

    try {
      // Инициализируем буфер вывода и очередь ввода
      window.pyodideOutputBuffer = ''
      window.pyodideInputQueue = options?.stdin ? options.stdin.split('\n') : []
      window.pyodideWaitingForInput = false

      // Настраиваем перехват вывода с помощью registerJsModule
      pyodide.registerJsModule("output_module", {
        write: (text: string) => {
          if (text !== '\n') {
            if (window.pyodideOutputBuffer !== undefined) {
              window.pyodideOutputBuffer += text
            }
          }
        },
        flush: () => {}
      })

      // Настраиваем перехват ввода
      pyodide.registerJsModule("input_module", {
        readline: () => {
          // Если есть данные в очереди, возвращаем их
          if (window.pyodideInputQueue && window.pyodideInputQueue.length > 0) {
            const line = window.pyodideInputQueue.shift() || ''
            return line
          }
          
          // Если очередь пуста, запрашиваем ввод
          window.pyodideWaitingForInput = true
          setWaitingForInput(true)
          
          if (options?.onInputRequest) {
            options.onInputRequest()
          }
          
          // Возвращаем пустую строку, если нет данных
          return ''
        }
      })

      // Выполняем код для настройки stdout/stderr/stdin
      await pyodide.runPythonAsync(`
import sys
import output_module
import input_module

class OutputInterceptor:
    def write(self, text):
        output_module.write(text+"\\n")
    def flush(self):
        output_module.flush()

class InputInterceptor:
    def readline(self):
        return input_module.readline()
    def read(self, size=-1):
        if size == -1:
            return self.readline()
        return self.readline()[:size] if size else ""
    def readlines(self):
        lines = []
        while True:
            line = self.readline()
            if not line:
                break
            lines.append(line)
        return lines

sys.stdout = OutputInterceptor()
sys.stderr = OutputInterceptor()
sys.stdin = InputInterceptor()

# Переопределяем встроенную функцию input()
def custom_input(prompt=""):
    if prompt:
        output_module.write(prompt)
    return input_module.readline()

# Переопределяем input() через setattr на builtins модуле
import builtins
setattr(builtins, 'input', custom_input)
`)

      // Выполняем пользовательский код
      await pyodide.runPythonAsync(code)
      
      // Получаем вывод из буфера
      const result = window.pyodideOutputBuffer || ''
      
      setOutput(result)
      setIsRunning(false)
      setWaitingForInput(false)
      
      return { output: result }
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred'
      
      // Пытаемся получить вывод даже при ошибке
      const errorOutput = window.pyodideOutputBuffer 
        ? `${window.pyodideOutputBuffer}\n\nError: ${errorMessage}`
        : `Error: ${errorMessage}`
      
      setOutput(errorOutput)
      setIsRunning(false)
      setWaitingForInput(false)
      return { output: errorOutput, error: errorMessage }
    } finally {
      // Очищаем буферы
      delete window.pyodideOutputBuffer
      delete window.pyodideInputQueue
      delete window.pyodideWaitingForInput
      setIsRunning(false)
      setWaitingForInput(false)
    }
  }

  const provideInput = (input: string) => {
    if (window.pyodideInputQueue !== undefined) {
      if (!window.pyodideInputQueue) {
        window.pyodideInputQueue = []
      }
      window.pyodideInputQueue.push(input)
      window.pyodideWaitingForInput = false
      setWaitingForInput(false)
    }
  }

  const clearOutput = () => {
    setOutput('')
  }

  return {
    pyodide,
    loading,
    error,
    output,
    isRunning,
    waitingForInput,
    runCode,
    provideInput,
    clearOutput,
  }
}