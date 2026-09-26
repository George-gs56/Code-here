import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardStats } from '../types';
import { apiRequest } from '../services/api';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar 
} from 'recharts';
import { 
  Flame, 
  BookOpen, 
  Code, 
  CheckCircle2, 
  Clock, 
  Target, 
  ArrowRight, 
  Award, 
  Play 
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [continueLearning, setContinueLearning] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [charts, setCharts] = useState<{ scoreOverTime: any[]; timeByLanguage: any[] }>({ scoreOverTime: [], timeByLanguage: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/dashboard/stats')
      .then((res) => {
        setStats(res.stats);
        setContinueLearning(res.continueLearning || []);
        setRecentActivity(res.recentActivity || []);
        setCharts(res.charts || { scoreOverTime: [], timeByLanguage: [] });
      })
      .catch((err) => console.error('Failed to load dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-8 bg-black">
        <div className="flex items-center gap-3 text-red-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
          <span className="text-sm font-semibold">Loading live CodeSphere metrics...</span>
        </div>
      </div>
    );
  }

  const streak = stats?.currentStreak || 0;
  const goalMinutes = user?.daily_goal_minutes || 30;
  const timeLearnedMinutes = stats?.totalLearningTimeMinutes || 0;
  const goalProgress = Math.min(100, Math.round((timeLearnedMinutes / goalMinutes) * 100));

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto bg-black text-zinc-100">
      {/* 1. Welcome Section & Streak Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1 text-xs font-extrabold text-red-400 mb-3">
              <Flame className="h-4 w-4 fill-red-500 text-red-500" />
              <span>{streak}-Day Continuous Learning Streak</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-500">{user?.full_name || user?.username}!</span>
            </h1>
            <p className="mt-2 text-xs text-zinc-400 max-w-xl">
              Consistency builds mastery. Complete your daily goal, practice coding in Monaco editor, or take a 10-question assessment today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('explore')}
              className="theme-btn-primary flex items-center gap-2 rounded-2xl px-5 py-3 text-xs"
            >
              <span>Explore Languages</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate('assessments')}
              className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-xs font-bold text-zinc-200 hover:bg-zinc-800 transition-all"
            >
              <span>Take Assessment</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Live Learning Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="dark-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Enrolled Languages</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400"><BookOpen className="h-4 w-4" /></div>
          </div>
          <p className="text-2xl font-black text-white">{stats?.totalEnrolledLanguages || 0}</p>
          <span className="text-[11px] text-zinc-500">Active language tracks</span>
        </div>

        <div className="dark-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Lessons Completed</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><CheckCircle2 className="h-4 w-4" /></div>
          </div>
          <p className="text-2xl font-black text-white">{stats?.lessonsCompleted || 0}</p>
          <span className="text-[11px] text-zinc-500">Curriculum modules</span>
        </div>

        <div className="dark-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Challenges Solved</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400"><Code className="h-4 w-4" /></div>
          </div>
          <p className="text-2xl font-black text-white">{stats?.challengesSolved || 0}</p>
          <span className="text-[11px] text-zinc-500">Coding exercises</span>
        </div>

        <div className="dark-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Avg Test Score</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400"><Award className="h-4 w-4" /></div>
          </div>
          <p className="text-2xl font-black text-white">{stats?.avgTestScore || '0'}<span className="text-xs font-normal text-zinc-500">/10</span></p>
          <span className="text-[11px] text-zinc-500">{stats?.testsPassed || 0} passed of {stats?.totalTestsAttempted || 0} tests</span>
        </div>
      </div>

      {/* 3. Continue Learning & Upcoming Daily Goal Target */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="lg:col-span-2 dark-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <h2 className="text-sm font-extrabold text-white">Continue Learning</h2>
            <button onClick={() => onNavigate('explore')} className="text-xs font-bold text-red-400 hover:underline">
              View All Languages
            </button>
          </div>

          {continueLearning.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center space-y-3">
              <p className="text-xs text-zinc-500">You haven't started any lessons yet.</p>
              <button
                onClick={() => onNavigate('explore')}
                className="theme-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs"
              >
                <Play className="h-3.5 w-3.5" /> Start Learning Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {continueLearning.map((item) => (
                <div
                  key={item.language_id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3 hover:border-red-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{item.language_name}</span>
                    <span className="text-[11px] font-bold text-red-400">{item.completion_percentage}%</span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{item.last_lesson_title}</p>

                  <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-rose-600 rounded-full"
                      style={{ width: `${item.completion_percentage}%` }}
                    ></div>
                  </div>

                  <button
                    onClick={() => onNavigate('language-detail', { slug: item.language_slug })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-1.5 text-xs font-bold text-zinc-300 hover:bg-red-600 hover:text-white transition-colors"
                  >
                    Continue Course
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Goal Target */}
        <div className="dark-card rounded-3xl p-6 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Target className="h-4 w-4 text-red-500" /> Daily Learning Goal
              </h2>
              <span className="text-xs font-bold text-red-400">{goalProgress}%</span>
            </div>

            <div className="space-y-3 text-center py-2">
              <p className="text-3xl font-black text-white">
                {timeLearnedMinutes} <span className="text-xs font-semibold text-zinc-500">/ {goalMinutes} Mins</span>
              </p>
              <p className="text-xs text-zinc-400">
                {goalProgress >= 100
                  ? '🎉 Daily target completed! Outstanding dedication.'
                  : `${goalMinutes - timeLearnedMinutes} minutes remaining to fulfill your target.`}
              </p>

              <div className="h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-rose-600 rounded-full transition-all duration-500"
                  style={{ width: `${goalProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-zinc-800/80 pt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Recent Activity</span>
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-2">No recent activity</p>
              ) : (
                recentActivity.slice(0, 3).map((act, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl bg-zinc-950 p-2 px-3 text-xs">
                    <span className="text-zinc-300 truncate max-w-[180px]">{act.title}</span>
                    <span className="text-[10px] text-zinc-500">{new Date(act.date).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Interactive Recharts Performance Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dark-card rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Assessment Scores Over Time</h3>
          {charts.scoreOverTime.length === 0 ? (
            <p className="text-xs text-zinc-500 py-12 text-center">Take your first 10-question assessment to generate performance analytics.</p>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.scoreOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                  <YAxis domain={[0, 10]} stroke="#71717a" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#dc2626' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="dark-card rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Learning Time Distribution (Minutes)</h3>
          {charts.timeByLanguage.length === 0 ? (
            <p className="text-xs text-zinc-500 py-12 text-center">Complete lessons or coding challenges to see time distribution graph.</p>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.timeByLanguage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="language" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="minutes" fill="#dc2626" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
