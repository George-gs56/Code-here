import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { History, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface AssessmentHistoryPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AssessmentHistoryPage: React.FC<AssessmentHistoryPageProps> = ({ onNavigate }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/assessments/my-results')
      .then((res) => setHistory(res.history || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading test results history...</div>;
  }

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <History className="h-6 w-6 text-red-400" /> My Test Results History
        </h1>
        <p className="text-xs text-slate-400 mt-1">Review all your past 10-question assessment attempts, scores, and pass statuses.</p>
      </div>

      {history.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center text-xs text-slate-400 space-y-3">
          <p>You have not attempted any assessments yet.</p>
          <button
            onClick={() => onNavigate('assessments')}
            className="theme-btn-primary rounded-xl px-4 py-2 text-xs font-bold"
          >
            Take Your First Assessment
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Language / Title</th>
                  <th className="p-4">Attempt #</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Pass Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {history.map((att) => {
                  const passed = att.passed;
                  return (
                    <tr key={att.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-slate-100">{att.language_name} Assessment</td>
                      <td className="p-4">Attempt #{att.attempt_number}</td>
                      <td className="p-4 font-extrabold text-slate-100">{att.score} / 10</td>
                      <td className="p-4">
                        {passed ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" /> PASSED
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-400 font-bold">
                            <XCircle className="h-3.5 w-3.5" /> FAILED
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400">{new Date(att.submitted_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => onNavigate('assessment-result', { attemptId: att.id })}
                          className="flex items-center gap-1 text-red-400 hover:underline ml-auto font-semibold"
                        >
                          View Details <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
