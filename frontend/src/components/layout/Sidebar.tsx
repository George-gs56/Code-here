import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Compass, 
  BookOpen, 
  Code2, 
  FileCheck2, 
  History, 
  Award, 
  Trophy, 
  User, 
  Settings, 
  ShieldAlert, 
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'explore', label: 'Explore Languages', icon: Compass },
    { id: 'my-learning', label: 'My Learning', icon: BookOpen },
    { id: 'practice', label: 'Practice Coding', icon: Code2 },
    { id: 'assessments', label: 'Take a Test', icon: FileCheck2 },
    { id: 'results', label: 'My Test Results', icon: History },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-zinc-800/80 bg-black p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Main Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-red-500' : 'text-zinc-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {user?.role === 'admin' && (
        <div className="mt-6 pt-4 border-t border-zinc-800/80 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">Administration</p>
          <button
            onClick={() => onNavigate('admin')}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
              activePage === 'admin'
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : 'text-red-400/80 hover:bg-red-500/10 hover:text-red-300'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Admin Dashboard</span>
          </button>
        </div>
      )}

      {/* User Mini Card */}
      {user && (
        <div className="mt-auto pt-6">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600/20 text-red-400 font-bold text-xs border border-red-500/30">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-zinc-200 truncate">{user.full_name}</p>
                <p className="text-[11px] text-zinc-500 truncate">@{user.username}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 py-1.5 text-[11px] font-medium text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-3 w-3" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
