import React, { useState, useEffect } from 'react';
import { Challenge } from '../types';
import { apiRequest } from '../services/api';
import Editor from '@monaco-editor/react';
import { Code2, Play, CheckCircle, RotateCcw, Flame, ArrowLeft, Search, Check, AlertTriangle, Terminal } from 'lucide-react';
import { toast } from 'sonner';

interface PracticePageProps {
  onNavigate: (page: string, params?: any) => void;
}

interface LanguageOption {
  slug: string;
  name: string;
  category: string;
  icon: string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { slug: 'python', name: 'Python', category: 'Backend & Data', icon: 'python' },
  { slug: 'javascript', name: 'JavaScript', category: 'Web Development', icon: 'javascript' },
  { slug: 'typescript', name: 'TypeScript', category: 'Web Development', icon: 'typescript' },
  { slug: 'java', name: 'Java', category: 'Enterprise', icon: 'java' },
  { slug: 'cpp', name: 'C++', category: 'Systems', icon: 'cpp' },
  { slug: 'csharp', name: 'C#', category: 'Enterprise', icon: 'csharp' },
  { slug: 'c', name: 'C', category: 'Systems', icon: 'c' },
  { slug: 'sql', name: 'SQL', category: 'Databases', icon: 'sql' },
  { slug: 'go', name: 'Go', category: 'Cloud & Systems', icon: 'go' },
  { slug: 'kotlin', name: 'Kotlin', category: 'Mobile', icon: 'kotlin' },
  { slug: 'php', name: 'PHP', category: 'Web Backend', icon: 'php' },
  { slug: 'ruby', name: 'Ruby', category: 'Web Backend', icon: 'ruby' },
  { slug: 'html', name: 'HTML', category: 'Frontend', icon: 'html' },
  { slug: 'css', name: 'CSS', category: 'Frontend', icon: 'css' },
];

