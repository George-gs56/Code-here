import vm from 'vm';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface TestCase {
  input: string;
  expected: string;
}

export interface TestResult {
  testCase: number;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
}

export interface ExecutionResponse {
  status: 'passed' | 'failed';
  message: string;
  outputConsole: string;
  testResults: TestResult[];
}

export function executeUserCode(
  userCode: string,
  testCases: TestCase[] = [],
  languageSlug: string = 'javascript'
): ExecutionResponse {
  const normLang = (languageSlug || 'javascript').toLowerCase();

  // -------------------------------------------------------------
  // PYTHON 3 EXECUTION ENGINE
  // -------------------------------------------------------------
  if (normLang === 'python') {
    return executePythonCode(userCode, testCases);
  }

  // -------------------------------------------------------------
  // JAVASCRIPT / TYPESCRIPT / FALLBACK ENGINE (Node VM)
  // -------------------------------------------------------------
  return executeJavaScriptCode(userCode, testCases);
}

function executePythonCode(userCode: string, testCases: TestCase[]): ExecutionResponse {
  const tmpDir = os.tmpdir();
  const scriptPath = path.join(tmpDir, `codesphere_py_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.py`);

  const pyScript = `
import json, sys

${userCode}

test_cases = ${JSON.stringify(testCases)}
results = []
all_passed = True

for i, tc in enumerate(test_cases):
    try:
        inp_str = tc['input'].strip()
        expected_str = tc['expected'].strip().strip('"').strip("'")
        
        # Parse inputs
        try:
            inp_val = json.loads(inp_str)
        except Exception:
            inp_val = inp_str
        
        res = None
        if 'solution' in globals() and callable(globals()['solution']):
            if isinstance(inp_val, list):
                res = solution(*inp_val)
            else:
                res = solution(inp_val)
        elif 'two_sum' in globals() and callable(globals()['two_sum']):
            res = two_sum(*inp_val) if isinstance(inp_val, list) else two_sum(inp_val)
        elif 'is_palindrome' in globals() and callable(globals()['is_palindrome']):
            res = is_palindrome(inp_val)
        elif 'reverse_string' in globals() and callable(globals()['reverse_string']):
            res = reverse_string(inp_val)
        else:
            res = None

        if res is not None:
            if isinstance(res, bool):
                actual_str = "true" if res else "false"
            else:
                actual_str = json.dumps(res) if isinstance(res, (list, dict)) else str(res)
        else:
            actual_str = "(no output or solution function returned None)"

        norm_actual = actual_str.strip().strip('"').strip("'")
        passed = (norm_actual == expected_str or actual_str.strip() == tc['expected'].strip())
        if not passed:
            all_passed = False
            
        results.append({
            "testCase": i + 1,
            "input": tc['input'],
            "expected": tc['expected'],
            "actual": actual_str,
            "passed": passed
        })
    except Exception as e:
        all_passed = False
        results.append({
            "testCase": i + 1,
            "input": tc['input'],
            "expected": tc['expected'],
            "actual": f"RuntimeError: {type(e).__name__}: {str(e)}",
            "passed": False,
            "error": f"{type(e).__name__}: {str(e)}"
        })

print(json.dumps({"results": results, "allPassed": all_passed}))
`;

  try {
    fs.writeFileSync(scriptPath, pyScript, 'utf8');
    const output = execSync(`python3 "${scriptPath}"`, { timeout: 4000, encoding: 'utf8' });
    const parsed = JSON.parse(output.trim());
    
    const testResults: TestResult[] = parsed.results || [];
    const allPassed = parsed.allPassed && testResults.length > 0;

    const outputConsole = testResults
      .map(tr => `Test Case #${tr.testCase} (${tr.passed ? 'PASSED' : 'FAILED'})\n  Input: ${tr.input}\n  Expected: ${tr.expected}\n  Actual: ${tr.actual}${tr.error ? `\n  Error: ${tr.error}` : ''}`)
      .join('\n\n');

    return {
      status: allPassed ? 'passed' : 'failed',
      message: allPassed ? 'All test cases passed successfully!' : 'Some test cases failed or threw runtime errors.',
      outputConsole: outputConsole || 'Execution output empty.',
      testResults
    };
  } catch (err: any) {
    const errorOutput = err.stderr ? err.stderr.toString() : err.message || 'Python execution failed';
    const cleanError = errorOutput.split('\n').filter((l: string) => !l.includes('File "') && !l.includes('codesphere_py_')).join('\n').trim() || errorOutput;

    return {
      status: 'failed',
      message: 'Python Syntax or Runtime Exception',
      outputConsole: `❌ Syntax/Runtime Error:\n${cleanError}`,
      testResults: testCases.map((tc, idx) => ({
        testCase: idx + 1,
        input: tc.input,
        expected: tc.expected,
        actual: `SyntaxError / Exception`,
        passed: false,
        error: cleanError
      }))
    };
  } finally {
    if (fs.existsSync(scriptPath)) {
      try { fs.unlinkSync(scriptPath); } catch (e) {}
    }
  }
}

