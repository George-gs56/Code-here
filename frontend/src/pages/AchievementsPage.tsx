import React, { useState, useEffect } from 'react';
import { Achievement } from '../types';
import { apiRequest } from '../services/api';
import { Award, CheckCircle2, Lock, Star, Sparkles } from 'lucide-react';

export const AchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/achievements')
      .then((res) => setAchievements(res.achievements || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading verified achievements...</div>;
  }

  const earnedCount = achievements.filter((a) => a.isEarned).length;

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-400" /> Achievements & Badges
          </h1>
          <p className="text-xs text-slate-400 mt-1">Unlock badges as you complete lessons, solve coding challenges, and pass assessments.</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-400">
          {earnedCount} of {achievements.length} Badges Earned
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((ach) => {
          return (
            <div
              key={ach.id}
              className={`rounded-3xl border p-6 backdrop-blur-sm space-y-4 transition-all ${
                ach.isEarned
                  ? 'border-amber-500/30 bg-amber-950/10'
                  : 'border-slate-800 bg-slate-900/40 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  ach.isEarned ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'
                }`}>
                  {ach.isEarned ? <Sparkles className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                </div>

                {ach.isEarned && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> EARNED
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-100">{ach.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{ach.description}</p>
              </div>

              {ach.isEarned && ach.earnedAt && (
                <p className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-2">
                  Unlocked on {new Date(ach.earnedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
