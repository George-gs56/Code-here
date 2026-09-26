import React, { useState, useEffect } from 'react';
import { Assessment } from '../types';
import { apiRequest } from '../services/api';
import { FileCheck2, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface AssessmentListPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AssessmentListPage: React.FC<AssessmentListPageProps> = ({ onNavigate }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/assessments')
      .then((res) => setAssessments(res.assessments || []))
      .catch((err) => console.error('Failed to load assessments:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-xs text-zinc-500">Loading available assessments...</div>;
  }

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto bg-black text-zinc-100">
      {/* Header */}
      <div className="rounded-3xl border border-red-500/30 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-8 shadow-2xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1 text-xs font-bold text-red-400">
          <FileCheck2 className="h-3.5 w-3.5" /> Mandatory Assessment Suite
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">CodeSphere Language Assessments</h1>
        <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
          Test your programming skills with our randomized 10-question assessment engine. Score at least 7 out of 10 (70%) to earn your verified pass certification.
        </p>
      </div>

      {/* Rules Banner */}
      <div className="dark-card rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <span className="text-lg font-black text-white">10 Questions</span>
          <p className="text-[11px] text-zinc-500">Multiple choice format</p>
        </div>
        <div>
          <span className="text-lg font-black text-white">10 Marks</span>
          <p className="text-[11px] text-zinc-500">1 mark per question</p>
        </div>
        <div>
          <span className="text-lg font-black text-emerald-400">7 / 10 (70%)</span>
          <p className="text-[11px] text-zinc-500">Passing score threshold</p>
        </div>
        <div>
          <span className="text-lg font-black text-red-400">Fresh Retests</span>
          <p className="text-[11px] text-zinc-500">No question repetition</p>
        </div>
      </div>

      {/* Assessment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assessments.map((ass) => {
          const hasPassed = ass.hasPassed;
          const bestScore = ass.bestScore;

          return (
            <div
              key={ass.id}
              className={`dark-card rounded-3xl p-6 flex flex-col justify-between space-y-4 ${
                hasPassed ? 'border-emerald-500/40 bg-emerald-950/10' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/10 text-red-400 font-black text-lg border border-red-500/20">
                    {ass.language_name?.slice(0, 2).toUpperCase()}
                  </div>
                  {hasPassed ? (
                    <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> PASSED ({bestScore}/10)
                    </span>
                  ) : ass.attemptCount! > 0 ? (
                    <span className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-400">
                      <AlertTriangle className="h-3 w-3" /> RETEST ELIGIBLE
                    </span>
                  ) : (
                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[10px] font-bold text-zinc-400">
                      NEW TEST
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-white">{ass.title}</h3>
                  <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{ass.description}</p>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-3">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-red-400" /> {ass.time_limit_minutes} Mins</span>
                  <span>10 Questions</span>
                  <span>Pass: 70%</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('assessment-session', { assessmentId: ass.id })}
                  className="theme-btn-primary flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold"
                >
                  <span>{hasPassed ? 'Retake to Improve Score' : ass.attemptCount! > 0 ? 'Start Fresh Retest' : 'Start Assessment'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