function executeJavaScriptCode(userCode: string, testCases: TestCase[]): ExecutionResponse {
  const logs: string[] = [];
  const customConsole = {
    log: (...args: any[]) => {
      logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    },
    error: (...args: any[]) => {
      logs.push('[Error]: ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    }
  };

  if (!testCases || testCases.length === 0) {
    try {
      const sandbox = { console: customConsole, Math, Date, Array, String, Number, Boolean, Object, JSON, RegExp, parseInt, parseFloat, isNaN, isFinite };
      const context = vm.createContext(sandbox);
      const script = new vm.Script(userCode);
      const result = script.runInContext(context, { timeout: 3000 });

      let consoleStr = logs.join('\n');
      if (result !== undefined && result !== null && !consoleStr.includes(String(result))) {
        consoleStr += (consoleStr ? '\n' : '') + `[Return Value]: ${typeof result === 'object' ? JSON.stringify(result) : result}`;
      }

      return {
        status: 'passed',
        message: 'Code executed successfully',
        outputConsole: consoleStr || 'Code executed with no output.',
        testResults: []
      };
    } catch (err: any) {
      return {
        status: 'failed',
        message: err.message || 'Execution Error',
        outputConsole: logs.join('\n') + `\n❌ ${err.name || 'RuntimeError'}: ${err.message}`,
        testResults: []
      };
    }
  }

  const testResults: TestResult[] = [];
  let allPassed = true;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const tcLogs: string[] = [];
    const tcConsole = {
      log: (...args: any[]) => {
        tcLogs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
      },
      error: (...args: any[]) => {
        tcLogs.push('[Error]: ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
      }
    };

    try {
      const sandbox = { console: tcConsole, Math, Date, Array, String, Number, Boolean, Object, JSON, RegExp, parseInt, parseFloat, isNaN, isFinite };
      const context = vm.createContext(sandbox);

      let runWrapper = `
        ${userCode}

        let __testInput = ${tc.input.trim().startsWith('[') || tc.input.trim().startsWith('{') || !isNaN(Number(tc.input.trim())) ? tc.input : JSON.stringify(tc.input)};
        let __res = null;

        if (typeof solution === 'function') {
          __res = Array.isArray(__testInput) ? solution(...__testInput) : solution(__testInput);
        } else if (typeof main === 'function') {
          __res = main(__testInput);
        } else if (typeof solve === 'function') {
          __res = solve(__testInput);
        } else if (typeof twoSum === 'function') {
          __res = Array.isArray(__testInput) ? twoSum(...__testInput) : twoSum(__testInput);
        }
        __res;
      `;

      const script = new vm.Script(runWrapper);
      const rawResult = script.runInContext(context, { timeout: 3000 });

      let actualStr = '';
      if (rawResult !== undefined && rawResult !== null) {
        actualStr = typeof rawResult === 'object' ? JSON.stringify(rawResult) : String(rawResult);
      } else if (tcLogs.length > 0) {
        actualStr = tcLogs[tcLogs.length - 1];
      }

      const normalizedActual = actualStr.trim().replace(/^['"]|['"]$/g, '');
      const normalizedExpected = tc.expected.trim().replace(/^['"]|['"]$/g, '');

      const passed = normalizedActual === normalizedExpected || actualStr.trim() === tc.expected.trim();

      if (!passed) {
        allPassed = false;
      }

      testResults.push({
        testCase: i + 1,
        input: tc.input,
        expected: tc.expected,
        actual: actualStr || '(no output or return value)',
        passed
      });
    } catch (err: any) {
      allPassed = false;
      testResults.push({
        testCase: i + 1,
        input: tc.input,
        expected: tc.expected,
        actual: `RuntimeError: ${err.message}`,
        passed: false,
        error: `${err.name || 'Error'}: ${err.message}`
      });
    }
  }

  const outputConsole = testResults
    .map(
      tr =>
        `Test Case #${tr.testCase} (${tr.passed ? 'PASSED' : 'FAILED'})\n  Input: ${tr.input}\n  Expected: ${tr.expected}\n  Actual: ${tr.actual}${
          tr.error ? `\n  Error: ${tr.error}` : ''
        }`
    )
    .join('\n\n');

  return {
    status: allPassed ? 'passed' : 'failed',
    message: allPassed ? 'All test cases passed successfully!' : 'Some test cases failed or threw runtime errors.',
    outputConsole,
    testResults
  };
}
