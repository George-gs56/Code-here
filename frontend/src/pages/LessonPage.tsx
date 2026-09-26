import React, { useState, useEffect } from 'react';
import { Lesson, KnowledgeCheckItem } from '../types';
import { apiRequest } from '../services/api';
import Editor from '@monaco-editor/react';
import { CheckCircle2, ArrowLeft, ArrowRight, Play, Clock, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LessonPageProps {
  lessonId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const LessonPage: React.FC<LessonPageProps> = ({ lessonId, onNavigate }) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [prevLesson, setPrevLesson] = useState<any>(null);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [code, setCode] = useState<string>('');
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [completing, setCompleting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    setQuizSubmitted(false);
    setSelectedAnswers({});
    setConsoleOutput('');

    apiRequest(`/lessons/${lessonId}`)
      .then((res) => {
        setLesson(res.lesson);
        setPrevLesson(res.prevLesson);
        setNextLesson(res.nextLesson);
        setUserProgress(res.userProgress);
        setCode(res.lesson.code_example || '// Try your code snippet here');
      })
      .catch((err) => console.error('Failed to load lesson:', err))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleRunCodeSnippet = async () => {
    setConsoleOutput('Executing code in sandbox...');
    try {
      const res = await apiRequest('/lessons/run-code', {
        method: 'POST',
        body: JSON.stringify({ code, languageSlug: lesson?.language_slug }),
      });
      setConsoleOutput(res.outputConsole || res.message || 'Execution completed.');
      if (res.status === 'passed') {
        toast.success('Code executed cleanly!');
      } else {
        toast.error('Execution returned errors.');
      }
    } catch (err: any) {
      setConsoleOutput(`❌ Execution Error: ${err.message || 'Failed to execute code'}`);
      toast.error(err.message || 'Execution error');
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await apiRequest(`/lessons/${lessonId}/complete`, { method: 'POST' });
      setUserProgress({ status: 'completed', completion_percentage: 100 });

      if (res.newAchievements && res.newAchievements.length > 0) {
        toast.success(`🎉 Achievement Unlocked: ${res.newAchievements.join(', ')}!`);
      } else {
        toast.success('Lesson marked as completed! Great progress.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete lesson');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-xs text-zinc-500">Loading lesson content...</div>;
  }

  if (!lesson) {
    return <div className="text-center py-20 text-xs text-red-500">Lesson not found.</div>;
  }

  const isCompleted = userProgress?.status === 'completed';
  const knowledgeChecks: KnowledgeCheckItem[] = lesson.knowledge_check || [];

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-5xl mx-auto bg-black text-zinc-100">
      {/* Navigation Top */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('language-detail', { slug: lesson.language_slug })}
          className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {lesson.language_name} Curriculum
        </button>

        {isCompleted && (
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
          </span>
        )}
      </div>

      {/* Lesson Header */}
      <div className="dark-card rounded-3xl p-8 space-y-3">
        <div className="flex items-center gap-3 text-xs font-bold text-red-400">
          <span>{lesson.language_name}</span>
          <span>•</span>
          <span>{lesson.course_level} Level</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-zinc-400"><Clock className="h-3 w-3" /> {lesson.estimated_minutes} mins</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">{lesson.title}</h1>
      </div>

      {/* Lesson Content Reading Panel */}
      <div className="dark-card rounded-3xl p-8 space-y-6 text-sm text-zinc-300 leading-relaxed">
        <div dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, '<br/>') }} />
      </div>

      {/* Try It Yourself Monaco Editor */}
      <div className="dark-card rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Play className="h-4 w-4 text-red-400" /> Try It Yourself — Interactive Code Sandbox
          </h3>
          <button
            onClick={handleRunCodeSnippet}
            className="theme-btn-primary flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs"
          >
            <Play className="h-3 w-3" /> Run Code
          </button>
        </div>

        <div className="h-64 rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
          <Editor
            height="100%"
            language={lesson.language_slug === 'cpp' ? 'cpp' : lesson.language_slug || 'javascript'}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false }}
          />
        </div>

        {consoleOutput && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-emerald-400">
            {consoleOutput}
          </div>
        )}
      </div>

      {/* Knowledge Check Questions */}
      {knowledgeChecks.length > 0 && (
        <div className="dark-card rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-red-400" /> Knowledge Check
          </h3>

          {knowledgeChecks.map((kc, idx) => (
            <div key={idx} className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs font-semibold text-zinc-200">{kc.question}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {kc.options.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[idx] === oIdx;
                  const isCorrect = oIdx === kc.correctOption;
                  let btnStyle = 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800';

                  if (quizSubmitted) {
                    if (isCorrect) btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold';
                    else if (isSelected && !isCorrect) btnStyle = 'border-rose-500 bg-rose-500/20 text-rose-300';
                  } else if (isSelected) {
                    btnStyle = 'border-red-500 bg-red-500/20 text-red-300 font-bold';
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => setSelectedAnswers({ ...selectedAnswers, [idx]: oIdx })}
                      className={`rounded-xl border p-2.5 px-3 text-xs text-left transition-all ${btnStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {quizSubmitted && (
                <p className="text-xs text-zinc-400 border-t border-zinc-800 pt-2">{kc.explanation}</p>
              )}
            </div>
          ))}

          {!quizSubmitted && (
            <button
              onClick={() => setQuizSubmitted(true)}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              Check Answer
            </button>
          )}
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800 pt-6">
        <div>
          {prevLesson ? (
            <button
              onClick={() => onNavigate('lesson', { id: prevLesson.id })}
              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
            >
              <ArrowLeft className="h-4 w-4" /> Previous: {prevLesson.title}
            </button>
          ) : <div />}
        </div>

        <button
          onClick={handleComplete}
          disabled={completing || isCompleted}
          className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-xs font-black transition-all ${
            isCompleted
              ? 'bg-emerald-600 text-white cursor-default'
              : 'theme-btn-primary'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{isCompleted ? 'Completed' : completing ? 'Saving...' : 'Mark as Completed'}</span>
        </button>

        <div>
          {nextLesson ? (
            <button
              onClick={() => onNavigate('lesson', { id: nextLesson.id })}
              className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20"
            >
              Next: {nextLesson.title} <ArrowRight className="h-4 w-4" />
            </button>
          ) : <div />}
        </div>
      </div>
    </div>
  );
};
