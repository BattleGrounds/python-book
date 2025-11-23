'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Динамически импортируем Monaco Editor для тестов
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 border rounded bg-gray-50">
      <div className="text-gray-600">Loading test editor...</div>
    </div>
  )
})

interface TestEditorProps {
  initialTestCode?: string
  onTestCodeChange?: (code: string) => void
  exerciseDescription?: string
}

const DEFAULT_TEST_TEMPLATE = `# Test code for Python exercise
# Use assert statements to validate student's solution

# Example tests for a function:

# 1. Check if function exists
if "function_name" in locals():
    # 2. Test with basic input
    result = function_name("test_input")
    
    # 3. Validate return type
    assert isinstance(result, str), "Function should return a string"
    
    # 4. Validate expected content
    assert "expected" in result, "Result should contain expected text"
    
    # 5. Test with different inputs
    result2 = function_name("another_input")
    assert len(result2) > 0, "Result should not be empty"
    
    print("✅ All tests passed!")
else:
    raise AssertionError("Function 'function_name' not found")`

export function TestEditor({ 
  initialTestCode = DEFAULT_TEST_TEMPLATE,
  onTestCodeChange,
  exerciseDescription = ""
}: TestEditorProps) {
  const [testCode, setTestCode] = useState(initialTestCode)
  const [showTemplates, setShowTemplates] = useState(false)

  // Шаблоны тестов для разных типов заданий
  const testTemplates = {
    function: `# Test template for function exercise
if "function_name" in locals():
    # Test basic functionality
    result = function_name("test")
    assert result is not None, "Function should return a value"
    assert isinstance(result, str), "Function should return a string"
    
    # Add more specific tests here
    print("✅ Basic function test passed")
else:
    raise AssertionError("Function 'function_name' not found")`,

    calculation: `# Test template for calculation exercise
# Check if expected variables exist
required_vars = ["result", "calculation"]
for var_name in required_vars:
    if var_name not in locals():
        raise AssertionError(f"Variable '{var_name}' not found")

# Validate calculation result
assert isinstance(result, (int, float)), "Result should be a number"
assert result == expected_value, f"Expected {expected_value}, got {result}"

print("✅ Calculation test passed")`,

    loop: `# Test template for loop exercise
# Check if loop produces expected output
output_lines = []
original_print = print

def capture_print(*args, **kwargs):
    output_lines.append(" ".join(str(arg) for arg in args))

print = capture_print

try:
    # Student's loop code should run here
    # The loop should print expected values
    
    # Restore original print
    print = original_print
    
    # Validate output
    assert len(output_lines) > 0, "Loop should produce output"
    assert "expected_output" in output_lines[0], "Output should contain expected text"
    
    print("✅ Loop test passed")
finally:
    print = original_print`,

    condition: `# Test template for condition exercise
# Test different conditions
test_cases = [
    ("input1", "expected_output1"),
    ("input2", "expected_output2"),
    ("input3", "expected_output3")
]

for test_input, expected in test_cases:
    result = student_function(test_input)
    assert result == expected, f"For input {test_input}, expected {expected}, got {result}"

print("✅ All condition tests passed")`
  }

  const handleTemplateSelect = (templateKey: keyof typeof testTemplates) => {
    setTestCode(testTemplates[templateKey])
    if (onTestCodeChange) {
      onTestCodeChange(testTemplates[templateKey])
    }
  }

  const handleCodeChange = (value: string = '') => {
    setTestCode(value)
    if (onTestCodeChange) {
      onTestCodeChange(value)
    }
  }

  const generateTestsFromDescription = () => {
    const desc = exerciseDescription.toLowerCase()
    let generatedTests = DEFAULT_TEST_TEMPLATE

    if (desc.includes('функцию') || desc.includes('function')) {
      // Извлекаем имя функции из описания
      const functionMatch = exerciseDescription.match(/(?:функцию|function)\s+(\w+)/i)
      const functionName = functionMatch ? functionMatch[1] : 'function_name'
      
      generatedTests = testTemplates.function.replace(/function_name/g, functionName)
    } else if (desc.includes('вычисл') || desc.includes('calculate')) {
      generatedTests = testTemplates.calculation
    } else if (desc.includes('цикл') || desc.includes('loop')) {
      generatedTests = testTemplates.loop
    } else if (desc.includes('услови') || desc.includes('condition') || desc.includes('if')) {
      generatedTests = testTemplates.condition
    }

    setTestCode(generatedTests)
    if (onTestCodeChange) {
      onTestCodeChange(generatedTests)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Test Code</h3>
          <p className="text-sm text-gray-600">
            Write tests to automatically validate student solutions
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={generateTestsFromDescription}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Generate from Description
          </button>
          
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          >
            {showTemplates ? 'Hide Templates' : 'Show Templates'}
          </button>
        </div>
      </div>

      {/* Test Templates */}
      {showTemplates && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-3">Test Templates</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleTemplateSelect('function')}
              className="p-3 border rounded text-left hover:bg-white transition-colors"
            >
              <div className="font-medium text-sm">Function</div>
              <div className="text-xs text-gray-600">Test function definitions</div>
            </button>
            
            <button
              onClick={() => handleTemplateSelect('calculation')}
              className="p-3 border rounded text-left hover:bg-white transition-colors"
            >
              <div className="font-medium text-sm">Calculation</div>
              <div className="text-xs text-gray-600">Test variables and calculations</div>
            </button>
            
            <button
              onClick={() => handleTemplateSelect('loop')}
              className="p-3 border rounded text-left hover:bg-white transition-colors"
            >
              <div className="font-medium text-sm">Loop</div>
              <div className="text-xs text-gray-600">Test loops and output</div>
            </button>
            
            <button
              onClick={() => handleTemplateSelect('condition')}
              className="p-3 border rounded text-left hover:bg-white transition-colors"
            >
              <div className="font-medium text-sm">Condition</div>
              <div className="text-xs text-gray-600">Test conditional logic</div>
            </button>
          </div>
        </div>
      )}

      {/* Test Code Editor */}
      <div className="border rounded-lg overflow-hidden">
        <Editor
          height="400px"
          defaultLanguage="python"
          value={testCode}
          onChange={handleCodeChange}
          theme="vs-light"
          options={{
            minimap: { enabled: true },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>

      {/* Test Writing Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Test Writing Guide</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use <code className="bg-blue-100 px-1 rounded">assert</code> statements to validate results</li>
          <li>• Check if required functions/variables exist with <code className="bg-blue-100 px-1 rounded">"name" in locals()</code></li>
          <li>• Test multiple input cases for robustness</li>
          <li>• Use <code className="bg-blue-100 px-1 rounded">print()</code> for progress messages</li>
          <li>• Raise <code className="bg-blue-100 px-1 rounded">AssertionError</code> with helpful messages</li>
        </ul>
      </div>
    </div>
  )
}