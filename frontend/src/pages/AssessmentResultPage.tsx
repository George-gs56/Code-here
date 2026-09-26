import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Trophy, AlertTriangle, CheckCircle2, XCircle, RotateCcw, Download, BookOpen } from 'lucide-react';

interface AssessmentResultPageProps {
  attemptId: string;
  resultData?: any;
  onNavigate: (page: string, params?: any) => void;
}

export const AssessmentResultPage: React.FC<AssessmentResultPageProps> = ({ attemptId, resultData: initialData, onNavigate }) => {
  const [result, setResult] = useState<any>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    if (!initialData && attemptId) {
      apiRequest(`/assessments/attempts/${attemptId}`)
        .then((res) => {
          setResult({
            attemptId: res.attempt.id,
            score: res.attempt.score,
            totalQuestions: 10,
            passingScore: 7,
            passed: res.attempt.passed,
            status: res.attempt.passed ? 'PASSED' : 'FAILED',
            timeTakenSeconds: res.attempt.time_taken_seconds,
            detailedResults: res.questions,
            assessmentTitle: res.attempt.assessment_title,
            languageName: res.attempt.language_name,
            languageSlug: res.attempt.language_slug,
          });
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [attemptId, initialData]);

  if (loading) {
    return <div className="text-center py-20 text-xs text-zinc-500">Loading assessment results...</div>;
  }

  if (!result) {
    return <div className="text-center py-20 text-xs text-red-500">Result record not found.</div>;
  }

  const passed = result.passed;
  const score = result.score;
  const incorrectCount = 10 - score;

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-4xl mx-auto bg-black text-zinc-100">
      {/* Top Banner: Celebratory PASSED vs FAILED Retest View */}
      {passed ? (
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-emerald-950/40 p-8 text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Trophy className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-white">Congratulations! You Passed! 🎉</h1>
          <p className="text-xs text-zinc-300 max-w-lg mx-auto">
            You successfully passed your assessment with a score of <span className="font-extrabold text-emerald-400">{score}/10</span> (Threshold: 7/10).
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowCertificate(true)}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-500"
            >
              <Download className="h-4 w-4" /> View Certificate
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="rounded-2xl border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-zinc-950 to-rose-950/40 p-8 text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-white">Assessment Not Passed — Keep Practising!</h1>
          <p className="text-xs text-zinc-300 max-w-lg mx-auto">
            You scored <span className="font-extrabold text-rose-400">{score}/10</span>. You need at least <span className="font-bold text-white">7 marks</span> to pass. You can take a retest with a fresh set of 10 questions.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('assessment-session', { assessmentId: result.assessmentId || attemptId })}
              className="theme-btn-primary flex items-center gap-2 rounded-2xl px-6 py-2.5 text-xs font-extrabold"
            >
              <RotateCcw className="h-4 w-4" /> Retake Test (Fresh Question Set)
            </button>
            <button
              onClick={() => onNavigate('explore')}
              className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700"
            >
              <BookOpen className="h-4 w-4" /> Recommended Lessons
            </button>
          </div>
        </div>
      )}

      {/* Score Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="dark-card rounded-2xl p-4">
          <span className="text-xs text-zinc-500">Final Score</span>
          <p className="text-2xl font-black text-white">{score} / 10</p>
        </div>
        <div className="dark-card rounded-2xl p-4">
          <span className="text-xs text-zinc-500">Passing Score</span>
          <p className="text-2xl font-black text-emerald-400">7 / 10 (70%)</p>
        </div>
        <div className="dark-card rounded-2xl p-4">
          <span className="text-xs text-zinc-500">Correct Answers</span>
          <p className="text-2xl font-black text-emerald-400">{score}</p>
        </div>
        <div className="dark-card rounded-2xl p-4">
          <span className="text-xs text-zinc-500">Incorrect Answers</span>
          <p className="text-2xl font-black text-rose-400">{incorrectCount}</p>
        </div>
      </div>

      {/* Detailed Question Review & Answer Key Breakdown */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-white">Detailed Answer Key & Review</h3>

        <div className="space-y-3">
          {(result.detailedResults || []).map((q: any, idx: number) => {
            const isCorrect = q.isCorrect;
            return (
              <div
                key={q.questionId || idx}
                className={`rounded-2xl border p-5 space-y-3 ${
                  isCorrect ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-rose-500/30 bg-rose-950/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-white">Question {q.order || idx + 1}: {q.questionText}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    isCorrect ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {isCorrect ? '+1 Mark' : '0 Marks'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt: string, oIdx: number) => {
                    const isSelected = q.selectedOption === oIdx;
                    const isCorrectOpt = q.correctOption === oIdx;

                    let bgStyle = 'border-zinc-800 bg-zinc-950 text-zinc-400';
                    if (isCorrectOpt) bgStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold';
                    else if (isSelected && !isCorrectOpt) bgStyle = 'border-rose-500 bg-rose-500/20 text-rose-300';

                    return (
                      <div key={oIdx} className={`rounded-xl border p-2.5 px-3 ${bgStyle}`}>
                        <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="text-xs text-zinc-300 border-t border-zinc-800/80 pt-2 font-medium">
                    <span className="font-bold text-red-400">Explanation:</span> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Certificate Preview Modal */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl border-2 border-red-500/40 bg-zinc-950 p-8 space-y-6 text-center">
            <div className="border-4 border-red-500/20 p-8 rounded-2xl space-y-4">
              <Trophy className="h-12 w-12 text-red-400 mx-auto" />
              <p className="text-xs uppercase tracking-widest font-bold text-red-400">Certificate of Completion</p>
              <h2 className="text-2xl font-black text-white">CodeSphere Programming Assessment</h2>
              <p className="text-xs text-zinc-300">This certifies that you have passed the verified 10-question assessment in</p>
              <p className="text-xl font-extrabold text-red-400">{result.languageName || 'Programming Language'}</p>
              <div className="flex justify-center gap-6 pt-4 text-xs text-zinc-400 border-t border-zinc-800">
                <div>Score: <span className="font-bold text-emerald-400">{score}/10 (70%+)</span></div>
                <div>Status: <span className="font-bold text-emerald-400">VERIFIED PASS</span></div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.print()}
                className="theme-btn-primary rounded-xl px-5 py-2 text-xs font-bold"
              >
                Print / Save PDF
              </button>
              <button
                onClick={() => setShowCertificate(false)}
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-700"
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
