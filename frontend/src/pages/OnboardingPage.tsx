import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Sparkles, Check, ArrowRight } from 'lucide-react';

interface OnboardingPageProps {
  onNavigate: (page: string) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onNavigate }) => {
  const { updateUserLocal } = useAuth();
  const [experienceLevel, setExperienceLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [targetLanguages, setTargetLanguages] = useState<string[]>(['python', 'javascript']);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(30);
  const [primaryGoal, setPrimaryGoal] = useState<string>('Interview Preparation');
  const [loading, setLoading] = useState(false);

  const availableLanguages = [
    { slug: 'python', name: 'Python' },
    { slug: 'javascript', name: 'JavaScript' },
    { slug: 'typescript', name: 'TypeScript' },
    { slug: 'java', name: 'Java' },
    { slug: 'cpp', name: 'C++' },
    { slug: 'sql', name: 'SQL' },
    { slug: 'html', name: 'HTML' },
    { slug: 'css', name: 'CSS' },
  ];

  const goalsList = [
    'Learning fundamentals',
    'College & University preparation',
    'Interview & Job preparation',
    'Daily coding practice',
  ];

  const toggleLanguage = (slug: string) => {
    if (targetLanguages.includes(slug)) {
      if (targetLanguages.length > 1) {
        setTargetLanguages(targetLanguages.filter((l) => l !== slug));
      }
    } else {
      setTargetLanguages([...targetLanguages, slug]);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await apiRequest('/auth/onboarding', {
        method: 'POST',
        body: JSON.stringify({ experienceLevel, targetLanguages, dailyGoalMinutes, primaryGoal }),
      });

      updateUserLocal({ experience_level: experienceLevel, target_languages: targetLanguages, daily_goal_minutes: dailyGoalMinutes, primary_goal: primaryGoal });
      onNavigate('dashboard');
    } catch (err) {
      console.error('Onboarding failed:', err);
      onNavigate('dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl space-y-8 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">Personalize Your CodeSphere Path</h2>
          <p className="mt-2 text-xs text-slate-400">Tell us your targets so we can tailor your learning dashboard.</p>
        </div>

        <div className="space-y-6">
          {/* 1. Experience Level */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">1. Your Current Programming Experience</label>
            <div className="grid grid-cols-3 gap-3">
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setExperienceLevel(level)}
                  className={`rounded-2xl border p-3.5 text-center transition-all ${
                    experienceLevel === level
                      ? 'border-red-500 bg-red-600/20 text-red-300 font-bold shadow-lg shadow-red-500/10'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <p className="text-sm">{level}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Target Languages */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">2. Languages You Want to Master</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {availableLanguages.map((lang) => {
                const selected = targetLanguages.includes(lang.slug);
                return (
                  <button
                    key={lang.slug}
                    type="button"
                    onClick={() => toggleLanguage(lang.slug)}
                    className={`flex items-center justify-between rounded-xl border p-2.5 px-3 text-xs font-semibold transition-all ${
                      selected
                        ? 'border-red-500 bg-red-600/20 text-red-300'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>{lang.name}</span>
                    {selected && <Check className="h-3.5 w-3.5 text-red-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Daily Target Minutes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              3. Daily Learning Target: <span className="text-red-400 font-bold">{dailyGoalMinutes} Minutes / day</span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDailyGoalMinutes(mins)}
                  className={`rounded-2xl border p-3 text-center transition-all text-xs font-semibold ${
                    dailyGoalMinutes === mins
                      ? 'border-red-500 bg-red-600/20 text-red-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {mins} mins
                </button>
              ))}
            </div>
          </div>

          {/* 4. Primary Goal */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">4. Your Primary Goal</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {goalsList.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setPrimaryGoal(g)}
                  className={`flex items-center justify-between rounded-2xl border p-3 px-4 text-xs font-semibold transition-all ${
                    primaryGoal === g
                      ? 'border-red-500 bg-red-600/20 text-red-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span>{g}</span>
                  {primaryGoal === g && <Check className="h-4 w-4 text-red-400" />}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleFinish}
            disabled={loading}
            className="theme-btn-primary flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold shadow-lg shadow-red-600/20"
          >
            {loading ? 'Saving Preferences...' : 'Complete Onboarding'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
