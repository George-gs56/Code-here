import React, { useState, useEffect } from 'react';
import { AssessmentQuestion } from '../types';
import { apiRequest } from '../services/api';
import { Clock, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface AssessmentPageProps {
  assessmentId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const AssessmentPage: React.FC<AssessmentPageProps> = ({ assessmentId, onNavigate }) => {
  const [step, setStep] = useState<'instructions' | 'test'>('instructions');
  const [assessmentInfo, setAssessmentInfo] = useState<any>(null);
  const [attemptId, setAttemptId] = useState<string>('');
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(900);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest(`/assessments`)
      .then((res) => {
        const ass = (res.assessments || []).find((a: any) => a.id === assessmentId);
        setAssessmentInfo(ass);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [assessmentId]);

  useEffect(() => {
    if (step !== 'test') return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const handleStartTest = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/assessments/${assessmentId}/start`, { method: 'POST' });
      setAttemptId(res.attemptId);
      setQuestions(res.questions || []);
      setTimeLeftSeconds((res.assessment.timeLimitMinutes || 15) * 60);

      const initialAnswers: Record<string, number | null> = {};
      (res.questions || []).forEach((q: any) => {
        initialAnswers[q.id] = null;
      });
      setAnswers(initialAnswers);
      setStep('test');
    } catch (err: any) {
      toast.error(err.message || 'Failed to start assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleFinalSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    const formattedAnswers = questions.map((q) => ({
      questionId: q.id,
      selectedOption: answers[q.id] !== undefined ? answers[q.id] : null,
    }));

    try {
      const res = await apiRequest(`/assessments/${assessmentId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ attemptId, answers: formattedAnswers }),
      });

      onNavigate('assessment-result', { attemptId: res.attemptId, resultData: res });
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit assessment');
      setSubmitting(false);
    }
  };

  if (loading && step === 'instructions') {
    return <div className="text-center py-20 text-xs text-zinc-500">Loading assessment instructions...</div>;
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.values(answers).filter((v) => v !== null).length;
  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-4xl mx-auto bg-black text-zinc-100">
      {/* STEP 1: PRE-TEST INSTRUCTIONS */}
      {step === 'instructions' && (
        <div className="space-y-6">
          <button
            onClick={() => onNavigate('assessments')}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Assessment List
          </button>

          <div className="dark-card rounded-3xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 mb-2">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-black text-white">{assessmentInfo?.title || 'Language Assessment'}</h1>
              <p className="text-xs text-zinc-400">Read all instructions carefully before starting the assessment.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center border-y border-zinc-800/80 py-4">
              <div>
                <span className="text-xs text-zinc-500">Total Questions</span>
                <p className="text-base font-black text-white">10 Questions</p>
              </div>
              <div>
                <span className="text-xs text-zinc-500">Total Marks</span>
                <p className="text-base font-black text-white">10 Marks</p>
              </div>
              <div>
                <span className="text-xs text-zinc-500">Passing Score</span>
                <p className="text-base font-black text-emerald-400">7 / 10 (70%)</p>
              </div>
              <div>
                <span className="text-xs text-zinc-500">Time Limit</span>
                <p className="text-base font-black text-red-400">{assessmentInfo?.time_limit_minutes || 15} Minutes</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">Assessment Rules:</span>
              <ul className="space-y-2 list-disc list-inside text-zinc-400">
                <li>You have exactly {assessmentInfo?.time_limit_minutes || 15} minutes to complete all 10 questions.</li>
                <li>Each question carries 1 mark. There is no negative marking.</li>
                <li>Answers are recorded dynamically as you select them.</li>
                <li>If you fail (score &lt; 7), your next attempt will serve 10 fresh questions from the question bank.</li>
                <li>Ensure a stable connection before clicking "Start Assessment".</li>
              </ul>
            </div>

            <button
              onClick={handleStartTest}
              className="theme-btn-primary flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold"
            >
              <span>I Understand the Rules — Begin Assessment</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ACTIVE TEST SESSION */}
      {step === 'test' && currentQ && (
        <div className="space-y-6">
          {/* Timer and Progress Top Bar */}
          <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-white">Question {currentIndex + 1} of 10</span>
              <span className="text-xs font-semibold text-zinc-500">({answeredCount}/10 Answered)</span>
            </div>

            <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold ${
              timeLeftSeconds < 120 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' : 'bg-zinc-900 text-red-400'
            }`}>
              <Clock className="h-4 w-4" />
              <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Question Navigation Drawer (1..10) */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = answers[q.id] !== null && answers[q.id] !== undefined;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-red-600 text-white ring-2 ring-red-400'
                      : isAnswered
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Question Display Card */}
          <div className="dark-card rounded-3xl p-8 space-y-6">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">{currentQ.topic} • {currentQ.difficulty}</span>
              <h2 className="text-lg font-black text-white leading-relaxed">{currentQ.questionText}</h2>
            </div>

            {/* Options Radio List */}
            <div className="space-y-3">
              {currentQ.options.map((optText, oIdx) => {
                const isSelected = answers[currentQ.id] === oIdx;

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(currentQ.id, oIdx)}
                    className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-xs font-semibold transition-all text-left ${
                      isSelected
                        ? 'border-red-500 bg-red-600/20 text-red-300'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                      isSelected ? 'border-red-500 bg-red-600 text-white' : 'border-zinc-700 bg-zinc-900 text-zinc-400'
                    }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </div>
                    <span>{optText}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Nav Actions */}
            <div className="flex items-center justify-between border-t border-zinc-800/80 pt-6">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-semibold text-zinc-300 disabled:opacity-30"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="theme-btn-primary flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white"
                >
                  Next Question <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-500"
                >
                  <CheckCircle2 className="h-4 w-4" /> Submit Assessment
                </button>
              )}
            </div>
          </div>

          {/* Submission Confirmation Modal */}
          {showConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 text-center">
                <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
                <h3 className="text-lg font-black text-white">Confirm Assessment Submission</h3>
                <p className="text-xs text-zinc-400">
                  You have answered <span className="font-bold text-red-400">{answeredCount} of 10</span> questions. Are you sure you want to finish and grade your attempt?
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="w-1/2 rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 text-xs font-semibold text-zinc-300"
                  >
                    Review Answers
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      handleFinalSubmit();
                    }}
                    disabled={submitting}
                    className="w-1/2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500"
                  >
                    {submitting ? 'Grading...' : 'Yes, Submit Now'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
