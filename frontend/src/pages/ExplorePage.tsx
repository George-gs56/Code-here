import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { apiRequest } from '../services/api';
import { Search, Filter, ArrowRight } from 'lucide-react';

interface ExplorePageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ onNavigate }) => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/languages')
      .then((res) => setLanguages(res.languages || []))
      .catch((err) => console.error('Failed to load languages:', err))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', 'Web Development', 'Backend & Data', 'Enterprise', 'Systems', 'Databases', 'Frontend'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredLanguages = languages.filter((lang) => {
    const matchesSearch = lang.name.toLowerCase().includes(search.toLowerCase()) || lang.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || lang.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || lang.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto bg-black text-zinc-100">
      {/* Header Banner */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Explore Programming Languages</h1>
        <p className="mt-1 text-xs text-zinc-400">Choose from 14 industry-standard programming languages and start learning today.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="dark-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search language name or concept..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 pl-10 pr-4 text-xs text-zinc-200 placeholder-zinc-500 focus:border-red-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-400">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-950 py-1.5 px-3 text-xs text-zinc-200 focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400">Difficulty:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-950 py-1.5 px-3 text-xs text-zinc-200 focus:outline-none"
            >
              {difficulties.map((diff) => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Language Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-zinc-500">Loading programming catalog...</div>
      ) : filteredLanguages.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-800 p-12 text-center text-xs text-zinc-500">
          No programming languages matched your query filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLanguages.map((lang) => {
            const progress = lang.progress_percentage || 0;
            return (
              <div
                key={lang.id}
                className="dark-card group relative flex flex-col justify-between rounded-3xl p-6"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/10 text-red-400 font-black text-lg border border-red-500/20 group-hover:scale-105 transition-transform">
                      {lang.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold border ${
                      lang.difficulty === 'Beginner'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : lang.difficulty === 'Intermediate'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {lang.difficulty}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-red-400 transition-colors">{lang.name}</h3>
                    <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{lang.description}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-y border-zinc-800/80 py-3 text-center">
                    <div>
                      <p className="text-xs font-bold text-zinc-200">{lang.lesson_count || 6}</p>
                      <span className="text-[10px] text-zinc-500">Lessons</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">{lang.challenge_count || 1}</p>
                      <span className="text-[10px] text-zinc-500">Challenges</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">10 Qs</p>
                      <span className="text-[10px] text-zinc-500">Assessments</span>
                    </div>
                  </div>

                  {/* User Progress bar if enrolled */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400 font-medium">Curriculum Progress</span>
                      <span className="text-red-400 font-bold">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 to-rose-600 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-2">
                  <button
                    onClick={() => onNavigate('language-detail', { slug: lang.slug })}
                    className="theme-btn-primary flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold"
                  >
                    <span>{progress > 0 ? 'Continue Path' : 'Start Learning'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