export const PracticePage: React.FC<PracticePageProps> = ({ onNavigate }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  
  const [code, setCode] = useState<string>('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [outputConsole, setOutputConsole] = useState<string>('');
  const [executionStatus, setExecutionStatus] = useState<'passed' | 'failed' | null>(null);
  
  const [activeTab, setActiveTab] = useState<'problem' | 'history' | 'hints'>('problem');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/challenges')
      .then((res) => {
        const list = res.challenges || [];
        setChallenges(list);
      })
      .catch((err) => console.error('Failed to load challenges:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectLanguage = (lang: LanguageOption) => {
    setSelectedLanguage(lang);
    setActiveChallenge(null);
    setDifficultyFilter('All');
    setSearchQuery('');
  };

  const loadChallengeDetail = async (id: string) => {
    try {
      const res = await apiRequest(`/challenges/${id}`);
      setActiveChallenge(res.challenge);
      setCode(res.challenge.starter_code || '// Write solution here\nfunction solution() {\n}');
      setSubmissions(res.userSubmissions || []);
      setTestResults([]);
      setOutputConsole('');
      setExecutionStatus(null);
      setActiveTab('problem');
    } catch (err) {
      console.error('Failed to load challenge detail:', err);
      toast.error('Failed to load problem details.');
    }
  };

  const handleRunCode = async () => {
    if (!activeChallenge) return;
    setSubmitting(true);
    setExecutionStatus(null);
    try {
      const res = await apiRequest(`/challenges/${activeChallenge.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ challengeId: activeChallenge.id, code }),
      });

      setTestResults(res.testResults || []);
      setOutputConsole(res.outputConsole || res.message);
      setExecutionStatus(res.status);

      if (res.status === 'passed') {
        toast.success('🎉 Test code executed cleanly!');
      } else {
        toast.error('❌ Code execution failed or test case failed.');
      }
    } catch (err: any) {
      setExecutionStatus('failed');
      setOutputConsole(`❌ Execution Error: ${err.message || 'Failed to execute code'}`);
      toast.error(err.message || 'Execution error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!activeChallenge) return;
    setSubmitting(true);
    setExecutionStatus(null);
    try {
      const res = await apiRequest(`/challenges/${activeChallenge.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ challengeId: activeChallenge.id, code }),
      });

      setTestResults(res.testResults || []);
      setOutputConsole(res.outputConsole || res.message);
      setExecutionStatus(res.status);

      if (res.status === 'passed') {
        toast.success('🎉 Solution Passed All Test Cases!');
        if (res.newAchievements && res.newAchievements.length > 0) {
          toast.success(`🏆 Achievement Unlocked: ${res.newAchievements.join(', ')}!`);
        }

        // Auto-return to problem selection page on pass
        toast.info('Success! Auto-returning to problem selection grid...');
        setTimeout(() => {
          setActiveChallenge(null);
          setTestResults([]);
          setOutputConsole('');
        }, 1800);
      } else {
        toast.error('❌ Code failed test cases or threw syntax/runtime error.');
      }
    } catch (err: any) {
      setExecutionStatus('failed');
      setOutputConsole(`❌ Submission Error: ${err.message || 'Submission failed'}`);
      toast.error(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetCode = () => {
    if (activeChallenge) {
      setCode(activeChallenge.starter_code || '');
      setTestResults([]);
      setOutputConsole('');
      setExecutionStatus(null);
      toast.info('Code reset to template stub.');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-xs text-zinc-500">Loading practice environment...</div>;
  }

  // --------------------------------------------------------------------------
  // STEP 1: LANGUAGE SELECTION GRID
  // --------------------------------------------------------------------------
  if (!selectedLanguage) {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto bg-black text-zinc-100 min-h-screen">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Code2 className="h-6 w-6 text-red-500" /> Coding Practice Environment
          </h1>
          <p className="text-xs text-zinc-400">
            Select a programming language to explore algorithmic and practical challenges.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const count = challenges.filter(c => c.language_slug === lang.slug).length;
            return (
              <button
                key={lang.slug}
                onClick={() => handleSelectLanguage(lang)}
                className="dark-card rounded-2xl p-5 border border-zinc-800 hover:border-red-500/50 hover:bg-zinc-900/60 transition-all text-left flex flex-col justify-between group space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-red-500 text-sm group-hover:scale-110 transition-transform">
                    {lang.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                    {lang.category}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-white group-hover:text-red-400 transition-colors">
                    {lang.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {count > 0 ? `${count} Practice Problems` : '35+ Algorithmic Challenges'}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-red-500 group-hover:translate-x-1 transition-transform">
                  <span>Start Solving</span>
                  <span>→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Filter challenges for selected language
  const languageChallenges = challenges.filter(
    (c) => c.language_slug === selectedLanguage.slug
  );

  const filteredChallenges = languageChallenges.filter((c) => {
    const matchesDifficulty = difficultyFilter === 'All' || c.difficulty === difficultyFilter;
    const matchesQuery = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDifficulty && matchesQuery;
  });

  // --------------------------------------------------------------------------
  // STEP 2: PROBLEM SELECTION GRID FOR SELECTED LANGUAGE
  // --------------------------------------------------------------------------
  if (!activeChallenge) {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto bg-black text-zinc-100 min-h-screen">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedLanguage(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700"
            >
              <ArrowLeft className="h-4 w-4" /> Change Language
            </button>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                {selectedLanguage.name} Practice Problems
              </h1>
              <p className="text-xs text-zinc-400">Choose a problem to solve in Monaco Editor.</p>
            </div>
          </div>

          {/* Difficulty & Search Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search topic or problem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500/50"
              />
            </div>

            {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  difficultyFilter === diff
                    ? 'bg-red-500 text-white'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Problem Cards Grid */}
        {filteredChallenges.length === 0 ? (
          <div className="text-center py-20 text-xs text-zinc-500 dark-card rounded-3xl p-8 border border-zinc-800">
            No practice problems match the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChallenges.map((ch) => (
              <div
                key={ch.id}
                onClick={() => loadChallengeDetail(ch.id)}
                className="dark-card rounded-2xl p-5 border border-zinc-800 hover:border-red-500/50 hover:bg-zinc-900/50 cursor-pointer transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-400">{ch.topic}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                        ch.difficulty === 'Easy'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : ch.difficulty === 'Medium'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {ch.difficulty}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-white group-hover:text-red-400 transition-colors">
                    {ch.title}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {ch.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-bold text-red-500 group-hover:translate-x-1 transition-transform">
                  <span>Solve Problem</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STEP 3: MONACO EDITOR SOLVER VIEW
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-4 p-6 max-w-7xl mx-auto bg-black text-zinc-100 min-h-screen">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveChallenge(null)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Problems
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white">{activeChallenge.title}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                  activeChallenge.difficulty === 'Easy'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : activeChallenge.difficulty === 'Medium'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}
              >
                {activeChallenge.difficulty}
              </span>
            </div>
            <p className="text-xs text-zinc-400">{selectedLanguage.name} • {activeChallenge.topic}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Problem Statement vs Right Monaco Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px]">
        {/* Left Column: Problem Details */}
        <div className="lg:col-span-5 dark-card rounded-3xl p-6 flex flex-col justify-between space-y-4 border border-zinc-800">
          <div>
            <div className="flex border-b border-zinc-800 space-x-4 mb-4">
              <button
                onClick={() => setActiveTab('problem')}
                className={`pb-2 text-xs font-bold ${activeTab === 'problem' ? 'border-b-2 border-red-500 text-red-400' : 'text-zinc-500'}`}
              >
                Problem Statement
              </button>
              <button
                onClick={() => setActiveTab('hints')}
                className={`pb-2 text-xs font-bold ${activeTab === 'hints' ? 'border-b-2 border-red-500 text-red-400' : 'text-zinc-500'}`}
              >
                Hints & Notes
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`pb-2 text-xs font-bold ${activeTab === 'history' ? 'border-b-2 border-red-500 text-red-400' : 'text-zinc-500'}`}
              >
                Submissions ({submissions.length})
              </button>
            </div>

            {activeTab === 'problem' && (
              <div className="space-y-4 text-xs text-zinc-300">
                <p className="leading-relaxed text-zinc-300 text-sm">{activeChallenge.description}</p>

                <div className="space-y-2 pt-2">
                  <span className="font-bold text-white text-xs">Sample Test Cases:</span>
                  {(activeChallenge.test_cases || []).map((tc, idx) => (
                    <div key={idx} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] space-y-1">
                      <div><span className="text-zinc-500">Input:</span> <span className="text-red-400">{tc.input}</span></div>
                      <div><span className="text-zinc-500">Expected Output:</span> <span className="text-emerald-400">{tc.expected}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'hints' && (
              <div className="space-y-2 text-xs text-zinc-300">
                <span className="font-bold text-white">Helpful Hints:</span>
                {(activeChallenge.hints || []).map((hint, hIdx) => (
                  <div key={hIdx} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 flex items-start gap-2">
                    <Flame className="h-4 w-4 text-red-500 shrink-0" />
                    <span>{hint}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-2 text-xs">
                {submissions.length === 0 ? (
                  <p className="text-zinc-500 py-4 text-center">No previous submissions yet.</p>
                ) : (
                  submissions.map((sub, sIdx) => (
                    <div key={sIdx} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 flex items-center justify-between">
                      <div>
                        <span className={`font-bold uppercase ${sub.status === 'passed' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {sub.status}
                        </span>
                        <p className="text-[10px] text-zinc-500">{new Date(sub.created_at).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => setCode(sub.submitted_code)}
                        className="text-[11px] text-red-400 hover:underline font-semibold"
                      >
                        Load Code
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Monaco Code Editor & Test Results */}
        <div className="lg:col-span-7 space-y-4 flex flex-col">
          <div className="dark-card rounded-3xl p-4 space-y-3 flex flex-col justify-between flex-1 border border-zinc-800">
            {/* Editor Action Buttons */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-red-500" /> Solution Editor ({selectedLanguage.name})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetCode}
                  className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-white px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900"
                >
                  <RotateCcw className="h-3 w-3" /> Reset Stub
                </button>
                <button
                  onClick={handleRunCode}
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
                >
                  <Play className="h-3 w-3 text-emerald-400" /> Run Code
                </button>
                <button
                  onClick={handleSubmitSolution}
                  disabled={submitting}
                  className="theme-btn-primary flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold disabled:opacity-50 bg-red-600 hover:bg-red-500 text-white"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> {submitting ? 'Evaluating...' : 'Submit Solution'}
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="h-[380px] rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
              <Editor
                height="100%"
                language={selectedLanguage.slug === 'cpp' ? 'cpp' : selectedLanguage.slug === 'python' ? 'python' : selectedLanguage.slug}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{ fontSize: 13, minimap: { enabled: false } }}
              />
            </div>

            {/* Test Results & Console Output Drawer */}
            {(testResults.length > 0 || outputConsole) && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <div className="font-bold text-white flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-red-500" /> Test Case Evaluation Output
                  </div>
                  {executionStatus && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        executionStatus === 'passed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {executionStatus === 'passed' ? 'PASSED ALL TESTS' : 'EXECUTION FAILED'}
                    </span>
                  )}
                </div>

                {/* Raw Console Trace */}
                {outputConsole && (
                  <div className="text-zinc-300 bg-zinc-900/60 p-3 rounded-xl whitespace-pre-wrap max-h-40 overflow-y-auto text-[11px] leading-relaxed border border-zinc-800">
                    {outputConsole}
                  </div>
                )}

                {/* DYNAMIC PER TEST CASE CARDS */}
                {testResults.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {testResults.map((tr, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl border p-3 text-[11px] space-y-1 ${
                          tr.passed
                            ? 'border-emerald-500/30 bg-emerald-950/20'
                            : 'border-red-500/30 bg-red-950/20'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>Test Case #{tr.testCase}</span>
                          <span className={tr.passed ? 'text-emerald-400' : 'text-red-400'}>
                            {tr.passed ? '✓ PASSED' : '❌ FAILED'}
                          </span>
                        </div>
                        <div className="text-zinc-400 text-[10px]">
                          <div>Input: <span className="text-zinc-200">{tr.input}</span></div>
                          <div>Expected: <span className="text-emerald-400">{tr.expected}</span></div>
                          <div>Actual: <span className={tr.passed ? 'text-emerald-300' : 'text-red-400'}>{tr.actual}</span></div>
                          {tr.error && <div className="text-red-400 font-semibold mt-1">Error: {tr.error}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
