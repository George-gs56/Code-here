import React, { useState, useEffect } from 'react';
import { Course, Language } from '../types';
import { apiRequest } from '../services/api';
import { BookOpen, CheckCircle, Play, ArrowLeft, Clock, Award } from 'lucide-react';

interface LanguageDetailPageProps {
  slug: string;
  onNavigate: (page: string, params?: any) => void;
}

export const LanguageDetailPage: React.FC<LanguageDetailPageProps> = ({ slug, onNavigate }) => {
  const [language, setLanguage] = useState<Language | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest(`/languages/${slug}/courses`)
      .then((res) => {
        setLanguage(res.language);
        setCourses(res.courses || []);
      })
      .catch((err) => console.error('Failed to load curriculum:', err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading language curriculum...</div>;
  }

  if (!language) {
    return <div className="text-center py-20 text-xs text-red-400">Language path not found.</div>;
  }

  const currentCourse = courses.find((c) => c.level === selectedLevel) || courses[0];

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => onNavigate('explore')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Explore Languages
      </button>

      {/* Hero Header */}
      <div className="rounded-3xl border border-red-500/20 bg-gradient-to-r from-slate-900 via-red-950/30 to-slate-900 p-8 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600/20 text-red-400 font-black text-2xl border border-red-500/30">
              {language.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{language.name} Learning Path</h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">{language.description}</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('assessments', { slug: language.slug })}
            className="theme-btn-primary flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold shadow-lg shadow-red-600/25"
          >
            <Award className="h-4 w-4" /> Take 10-Q Assessment
          </button>
        </div>
      </div>

      {/* Level Tabs */}
      <div className="flex border-b border-slate-800 space-x-6">
        {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`pb-3 text-xs font-bold transition-all ${
              selectedLevel === level
                ? 'border-b-2 border-red-500 text-red-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {level} Level
          </button>
        ))}
      </div>

      {/* Course Content */}
      {currentCourse ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-2">
            <h2 className="text-lg font-extrabold text-slate-100">{currentCourse.title}</h2>
            <p className="text-xs text-slate-400">{currentCourse.description}</p>
          </div>

          {/* Lessons List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Course Lessons</h3>
            {(currentCourse.lessons || []).map((les, index) => {
              const isCompleted = les.status === 'completed';
              return (
                <div
                  key={les.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-5 backdrop-blur-sm transition-all ${
                    isCompleted
                      ? 'border-emerald-500/30 bg-emerald-950/10'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs ${
                      isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{les.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {les.estimated_minutes} mins</span>
                        {isCompleted && (
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                            <CheckCircle className="h-3 w-3" /> Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('lesson', { id: les.id })}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      isCompleted
                        ? 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                        : 'theme-btn-primary'
                    }`}
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>{isCompleted ? 'Review Lesson' : 'Start Lesson'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 p-8 text-center text-xs text-slate-400">
          No lessons found for this level yet.
        </div>
      )}
    </div>
  );
};
