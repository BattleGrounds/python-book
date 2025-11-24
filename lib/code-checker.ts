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
      // Инициализируем буфер вывода для тестов
      if (typeof window !== 'undefined') {
        window.pyodideOutputBuffer = ''
      }

      // Настраиваем перехват вывода для тестов
      pyodide.registerJsModule("test_output_module", {
        write: (text: string) => {
          if (text !== '\n' && typeof window !== 'undefined' && window.pyodideOutputBuffer !== undefined) {
            window.pyodideOutputBuffer += text
          }
        },
        flush: () => {}
      })

      // Настраиваем stdin для тестов - возвращаем пустую строку, чтобы не блокировать выполнение
      pyodide.registerJsModule("test_input_module", {
        readline: () => {
          // Для тестов всегда возвращаем пустую строку, чтобы не запрашивать интерактивный ввод
          return ''
        }
      })

      // Настраиваем вывод для тестов (но позволяем тестам управлять stdin самим)
      await pyodide.runPythonAsync(`
import sys
import test_output_module

class TestOutputInterceptor:
    def write(self, text):
        test_output_module.write(text+"\\n")
    def flush(self):
        test_output_module.flush()

# Сохраняем оригинальные stdin/stdout для восстановления
_original_stdout = sys.stdout
_original_stderr = sys.stderr
_original_stdin = sys.stdin

# Переопределяем только stdout/stderr для перехвата вывода
sys.stdout = TestOutputInterceptor()
sys.stderr = TestOutputInterceptor()

# НЕ переопределяем sys.stdin - позволим тестам самим управлять им
# Переопределяем input() чтобы он работал с текущим sys.stdin (включая StringIO)
import builtins
_original_input = builtins.input

def test_input(prompt=""):
    if prompt:
        test_output_module.write(prompt)
    # Если sys.stdin имеет метод readline (например, StringIO), используем его напрямую
    if hasattr(sys.stdin, 'readline'):
        try:
            line = sys.stdin.readline()
            # Убираем символ новой строки в конце, если есть
            return line.rstrip('\\n\\r')
        except:
            pass
    # Иначе используем оригинальный input
    try:
        return _original_input(prompt)
    except:
        # Если input() не работает (нет данных), возвращаем пустую строку
        return ""

setattr(builtins, 'input', test_input)
      `)

      // Выполняем код студента
      await pyodide.runPythonAsync(studentCode)

      // Выполняем тесты
      await pyodide.runPythonAsync(testCode)

      // Получаем вывод из буфера
      const stdout = typeof window !== 'undefined' && window.pyodideOutputBuffer 
        ? window.pyodideOutputBuffer 
        : ''

      const executionTime = Date.now() - startTime

      const passed = !!(stdout && !stdout.includes('❌') && !stdout.includes('Failed') && stdout.includes('All tests passed'))
      const message = passed ? 'Tests passed' : 'Tests failed'

      return {
        passed,
        message,
        output: stdout || undefined,
        error: undefined,
        executionTime
      }

    } catch (error: any) {
      const executionTime = Date.now() - startTime
      
      let lastOutput = ''
      try {
        lastOutput = typeof window !== 'undefined' && window.pyodideOutputBuffer 
          ? window.pyodideOutputBuffer 
          : ''
      } catch (e) {}

      return {
        passed: false,
        message: 'Execution error',
        output: lastOutput,
        error: error.message,
        executionTime
      }
    } finally {
      // Очищаем буфер после тестов
      if (typeof window !== 'undefined') {
        delete window.pyodideOutputBuffer
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