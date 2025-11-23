// app/hooks/use-pyodide.ts
'use client'

import { useState, useEffect } from 'react'

declare global {
  interface Window {
    loadPyodide: any;
    pyodideOutputBuffer?: string;
  }
}

interface RunCodeResult {
  output: string;
  error?: string;
}

export function usePyodide() {
  const [pyodide, setPyodide] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [output, setOutput] = useState<string>('')
  const [isRunning, setIsRunning] = useState(false)

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

  const runCode = async (code: string): Promise<RunCodeResult> => {
    if (!pyodide) {
      return { output: 'Pyodide not loaded yet', error: 'Pyodide not loaded' }
    }

    setIsRunning(true)
    setOutput('')

    try {
      // Инициализируем буфер вывода
      window.pyodideOutputBuffer = ''

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

      // Выполняем код для настройки stdout/stderr
      await pyodide.runPythonAsync(`
import sys
import output_module

class OutputInterceptor:
    def write(self, text):
        output_module.write(text+"\\n")
    def flush(self):
        output_module.flush()

sys.stdout = OutputInterceptor()
sys.stderr = OutputInterceptor()
`)

      // Выполняем пользовательский код
      await pyodide.runPythonAsync(code)
      
      // Получаем вывод из буфера
      const result = window.pyodideOutputBuffer || ''
      
      setOutput(result)
      setIsRunning(false)
      
      return { output: result }
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred'
      
      // Пытаемся получить вывод даже при ошибке
      const errorOutput = window.pyodideOutputBuffer 
        ? `${window.pyodideOutputBuffer}\n\nError: ${errorMessage}`
        : `Error: ${errorMessage}`
      
      setOutput(errorOutput)
      setIsRunning(false)
      return { output: errorOutput, error: errorMessage }
    } finally {
      // Очищаем буфер
      delete window.pyodideOutputBuffer
      setIsRunning(false)
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
    runCode,
    clearOutput,
  }
}