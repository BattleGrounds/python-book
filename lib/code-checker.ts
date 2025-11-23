export interface TestResult {
  passed: boolean
  message: string
  output?: string
  error?: string
  executionTime?: number
}

export class PythonCodeChecker {
  /**
   * Просто выполняет код студента и тесты
   */
  static async executeCode(
    studentCode: string,
    testCode: string,
    pyodide: any
  ): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      // Сбрасываем вывод
      await pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
      `)

      // Выполняем код студента
      await pyodide.runPythonAsync(studentCode)

      // Выполняем тесты
      await pyodide.runPythonAsync(testCode)

      // Получаем вывод
      const stdout = pyodide.runPython('sys.stdout.getvalue()')
      const stderr = pyodide.runPython('sys.stderr.getvalue()')

      const executionTime = Date.now() - startTime

      const passed = !stderr && stdout && !stdout.includes('❌')
      const message = passed ? 'Tests passed' : 'Tests failed'

      return {
        passed,
        message,
        output: stdout || stderr,
        error: stderr || undefined,
        executionTime
      }

    } catch (error: any) {
      const executionTime = Date.now() - startTime
      
      let lastOutput = ''
      try {
        lastOutput = pyodide.runPython('sys.stdout.getvalue()') || ''
      } catch (e) {}

      return {
        passed: false,
        message: 'Execution error',
        output: lastOutput,
        error: error.message,
        executionTime
      }
    }
  }

  /**
   * Проверка синтаксиса
   */
  static validateSyntax(code: string): { valid: boolean; error?: string } {
    const lines = code.split('\n')
    
    let openParens = 0
    let openBrackets = 0
    let openBraces = 0
    let inString = false
    let stringChar = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (!line || line.startsWith('#')) continue

      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        const prevChar = j > 0 ? line[j - 1] : ''
        
        if (!inString && (char === '"' || char === "'")) {
          inString = true
          stringChar = char
        } else if (inString && char === stringChar && prevChar !== '\\') {
          inString = false
          stringChar = ''
        }
        
        if (!inString) {
          if (char === '(') openParens++
          if (char === ')') openParens--
          if (char === '[') openBrackets++
          if (char === ']') openBrackets--
          if (char === '{') openBraces++
          if (char === '}') openBraces--
        }
      }
    }

    if (inString) {
      return { valid: false, error: 'Unclosed string literal' }
    }
    if (openParens !== 0) {
      return { valid: false, error: 'Unbalanced parentheses' }
    }
    if (openBrackets !== 0) {
      return { valid: false, error: 'Unbalanced brackets' }
    }
    if (openBraces !== 0) {
      return { valid: false, error: 'Unbalanced braces' }
    }

    return { valid: true }
  }
}