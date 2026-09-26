import React, { useState, useEffect } from 'react';
import { LeaderboardUser } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Trophy, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export const LeaderboardPage: React.FC = () => {
  const { user, updateUserLocal } = useAuth();
  const [rankings, setRankings] = useState<LeaderboardUser[]>([]);
  const [period, setPeriod] = useState<string>('Weekly Current Cycle');
  const [visibility, setVisibility] = useState<boolean>(user?.leaderboard_visibility ?? true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/leaderboard')
      .then((res) => {
        setRankings(res.rankings || []);
        setPeriod(res.period || 'Weekly');
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleVisibility = async () => {
    const nextVis = !visibility;
    setVisibility(nextVis);
    try {
      await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ leaderboardVisibility: nextVis }),
      });
      updateUserLocal({ leaderboard_visibility: nextVis });
      toast.success(`Leaderboard visibility updated to ${nextVis ? 'Public' : 'Private'}`);
    } catch (err) {
      toast.error('Failed to update visibility setting');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading leaderboard rankings...</div>;
  }

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" /> CodeSphere Leaderboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">Weekly global standings based on verified lessons, coding challenges, and assessment scores.</p>
        </div>

        <button
          onClick={handleToggleVisibility}
          className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors"
        >
          {visibility ? <Eye className="h-4 w-4 text-emerald-400" /> : <EyeOff className="h-4 w-4 text-slate-400" />}
          <span>Profile Visibility: {visibility ? 'Public' : 'Private (Opted Out)'}</span>
        </button>
      </div>

      {/* Rankings Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-sm shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Rank</th>
                <th className="p-4">Student</th>
                <th className="p-4">Experience</th>
                <th className="p-4">Lesson Pts</th>
                <th className="p-4">Challenge Pts</th>
                <th className="p-4">Assessment Pts</th>
                <th className="p-4 text-right">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {rankings.map((r) => {
                const isCurrentUser = user && user.id === r.id;
                return (
                  <tr
                    key={r.id}
                    className={`transition-colors ${
                      isCurrentUser
                        ? 'bg-red-600/15 border-l-4 border-red-500 font-semibold'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-4 font-black">
                      {r.rank === 1 ? '🥇 #1' : r.rank === 2 ? '🥈 #2' : r.rank === 3 ? '🥉 #3' : `#${r.rank}`}
                    </td>
                    <td className="p-4 font-bold text-slate-100 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/20 text-red-400 font-bold text-xs border border-red-500/30">
                        {r.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{r.displayName}</span>
                      {isCurrentUser && (
                        <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-400 border border-red-500/30">
                          YOU
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400">{r.experienceLevel}</td>
                    <td className="p-4">{r.lessonPoints}</td>
                    <td className="p-4">{r.challengePoints}</td>
                    <td className="p-4">{r.assessmentPoints}</td>
                    <td className="p-4 text-right font-black text-red-400 text-sm">{r.totalPoints}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
