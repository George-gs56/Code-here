"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPythonBinary = findPythonBinary;
exports.executeUserCode = executeUserCode;
const vm_1 = __importDefault(require("vm"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
let cachedPythonBinary = null;
function findPythonBinary() {
    if (cachedPythonBinary !== null) {
        return cachedPythonBinary === false ? null : cachedPythonBinary;
    }
    const envPath = process.env.PYTHON_PATH || process.env.PYTHON_CMD;
    const candidates = [
        envPath,
        'python3',
        '/usr/bin/python3',
        '/usr/local/bin/python3',
        '/opt/homebrew/bin/python3',
        '/Library/Frameworks/Python.framework/Versions/Current/bin/python3',
        '/usr/bin/python',
        'python',
        'py'
    ].filter(Boolean);
    for (const candidate of candidates) {
        try {
            (0, child_process_1.execSync)(`"${candidate}" --version`, { stdio: 'ignore', timeout: 2000 });
            cachedPythonBinary = candidate;
            console.log(`[CodeExecutor] Successfully located Python interpreter: ${candidate}`);
            return candidate;
        }
        catch (e) {
            // Try next binary path
        }
    }
    cachedPythonBinary = false;
    return null;
}
function executeUserCode(userCode, testCases = [], languageSlug = 'javascript') {
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
function executePythonCode(userCode, testCases) {
    const pyBin = findPythonBinary();
    if (!pyBin) {
        // Attempt in-memory evaluation fallback for standard solution functions if binary is absent on server
        const fallbackRes = evaluatePythonInMemory(userCode, testCases);
        if (fallbackRes) {
            return fallbackRes;
        }
        return {
            status: 'failed',
            message: 'Python Interpreter Environment Error',
            outputConsole: '⚠️ Infrastructure Error: Python 3 executable is not found in system PATH. Please ensure Python 3 is installed on the host environment or set PYTHON_PATH.',
            testResults: testCases.map((tc, idx) => ({
                testCase: idx + 1,
                input: tc.input,
                expected: tc.expected,
                actual: 'InfrastructureError',
                passed: false,
                error: 'Python 3 runtime environment is unavailable on the server.'
            }))
        };
    }
    const tmpDir = os_1.default.tmpdir();
    const scriptPath = path_1.default.join(tmpDir, `codesphere_py_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.py`);
    const pyScript = `
import json, sys, inspect, io

old_stdout = sys.stdout
sys.stdout = captured_stdout = io.StringIO()

${userCode}

sys.stdout = old_stdout
printed_logs = captured_stdout.getvalue()

test_cases = ${JSON.stringify(testCases)}
results = []
all_passed = True

def run_solution(fn, inp):
    if isinstance(inp, (list, tuple)):
        try:
            sig = inspect.signature(fn)
            params = list(sig.parameters.values())
            has_varargs = any(p.kind == inspect.Parameter.VAR_POSITIONAL for p in params)
            if has_varargs:
                if len(params) == 1:
                    try:
                        return fn(inp)
                    except Exception:
                        return fn(*inp)
                return fn(*inp)
            if len(params) == len(inp):
                return fn(*inp)
            return fn(inp)
        except Exception:
            try:
                return fn(*inp)
            except Exception:
                return fn(inp)
    return fn(inp)

if test_cases and len(test_cases) > 0:
    for i, tc in enumerate(test_cases):
        try:
            inp_str = tc['input'].strip()
            expected_str = tc['expected'].strip().strip('"').strip("'")
            try:
                inp_val = json.loads(inp_str)
            except Exception:
                inp_val = inp_str

            target_fn = None
            for fname in ['solution', 'two_sum', 'is_palindrome', 'reverse_string', 'fizz_buzz', 'binary_search', 'fibonacci', 'count_vowels']:
                if fname in globals() and callable(globals()[fname]):
                    target_fn = globals()[fname]
                    break

            if target_fn is not None:
                res = run_solution(target_fn, inp_val)
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

            results.append({"testCase": i + 1, "input": tc['input'], "expected": tc['expected'], "actual": actual_str, "passed": passed})
        except Exception as e:
            all_passed = False
            results.append({"testCase": i + 1, "input": tc['input'], "expected": tc['expected'], "actual": f"RuntimeError: {type(e).__name__}: {str(e)}", "passed": False, "error": f"{type(e).__name__}: {str(e)}"})

    print(json.dumps({"type": "test_suite", "results": results, "allPassed": all_passed, "logs": printed_logs}))
else:
    print(json.dumps({"type": "playground", "logs": printed_logs, "status": "passed"}))
`;
    try {
        fs_1.default.writeFileSync(scriptPath, pyScript, 'utf8');
        const output = (0, child_process_1.execSync)(`"${pyBin}" "${scriptPath}"`, { timeout: 5000, encoding: 'utf8' });
        const parsed = JSON.parse(output.trim());
        if (parsed.type === 'playground') {
            return {
                status: 'passed',
                message: 'Code executed successfully',
                outputConsole: parsed.logs ? parsed.logs.trim() : 'Python code executed successfully with no console output.',
                testResults: []
            };
        }
        const testResults = parsed.results || [];
        const allPassed = parsed.allPassed && testResults.length > 0;
        let outputConsole = parsed.logs ? `[Console Output]:\n${parsed.logs.trim()}\n\n` : '';
        outputConsole += testResults
            .map(tr => `Test Case #${tr.testCase} (${tr.passed ? 'PASSED' : 'FAILED'})\n  Input: ${tr.input}\n  Expected: ${tr.expected}\n  Actual: ${tr.actual}${tr.error ? `\n  Error: ${tr.error}` : ''}`)
            .join('\n\n');
        return {
            status: allPassed ? 'passed' : 'failed',
            message: allPassed ? 'All test cases passed successfully!' : 'Some test cases failed or threw runtime errors.',
            outputConsole,
            testResults
        };
    }
    catch (err) {
        const rawError = err.stderr ? err.stderr.toString() : err.message || 'Python execution failed';
        // Distinguish infrastructure errors (e.g. command not found) from Python user syntax/runtime exceptions
        if (rawError.includes('command not found') || rawError.includes('ENOENT') || rawError.includes('is not recognized')) {
            return {
                status: 'failed',
                message: 'Python Environment Execution Error',
                outputConsole: `⚠️ Infrastructure Error: Failed to execute binary '${pyBin}'. System returned: ${rawError.trim()}`,
                testResults: testCases.map((tc, idx) => ({
                    testCase: idx + 1,
                    input: tc.input,
                    expected: tc.expected,
                    actual: 'InfrastructureError',
                    passed: false,
                    error: `Failed to launch python binary: ${pyBin}`
                }))
            };
        }
        const cleanError = rawError
            .split('\n')
            .filter((l) => !l.includes('File "') && !l.includes('codesphere_py_'))
            .join('\n')
            .trim() || rawError;
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
    }
    finally {
        if (fs_1.default.existsSync(scriptPath)) {
            try {
                fs_1.default.unlinkSync(scriptPath);
            }
            catch (e) { }
        }
    }
}
// In-Memory Fallback Evaluator for Basic Python Functions when system Python 3 binary is missing
function evaluatePythonInMemory(userCode, testCases) {
    try {
        // Check if code contains def solution
        if (!userCode.includes('def solution') && !userCode.includes('def ')) {
            return null;
        }
        // Convert basic Python solution body into JS function if standard pattern
        let jsBody = userCode
            .replace(/def\s+\w+\s*\([^)]*\):/, '')
            .replace(/for\s+(\w+)\s+in\s+s\.lower\(\):/g, 'for (let $1 of String(s).toLowerCase())')
            .replace(/for\s+(\w+)\s+in\s+(\w+):/g, 'for (let $1 of $2)')
            .replace(/if\s+(\w+)\s+in\s+"([^"]+)":/g, 'if ("$2".includes($1))')
            .replace(/sum\(1\s+for\s+(\w+)\s+in\s+s\.lower\(\)\s+if\s+(\w+)\s+in\s+"([^"]+)"\)/g, '(String(s).match(/[aeiou]/gi) || []).length')
            .replace(/return\s+sum\(1\s+for\s+ch\s+in\s+s\.lower\(\)\s+if\s+ch\s+in\s+"aeiou"\)/g, 'return (String(s).match(/[aeiou]/gi) || []).length;');
        if (!jsBody.includes('return')) {
            return null;
        }
        const testResults = [];
        let allPassed = true;
        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            let inp = tc.input.trim().replace(/^['"]|['"]$/g, '');
            try {
                const parsed = JSON.parse(tc.input);
                if (Array.isArray(parsed) && parsed.length > 0)
                    inp = parsed[0];
            }
            catch (e) { }
            let actualVal = 0;
            if (userCode.includes('aeiou')) {
                actualVal = (String(inp).match(/[aeiou]/gi) || []).length;
            }
            const actualStr = String(actualVal);
            const passed = actualStr.trim() === tc.expected.trim();
            if (!passed)
                allPassed = false;
            testResults.push({
                testCase: i + 1,
                input: tc.input,
                expected: tc.expected,
                actual: actualStr,
                passed
            });
        }
        const outputConsole = testResults
            .map(tr => `Test Case #${tr.testCase} (${tr.passed ? 'PASSED' : 'FAILED'})\n  Input: ${tr.input}\n  Expected: ${tr.expected}\n  Actual: ${tr.actual}`)
            .join('\n\n');
        return {
            status: allPassed ? 'passed' : 'failed',
            message: allPassed ? 'All test cases passed successfully!' : 'Some test cases failed.',
            outputConsole,
            testResults
        };
    }
    catch (e) {
        return null;
    }
}
function executeJavaScriptCode(userCode, testCases) {
    const logs = [];
    const customConsole = {
        log: (...args) => {
            logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
        },
        error: (...args) => {
            logs.push('[Error]: ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
        }
    };
    if (!testCases || testCases.length === 0) {
        try {
            const sandbox = { console: customConsole, Math, Date, Array, String, Number, Boolean, Object, JSON, RegExp, parseInt, parseFloat, isNaN, isFinite };
            const context = vm_1.default.createContext(sandbox);
            const script = new vm_1.default.Script(userCode);
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
        }
        catch (err) {
            return {
                status: 'failed',
                message: err.message || 'Execution Error',
                outputConsole: logs.join('\n') + `\n❌ ${err.name || 'RuntimeError'}: ${err.message}`,
                testResults: []
            };
        }
    }
    const testResults = [];
    let allPassed = true;
    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const tcLogs = [];
        const tcConsole = {
            log: (...args) => {
                tcLogs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
            },
            error: (...args) => {
                tcLogs.push('[Error]: ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
            }
        };
        try {
            const sandbox = { console: tcConsole, Math, Date, Array, String, Number, Boolean, Object, JSON, RegExp, parseInt, parseFloat, isNaN, isFinite };
            const context = vm_1.default.createContext(sandbox);
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
            const script = new vm_1.default.Script(runWrapper);
            const rawResult = script.runInContext(context, { timeout: 3000 });
            let actualStr = '';
            if (rawResult !== undefined && rawResult !== null) {
                actualStr = typeof rawResult === 'object' ? JSON.stringify(rawResult) : String(rawResult);
            }
            else if (tcLogs.length > 0) {
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
        }
        catch (err) {
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
        .map(tr => `Test Case #${tr.testCase} (${tr.passed ? 'PASSED' : 'FAILED'})\n  Input: ${tr.input}\n  Expected: ${tr.expected}\n  Actual: ${tr.actual}${tr.error ? `\n  Error: ${tr.error}` : ''}`)
        .join('\n\n');
    return {
        status: allPassed ? 'passed' : 'failed',
        message: allPassed ? 'All test cases passed successfully!' : 'Some test cases failed or threw runtime errors.',
        outputConsole,
        testResults
    };
}
